"use client";

/**
 * StatusMenu — popover replacement for native <select> used across
 * onboarding. Colored chip trigger, dot-colored options, keyboard
 * navigable via Radix Popover. Two flavors:
 *  - TaskStatusMenu: task status (5 options)
 *  - ProjectStatusMenu: project status (6 options)
 */

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ONBOARDING_TASK_STATUSES,
  ONBOARDING_PROJECT_STATUSES,
  TASK_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type OnboardingTaskStatus,
  type OnboardingProjectStatus,
} from "@/lib/onboarding/types";

// ---------------------------------------------------------------------------
// Tone classes
// ---------------------------------------------------------------------------

function taskChipClass(v: OnboardingTaskStatus): string {
  switch (v) {
    case "done":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "in_progress":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "blocked":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "na":
      return "bg-haven-sage text-foreground/70 border-haven-sage";
    default:
      return "bg-surface-alt text-foreground/70 border-border";
  }
}

function taskDotClass(v: OnboardingTaskStatus): string {
  switch (v) {
    case "done":
      return "bg-emerald-500";
    case "in_progress":
      return "bg-amber-500";
    case "blocked":
      return "bg-rose-500";
    case "na":
      return "bg-haven-sage-700";
    default:
      return "bg-foreground/40";
  }
}

function projectChipClass(v: OnboardingProjectStatus): string {
  switch (v) {
    case "done":
    case "ready_to_pass":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "owner_relations_onboarding":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "no_longer_onboarding":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "on_hold":
      return "bg-surface-alt text-foreground/70 border-border";
    default:
      return "bg-accent-soft text-haven-coral-700 border-haven-coral-200";
  }
}

function projectDotClass(v: OnboardingProjectStatus): string {
  switch (v) {
    case "done":
    case "ready_to_pass":
      return "bg-emerald-500";
    case "owner_relations_onboarding":
      return "bg-amber-500";
    case "no_longer_onboarding":
      return "bg-rose-500";
    case "on_hold":
      return "bg-foreground/40";
    default:
      return "bg-haven-coral-600";
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function TaskStatusMenu({
  value,
  onChange,
  disabled,
  size = "sm",
}: {
  value: OnboardingTaskStatus;
  onChange: (v: OnboardingTaskStatus) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const pad = size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-pill border font-semibold transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:shadow-ring disabled:opacity-50 ${pad} ${taskChipClass(value)}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${taskDotClass(value)}`} />
        {TASK_STATUS_LABELS[value]}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[180px] p-1">
        {ONBOARDING_TASK_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              onChange(s);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-surface-alt"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${taskDotClass(s)}`} />
            <span className="flex-1">{TASK_STATUS_LABELS[s]}</span>
            {value === s ? (
              <Check className="h-3.5 w-3.5 text-foreground/70" />
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function ProjectStatusMenu({
  value,
  onChange,
  disabled,
}: {
  value: OnboardingProjectStatus;
  onChange: (v: OnboardingProjectStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-semibold transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:shadow-ring disabled:opacity-50 ${projectChipClass(value)}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${projectDotClass(value)}`}
        />
        {PROJECT_STATUS_LABELS[value]}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[240px] p-1">
        {ONBOARDING_PROJECT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              onChange(s);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-surface-alt"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${projectDotClass(s)}`}
            />
            <span className="flex-1">{PROJECT_STATUS_LABELS[s]}</span>
            {value === s ? (
              <Check className="h-3.5 w-3.5 text-foreground/70" />
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
