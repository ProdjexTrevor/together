"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DesktopNav, MobileNav } from "./nav";
import { CreateItemButton } from "@/components/create/create-item-button";

export function AppShell({
  currentName,
  partnerName,
  children,
  showMobileCreate = true,
}: {
  currentName: string;
  partnerName?: string | null;
  children: React.ReactNode;
  showMobileCreate?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-dvh">
      <DesktopNav currentName={currentName} partnerName={partnerName} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8">
        {children}
      </main>

      {mounted
        ? createPortal(
            <>
              <MobileNav />
              {showMobileCreate ? (
                <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 z-50 md:hidden">
                  <CreateItemButton compact />
                </div>
              ) : null}
            </>,
            document.body
          )
        : null}
    </div>
  );
}
