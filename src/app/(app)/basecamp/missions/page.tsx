export const dynamic = "force-dynamic";

import { addMissionAction, completeMissionAction } from "@/services/basecamp/actions";
import { basecampService } from "@/services/basecamp/service";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default async function BasecampMissionsPage() {
  const missions = await basecampService.listMissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[var(--ink)]">Missions + rewards</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Assign something hot. Promise something hotter when it&apos;s done.
        </p>
      </div>

      <form action={addMissionAction} className="space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4">
        <Input name="title" required placeholder="Mission title" />
        <Textarea name="details" placeholder="Details / rules" rows={2} />
        <Input name="reward" required placeholder="Reward when completed" />
        <Button type="submit">Assign mission</Button>
      </form>

      <ul className="space-y-3">
        {missions.map((m) => (
          <li key={m.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="font-display text-xl text-[var(--ink)]">{m.title}</p>
            {m.details ? <p className="mt-2 text-sm text-[var(--muted)]">{m.details}</p> : null}
            <p className="mt-3 text-sm text-[var(--clay)]">
              <span className="font-medium">Reward:</span> {m.reward}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">{m.status}</span>
              {m.status === "open" ? (
                <form action={completeMissionAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" size="sm">
                    Mark done
                  </Button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
