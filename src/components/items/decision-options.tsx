"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { recordDecisionResponseAction } from "@/services/actions";
import type { DecisionOption, DecisionResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DecisionOptions({
  itemId,
  options,
  responses,
  currentUserId,
}: {
  itemId: string;
  options: DecisionOption[];
  responses: DecisionResponse[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const myResponse = responses.find((r) => r.user_id === currentUserId);

  return (
    <div>
      <h2 className="font-display text-2xl text-ink md:text-3xl">Choose your preference</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {options.map((option) => {
          const selected = myResponse?.option_id === option.id;
          const voteCount = responses.filter((r) => r.option_id === option.id).length;
          return (
            <div
              key={option.id}
              className={cn(
                "relative rounded-[20px] border bg-card p-4 shadow-sm transition",
                selected ? "border-clay ring-1 ring-clay/40" : "border-border"
              )}
            >
              {selected ? (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-clay text-white">
                  <Check className="h-4 w-4" />
                </span>
              ) : null}
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-pale-sage text-3xl">
                {option.title.toLowerCase().includes("beach")
                  ? "🏖️"
                  : option.title.toLowerCase().includes("lake")
                    ? "🏞️"
                    : "🏠"}
              </div>
              <h3 className="text-center font-display text-xl text-ink">{option.title}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-success">Pros</p>
                  <ul className="mt-1 space-y-1 text-muted">
                    {option.pros.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-clay">Cons</p>
                  <ul className="mt-1 space-y-1 text-muted">
                    {option.cons.map((c) => (
                      <li key={c}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted">
                {voteCount} response{voteCount === 1 ? "" : "s"}
              </p>
              <Button
                className="mt-3 w-full"
                variant={selected ? "primary" : "secondary"}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await recordDecisionResponseAction(itemId, option.id);
                    router.refresh();
                  })
                }
              >
                {selected ? (
                  <>
                    <Check className="h-4 w-4" /> Selected
                  </>
                ) : (
                  "Select"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
