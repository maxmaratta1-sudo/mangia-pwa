import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "warm";
  padding?:  "none" | "sm" | "md" | "lg";
  as?:       "div" | "article" | "section" | "li";
}

const variantStyles = {
  default:  "bg-white border border-graphite-100",
  elevated: "bg-white shadow-card",
  outlined: "bg-transparent border border-graphite-200",
  warm:     "bg-cream-50 border border-cream-200",
};

const paddingStyles = {
  none: "",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      as: Tag  = "div",
      className,
      children,
      ...props
    },
    ref
  ) => (
    <Tag
      ref={ref as any}
      className={cn(
        "rounded-2xl overflow-hidden",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
);

Card.displayName = "Card";

// ── Sub-components ──────────────────────────────────────────────────────────

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between mb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-graphite-800 font-medium text-lg leading-snug", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between pt-3 mt-3 border-t border-graphite-100", className)}
      {...props}
    />
  );
}
