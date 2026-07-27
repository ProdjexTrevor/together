"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteItemAction } from "@/services/actions";
import { Button } from "@/components/ui/button";
import { typePath } from "@/lib/status";
import type { ItemType } from "@/types";
import { cn } from "@/lib/utils";

export function DeleteItemButton({
  itemId,
  itemType,
  title,
  variant = "button",
  className,
}: {
  itemId: string;
  itemType: ItemType;
  title: string;
  variant?: "button" | "icon";
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    const confirmed = window.confirm(`Delete “${title}”? This can’t be undone.`);
    if (!confirmed) return;
    startTransition(async () => {
      await deleteItemAction(itemId);
      router.push(`/${typePath(itemType)}`);
      router.refresh();
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={`Delete ${title}`}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-muted transition hover:bg-pale-clay hover:text-destructive disabled:opacity-50",
          className
        )}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onDelete}
      disabled={pending}
      className={className}
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
