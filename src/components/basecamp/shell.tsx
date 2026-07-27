"use client";

import { useEffect } from "react";
import Link from "next/link";
import { lockBasecampAction } from "@/services/basecamp/actions";

const links = [
  { href: "/basecamp", label: "Home" },
  { href: "/basecamp/ynm", label: "Yes / No / Maybe" },
  { href: "/basecamp/coupons", label: "Coupons" },
  { href: "/basecamp/missions", label: "Missions" },
  { href: "/basecamp/goals", label: "Goals" },
  { href: "/basecamp/notes", label: "Filthy notes" },
];

export function BasecampShell({
  children,
  partnerName,
}: {
  children: React.ReactNode;
  partnerName?: string | null;
}) {
  useEffect(() => {
    document.documentElement.classList.add("basecamp-mode");
    return () => document.documentElement.classList.remove("basecamp-mode");
  }, []);

  return (
    <div className="basecamp-shell flex h-dvh max-h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--card)]/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--clay)]">
              Basecamp
            </p>
            <p className="font-display text-xl text-[var(--ink)]">
              Just us{partnerName ? ` · ${partnerName.split(" ")[0]}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
              Exit
            </Link>
            <form action={lockBasecampAction}>
              <button type="submit" className="text-sm text-[var(--clay)]">
                Lock
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto mt-3 flex max-w-3xl gap-1 overflow-x-auto pb-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-[var(--muted)] hover:bg-[var(--pale-clay)] hover:text-[var(--ink)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
