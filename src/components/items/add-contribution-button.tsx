"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContributionAction } from "@/services/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function AddContributionButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <Button className="w-full" size="lg" onClick={() => setOpen(true)}>
        Add contribution
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add contribution">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await addContributionAction(itemId, Number(amount), note);
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save contribution"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
