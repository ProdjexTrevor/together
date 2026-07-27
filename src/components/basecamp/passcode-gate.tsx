"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { unlockBasecampAction } from "@/services/basecamp/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BasecampPasscodeGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await unlockBasecampAction(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="basecamp-shell flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--clay)]">
          Private
        </p>
        <h1 className="mt-2 font-display text-3xl text-[var(--ink)]">Enter the heat</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Passcode required. This side stays between you two.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Passcode"
            className="bg-[var(--page)] text-center text-lg tracking-[0.35em]"
          />
          {error ? <p className="text-sm text-[var(--clay)]">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending || code.length < 4}>
            {pending ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    </div>
  );
}
