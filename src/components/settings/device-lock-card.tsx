"use client";

import { useEffect, useState, useTransition } from "react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";

export function DeviceLockCard() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = async () => {
    const res = await fetch("/api/webauthn/status");
    if (!res.ok) return;
    const data = await res.json();
    setEnabled(Boolean(data.lockEnabled));
  };

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    refresh().catch(() => undefined);
  }, []);

  const enable = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const optRes = await fetch("/api/webauthn/register");
        if (!optRes.ok) {
          const err = await optRes.json().catch(() => ({}));
          throw new Error(err.error || "Could not start Face ID setup");
        }
        const options = await optRes.json();
        const attestation = await startRegistration({ optionsJSON: options });
        const verifyRes = await fetch("/api/webauthn/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attestation),
        });
        if (!verifyRes.ok) {
          const err = await verifyRes.json().catch(() => ({}));
          throw new Error(err.error || "Could not save Face ID / passcode");
        }
        localStorage.setItem("together_device_lock", "1");
        setEnabled(true);
        setMessage("Face ID / passcode lock is on for this device.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Setup canceled or failed.");
      }
    });
  };

  const disable = () => {
    setMessage(null);
    startTransition(async () => {
      await fetch("/api/webauthn/status", { method: "DELETE" });
      localStorage.removeItem("together_device_lock");
      setEnabled(false);
      setMessage("Device lock turned off.");
    });
  };

  const testUnlock = () => {
    setMessage(null);
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
        setMessage("Unlocked successfully.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unlock canceled.");
      }
    });
  };

  if (!supported) {
    return (
      <p className="text-sm text-muted">
        This device/browser doesn&apos;t support Face ID, Touch ID, or device passcode unlock
        for web apps.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Require Face ID, Touch ID, or your phone passcode when opening Together. Best on the Home
        Screen app (Share → Add to Home Screen).
      </p>
      <div className="flex flex-wrap gap-2">
        {enabled ? (
          <>
            <Button type="button" variant="secondary" onClick={disable} disabled={pending}>
              Turn off device lock
            </Button>
            <Button type="button" onClick={testUnlock} disabled={pending}>
              Test unlock
            </Button>
          </>
        ) : (
          <Button type="button" onClick={enable} disabled={pending}>
            {pending ? "Waiting for Face ID…" : "Enable Face ID / passcode"}
          </Button>
        )}
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
