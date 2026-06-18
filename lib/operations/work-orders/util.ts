/**
 * Pure helpers for the Operations Costs module. No "use server" — these are
 * imported by server actions, the REST route, and (for formatting) the
 * client dashboard.
 */

import type {
  WorkOrder,
  CostsSummary,
  EmployeeSummary,
  WorkOrderRole,
} from "./types";

/** Coerce a Postgres numeric (which can arrive as a string) to a number. */
export function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Today's date (YYYY-MM-DD) in Haven's operating timezone (US Eastern — the
 * Great Smoky Mountains). Server clocks run UTC, so a naive toISOString would
 * roll the business day over hours early in the evening. en-CA formats as
 * YYYY-MM-DD.
 */
export function havenToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** N days before `from` (default today), as YYYY-MM-DD. */
export function daysAgo(days: number, from = havenToday()): string {
  const d = new Date(`${from}T00:00:00`);
  d.setDate(d.getDate() - days);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Normalise a raw DB row's money columns to real numbers. */
export function normalizeWorkOrder(row: Record<string, unknown>): WorkOrder {
  return {
    ...(row as unknown as WorkOrder),
    amount_charged: num(row.amount_charged),
    amount_paid: num(row.amount_paid),
    profit: num(row.profit),
  };
}

/**
 * Roll up a set of work orders into totals + a per-employee breakdown.
 * Employees are keyed by name (a person), so "profit per employee" is one
 * row per person even if they logged both tech and runner work.
 */
export function summarizeWorkOrders(rows: WorkOrder[]): CostsSummary {
  const byName = new Map<
    string,
    {
      employee_name: string;
      roles: Set<WorkOrderRole>;
      orders: number;
      charged: number;
      paid: number;
    }
  >();

  let charged = 0;
  let paid = 0;

  for (const r of rows) {
    const c = num(r.amount_charged);
    const p = num(r.amount_paid);
    charged += c;
    paid += p;

    const key = r.employee_name;
    let bucket = byName.get(key);
    if (!bucket) {
      bucket = {
        employee_name: r.employee_name,
        roles: new Set<WorkOrderRole>(),
        orders: 0,
        charged: 0,
        paid: 0,
      };
      byName.set(key, bucket);
    }
    bucket.roles.add(r.employee_role);
    bucket.orders += 1;
    bucket.charged += c;
    bucket.paid += p;
  }

  const by_employee: EmployeeSummary[] = [...byName.values()]
    .map((b) => {
      const profit = b.charged - b.paid;
      return {
        employee_name: b.employee_name,
        roles: [...b.roles],
        orders: b.orders,
        charged: round2(b.charged),
        paid: round2(b.paid),
        profit: round2(profit),
        margin: b.charged > 0 ? profit / b.charged : 0,
      };
    })
    .sort((a, b) => b.profit - a.profit);

  const profit = charged - paid;
  return {
    totals: {
      orders: rows.length,
      employees: by_employee.length,
      charged: round2(charged),
      paid: round2(paid),
      profit: round2(profit),
      margin: charged > 0 ? profit / charged : 0,
    },
    by_employee,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD_CENTS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Currency for KPI display — whole dollars by default, cents when asked. */
export function formatCurrency(n: number, cents = false): string {
  return (cents ? USD_CENTS : USD).format(num(n));
}

/** A 0..1 ratio as a whole-number percent string. */
export function formatPercent(ratio: number): string {
  return `${Math.round(num(ratio) * 100)}%`;
}
