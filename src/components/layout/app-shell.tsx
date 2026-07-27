"use client";

import { DesktopNav, MobileNav } from "./nav";
import { CreateItemButton } from "@/components/create/create-item-button";
import { DeviceLockGate } from "@/components/lock/device-lock-gate";

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
  return (
    <DeviceLockGate>
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
        <DesktopNav currentName={currentName} partnerName={partnerName} />

        <main
          data-app-scroll
          className="relative mx-auto w-full max-w-6xl flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 pb-8 md:px-6 md:py-8"
        >
          {children}
        </main>

        <div className="relative z-50 shrink-0 md:hidden">
          {showMobileCreate ? (
            <div className="pointer-events-none absolute bottom-[calc(100%+0.75rem)] right-4 z-50">
              <div className="pointer-events-auto">
                <CreateItemButton compact />
              </div>
            </div>
          ) : null}
          <MobileNav />
        </div>
      </div>
    </DeviceLockGate>
  );
}
