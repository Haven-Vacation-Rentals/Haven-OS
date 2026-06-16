export const COMPENSATION_FORM_STATUSES = ["draft", "active", "closed"] as const;
export type CompensationFormStatus = (typeof COMPENSATION_FORM_STATUSES)[number];

export const COMPENSATION_ACTIVITY_TYPES = [
  "booked_meeting",
  "closed_deal",
] as const;
export type CompensationActivityType =
  (typeof COMPENSATION_ACTIVITY_TYPES)[number];

export const COMPENSATION_SUBMISSION_STATUSES = [
  "pending",
  "approved",
  "paid",
  "rejected",
] as const;
export type CompensationSubmissionStatus =
  (typeof COMPENSATION_SUBMISSION_STATUSES)[number];

export type DbCompensationForm = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: CompensationFormStatus;
  allow_booked_meetings: boolean;
  allow_closed_deals: boolean;
  meeting_payout_amount: number;
  closed_deal_payout_amount: number;
  deal_commission_percent: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbCompensationSubmission = {
  id: string;
  form_id: string;
  submitted_at: string;
  rep_name: string;
  rep_email: string | null;
  activity_type: CompensationActivityType;
  account_name: string;
  contact_name: string | null;
  activity_date: string | null;
  meeting_datetime: string | null;
  deal_count: number | null;
  deal_value: number | null;
  payout_amount: number;
  notes: string;
  status: CompensationSubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export type CompensationFormListItem = DbCompensationForm & {
  submission_count: number;
  pending_count: number;
  total_pending_payout: number;
  total_approved_payout: number;
  total_paid_payout: number;
  last_submission_at: string | null;
};

export type CompensationSubmissionWithForm = DbCompensationSubmission & {
  form_title: string;
  form_slug: string;
};

export const COMPENSATION_FORM_STATUS_LABELS: Record<
  CompensationFormStatus,
  string
> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

export const COMPENSATION_ACTIVITY_LABELS: Record<
  CompensationActivityType,
  string
> = {
  booked_meeting: "Booked meeting",
  closed_deal: "Closed deal",
};

export const COMPENSATION_SUBMISSION_STATUS_LABELS: Record<
  CompensationSubmissionStatus,
  string
> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};
