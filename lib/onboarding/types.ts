// Database shapes (snake_case from Supabase) + domain types for onboarding.

export const ONBOARDING_PROJECT_STATUSES = [
  "onboarding",
  "owner_relations_onboarding",
  "ready_to_pass",
  "done",
  "no_longer_onboarding",
  "on_hold",
] as const;
export type OnboardingProjectStatus = (typeof ONBOARDING_PROJECT_STATUSES)[number];

export const ONBOARDING_TASK_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
  "na",
] as const;
export type OnboardingTaskStatus = (typeof ONBOARDING_TASK_STATUSES)[number];

export const ONBOARDING_DEPARTMENTS = [
  "onboarding",
  "owner_relations",
  "revenue",
  "cleaning",
  "guest_comms",
  "finance",
  "dispatch",
  "sales",
  "maintenance",
  "runner",
  "leadership",
  "haven",
  "tendwell",
  "stillwater",
] as const;
export type OnboardingDepartment = (typeof ONBOARDING_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<OnboardingDepartment, string> = {
  onboarding: "Onboarding",
  owner_relations: "Owner Relations",
  revenue: "Revenue",
  cleaning: "Cleaning",
  guest_comms: "Guest Communications",
  finance: "Finance",
  dispatch: "Dispatch",
  sales: "Sales",
  maintenance: "Maintenance",
  runner: "Runner/Support",
  leadership: "Leadership Team",
  haven: "Haven",
  tendwell: "Tendwell",
  stillwater: "Stillwater",
};

export const PROJECT_STATUS_LABELS: Record<OnboardingProjectStatus, string> = {
  onboarding: "Onboarding",
  owner_relations_onboarding: "Owner Relations Onboarding",
  ready_to_pass: "Ready to Pass",
  done: "Done",
  no_longer_onboarding: "No Longer Onboarding",
  on_hold: "On Hold",
};

export const TASK_STATUS_LABELS: Record<OnboardingTaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
  na: "N/A",
};

export type DbOnboardingProject = {
  id: string;
  property_nickname: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  status: OnboardingProjectStatus;
  start_date: string | null;
  target_open_date: string | null;
  actual_open_date: string | null;
  slack_channel: string | null;
  owner_profile_folder_url: string | null;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbOnboardingTask = {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  template_key: string | null;
  title: string;
  description: string;
  department: OnboardingDepartment | null;
  status: OnboardingTaskStatus;
  is_key_date: boolean;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  assignee_email: string | null;
  notes: string;
  order_index: number;
  depth: number;
  created_at: string;
  updated_at: string;
};

export type DbOnboardingChecklistItem = {
  id: string;
  task_id: string;
  label: string;
  is_checked: boolean;
  checked_at: string | null;
  checked_by: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbOnboardingTaskTemplate = {
  id: string;
  template_key: string;
  parent_template_key: string | null;
  title: string;
  description: string | null;
  department: OnboardingDepartment | null;
  is_key_date: boolean;
  order_index: number;
  depth: number;
  has_checklist: boolean;
  checklist_items: string[];
  created_at: string;
};

// Tree-shaped task (children nested in)
export type OnboardingTaskNode = DbOnboardingTask & {
  children: OnboardingTaskNode[];
  checklist: DbOnboardingChecklistItem[];
};

export type OnboardingProjectTree = {
  project: DbOnboardingProject;
  tasks: OnboardingTaskNode[];
  totals: {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
    notStarted: number;
    na: number;
    percentComplete: number; // 0..100 (excludes na tasks from denominator)
    keyDatesTotal: number;
    keyDatesDone: number;
  };
};
