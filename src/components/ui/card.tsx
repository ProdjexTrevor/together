import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-border bg-card shadow-[0_1px_2px_rgba(36,53,45,0.04),0_8px_24px_rgba(36,53,45,0.04)] transition-transform duration-[200ms] ease-out motion-safe:hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-display text-[25px] leading-tight text-ink md:text-[28px]", className)}
      {...props}
    />
  );
}
