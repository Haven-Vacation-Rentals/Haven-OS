import { cn } from "@/lib/utils";
import type { PropertyStatus, PropertyTier } from "@/lib/properties/types";

const statusStyles: Record<PropertyStatus, { label: string; class: string }> = {
  live: { label: "Live", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  onboarding: { label: "Onboarding", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  paused: { label: "Paused", class: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  offboarding: { label: "Offboarding", class: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  offboarded: { label: "Offboarded", class: "bg-muted text-muted-foreground" },
};

const tierStyles: Record<PropertyTier, { label: string; class: string }> = {
  top: { label: "Top", class: "bg-accent-soft text-accent" },
  key: { label: "Key", class: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  normal: { label: "Normal", class: "bg-surface-alt text-foreground/70" },
  junior: { label: "Junior", class: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  low: { label: "Low", class: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.class,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

export function TierBadge({ tier, className }: { tier: PropertyTier | null; className?: string }) {
  if (!tier) return null;
  const t = tierStyles[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        t.class,
        className,
      )}
    >
      {t.label}
    </span>
  );
}
