import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-border bg-surface px-3",
      "text-sm text-foreground placeholder:text-muted-foreground",
      "focus:outline-none focus:shadow-ring",
      "disabled:opacity-50 disabled:pointer-events-none",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
