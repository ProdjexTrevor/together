export const dynamic = "force-dynamic";

import { Heart } from "lucide-react";
import { requireHousehold, Shell } from "@/lib/session";
import { CheckInForm } from "@/components/check-in/check-in-form";
import { CheckInSnapshot } from "@/components/check-in/check-in-snapshot";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/dates";
import { DIMENSION_META, type CheckInDimension } from "@/lib/check-in";

export default async function CheckInPage() {
  const { repo, ctx } = await requireHousehold();
  const partnerName = ctx.partner?.full_name ?? null;

  const [latest, myHistory, partnerHistory] = await Promise.all([
    repo.getLatestWellnessCheckIns(),
    repo.listWellnessCheckIns(ctx.currentUser.id, 7),
    ctx.partner ? repo.listWellnessCheckIns(ctx.partner.id, 7) : Promise.resolve([]),
  ]);

  const myPrevious = myHistory[1] ?? null;
  const partnerPrevious = partnerHistory[1] ?? null;

  return (
    <Shell ctx={ctx}>
      <div className="space-y-6 md:space-y-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-clay">Check-in</p>
          <h1 className="mt-1 font-display text-4xl text-ink md:text-5xl">
            How are we, really?
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted">
            A quick pulse on mental, physical, and emotional health — shared so you can support
            each other with less guessing.
          </p>
        </div>

        <CheckInSnapshot
          emphasize
          title={partnerName ? `How ${partnerName.split(" ")[0]} is doing` : "Partner check-in"}
          checkIn={latest.partner}
          previous={partnerPrevious}
          subjectName={partnerName ?? undefined}
          emptyHint={
            partnerName
              ? `${partnerName.split(" ")[0]} hasn’t shared a check-in yet. Invite them to take 30 seconds.`
              : "Invite your partner to start sharing check-ins."
          }
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5 md:p-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-clay" />
              <h2 className="font-display text-2xl text-ink">Your check-in</h2>
            </div>
            <p className="mt-2 text-sm text-muted">
              Share how you&apos;re doing
              {partnerName ? ` so ${partnerName.split(" ")[0]} can see` : ""}. Keep it honest —
              not polished.
            </p>
            <div className="mt-5">
              <CheckInForm partnerName={partnerName} />
            </div>
          </Card>

          <CheckInSnapshot
            title="Your latest"
            checkIn={latest.mine}
            previous={myPrevious}
            subjectName={ctx.currentUser.full_name}
            emptyHint="You haven’t checked in yet. Tap the scores and share when you’re ready."
          />
        </div>

        {(partnerHistory.length > 1 || myHistory.length > 1) && (
          <Card className="p-5 md:p-6">
            <h2 className="font-display text-2xl text-ink">Recent pulse</h2>
            <p className="mt-1 text-sm text-muted">Last few check-ins at a glance.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <HistoryList
                label={partnerName ? partnerName.split(" ")[0] : "Partner"}
                rows={partnerHistory.slice(0, 5)}
              />
              <HistoryList label="You" rows={myHistory.slice(0, 5)} />
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}

function HistoryList({
  label,
  rows,
}: {
  label: string;
  rows: {
    id: string;
    mental: number;
    physical: number;
    emotional: number;
    created_at: string;
  }[];
}) {
  const dims: CheckInDimension[] = ["mental", "physical", "emotional"];
  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No history yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-border/70 bg-page/40 px-3 py-2 text-sm"
            >
              <span className="text-muted">{formatRelative(row.created_at)}</span>
              <span className="flex gap-2 text-ink">
                {dims.map((d) => (
                  <span key={d} title={DIMENSION_META[d].label}>
                    <span className="text-muted">{DIMENSION_META[d].label[0]}</span>
                    {row[d]}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
