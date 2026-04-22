export type MetricStatus = "green" | "yellow" | "red" | null;
export type MetricType = "Total" | "Avg" | null;
export type SectionVariant = "olive" | "blue" | "red";
export type MonthStatus = "active" | "archived";

export interface WeekData {
  value: string | null;
  note?: string | null;
}

// ---------------------------------------------------------------------------
// Raw DB row shapes (mirrors Supabase table columns)
// ---------------------------------------------------------------------------

export interface DbScorecardMonth {
  id: string;
  label: string;
  year: number;
  month: number;
  week_labels: string[];
  status: MonthStatus;
  archived_at: string | null;
  created_at: string;
}

export interface DbScorecardSection {
  id: string;
  month_id: string;
  title: string;
  variant: SectionVariant;
  order_index: number;
  created_at: string;
}

export interface DbScorecardRow {
  id: string;
  section_id: string;
  month_id: string;
  metric: string;
  order_index: number;
  week1_value: string | null;
  week1_note: string | null;
  week2_value: string | null;
  week2_note: string | null;
  week3_value: string | null;
  week3_note: string | null;
  week4_value: string | null;
  week4_note: string | null;
  remainder_value: string | null;
  remainder_note: string | null;
  monthly_target: string | null;
  metric_type: MetricType;
  monthly_actual: string | null;
  status: MetricStatus;
  metric_owner: string | null;
  metric_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// UI composite types (used in components)
// ---------------------------------------------------------------------------

export interface ScorecardRow {
  id: string;
  metric: string;
  order_index: number;
  weeks: [WeekData, WeekData, WeekData, WeekData, WeekData];
  monthlyTarget: string | null;
  metricType: MetricType;
  monthlyActual: string | null;
  status: MetricStatus;
  metricOwner: string | null;
  metricSource: string | null;
  notes: string | null;
}

export interface ScorecardSection {
  id: string;
  title: string;
  variant: SectionVariant;
  order_index: number;
  rows: ScorecardRow[];
}

export interface ScorecardMonth {
  id: string;
  label: string;
  year: number;
  month: number;
  weekLabels: [string, string, string, string, string];
  status: MonthStatus;
  archivedAt: string | null;
  createdAt: string;
  sections: ScorecardSection[];
}

export interface MonthSummary {
  id: string;
  label: string;
  year: number;
  month: number;
  status: MonthStatus;
  archived_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Legacy static config (used by seed data in data.ts)
// ---------------------------------------------------------------------------

export interface ScorecardConfig {
  weeks: [string, string, string, string, string];
  sections: Array<{
    id: string;
    title: string;
    variant: SectionVariant;
    rows: Array<{
      id: string;
      metric: string;
      weeks: [WeekData, WeekData, WeekData, WeekData, WeekData];
      monthlyTarget: string | null;
      metricType: MetricType;
      monthlyActual: string | null;
      status: MetricStatus;
      metricOwner: string | null;
      metricSource: string | null;
      notes: string | null;
    }>;
  }>;
}
