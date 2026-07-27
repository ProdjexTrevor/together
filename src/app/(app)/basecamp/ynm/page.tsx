export const dynamic = "force-dynamic";

import { basecampService } from "@/services/basecamp/service";
import { addYnmAction, setYnmVoteAction } from "@/services/basecamp/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { YnmVote } from "@/types/basecamp";

export default async function BasecampYnmPage() {
  const items = await basecampService.listYnm();
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[var(--ink)]">Yes / No / Maybe</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Be honest. Green = both said yes. That&apos;s your permission slip.
        </p>
      </div>

      <form action={addYnmAction} className="grid gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-[1fr_140px_auto]">
        <Input name="title" required placeholder="Add something filthy to vote on…" />
        <Input name="category" placeholder="Category" defaultValue="Custom" />
        <Button type="submit">Add</Button>
      </form>

      {categories.map((cat) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--clay)]">
            {cat}
          </h2>
          <ul className="space-y-2">
            {items
              .filter((i) => i.category === cat)
              .map((item) => {
                const bothYes = item.vote_a === "yes" && item.vote_b === "yes";
                return (
                  <li
                    key={item.id}
                    className={`rounded-[16px] border p-4 ${
                      bothYes
                        ? "border-[var(--clay)] bg-[var(--pale-clay)]"
                        : "border-[var(--border)] bg-[var(--card)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--ink)]">{item.title}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Partner A: {item.vote_a} · Partner B: {item.vote_b}
                          {bothYes ? " · MATCH" : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {(["yes", "maybe", "no"] as YnmVote[]).map((v) => (
                          <form key={v} action={setYnmVoteAction}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="vote" value={v} />
                            <Button
                              type="submit"
                              size="sm"
                              variant={v === "yes" ? "primary" : "secondary"}
                            >
                              {v}
                            </Button>
                          </form>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
