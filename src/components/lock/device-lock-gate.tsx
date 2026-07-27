"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Blocks the signed-in app until Face ID / passcode succeeds (when enabled).
 */
export function DeviceLockGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/webauthn/status");
      if (!res.ok) {
        setNeedsUnlock(false);
        setReady(true);
        return;
      }
      const data = await res.json();
      const preferLock = localStorage.getItem("together_device_lock") === "1";
      const shouldLock = Boolean(data.authenticated && data.lockEnabled && preferLock && !data.unlocked);
      setNeedsUnlock(shouldLock);
    } catch {
      setNeedsUnlock(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const unlock = () => {
    setError(null);
    startTransition(async () => {
      try {
        const optRes = await fetch("/api/webauthn/authenticate");
        if (!optRes.ok) {
          const err = await optRes.json().catch(() => ({}));
          throw new Error(err.error || "Could not start unlock");
        }
        const options = await optRes.json();
        const assertion = await startAuthentication({ optionsJSON: options });
        const verifyRes = await fetch("/api/webauthn/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assertion),
        });
        if (!verifyRes.ok) {
          const err = await verifyRes.json().catch(() => ({}));
          throw new Error(err.error || "Unlock failed");
        }
        setNeedsUnlock(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unlock canceled");
      }
    });
  };

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (!needsUnlock) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-page px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pale-clay text-clay">
        <Fingerprint className="h-8 w-8" aria-hidden />
      </div>
      <div>
        <h1 className="font-display text-3xl text-ink">Together is locked</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Use Face ID, Touch ID, or your device passcode to open your shared space.
        </p>
      </div>
      <Button type="button" size="lg" onClick={unlock} disabled={pending}>
        {pending ? "Waiting…" : "Unlock"}
      </Button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </div>
  );
}
