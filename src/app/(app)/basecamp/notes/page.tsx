export const dynamic = "force-dynamic";

import { addNoteAction } from "@/services/basecamp/actions";
import { basecampService } from "@/services/basecamp/service";
import { requireHousehold } from "@/lib/session";
import { formatRelative } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export default async function BasecampNotesPage() {
  const { ctx } = await requireHousehold();
  const notes = await basecampService.listNotes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[var(--ink)]">Filthy notes</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Fantasies, requests, confessions — encrypted at rest. Say the quiet part out loud.
        </p>
      </div>

      <form action={addNoteAction} className="space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4">
        <Textarea
          name="body"
          required
          rows={4}
          placeholder="Tell them exactly what you want…"
        />
        <label className="block text-sm text-[var(--muted)]">
          Heat (1–5)
          <input
            name="heat"
            type="number"
            min={1}
            max={5}
            defaultValue={4}
            className="mt-1 h-11 w-full rounded-[13px] border border-[var(--border)] bg-[var(--page)] px-3 text-[var(--ink)]"
          />
        </label>
        <Button type="submit">Drop the note</Button>
      </form>

      <ul className="space-y-3">
        {notes.map((n) => {
          const author =
            n.author_id === ctx.currentUser.id
              ? "You"
              : ctx.partner?.full_name.split(" ")[0] || "Partner";
          return (
            <li key={n.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span>
                  {author} · heat {n.heat}/5
                </span>
                <span>{formatRelative(n.created_at)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
                {n.body}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
