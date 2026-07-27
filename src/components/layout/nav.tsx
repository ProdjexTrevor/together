"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  Home,
  MoreHorizontal,
  Scale,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { AvatarPair } from "@/components/ui/avatar";

const desktopLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/decisions", label: "Decisions", icon: Scale },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/finances", label: "Finances", icon: CircleDollarSign },
];

const mobileLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/decisions", label: "Decisions", icon: Scale },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/settings", label: "More", icon: MoreHorizontal },
];

export function DesktopNav({
  currentName,
  partnerName,
}: {
  currentName: string;
  partnerName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {desktopLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-pale-clay text-clay"
                    : "text-muted hover:bg-pale-sage/50 hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
          <Link
            href="/calendar"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
              pathname.startsWith("/calendar")
                ? "bg-pale-clay text-clay"
                : "text-muted hover:bg-pale-sage/50 hover:text-ink"
            )}
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            Calendar
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <AvatarPair
            left={{ name: currentName }}
            right={partnerName ? { name: partnerName } : null}
          />
          <span className="hidden text-sm text-muted lg:inline">
            {partnerName ? `${currentName} & ${partnerName}` : currentName}
          </span>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between">
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-clay" : "text-muted"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
