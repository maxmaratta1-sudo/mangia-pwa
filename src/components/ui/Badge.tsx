import { cn } from "../../lib/utils";

type BadgeVariant = "popular" | "signature" | "novità" | "promo" | "default";

const badgeStyles: Record<BadgeVariant, string> = {
  popular:   "bg-terracotta-100 text-terracotta-700",
  signature: "bg-olive-100 text-olive-700",
  "novità":  "bg-cream-200 text-graphite-700",
  promo:     "bg-graphite-100 text-graphite-700",
  default:   "bg-graphite-100 text-graphite-600",
};

interface BadgeProps {
  variant?:  BadgeVariant;
  children:  React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide",
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
