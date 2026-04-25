"use client";

/**
 * TaskCheckbox — large, click-friendly circular toggle for task rows.
 *
 * One click cycles between Done and Not Started. Right-click (or the
 * StatusMenu in the row) lets the user pick the full set of statuses.
 *
 *   ○  not_started        (empty ring, hover fills)
 *   ◐  in_progress        (amber half-fill)
 *   ⛔ blocked            (rose ring with center dot)
 *   ✓  done               (filled emerald with check)
 *   —  na                 (gray ring with dash)
 *
 * Designed to be the primary affordance — visually obvious, generous hit
 * area, full keyboard support (Space toggles, Enter opens the drawer).
 */

import * as React from "react";
import { Check, Minus } from "lucide-react";
import type { OnboardingTaskStatus } from "@/lib/onboarding/types";
import { TASK_STATUS_LABELS } from "@/lib/onboarding/types";

type Size = "sm" | "md";

const SIZE_CLASSES: Record<Size, { box: string; icon: string; hit: string }> = {
  sm: { box: "h-4 w-4", icon: "h-3 w-3", hit: "h-7 w-7" },
  md: { box: "h-5 w-5", icon: "h-3.5 w-3.5", hit: "h-8 w-8" },
};

export function TaskCheckbox({
  status,
  onToggle,
  disabled,
  size = "md",
  title,
  className = "",
}: {
  status: OnboardingTaskStatus;
  /**
   * Called with the next status. Default is to toggle done <-> not_started,
   * but pages can override (e.g., to short-circuit "na" tasks).
   */
  onToggle: (next: OnboardingTaskStatus) => void;
  disabled?: boolean;
  size?: Size;
  title?: string;
  className?: string;
}) {
  const cls = SIZE_CLASSES[size];

  const next: OnboardingTaskStatus =
    status === "done" ? "not_started" : "done";

  const label =
    title ??
    (status === "done"
      ? "Mark not started"
      : `Mark done (currently ${TASK_STATUS_LABELS[status]})`);

  let inner: React.ReactNode = null;
  let boxClass =
    "border border-border bg-surface group-hover:border-emerald-500/70 group-hover:bg-emerald-50";

  switch (status) {
    case "done":
      boxClass =
        "border border-emerald-600 bg-emerald-600 text-white shadow-[0_0_0_2px_rgba(16,185,129,0.15)]";
      inner = <Check className={cls.icon + " stroke-[3]"} />;
      break;
    case "in_progress":
      boxClass = "border-2 border-amber-500 bg-amber-50";
      inner = (
        <span
          className="block rounded-full bg-amber-500"
          style={{
            width: size === "sm" ? "6px" : "8px",
            height: size === "sm" ? "6px" : "8px",
          }}
        />
      );
      break;
    case "blocked":
      boxClass = "border-2 border-rose-500 bg-rose-50";
      inner = (
        <span
          className="block rounded-full bg-rose-500"
          style={{
            width: size === "sm" ? "5px" : "7px",
            height: size === "sm" ? "5px" : "7px",
          }}
        />
      );
      break;
    case "na":
      boxClass = "border border-border bg-surface-alt text-muted-foreground";
      inner = <Minus className={cls.icon} />;
      break;
    case "not_started":
    default:
      boxClass =
        "border border-border bg-surface group-hover:border-emerald-500/70 group-hover:bg-emerald-50";
      inner = null;
      break;
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={status === "done"}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle(next);
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onToggle(next);
        }
      }}
      className={
        "group shrink-0 inline-flex items-center justify-center rounded-full " +
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 " +
        cls.hit +
        " " +
        className
      }
    >
      <span
        className={
          "inline-flex items-center justify-center rounded-full transition-colors " +
          cls.box +
          " " +
          boxClass
        }
      >
        {inner}
      </span>
    </button>
  );
}
