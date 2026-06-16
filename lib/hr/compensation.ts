"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPermissions, requireHrModule } from "@/lib/auth/permissions";
import type {
  CompensationActivityType,
  CompensationFormListItem,
  CompensationFormStatus,
  CompensationSubmissionStatus,
  CompensationSubmissionWithForm,
  DbCompensationForm,
  DbCompensationSubmission,
} from "./compensation-types";
import {
  COMPENSATION_ACTIVITY_TYPES,
  COMPENSATION_FORM_STATUSES,
  COMPENSATION_SUBMISSION_STATUSES,
} from "./compensation-types";

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function currentEmail(): Promise<string | null> {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

function toMoney(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function isFormStatus(value: unknown): value is CompensationFormStatus {
  return (
    typeof value === "string" &&
    (COMPENSATION_FORM_STATUSES as readonly string[]).includes(value)
  );
}

function isActivityType(value: unknown): value is CompensationActivityType {
  return (
    typeof value === "string" &&
    (COMPENSATION_ACTIVITY_TYPES as readonly string[]).includes(value)
  );
}

function isSubmissionStatus(
  value: unknown,
): value is CompensationSubmissionStatus {
  return (
    typeof value === "string" &&
    (COMPENSATION_SUBMISSION_STATUSES as readonly string[]).includes(value)
  );
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const supabase = await db();
  let slug = base || "sales-compensation";
  let i = 1;
  while (i < 50) {
    let q = supabase.from("hr_compensation_forms").select("id").eq("slug", slug);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function revalidateCompensation() {
  revalidatePath("/hr/compensation");
}

function normaliseForm(row: DbCompensationForm): DbCompensationForm {
  return {
    ...row,
    allow_booked_meetings: row.allow_booked_meetings ?? true,
    allow_closed_deals: row.allow_closed_deals ?? true,
    meeting_payout_amount: toMoney(row.meeting_payout_amount),
    closed_deal_payout_amount: toMoney(
      row.closed_deal_payout_amount ?? row.deal_commission_percent,
    ),
    deal_commission_percent: toMoney(row.deal_commission_percent),
  };
}

function normaliseSubmission(
  row: DbCompensationSubmission,
): DbCompensationSubmission {
  return {
    ...row,
    deal_count:
      row.deal_count === null || row.deal_count === undefined
        ? null
        : Math.max(1, Math.floor(Number(row.deal_count) || 1)),
    deal_value: row.deal_value === null ? null : toMoney(row.deal_value),
    payout_amount: toMoney(row.payout_amount),
  };
}

export async function listCompensationForms(): Promise<
  CompensationFormListItem[]
> {
  await requireHrModule("compensation");
  const supabase = await db();
  const { data: forms, error } = await supabase
    .from("hr_compensation_forms")
    .select("*")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const list = ((forms ?? []) as DbCompensationForm[]).map(normaliseForm);
  if (list.length === 0) return [];

  const ids = list.map((f) => f.id);
  const { data: submissions, error: subError } = await supabase
    .from("hr_compensation_submissions")
    .select("form_id, submitted_at, status, payout_amount")
    .in("form_id", ids);
  if (subError) throw subError;

  type Row = {
    form_id: string;
    submitted_at: string;
    status: CompensationSubmissionStatus;
    payout_amount: number | string;
  };
  const stats = new Map<
    string,
    {
      count: number;
      pending: number;
      pendingPayout: number;
      approvedPayout: number;
      paidPayout: number;
      last: string | null;
    }
  >();
  for (const r of (submissions ?? []) as Row[]) {
    const cur =
      stats.get(r.form_id) ??
      {
        count: 0,
        pending: 0,
        pendingPayout: 0,
        approvedPayout: 0,
        paidPayout: 0,
        last: null,
      };
    const amount = toMoney(r.payout_amount);
    cur.count += 1;
    if (r.status === "pending") {
      cur.pending += 1;
      cur.pendingPayout += amount;
    }
    if (r.status === "approved") cur.approvedPayout += amount;
    if (r.status === "paid") cur.paidPayout += amount;
    if (!cur.last || r.submitted_at > cur.last) cur.last = r.submitted_at;
    stats.set(r.form_id, cur);
  }

  return list.map((f) => {
    const s = stats.get(f.id);
    return {
      ...f,
      submission_count: s?.count ?? 0,
      pending_count: s?.pending ?? 0,
      total_pending_payout: toMoney(s?.pendingPayout ?? 0),
      total_approved_payout: toMoney(s?.approvedPayout ?? 0),
      total_paid_payout: toMoney(s?.paidPayout ?? 0),
      last_submission_at: s?.last ?? null,
    };
  });
}

export async function listCompensationSubmissions(): Promise<
  CompensationSubmissionWithForm[]
> {
  await requireHrModule("compensation");
  const supabase = await db();
  const { data, error } = await supabase
    .from("hr_compensation_submissions")
    .select(
      "*, form:hr_compensation_forms!hr_compensation_submissions_form_id_fkey(title, slug)",
    )
    .order("submitted_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as Array<DbCompensationSubmission & {
    form?: { title?: string | null; slug?: string | null };
  }>).map((r) => ({
    ...normaliseSubmission(r),
    form_title: r.form?.title ?? "Compensation form",
    form_slug: r.form?.slug ?? "",
  }));
}

export async function createCompensationForm(input: {
  title: string;
  description?: string;
  status?: CompensationFormStatus;
  allow_booked_meetings?: boolean;
  allow_closed_deals?: boolean;
  meeting_payout_amount?: number;
  closed_deal_payout_amount?: number;
  deal_commission_percent?: number;
}): Promise<DbCompensationForm> {
  await requireHrModule("compensation");
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const supabase = await db();
  const slug = await ensureUniqueSlug(slugify(title));
  const email = await currentEmail();
  const { data, error } = await supabase
    .from("hr_compensation_forms")
    .insert({
      slug,
      title,
      description: input.description?.trim() ?? "",
      status: isFormStatus(input.status) ? input.status : "draft",
      allow_booked_meetings: input.allow_booked_meetings ?? true,
      allow_closed_deals: input.allow_closed_deals ?? true,
      meeting_payout_amount: Math.max(0, toMoney(input.meeting_payout_amount)),
      closed_deal_payout_amount: Math.max(
        0,
        toMoney(input.closed_deal_payout_amount ?? input.deal_commission_percent),
      ),
      deal_commission_percent: Math.max(
        0,
        toMoney(input.deal_commission_percent),
      ),
      created_by: email,
    })
    .select()
    .single();
  if (error) throw error;
  revalidateCompensation();
  return normaliseForm(data as DbCompensationForm);
}

export async function updateCompensationForm(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    status: CompensationFormStatus;
    allow_booked_meetings: boolean;
    allow_closed_deals: boolean;
    meeting_payout_amount: number;
    closed_deal_payout_amount: number;
    deal_commission_percent: number;
  }>,
): Promise<void> {
  await requireHrModule("compensation");
  const patch: Record<string, unknown> = {};
  if (typeof input.title === "string") {
    const title = input.title.trim();
    if (!title) throw new Error("Title is required");
    patch.title = title;
    patch.slug = await ensureUniqueSlug(slugify(title), id);
  }
  if (typeof input.description === "string") {
    patch.description = input.description.trim();
  }
  if (isFormStatus(input.status)) patch.status = input.status;
  if (typeof input.allow_booked_meetings === "boolean") {
    patch.allow_booked_meetings = input.allow_booked_meetings;
  }
  if (typeof input.allow_closed_deals === "boolean") {
    patch.allow_closed_deals = input.allow_closed_deals;
  }
  if (input.meeting_payout_amount !== undefined) {
    patch.meeting_payout_amount = Math.max(0, toMoney(input.meeting_payout_amount));
  }
  if (input.closed_deal_payout_amount !== undefined) {
    patch.closed_deal_payout_amount = Math.max(
      0,
      toMoney(input.closed_deal_payout_amount),
    );
  }
  if (input.deal_commission_percent !== undefined) {
    patch.deal_commission_percent = Math.max(
      0,
      toMoney(input.deal_commission_percent),
    );
  }
  const supabase = await db();
  const { error } = await supabase
    .from("hr_compensation_forms")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
  revalidateCompensation();
}

export async function updateCompensationSubmissionStatus(
  id: string,
  status: CompensationSubmissionStatus,
): Promise<void> {
  await requireHrModule("compensation");
  if (!isSubmissionStatus(status)) throw new Error("Invalid status");
  const email = await currentEmail();
  const supabase = await db();
  const { error } = await supabase
    .from("hr_compensation_submissions")
    .update({
      status,
      reviewed_by: email,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  revalidateCompensation();
}

export async function getPublicCompensationFormBySlug(
  slug: string,
): Promise<DbCompensationForm | null> {
  try {
    if (!slug || typeof slug !== "string") return null;
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("hr_compensation_forms")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data ? normaliseForm(data as DbCompensationForm) : null;
  } catch {
    return null;
  }
}

export async function submitCompensationResponse(input: {
  form_id: string;
  slug: string;
  rep_name: string;
  rep_email?: string;
  activity_type: CompensationActivityType;
  account_name: string;
  contact_name?: string;
  activity_date?: string;
  meeting_datetime?: string;
  deal_count?: number;
  deal_value?: number;
  notes?: string;
  user_agent?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const repName = input.rep_name.trim();
    const accountName = input.account_name.trim();
    if (!repName) return { ok: false, error: "Sales rep name is required" };
    if (!accountName) return { ok: false, error: "Account name is required" };
    if (!isActivityType(input.activity_type)) {
      return { ok: false, error: "Choose meeting or closed deal" };
    }

    const supabase = await createClient();
    if (!supabase) {
      return {
        ok: false,
        error: "Compensation form service is temporarily unavailable.",
      };
    }
    const { data: form, error: formError } = await supabase
      .from("hr_compensation_forms")
      .select("*")
      .eq("id", input.form_id)
      .eq("slug", input.slug)
      .maybeSingle();
    if (formError) throw formError;
    const activeForm = form ? normaliseForm(form as DbCompensationForm) : null;
    if (!activeForm || activeForm.status !== "active") {
      return { ok: false, error: "This form is not accepting responses" };
    }
    if (
      input.activity_type === "booked_meeting" &&
      !activeForm.allow_booked_meetings
    ) {
      return { ok: false, error: "This form is not accepting booked meetings" };
    }
    if (input.activity_type === "closed_deal" && !activeForm.allow_closed_deals) {
      return { ok: false, error: "This form is not accepting closed deals" };
    }

    const dealCount =
      input.activity_type === "closed_deal"
        ? Math.max(1, Math.floor(Number(input.deal_count) || 1))
        : null;
    const dealValue =
      input.activity_type === "closed_deal"
        ? activeForm.closed_deal_payout_amount
        : null;
    const payout =
      input.activity_type === "booked_meeting"
        ? activeForm.meeting_payout_amount
        : toMoney((dealValue ?? 0) * (dealCount ?? 1));

    const row = {
      form_id: activeForm.id,
      rep_name: repName,
      rep_email: input.rep_email?.trim() || null,
      activity_type: input.activity_type,
      account_name: accountName,
      contact_name: input.contact_name?.trim() || null,
      activity_date: input.activity_date || null,
      meeting_datetime:
        input.activity_type === "booked_meeting"
          ? input.meeting_datetime || null
          : null,
      deal_count: dealCount,
      deal_value: dealValue,
      payout_amount: payout,
      notes: input.notes?.trim() ?? "",
      user_agent: input.user_agent ?? null,
    };
    const { error } = await supabase.from("hr_compensation_submissions").insert(row);
    if (error) {
      const admin = getAdminClient();
      const { error: adminError } = await admin
        .from("hr_compensation_submissions")
        .insert(row);
      if (adminError) throw adminError;
    }
    revalidateCompensation();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Something went wrong submitting this response",
    };
  }
}

export async function canManageCompensation(): Promise<boolean> {
  const perm = await getPermissions();
  if (!perm.user_id) return false;
  if (perm.is_super_admin) return true;
  return requireHrModule("compensation")
    .then(() => true)
    .catch(() => false);
}
