export type MetricStatus = "green" | "yellow" | "red" | null;
export type MetricType = "Total" | "Avg" | null;
export type SectionVariant = "olive" | "blue" | "red";

export interface WeekData {
  value: string | null;
  note?: string | null;
}

export interface ScorecardRow {
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
}

export interface ScorecardSection {
  id: string;
  title: string;
  variant: SectionVariant;
  rows: ScorecardRow[];
}

export interface ScorecardConfig {
  weeks: [string, string, string, string, string];
  sections: ScorecardSection[];
}
