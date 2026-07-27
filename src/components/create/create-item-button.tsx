"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CheckSquare,
  CircleDollarSign,
  Plus,
  Scale,
  Target,
} from "lucide-react";
import { createItemAction } from "@/services/actions";
import { createItemSchema, type CreateItemInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { typePath } from "@/lib/status";

const types = [
  { value: "task" as const, label: "Task", icon: CheckSquare },
  { value: "decision" as const, label: "Decision", icon: Scale },
  { value: "goal" as const, label: "Goal", icon: Target },
  { value: "financial_target" as const, label: "Financial Target", icon: CircleDollarSign },
];

export function CreateItemButton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-clay text-white shadow-lg",
            className
          )}
          aria-label="Add something"
        >
          <Plus className="h-6 w-6" />
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} className={className} size="lg">
          <Plus className="h-5 w-5" />
          Add something
        </Button>
      )}
      <CreateItemModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreateItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateItemInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createItemSchema as any),
    defaultValues: {
      type: "task",
      title: "",
      description: "",
      owner: "both",
      priority: "normal",
      due_date: "",
      target_amount: undefined,
      current_amount: 0,
      tracking_type: "habit",
      target_value: 12,
    },
  });

  const selectedType = form.watch("type");
  const description = form.watch("description") ?? "";

  const typeFields = useMemo(() => {
    if (selectedType === "financial_target") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="target_amount">Target amount ($)</Label>
            <Input
              id="target_amount"
              type="number"
              step="1"
              {...form.register("target_amount")}
            />
            <FieldError message={form.formState.errors.target_amount?.message} />
          </div>
          <div>
            <Label htmlFor="current_amount">Current amount ($)</Label>
            <Input
              id="current_amount"
              type="number"
              step="1"
              {...form.register("current_amount")}
            />
          </div>
        </div>
      );
    }
    if (selectedType === "goal") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="tracking_type">Tracking</Label>
            <select
              id="tracking_type"
              className="h-11 w-full rounded-[13px] border border-border bg-card px-3.5 text-[15px]"
              {...form.register("tracking_type")}
            >
              <option value="habit">Habit</option>
              <option value="numeric">Numeric</option>
              <option value="percentage">Percentage</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
          <div>
            <Label htmlFor="target_value">Target value</Label>
            <Input id="target_value" type="number" {...form.register("target_value")} />
          </div>
        </div>
      );
    }
    return null;
  }, [selectedType, form]);

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const item = await createItemAction(values);
        form.reset({ ...form.getValues(), title: "", description: "" });
        onClose();
        router.push(`/${typePath(item.type)}/${item.id}`);
        router.refresh();
      } catch (e) {
        setServerError(e instanceof Error ? e.message : "Could not save item");
      }
    });
  });

  return (
    <Modal open={open} onClose={onClose} title="Create new item">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {types.map(({ value, label, icon: Icon }) => {
            const active = selectedType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => form.setValue("type", value, { shouldDirty: true })}
                className={cn(
                  "relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-[16px] border px-2 py-3 text-sm transition",
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-border bg-card text-ink hover:bg-pale-sage/40"
                )}
              >
                {active ? <Check className="absolute right-2 top-2 h-4 w-4" /> : null}
                <Icon className="h-5 w-5" />
                <span className="text-center text-xs font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g., Schedule date night"
            {...form.register("title")}
          />
          <FieldError message={form.formState.errors.title?.message} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="owner">Owner</Label>
            <select
              id="owner"
              className="h-11 w-full rounded-[13px] border border-border bg-card px-3.5 text-[15px]"
              {...form.register("owner")}
            >
              <option value="both">Both</option>
              <option value="self">Me</option>
              <option value="partner">Partner</option>
            </select>
          </div>
          <div>
            <Label htmlFor="due_date">Due date</Label>
            <Input id="due_date" type="date" {...form.register("due_date")} />
          </div>
        </div>

        {typeFields}

        <div>
          <Label htmlFor="description">Details</Label>
          <Textarea
            id="description"
            maxLength={500}
            placeholder="Add a little context…"
            {...form.register("description")}
          />
          <p className="mt-1 text-right text-xs text-muted">{description.length}/500</p>
        </div>

        {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save item"}
        </Button>
      </form>
    </Modal>
  );
}
