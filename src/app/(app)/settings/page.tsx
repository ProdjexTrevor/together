export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireHousehold, Shell } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOutAction, updateNotificationPrefsAction } from "@/services/actions";
import { formatRelative } from "@/lib/dates";

export default async function SettingsPage() {
  const { repo, ctx } = await requireHousehold();
  const [prefs, notifications] = await Promise.all([
    repo.getNotificationPrefs(),
    repo.listNotifications(),
  ]);

  return (
    <Shell ctx={ctx}>
      <h1 className="font-display text-4xl text-ink md:text-5xl">Settings</h1>
      <p className="mt-1 text-muted">Household, notifications, and account.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-2xl text-ink">Household</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="font-medium text-ink">{ctx.household.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Members</dt>
              <dd className="font-medium text-ink">
                {ctx.members.map((m) => m.profile.full_name).join(" & ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Limit</dt>
              <dd className="text-ink">Two active partners for MVP</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-2xl text-ink">Notification preferences</h2>
          <form
            action={async (formData) => {
              "use server";
              await updateNotificationPrefsAction({
                assignments: formData.get("assignments") === "on",
                comments: formData.get("comments") === "on",
                mentions: formData.get("mentions") === "on",
                decisions: formData.get("decisions") === "on",
                deadlines: formData.get("deadlines") === "on",
                contributions: formData.get("contributions") === "on",
              });
            }}
            className="mt-4 space-y-3"
          >
            {(
              [
                ["assignments", "New assignments"],
                ["comments", "Comments & replies"],
                ["mentions", "@partner mentions"],
                ["decisions", "Decision responses needed"],
                ["deadlines", "Approaching deadlines"],
                ["contributions", "Contributions & milestones"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span>{label}</span>
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={prefs[key]}
                  className="h-5 w-5 rounded border-border"
                />
              </label>
            ))}
            <Button type="submit" className="mt-2">
              Save preferences
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted">
            Email delivery is a separated extension point; in-app notifications are active.
          </p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="font-display text-2xl text-ink">Recent notifications</h2>
          <ul className="mt-4 space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="rounded-[14px] border border-border bg-page/50 px-4 py-3"
              >
                <p className="font-medium text-ink">{n.title}</p>
                <p className="text-sm text-muted">{n.body}</p>
                <p className="mt-1 text-xs text-muted">{formatRelative(n.created_at)}</p>
              </li>
            ))}
            {notifications.length === 0 ? (
              <li className="text-sm text-muted">You&apos;re all caught up.</li>
            ) : null}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-2xl text-ink">Account</h2>
          <p className="mt-2 text-sm text-muted">Signed in as {ctx.currentUser.email}</p>
          <form
            action={async () => {
              "use server";
              await signOutAction();
              redirect("/sign-in");
            }}
            className="mt-4"
          >
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
