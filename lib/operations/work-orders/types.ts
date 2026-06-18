/**
 * Operations Costs — work-order profitability types.
 * Mirrors supabase/migrations/0044_operations_work_orders.sql.
 *
 * One WorkOrder = one completed job: who did it (tech or runner), what was
 * charged to the client (revenue), and what the worker is paid (labor cost).
 * Profit = charged - paid. The dashboard rolls these up by day and employee.
 */

export const WORK_ORDER_ROLES = [
  "maintenance_tech",
  "runner",
  "other",
] as const;
export type WorkOrderRole = (typeof WORK_ORDER_ROLES)[number];

export const WORK_ORDER_ROLE_LABELS: Record<WorkOrderRole, string> = {
  maintenance_tech: "Maintenance Tech",
  runner: "Runner",
  other: "Other",
};

export const WORK_ORDER_SOURCES = [
  "manual",
  "agent_upload",
  "api",
  "other",
] as const;
export type WorkOrderSource = (typeof WORK_ORDER_SOURCES)[number];

export interface WorkOrder {
  id: string;
  work_date: string; // YYYY-MM-DD

  employee_name: string;
  employee_role: WorkOrderRole;
  employee_id: string | null;

  title: string | null;
  description: string | null;
  property_id: string | null;
  property_name: string | null;

  amount_charged: number;
  amount_paid: number;
  profit: number;

  source: WorkOrderSource;
  external_ref: string | null;
  notes: string | null;

  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateWorkOrderInput = {
  work_date?: string | null;
  employee_name: string;
  employee_role?: WorkOrderRole;
  employee_id?: string | null;
  title?: string | null;
  description?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  amount_charged?: number;
  amount_paid?: number;
  source?: WorkOrderSource;
  external_ref?: string | null;
  notes?: string | null;
};

export type UpdateWorkOrderInput = Partial<
  Omit<
    WorkOrder,
    "id" | "profit" | "created_at" | "updated_at" | "created_by"
  >
>;

export type WorkOrderFilter = {
  /** Single business day (YYYY-MM-DD). Used by the daily view. */
  date?: string;
  /** Inclusive range start (YYYY-MM-DD). Used by the history view. */
  from?: string;
  /** Inclusive range end (YYYY-MM-DD). Used by the history view. */
  to?: string;
  role?: WorkOrderRole | "all";
  /** Filter by employee_name (exact). */
  employee?: string | "all";
  search?: string;
};

// ---------------------------------------------------------------------------
// Aggregates (computed in util.ts, consumed by the dashboard + agent tools)
// ---------------------------------------------------------------------------

export interface EmployeeSummary {
  employee_name: string;
  /** Distinct roles this person logged work under (usually one). */
  roles: WorkOrderRole[];
  orders: number;
  charged: number;
  paid: number;
  profit: number;
  /** profit / charged, 0..1. 0 when nothing was charged. */
  margin: number;
}

export interface CostsTotals {
  orders: number;
  employees: number;
  charged: number;
  paid: number;
  profit: number;
  margin: number;
}

export interface CostsSummary {
  totals: CostsTotals;
  by_employee: EmployeeSummary[];
}

/** Lightweight employee option for filter dropdowns. */
export interface EmployeeOption {
  name: string;
  role: WorkOrderRole;
}
