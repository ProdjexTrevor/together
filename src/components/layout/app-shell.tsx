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
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <DesktopNav currentName={currentName} partnerName={partnerName} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      <MobileNav />
      {showMobileCreate ? (
        <div className="fixed bottom-20 right-4 z-40 md:hidden">
          <CreateItemButton compact />
        </div>
      ) : null}
    </div>
  );
}
