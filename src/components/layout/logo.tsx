import { Heart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/dashboard",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-pale-clay text-clay">
        <Heart className="h-4 w-4 fill-current" aria-hidden />
        <span className="sr-only">Together</span>
      </span>
      <span className="font-display text-2xl tracking-tight text-ink">Together</span>
    </Link>
  );
}
