import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-clay text-white hover:bg-[#b86b52] shadow-sm focus-visible:ring-clay/40",
  secondary:
    "bg-card text-ink border border-ink/20 hover:bg-pale-sage/40 focus-visible:ring-sage/40",
  ghost: "bg-transparent text-ink hover:bg-pale-sage/50 focus-visible:ring-sage/30",
  destructive:
    "bg-destructive text-white hover:bg-[#9f4740] focus-visible:ring-destructive/40",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-[12px]",
  md: "h-11 px-4 text-[15px] rounded-[13px]",
  lg: "h-12 px-5 text-base rounded-[14px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-[180ms] ease-out disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
