import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-surface-alt text-foreground/80",
        coral: "bg-haven-coral-100 text-haven-coral-700",
        sage: "bg-haven-sage text-foreground/80",
        success: "bg-emerald-50 text-emerald-700",
        warn: "bg-amber-50 text-amber-800",
        danger: "bg-rose-50 text-rose-700",
        dark: "bg-foreground text-background",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </span>
  );
}
