"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushEnableCard() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      navigator.serviceWorker.register("/sw.js").catch(() => {
        setMessage("Could not register the notification service.");
      });
    }
  }, []);

  const enable = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const permissionResult = await Notification.requestPermission();
        setPermission(permissionResult);
        if (permissionResult !== "granted") {
          setMessage("Notifications were blocked. Enable them in iPhone Settings → Together.");
          return;
        }

        const vapidRes = await fetch("/api/push/vapid");
        if (!vapidRes.ok) {
          setMessage("Push is not configured on the server yet.");
          return;
        }
        const { publicKey } = await vapidRes.json();

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const saveRes = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        if (!saveRes.ok) {
          setMessage("Could not save this device for notifications.");
          return;
        }

        setSubscribed(true);
        setMessage("Notifications enabled on this device.");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not enable notifications on this device."
        );
      }
    });
  };

  if (!supported) {
    return (
      <p className="text-sm text-muted">
        Push notifications need a Home Screen install on iPhone (Share → Add to Home Screen),
        then open Together from that icon.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Get alerts when something new is created, and when deadlines are 3 days out, 1 day out,
        or overdue. On iPhone, add Together to your Home Screen first.
      </p>
      <Button type="button" onClick={enable} disabled={pending || subscribed}>
        {pending
          ? "Enabling…"
          : subscribed
            ? "Notifications enabled"
            : permission === "denied"
              ? "Notifications blocked"
              : "Enable push notifications"}
      </Button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
