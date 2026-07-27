"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGoalProgressAction } from "@/services/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function GoalProgressForm({
  itemId,
  currentValue,
}: {
  itemId: string;
  currentValue: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentValue));
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateGoalProgressAction(itemId, Number(value));
          router.refresh();
        });
      }}
    >
      <div>
        <Label htmlFor="progress">Current progress</Label>
        <Input
          id="progress"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-32"
        />
      </div>
      <Button type="submit" disabled={pending}>
        Update progress
      </Button>
    </form>
  );
}
