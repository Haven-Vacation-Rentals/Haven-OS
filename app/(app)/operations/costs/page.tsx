import { Coins } from "lucide-react";
import {
  getCostsSummary,
  listWorkOrders,
  getAvailableDates,
  listEmployees,
} from "@/lib/operations/work-orders/actions";
import { havenToday, daysAgo } from "@/lib/operations/work-orders/util";
import type {
  WorkOrderFilter,
  WorkOrderRole,
} from "@/lib/operations/work-orders/types";
import { WORK_ORDER_ROLES } from "@/lib/operations/work-orders/types";
import { OperationsCostsDashboard } from "@/components/operations/operations-costs-dashboard";

export const dynamic = "force-dynamic";

type SearchParams = {
  view?: string;
  date?: string;
  from?: string;
  to?: string;
  role?: string;
  employee?: string;
  search?: string;
};

function asRole(v: string | undefined): WorkOrderRole | "all" {
  return v && (WORK_ORDER_ROLES as readonly string[]).includes(v)
    ? (v as WorkOrderRole)
    : "all";
}

export default async function OperationsCostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const today = havenToday();
  const view = sp.view === "history" ? "history" : "daily";

  const role = asRole(sp.role);
  const employee = sp.employee || "all";
  const search = sp.search || "";

  const date = view === "daily" ? sp.date || today : undefined;
  const from = view === "history" ? sp.from || daysAgo(29, today) : undefined;
  const to = view === "history" ? sp.to || today : undefined;

  const filter: WorkOrderFilter = {
    date,
    from,
    to,
    role,
    employee,
    search,
  };

  const [summary, orders, availableDates, employees] = await Promise.all([
    getCostsSummary(filter),
    listWorkOrders(filter),
    getAvailableDates(),
    listEmployees(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Operations
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-soft">
            <Coins className="h-5 w-5 text-haven-coral-700" />
          </div>
          <div>
            <h1 className="font-heading text-display-2 font-bold tracking-tight">
              Operations Costs
            </h1>
            <p className="text-sm text-muted-foreground">
              Daily work-order profit per employee — what we charged, what we
              paid, and what we kept.
            </p>
          </div>
        </div>
      </header>

      <OperationsCostsDashboard
        view={view}
        today={today}
        filter={{
          date: date ?? null,
          from: from ?? null,
          to: to ?? null,
          role,
          employee,
          search,
        }}
        summary={summary}
        orders={orders}
        availableDates={availableDates}
        employees={employees}
      />
    </div>
  );
}
