import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  accent?: boolean;
  className?: string;
}

/**
 * KPI stat card — Futura display numerics, Raleway labels,
 * coral accent reserved for the single "focus" metric per row.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
  delta,
  accent = false,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col gap-3 p-5",
        accent && "bg-foreground text-background border-transparent",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "haven-eyebrow",
            accent && "text-background/70",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-md bg-surface-alt text-foreground/70",
            accent && "bg-background/10 text-background",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-heading text-[32px] font-bold leading-none tracking-tight",
            accent ? "text-background" : "text-foreground",
          )}
        >
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              delta.direction === "up" && "text-emerald-600",
              delta.direction === "down" && "text-rose-600",
              delta.direction === "flat" && "text-muted-foreground",
              accent && "text-background/80",
            )}
          >
            {delta.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : delta.direction === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {delta.value}
          </span>
        ) : null}
      </div>

      {sub ? (
        <div
          className={cn(
            "text-xs",
            accent ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {sub}
        </div>
      ) : null}
    </Card>
  );
}
