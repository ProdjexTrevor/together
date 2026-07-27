import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscussionPanel } from "@/components/comments/discussion-panel";
import { GoalProgressForm } from "@/components/items/goal-progress-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { formatLongDate } from "@/lib/dates";
import { progressPercent } from "@/lib/money";
import { habitProgressLabel } from "@/lib/progress";
import { statusLabel, statusTone } from "@/lib/status";
import { requireHousehold, Shell } from "@/lib/session";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { repo, ctx } = await requireHousehold();
  const item = await repo.getItem(id);
  if (!item || item.type !== "goal") notFound();

  const [comments, reactions, activity] = await Promise.all([
    repo.listComments(id),
    repo.listReactions(id),
    repo.listActivity(id),
  ]);

  const goal = item.goal;

  return (
    <Shell ctx={ctx}>
      <Link href="/goals" className="text-sm font-medium text-muted hover:text-ink">
        ← Goals
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl text-ink md:text-5xl">{item.title}</h1>
              {item.description ? (
                <p className="mt-3 text-[15px] text-muted">{item.description}</p>
              ) : null}
            </div>
            <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
          </div>

          <Card className="p-5">
            <p className="text-sm text-muted">
              {habitProgressLabel(
                goal?.current_value ?? 0,
                goal?.target_value ?? 0,
                goal?.unit ?? "weeks"
              )}
              {goal?.streak_count ? ` · ${goal.streak_count}-week streak` : ""}
            </p>
            <ProgressBar
              className="mt-3"
              value={progressPercent(goal?.current_value ?? 0, goal?.target_value ?? 1)}
            />
            <div className="mt-4">
              <GoalProgressForm itemId={item.id} currentValue={goal?.current_value ?? 0} />
            </div>
            <p className="mt-4 text-sm text-muted">
              Target date: {item.due_date ? formatLongDate(item.due_date) : "Open-ended"}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-2xl text-ink">Activity & history</h2>
            <ul className="mt-4 space-y-3">
              {activity.map((event) => (
                <li key={event.id} className="text-sm text-muted">
                  <span className="font-medium text-ink">{event.summary}</span>
                  <span className="ml-2">{formatLongDate(event.created_at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <DiscussionPanel
          itemId={item.id}
          comments={comments}
          reactions={reactions}
          profiles={ctx.members.map((m) => m.profile)}
        />
      </div>
    </Shell>
  );
}
