"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTaskAction } from "@/services/actions";
import { cn } from "@/lib/utils";

export function TaskCheckbox({
  itemId,
  completed,
  title,
}: {
  itemId: string;
  completed: boolean;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${completed ? "Uncomplete" : "Complete"} ${title}`}
      onClick={() =>
        startTransition(async () => {
          await toggleTaskAction(itemId);
          router.refresh();
        })
      }
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-success",
        completed && "bg-pale-sage"
      )}
    >
      {completed ? "✓" : null}
    </button>
  );
}
