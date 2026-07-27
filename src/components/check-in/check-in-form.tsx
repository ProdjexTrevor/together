"use client";

import { useState, useTransition } from "react";
import { CHECK_IN_SCALE, DIMENSION_META, type CheckInDimension } from "@/lib/check-in";
import { createWellnessCheckInAction } from "@/services/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DIMENSIONS: CheckInDimension[] = ["mental", "physical", "emotional"];

export function CheckInForm({ partnerName }: { partnerName?: string | null }) {
  const [scores, setScores] = useState<Record<CheckInDimension, number>>({
    mental: 3,
    physical: 3,
    emotional: 3,
  });
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await createWellnessCheckInAction({
          mental: scores.mental,
          physical: scores.physical,
          emotional: scores.emotional,
          note,
        });
        setNote("");
        setMessage(
          partnerName
            ? `Shared with ${partnerName.split(" ")[0]}.`
            : "Check-in saved."
        );
      } catch {
        setMessage("Could not save this check-in. Try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {DIMENSIONS.map((dim) => (
        <div key={dim}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-xl text-ink">{DIMENSION_META[dim].label}</h3>
            <span className="text-sm text-muted">{DIMENSION_META[dim].prompt}</span>
          </div>
          <div className="mt-3 flex gap-2">
            {CHECK_IN_SCALE.map((level) => {
              const active = scores[dim] === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setScores((s) => ({ ...s, [dim]: level.value }))}
                  className={cn(
                    "flex h-12 flex-1 flex-col items-center justify-center rounded-[14px] border text-xs font-medium transition",
                    active
                      ? "border-clay bg-pale-clay text-clay"
                      : "border-border bg-page/60 text-muted hover:border-sage/40 hover:text-ink"
                  )}
                  aria-pressed={active}
                  aria-label={`${DIMENSION_META[dim].label}: ${level.label}`}
                >
                  <span className="text-sm font-semibold">{level.value}</span>
                  <span className="hidden sm:inline">{level.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <label htmlFor="checkin-note" className="text-sm font-medium text-ink">
          Optional note
        </label>
        <Textarea
          id="checkin-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Anything your partner should know?"
          className="mt-2"
        />
      </div>

      <Button type="button" onClick={submit} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sharing…" : "Share check-in"}
      </Button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
