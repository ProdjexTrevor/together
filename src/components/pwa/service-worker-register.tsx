"use client";

import { useEffect } from "react";

/** Registers the service worker for installed / capable browsers. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration failures in unsupported contexts.
    });
  }, []);

  return null;
}
