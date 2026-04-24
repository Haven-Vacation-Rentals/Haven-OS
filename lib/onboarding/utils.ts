import type {
  OnboardingDepartment,
  OnboardingProjectStatus,
  OnboardingTaskStatus,
} from "./types";

// Department → tone+color mapping for badges/chips
export const DEPARTMENT_TONE: Record<
  OnboardingDepartment,
  "coral" | "sage" | "success" | "warn" | "danger" | "dark" | "neutral"
> = {
  onboarding: "coral",
  owner_relations: "warn",
  revenue: "dark",
  cleaning: "sage",
  guest_comms: "success",
  finance: "warn",
  dispatch: "danger",
  sales: "coral",
  maintenance: "neutral",
  runner: "neutral",
  leadership: "dark",
  haven: "coral",
  tendwell: "sage",
  stillwater: "sage",
};

export const PROJECT_STATUS_TONE: Record<
  OnboardingProjectStatus,
  "coral" | "warn" | "success" | "neutral" | "danger"
> = {
  onboarding: "coral",
  owner_relations_onboarding: "warn",
  ready_to_pass: "success",
  done: "success",
  no_longer_onboarding: "danger",
  on_hold: "neutral",
};

export const TASK_STATUS_TONE: Record<
  OnboardingTaskStatus,
  "neutral" | "warn" | "danger" | "success" | "sage"
> = {
  not_started: "neutral",
  in_progress: "warn",
  blocked: "danger",
  done: "success",
  na: "sage",
};

export function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export function formatDateShort(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

// Project status pipeline — visual stage progression for a project.
// "ready_to_pass" and "done" share the final lane visually; on_hold /
// no_longer_onboarding are off-pipeline and render distinctly.
export const PROJECT_PIPELINE: {
  key: OnboardingProjectStatus;
  label: string;
  index: number;
}[] = [
  { key: "onboarding", label: "Onboarding", index: 0 },
  { key: "owner_relations_onboarding", label: "Owner Relations", index: 1 },
  { key: "ready_to_pass", label: "Ready to Pass", index: 2 },
  { key: "done", label: "Done", index: 3 },
];

export function pipelineIndex(status: OnboardingProjectStatus): number {
  const hit = PROJECT_PIPELINE.find((p) => p.key === status);
  return hit ? hit.index : -1;
}

export function isOffPipeline(status: OnboardingProjectStatus): boolean {
  return status === "on_hold" || status === "no_longer_onboarding";
}

// Returns number of days from today until the given date.
// Positive = future, negative = past, 0 = today. null if no date.
export function daysUntil(s: string | null | undefined): number | null {
  if (!s) return null;
  try {
    const target = new Date(s);
    if (Number.isNaN(target.getTime())) return null;
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ms = target.getTime() - today.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function isOverdue(s: string | null | undefined): boolean {
  const d = daysUntil(s);
  return d !== null && d < 0;
}

// "in 3 days" / "2 days ago" / "today" — compact relative label for key dates.
export function formatRelative(s: string | null | undefined): string {
  const d = daysUntil(s);
  if (d === null) return "—";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d > 0 && d <= 14) return `in ${d} days`;
  if (d < 0 && d >= -14) return `${Math.abs(d)} days ago`;
  // Fall back to formatted date for far-out things.
  return formatDateShort(s);
}

// Bucket a date into human-ordered timeline groups.
export type TimelineBucket =
  | "overdue"
  | "today"
  | "this_week"
  | "next_week"
  | "later"
  | "no_date";

export const TIMELINE_BUCKET_LABEL: Record<TimelineBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  this_week: "This week",
  next_week: "Next week",
  later: "Later",
  no_date: "No date",
};

export function timelineBucket(
  s: string | null | undefined,
): TimelineBucket {
  const d = daysUntil(s);
  if (d === null) return "no_date";
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  if (d <= 7) return "this_week";
  if (d <= 14) return "next_week";
  return "later";
}

export const TIMELINE_BUCKET_ORDER: TimelineBucket[] = [
  "overdue",
  "today",
  "this_week",
  "next_week",
  "later",
  "no_date",
];
