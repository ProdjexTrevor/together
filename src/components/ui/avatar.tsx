import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-card", sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-pale-clay font-medium text-clay ring-2 ring-card",
        sizes[size],
        className
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarPair({
  left,
  right,
}: {
  left: { name: string; src?: string | null };
  right?: { name: string; src?: string | null } | null;
}) {
  return (
    <div className="flex items-center">
      <Avatar name={left.name} src={left.src} />
      {right ? (
        <Avatar name={right.name} src={right.src} className="-ml-2" />
      ) : null}
    </div>
  );
}
