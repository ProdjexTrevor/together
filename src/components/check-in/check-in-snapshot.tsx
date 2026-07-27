import { formatRelative } from "@/lib/dates";
import {
  DIMENSION_META,
  insightForCheckIn,
  scoreTone,
  type CheckInDimension,
} from "@/lib/check-in";
import type { WellnessCheckIn } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DIMENSIONS: CheckInDimension[] = ["mental", "physical", "emotional"];

export function CheckInSnapshot({
  title,
  checkIn,
  previous,
  subjectName,
  emptyHint,
  emphasize,
}: {
  title: string;
  checkIn: WellnessCheckIn | null;
  previous?: WellnessCheckIn | null;
  subjectName?: string;
  emptyHint: string;
  emphasize?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5 md:p-6",
        emphasize && "border-clay/30 bg-gradient-to-br from-pale-clay/40 to-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {checkIn ? (
          <p className="shrink-0 text-xs text-muted">{formatRelative(checkIn.created_at)}</p>
        ) : null}
      </div>

      {!checkIn ? (
        <p className="mt-4 text-sm text-muted">{emptyHint}</p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {DIMENSIONS.map((dim) => (
              <div
                key={dim}
                className="rounded-[16px] border border-border/80 bg-page/50 px-3 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {DIMENSION_META[dim].label}
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="font-display text-3xl text-ink">{checkIn[dim]}</p>
                  <Badge tone={scoreTone(checkIn[dim])}>
                    {checkIn[dim] >= 4
                      ? "Strong"
                      : checkIn[dim] === 3
                        ? "Okay"
                        : checkIn[dim] === 2
                          ? "Low"
                          : "Heavy"}
                  </Badge>
                </div>
                <ScoreDots value={checkIn[dim]} />
              </div>
            ))}
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-ink/90">
            {insightForCheckIn(checkIn, previous, subjectName)}
          </p>

          {checkIn.note ? (
            <blockquote className="mt-4 border-l-2 border-sage/50 pl-3 text-sm italic text-muted">
              “{checkIn.note}”
            </blockquote>
          ) : null}
        </>
      )}
    </Card>
  );
}

function ScoreDots({ value }: { value: number }) {
  return (
    <div className="mt-3 flex gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            n <= value ? "bg-sage" : "bg-border"
          )}
        />
      ))}
    </div>
  );
}
