"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DbScorecardMonth,
  DbScorecardSection,
  DbScorecardRow,
  ScorecardMonth,
  ScorecardSection,
  ScorecardRow,
  MonthSummary,
  MetricStatus,
  MetricType,
} from "./types";
import { SCORECARD_DATA } from "./data";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function mapRow(r: DbScorecardRow): ScorecardRow {
  return {
    id: r.id,
    metric: r.metric,
    order_index: r.order_index,
    weeks: [
      { value: r.week1_value, note: r.week1_note },
      { value: r.week2_value, note: r.week2_note },
      { value: r.week3_value, note: r.week3_note },
      { value: r.week4_value, note: r.week4_note },
      { value: r.remainder_value, note: r.remainder_note },
    ],
    monthlyTarget: r.monthly_target,
    metricType: r.metric_type,
    monthlyActual: r.monthly_actual,
    status: r.status,
    metricOwner: r.metric_owner,
    metricSource: r.metric_source,
    notes: r.notes,
  };
}

function assembleMonth(
  m: DbScorecardMonth,
  sections: DbScorecardSection[],
  rows: DbScorecardRow[],
): ScorecardMonth {
  const bySection = new Map<string, ScorecardRow[]>();
  for (const r of rows) {
    const arr = bySection.get(r.section_id) ?? [];
    arr.push(mapRow(r));
    bySection.set(r.section_id, arr);
  }

  const mappedSections: ScorecardSection[] = sections
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => ({
      id: s.id,
      title: s.title,
      variant: s.variant,
      order_index: s.order_index,
      rows: (bySection.get(s.id) ?? []).sort((a, b) => a.order_index - b.order_index),
    }));

  const wl = m.week_labels ?? [];
  return {
    id: m.id,
    label: m.label,
    year: m.year,
    month: m.month,
    weekLabels: [wl[0] ?? "", wl[1] ?? "", wl[2] ?? "", wl[3] ?? "", wl[4] ?? ""],
    status: m.status,
    archivedAt: m.archived_at,
    createdAt: m.created_at,
    sections: mappedSections,
  };
}

async function fetchMonth(supabase: Awaited<ReturnType<typeof db>>, monthId: string) {
  const [{ data: m, error: mErr }, { data: sections }, { data: rows }] = await Promise.all([
    supabase.from("scorecard_months").select("*").eq("id", monthId).single(),
    supabase.from("scorecard_sections").select("*").eq("month_id", monthId).order("order_index"),
    supabase.from("scorecard_rows").select("*").eq("month_id", monthId).order("order_index"),
  ]);
  if (mErr || !m) return null;
  return assembleMonth(m as DbScorecardMonth, (sections ?? []) as DbScorecardSection[], (rows ?? []) as DbScorecardRow[]);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getActiveMonth(): Promise<ScorecardMonth | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("scorecard_months")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return fetchMonth(supabase, (data as { id: string }).id);
}

export async function getMonth(id: string): Promise<ScorecardMonth | null> {
  const supabase = await db();
  return fetchMonth(supabase, id);
}

export async function listMonths(): Promise<MonthSummary[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("scorecard_months")
    .select("id, label, year, month, status, archived_at, created_at")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) return [];
  return (data ?? []) as MonthSummary[];
}

// ---------------------------------------------------------------------------
// Seed (called once when no active month exists)
// ---------------------------------------------------------------------------

export async function seedActiveMonth(): Promise<ScorecardMonth> {
  const supabase = await db();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const label = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const { data: mData, error: mErr } = await supabase
    .from("scorecard_months")
    .insert({ label, year, month, week_labels: SCORECARD_DATA.weeks, status: "active" })
    .select()
    .single();
  if (mErr) throw mErr;

  const monthId = (mData as DbScorecardMonth).id;

  for (let si = 0; si < SCORECARD_DATA.sections.length; si++) {
    const sec = SCORECARD_DATA.sections[si];
    const { data: sData, error: sErr } = await supabase
      .from("scorecard_sections")
      .insert({ month_id: monthId, title: sec.title, variant: sec.variant, order_index: si })
      .select()
      .single();
    if (sErr) throw sErr;

    const sectionId = (sData as DbScorecardSection).id;
    const rowInserts = sec.rows.map((row, ri) => ({
      section_id: sectionId,
      month_id: monthId,
      metric: row.metric,
      order_index: ri,
      week1_value: row.weeks[0].value,
      week1_note: row.weeks[0].note ?? null,
      week2_value: row.weeks[1].value,
      week2_note: row.weeks[1].note ?? null,
      week3_value: row.weeks[2].value,
      week3_note: row.weeks[2].note ?? null,
      week4_value: row.weeks[3].value,
      week4_note: row.weeks[3].note ?? null,
      remainder_value: row.weeks[4].value,
      remainder_note: row.weeks[4].note ?? null,
      monthly_target: row.monthlyTarget,
      metric_type: row.metricType,
      monthly_actual: row.monthlyActual,
      status: row.status,
      metric_owner: row.metricOwner,
      metric_source: row.metricSource,
      notes: row.notes,
    }));

    const { error: rErr } = await supabase.from("scorecard_rows").insert(rowInserts);
    if (rErr) throw rErr;
  }

  revalidatePath("/scorecard");
  return (await fetchMonth(supabase, monthId))!;
}

// ---------------------------------------------------------------------------
// Cell & label updates
// ---------------------------------------------------------------------------

const ALLOWED_ROW_FIELDS = new Set([
  "metric",
  "week1_value", "week1_note",
  "week2_value", "week2_note",
  "week3_value", "week3_note",
  "week4_value", "week4_note",
  "remainder_value", "remainder_note",
  "monthly_target", "metric_type", "monthly_actual",
  "status", "metric_owner", "metric_source", "notes",
]);

export async function updateRowCell(
  rowId: string,
  field: string,
  value: string | null,
): Promise<void> {
  if (!ALLOWED_ROW_FIELDS.has(field)) throw new Error(`Disallowed field: ${field}`);
  const supabase = await db();
  const { error } = await supabase
    .from("scorecard_rows")
    .update({ [field]: value || null })
    .eq("id", rowId);
  if (error) throw error;
  // No revalidatePath — client manages optimistic state
}

export async function updateWeekLabel(
  monthId: string,
  weekIndex: number,
  label: string,
): Promise<void> {
  if (weekIndex < 0 || weekIndex > 4) throw new Error("Invalid week index");
  const supabase = await db();
  const { data, error: rErr } = await supabase
    .from("scorecard_months")
    .select("week_labels")
    .eq("id", monthId)
    .single();
  if (rErr) throw rErr;

  const labels: string[] = [...((data as { week_labels: string[] }).week_labels ?? ["", "", "", "", ""])];
  labels[weekIndex] = label;

  const { error } = await supabase
    .from("scorecard_months")
    .update({ week_labels: labels })
    .eq("id", monthId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Archive current month → create next blank month
// ---------------------------------------------------------------------------

export async function archiveActiveMonth(): Promise<ScorecardMonth> {
  const supabase = await db();

  // 1. Find the active month
  const { data: active, error: aErr } = await supabase
    .from("scorecard_months")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .single();
  if (aErr || !active) throw new Error("No active month to archive");

  const current = active as DbScorecardMonth;

  // 2. Load sections + rows for structure copy
  const [{ data: sections }, { data: rows }] = await Promise.all([
    supabase.from("scorecard_sections").select("*").eq("month_id", current.id).order("order_index"),
    supabase.from("scorecard_rows").select("*").eq("month_id", current.id).order("order_index"),
  ]);

  // 3. Archive current
  const { error: archErr } = await supabase
    .from("scorecard_months")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", current.id);
  if (archErr) throw archErr;

  // 4. Create next month (JS month is 0-indexed; stored month is 1-indexed)
  const nextDate = new Date(current.year, current.month, 1); // current.month IS 1-indexed, so this advances by one month
  const nextYear = nextDate.getFullYear();
  const nextMonth = nextDate.getMonth() + 1;
  const nextLabel = nextDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const { data: newM, error: nmErr } = await supabase
    .from("scorecard_months")
    .insert({ label: nextLabel, year: nextYear, month: nextMonth, week_labels: ["", "", "", "", ""], status: "active" })
    .select()
    .single();
  if (nmErr) throw nmErr;

  const newMonthId = (newM as DbScorecardMonth).id;

  // 5. Copy section + row structure (blank values)
  for (const sec of (sections ?? []) as DbScorecardSection[]) {
    const { data: newSec, error: nsErr } = await supabase
      .from("scorecard_sections")
      .insert({ month_id: newMonthId, title: sec.title, variant: sec.variant, order_index: sec.order_index })
      .select()
      .single();
    if (nsErr) throw nsErr;

    const sectionRows = ((rows ?? []) as DbScorecardRow[]).filter((r) => r.section_id === sec.id);
    if (!sectionRows.length) continue;

    const { error: rErr } = await supabase.from("scorecard_rows").insert(
      sectionRows.map((r) => ({
        section_id: (newSec as DbScorecardSection).id,
        month_id: newMonthId,
        metric: r.metric,
        order_index: r.order_index,
        // All value fields left null for the new month
      })),
    );
    if (rErr) throw rErr;
  }

  revalidatePath("/scorecard");
  return (await fetchMonth(supabase, newMonthId))!;
}
