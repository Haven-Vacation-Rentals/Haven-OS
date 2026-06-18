"use client";

/**
 * OperationsCostsDashboard — the Operations Costs tab.
 *
 * Shows, for a chosen day (or a history range), the work orders completed,
 * who did them, what was charged, what we paid out, and the profit — rolled
 * up per employee. Filter by maintenance tech or runner, drill into a single
 * employee, and page back through history day by day.
 *
 * Data flows in from the server page via props; filter controls push the
 * filter state into the URL (?view=&date=&from=&to=&role=&employee=&search=)
 * and the server re-fetches. The primary way rows arrive is an AI agent
 * running the `upload_work_order_costs` skill; the "Add work order" dialog is
 * a manual fallback.
 */

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Coins,
  DollarSign,
  Wallet,
  TrendingUp,
  Percent,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  WORK_ORDER_ROLES,
  WORK_ORDER_ROLE_LABELS,
  type WorkOrder,
  type WorkOrderRole,
  type CostsSummary,
  type EmployeeOption,
} from "@/lib/operations/work-orders/types";
import { formatCurrency, formatPercent } from "@/lib/operations/work-orders/util";
import {
  createWorkOrder,
  deleteWorkOrder,
} from "@/lib/operations/work-orders/actions";

type View = "daily" | "history";

interface FilterState {
  date: string | null;
  from: string | null;
  to: string | null;
  role: WorkOrderRole | "all";
  employee: string | "all";
  search: string;
}

const ROLE_TONE: Record<WorkOrderRole, "coral" | "sage" | "neutral"> = {
  maintenance_tech: "coral",
  runner: "sage",
  other: "neutral",
};

export function OperationsCostsDashboard({
  view,
  today,
  filter,
  summary,
  orders,
  availableDates,
  employees,
}: {
  view: View;
  today: string;
  filter: FilterState;
  summary: CostsSummary;
  orders: WorkOrder[];
  availableDates: string[];
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "" || v === "all") params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      startTransition(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push((qs ? `${pathname}?${qs}` : pathname) as any),
      );
    },
    [router, pathname, searchParams],
  );

  const setView = (next: View) => {
    if (next === view) return;
    if (next === "history") updateParams({ view: "history", date: null });
    else updateParams({ view: null, date: null, from: null, to: null });
  };

  const t = summary.totals;
  const isEmpty = orders.length === 0;

  // Day stepper (daily view) — move within days that have data, falling back
  // to literal +/- 1 day when the neighbour has no records yet.
  const stepDay = (dir: -1 | 1) => {
    const cur = filter.date ?? today;
    const idx = availableDates.indexOf(cur);
    let next: string;
    if (idx !== -1) {
      // availableDates is newest-first: next older = idx+1, newer = idx-1.
      const target = dir === -1 ? idx + 1 : idx - 1;
      next =
        target >= 0 && target < availableDates.length
          ? availableDates[target]
          : shiftIso(cur, dir);
    } else {
      next = shiftIso(cur, dir);
    }
    updateParams({ date: next });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="daily">
              <CalendarDays className="h-3.5 w-3.5" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="history">
              <ClipboardList className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          {view === "daily" ? (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => stepDay(-1)}
                disabled={pending}
                title="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <input
                type="date"
                value={filter.date ?? today}
                max={today}
                onChange={(e) => updateParams({ date: e.target.value || today })}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:shadow-ring"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => stepDay(1)}
                disabled={pending || (filter.date ?? today) >= today}
                title="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {(filter.date ?? today) !== today ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateParams({ date: null })}
                  disabled={pending}
                >
                  Today
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="date"
                value={filter.from ?? ""}
                max={filter.to ?? today}
                onChange={(e) => updateParams({ from: e.target.value })}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:shadow-ring"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={filter.to ?? today}
                max={today}
                onChange={(e) => updateParams({ to: e.target.value })}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:shadow-ring"
              />
              {[7, 30, 90].map((n) => (
                <Button
                  key={n}
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    updateParams({ from: shiftIso(today, -(n - 1)), to: today })
                  }
                >
                  {n}d
                </Button>
              ))}
            </div>
          )}

          <Select
            value={filter.role}
            onChange={(v) => updateParams({ role: v })}
            disabled={pending}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {WORK_ORDER_ROLES.map((r) => (
              <option key={r} value={r}>
                {WORK_ORDER_ROLE_LABELS[r]}
              </option>
            ))}
          </Select>

          <Select
            value={filter.employee}
            onChange={(v) => updateParams({ employee: v })}
            disabled={pending}
            aria-label="Filter by employee"
          >
            <option value="all">All employees</option>
            {employees.map((e) => (
              <option key={e.name} value={e.name}>
                {e.name}
              </option>
            ))}
          </Select>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddOpen(true)}
            disabled={pending}
          >
            <Plus className="h-4 w-4" />
            Add work order
          </Button>
        </div>
      </div>

      {view === "history" ? (
        <Input
          value={filter.search}
          onChange={(e) => updateParams({ search: e.target.value })}
          placeholder="Search work orders — employee, property, title, notes…"
          className="max-w-md"
        />
      ) : null}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Charged"
          value={formatCurrency(t.charged)}
          icon={DollarSign}
          sub="Revenue billed"
        />
        <KpiCard
          label="Paid out"
          value={formatCurrency(t.paid)}
          icon={Wallet}
          sub="Labor cost"
        />
        <KpiCard
          label="Profit"
          value={formatCurrency(t.profit)}
          icon={TrendingUp}
          sub={`${formatPercent(t.margin)} margin`}
          accent
        />
        <KpiCard
          label="Margin"
          value={formatPercent(t.margin)}
          icon={Percent}
        />
        <KpiCard
          label="Work orders"
          value={String(t.orders)}
          icon={ClipboardList}
        />
        <KpiCard label="Employees" value={String(t.employees)} icon={Users} />
      </div>

      {isEmpty ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <>
          <EmployeeTable
            summary={summary}
            activeEmployee={filter.employee}
            onPick={(name) =>
              updateParams({
                employee: filter.employee === name ? null : name,
              })
            }
          />
          <WorkOrdersTable
            orders={orders}
            showDate={view === "history"}
            pending={pending}
          />
        </>
      )}

      <AddWorkOrderDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultDate={filter.date ?? today}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-employee rollup
// ---------------------------------------------------------------------------

function EmployeeTable({
  summary,
  activeEmployee,
  onPick,
}: {
  summary: CostsSummary;
  activeEmployee: string | "all";
  onPick: (name: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-heading text-base font-bold">Profit by employee</h3>
        <span className="text-xs text-muted-foreground">
          {summary.by_employee.length} employee
          {summary.by_employee.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2 font-semibold">Employee</th>
              <th className="px-3 py-2 font-semibold">Role</th>
              <th className="px-3 py-2 text-right font-semibold">Orders</th>
              <th className="px-3 py-2 text-right font-semibold">Charged</th>
              <th className="px-3 py-2 text-right font-semibold">Paid</th>
              <th className="px-3 py-2 text-right font-semibold">Profit</th>
              <th className="px-5 py-2 text-right font-semibold">Margin</th>
            </tr>
          </thead>
          <tbody>
            {summary.by_employee.map((e) => {
              const active = activeEmployee === e.employee_name;
              return (
                <tr
                  key={e.employee_name}
                  onClick={() => onPick(e.employee_name)}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-alt/60",
                    active && "bg-accent-soft/50",
                  )}
                >
                  <td className="px-5 py-2.5 font-semibold text-foreground">
                    {e.employee_name}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {e.roles.map((r) => (
                        <Badge key={r} tone={ROLE_TONE[r]}>
                          {WORK_ORDER_ROLE_LABELS[r]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {e.orders}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatCurrency(e.charged)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(e.paid)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right font-semibold tabular-nums",
                      e.profit >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {formatCurrency(e.profit)}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatPercent(e.margin)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface-alt/40 font-semibold">
              <td className="px-5 py-2.5" colSpan={2}>
                Total
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {summary.totals.orders}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatCurrency(summary.totals.charged)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatCurrency(summary.totals.paid)}
              </td>
              <td
                className={cn(
                  "px-3 py-2.5 text-right tabular-nums",
                  summary.totals.profit >= 0
                    ? "text-emerald-600"
                    : "text-rose-600",
                )}
              >
                {formatCurrency(summary.totals.profit)}
              </td>
              <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatPercent(summary.totals.margin)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Work-order detail rows
// ---------------------------------------------------------------------------

function WorkOrdersTable({
  orders,
  showDate,
  pending,
}: {
  orders: WorkOrder[];
  showDate: boolean;
  pending: boolean;
}) {
  const router = useRouter();

  const onDelete = (wo: WorkOrder) => {
    if (
      !window.confirm(
        `Delete this work order for ${wo.employee_name}? This can't be undone.`,
      )
    )
      return;
    void (async () => {
      const r = await deleteWorkOrder(wo.id);
      if (r.ok) {
        toast.success("Work order deleted");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    })();
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-heading text-base font-bold">Work orders</h3>
        <span className="text-xs text-muted-foreground">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              {showDate ? <th className="px-5 py-2 font-semibold">Date</th> : null}
              <th className={cn("py-2 font-semibold", showDate ? "px-3" : "px-5")}>
                Employee
              </th>
              <th className="px-3 py-2 font-semibold">Work</th>
              <th className="px-3 py-2 text-right font-semibold">Charged</th>
              <th className="px-3 py-2 text-right font-semibold">Paid</th>
              <th className="px-3 py-2 text-right font-semibold">Profit</th>
              <th className="px-5 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((wo) => (
              <tr
                key={wo.id}
                className="group border-b border-border/60 hover:bg-surface-alt/50"
              >
                {showDate ? (
                  <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground">
                    {formatDay(wo.work_date)}
                  </td>
                ) : null}
                <td
                  className={cn(
                    "py-2.5 align-top",
                    showDate ? "px-3" : "px-5",
                  )}
                >
                  <div className="font-medium text-foreground">
                    {wo.employee_name}
                  </div>
                  <Badge tone={ROLE_TONE[wo.employee_role]} className="mt-1">
                    {WORK_ORDER_ROLE_LABELS[wo.employee_role]}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div className="text-foreground">
                    {wo.title || wo.description || "—"}
                  </div>
                  {wo.property_name ? (
                    <div className="text-xs text-muted-foreground">
                      {wo.property_name}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums">
                  {formatCurrency(wo.amount_charged, true)}
                </td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums text-muted-foreground">
                  {formatCurrency(wo.amount_paid, true)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2.5 text-right align-top font-semibold tabular-nums",
                    wo.profit >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {formatCurrency(wo.profit, true)}
                </td>
                <td className="px-5 py-2.5 text-right align-top">
                  <button
                    type="button"
                    onClick={() => onDelete(wo)}
                    disabled={pending}
                    title="Delete work order"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-card bg-accent-soft">
        <Coins className="h-6 w-6 text-haven-coral-700" />
      </div>
      <h3 className="font-heading text-lg font-bold">No work orders here yet</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Your AI agent can push the day&apos;s completed work orders straight in
        with the <span className="font-mono text-xs">upload_work_order_costs</span>{" "}
        skill — employee, role, what was charged, and what they&apos;re paid.
        You can also add one by hand.
      </p>
      <Button variant="primary" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add work order
      </Button>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Manual add dialog
// ---------------------------------------------------------------------------

function AddWorkOrderDialog({
  open,
  onOpenChange,
  defaultDate,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate: string;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [workDate, setWorkDate] = useState(defaultDate);
  const [employeeName, setEmployeeName] = useState("");
  const [role, setRole] = useState<WorkOrderRole>("maintenance_tech");
  const [title, setTitle] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [charged, setCharged] = useState("");
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setWorkDate(defaultDate);
    setEmployeeName("");
    setRole("maintenance_tech");
    setTitle("");
    setPropertyName("");
    setCharged("");
    setPaid("");
    setNotes("");
    setError(null);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const chargedNum = parseFloat(charged) || 0;
  const paidNum = parseFloat(paid) || 0;
  const profit = chargedNum - paidNum;

  const submit = () => {
    setError(null);
    if (!employeeName.trim()) return setError("Employee name is required.");
    startTransition(async () => {
      const r = await createWorkOrder({
        work_date: workDate || defaultDate,
        employee_name: employeeName.trim(),
        employee_role: role,
        title: title.trim() || null,
        property_name: propertyName.trim() || null,
        amount_charged: chargedNum,
        amount_paid: paidNum,
        notes: notes.trim() || null,
        source: "manual",
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      toast.success("Work order added");
      onSaved();
      close(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-haven-coral-600" />
            Add work order
          </DialogTitle>
          <DialogDescription>
            Log one completed job. Profit is charged minus paid.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              disabled={pending}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:shadow-ring"
            />
          </Field>
          <Field label="Role">
            <Select
              value={role}
              onChange={(v) => setRole(v as WorkOrderRole)}
              disabled={pending}
              className="w-full"
            >
              {WORK_ORDER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {WORK_ORDER_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Employee">
          <Input
            autoFocus
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="e.g. Marcus Lee"
            disabled={pending}
          />
        </Field>

        <Field label="Work order" optional>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. HVAC filter replacement"
            disabled={pending}
          />
        </Field>

        <Field label="Property" optional>
          <Input
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="Property name (matched to PDM if it exists)"
            disabled={pending}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Charged ($)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={charged}
              onChange={(e) => setCharged(e.target.value)}
              placeholder="0.00"
              disabled={pending}
            />
          </Field>
          <Field label="Paid ($)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              placeholder="0.00"
              disabled={pending}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-card border border-border bg-surface-alt/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Profit</span>
          <span
            className={cn(
              "font-heading text-base font-bold tabular-nums",
              profit >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {formatCurrency(profit, true)}
          </span>
        </div>

        <Field label="Notes" optional>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth recording"
            disabled={pending}
          />
        </Field>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Add work order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------

function Select({
  value,
  onChange,
  children,
  disabled,
  className,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
} & Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange" | "disabled" | "className"
>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground",
        "focus:outline-none focus:shadow-ring disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {optional ? (
          <span className="ml-1 font-normal normal-case text-muted-foreground/70">
            (optional)
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Date helpers (client-side; YYYY-MM-DD math without timezone drift)
// ---------------------------------------------------------------------------

function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
}
