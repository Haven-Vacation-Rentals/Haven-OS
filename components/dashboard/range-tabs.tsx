"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const ranges = ["7 Days", "30 Days", "90 Days", "Custom"] as const;
type Range = (typeof ranges)[number];

export function RangeTabs({ defaultValue = "30 Days" }: { defaultValue?: Range }) {
  const [value, setValue] = useState<Range>(defaultValue);
  return (
    <div
      role="tablist"
      aria-label="Dashboard time range"
      className="inline-flex items-center gap-1.5"
    >
      {ranges.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setValue(r)}
            className={cn(
              "h-8 rounded-md px-3 text-[13px] font-semibold transition-colors",
              active
                ? "bg-accent text-accent-foreground shadow-card"
                : "bg-surface-alt text-foreground/70 hover:bg-muted",
            )}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
