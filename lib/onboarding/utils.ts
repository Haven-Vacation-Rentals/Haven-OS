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
