import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Haven button system.
 *
 * The `cta` variant is the one that matches havenvacationrentals.com
 * exactly — pill, uppercase, 900 weight, 2px tracking, coral fill.
 * `primary` is a softened version for in-app actions (no uppercase).
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:shadow-ring",
    "disabled:opacity-50 disabled:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        cta: [
          "rounded-pill bg-accent text-accent-foreground",
          "text-[14px] font-black uppercase tracking-cta",
          "hover:brightness-95 active:brightness-90",
        ].join(" "),
        primary: [
          "rounded-md bg-accent text-accent-foreground font-semibold",
          "hover:brightness-95 active:brightness-90",
        ].join(" "),
        secondary: [
          "rounded-md bg-surface-alt text-foreground font-semibold",
          "border border-border hover:bg-muted",
        ].join(" "),
        outline: [
          "rounded-md border border-border bg-transparent text-foreground",
          "hover:bg-surface-alt",
        ].join(" "),
        ghost: [
          "rounded-md bg-transparent text-foreground",
          "hover:bg-surface-alt",
        ].join(" "),
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
