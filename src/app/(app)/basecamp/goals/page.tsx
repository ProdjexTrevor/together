export const dynamic = "force-dynamic";

import { addGoalAction, bumpGoalAction } from "@/services/basecamp/actions";
import { basecampService } from "@/services/basecamp/service";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";

export default async function BasecampGoalsPage() {
  const goals = await basecampService.listGoals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[var(--ink)]">Heat goals</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Track the physical streak you both want — weekly fucks, new positions, toy nights.
        </p>
      </div>

      <form action={addGoalAction} className="space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4">
        <Input name="title" required placeholder="Goal title" />
        <Textarea name="details" placeholder="Details" rows={2} />
        <Input name="target" type="number" min={1} defaultValue={3} required />
        <Button type="submit">Add goal</Button>
      </form>

      <ul className="space-y-3">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.progress / Math.max(1, g.target)) * 100));
          return (
            <li key={g.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="font-display text-xl text-[var(--ink)]">{g.title}</p>
              {g.details ? <p className="mt-1 text-sm text-[var(--muted)]">{g.details}</p> : null}
              <p className="mt-3 text-sm text-[var(--muted)]">
                {g.progress} / {g.target}
              </p>
              <ProgressBar className="mt-2" value={pct} />
              <div className="mt-3 flex gap-2">
                <form action={bumpGoalAction}>
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="delta" value="1" />
                  <Button type="submit" size="sm">
                    +1
                  </Button>
                </form>
                <form action={bumpGoalAction}>
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="delta" value="-1" />
                  <Button type="submit" size="sm" variant="secondary">
                    −1
                  </Button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
