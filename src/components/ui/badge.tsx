import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Tone = "sage" | "clay" | "amber" | "neutral" | "success";

const tones: Record<Tone, string> = {
  sage: "bg-pale-sage text-[#4f6350]",
  clay: "bg-pale-clay text-[#8a4f3c]",
  amber: "bg-[#F5E6D3] text-warning",
  neutral: "bg-[#F0EAE2] text-muted",
  success: "bg-pale-sage text-success",
};

export function Badge({
  className,
  tone = "sage",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
