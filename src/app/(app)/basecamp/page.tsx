export const dynamic = "force-dynamic";

import Link from "next/link";
import { basecampService } from "@/services/basecamp/service";
import { Card } from "@/components/ui/card";

export default async function BasecampHomePage() {
  const [ynm, coupons, missions, goals, notes] = await Promise.all([
    basecampService.listYnm(),
    basecampService.listCoupons(),
    basecampService.listMissions(),
    basecampService.listGoals(),
    basecampService.listNotes(),
  ]);

  const matches = ynm.filter((i) => i.vote_a === "yes" && i.vote_b === "yes").length;
  const openMissions = missions.filter((m) => m.status === "open").length;
  const openCoupons = coupons.filter((c) => c.status === "available").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[var(--ink)]">Your private playground</h1>
        <p className="mt-2 text-[var(--muted)]">
          Goals, filthy missions, coupons, and honesty lists — built for an electric physical
          connection.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat href="/basecamp/ynm" label="Double-yes matches" value={String(matches)} />
        <Stat href="/basecamp/coupons" label="Open coupons" value={String(openCoupons)} />
        <Stat href="/basecamp/missions" label="Open missions" value={String(openMissions)} />
        <Stat href="/basecamp/goals" label="Heat goals" value={String(goals.length)} />
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-display text-2xl text-[var(--ink)]">Tonight&apos;s nudge</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Pick one double-yes, redeem a coupon, or drop a filthy note. Small sparks stack into a
          sex life you both chase.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link className="rounded-full bg-[var(--clay)] px-3 py-1.5 text-white" href="/basecamp/ynm">
            Vote the list
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[var(--ink)]"
            href="/basecamp/notes"
          >
            Leave a note ({notes.length})
          </Link>
        </div>
      </Card>
    </div>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link
      href={href}
      className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <p className="font-display text-3xl text-[var(--clay)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
    </Link>
  );
}
