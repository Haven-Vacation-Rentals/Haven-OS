// Database shapes (snake_case from Supabase)

export type DbHrAdmin = { email: string; created_at: string };

export type DbEmployee = {
  id: string;
  full_name: string;
  email: string | null;
  role_title: string | null;
  department: string | null;
  department_id: string | null;
  profile_id: string | null;
  start_date: string | null;
  status: string; // active | inactive | terminated
  avatar_url: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type DbPerformanceReview = {
  id: string;
  employee_id: string;
  review_date: string;
  reviewer_email: string | null;
  rating: string | null;
  summary: string;
  goals: string;
  created_at: string;
  updated_at: string;
};

export type DbHrIssue = {
  id: string;
  employee_id: string;
  reported_by: string | null;
  reported_date: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  resolution: string;
  created_at: string;
  updated_at: string;
};

export type DbRole = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string;
  responsibilities: string;
  perks: string;
  status: string; // draft | open | closed
  created_at: string;
  updated_at: string;
};

export type DbCandidate = {
  id: string;
  role_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  resume_url: string | null;
  resume_path: string | null;
  resume_filename: string | null;
  resume_mime: string | null;
  resume_size: number | null;
  loom_url: string | null;
  cover_letter: string;
  stage: string; // applied | screen | interview | offer | hired | rejected
  source: string; // public_form | referral | manual
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ApplicationQuestionConfig = {
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_label_low?: string;
  scale_label_high?: string;
};

export type DbRoleQuestion = {
  id: string;
  role_id: string;
  position: number;
  question_type: string; // short_text | long_text | url | single_choice | multi_choice | rating | yes_no
  prompt: string;
  help_text: string;
  required: boolean;
  config: ApplicationQuestionConfig;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbCandidateAnswer = {
  id: string;
  candidate_id: string;
  question_id: string;
  value_text: string | null;
  value_choice: string | null;
  value_choices: string[] | null;
  value_number: number | null;
  created_at: string;
};

export type ApplicationAnswerInput = {
  question_id: string;
  value_text?: string | null;
  value_choice?: string | null;
  value_choices?: string[] | null;
  value_number?: number | null;
};

export const APPLICATION_QUESTION_TYPES = [
  "short_text",
  "long_text",
  "url",
  "single_choice",
  "multi_choice",
  "rating",
  "yes_no",
] as const;
export type ApplicationQuestionType = (typeof APPLICATION_QUESTION_TYPES)[number];

export const APPLICATION_QUESTION_TYPE_LABELS: Record<ApplicationQuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  url: "URL / link",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  rating: "Rating",
  yes_no: "Yes / No",
};

export type DbCandidateNote = {
  id: string;
  candidate_id: string;
  author_id: string | null;
  author_email: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type DbHrDoc = {
  id: string;
  kind: string; // policy | procedure
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// App-facing enums / constants

export const EMPLOYEE_STATUSES = ["active", "inactive", "terminated"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const ISSUE_CATEGORIES = [
  "performance",
  "behavior",
  "attendance",
  "safety",
  "other",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_SEVERITIES = ["low", "medium", "high"] as const;
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const ISSUE_STATUSES = ["open", "in_progress", "resolved"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ROLE_STATUSES = ["draft", "open", "closed"] as const;
export type RoleStatus = (typeof ROLE_STATUSES)[number];

export const CANDIDATE_STAGES = [
  "applied",
  "screen",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

export const DOC_KINDS = ["policy", "procedure"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "seasonal",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

// Human-readable labels

export const CANDIDATE_STAGE_LABELS: Record<CandidateStage, string> = {
  applied: "Applied",
  screen: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const ROLE_STATUS_LABELS: Record<RoleStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  performance: "Performance",
  behavior: "Behavior",
  attendance: "Attendance",
  safety: "Safety",
  other: "Other",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  seasonal: "Seasonal",
};
