"use client";

/**
 * LostItemsDirectory — landing page for /operations/lost-items.
 *
 * Sections (top to bottom):
 *  1. Summary tiles (open / overdue / completed / total)
 *  2. Toolbar (search + filters + view toggle + new case)
 *  3. Body (Board kanban / List table)
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  PackageSearch,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  LayoutGrid,
  List as ListIcon,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LOST_ITEM_PIPELINE,
  LOST_ITEM_STATUS_LABELS,
  LOST_ITEM_PRIORITIES,
  type LostItemCaseWithRelations,
  type LostItemStatus,
  type LostItemPriority,
} from "@/lib/lost-items/types";
import { setStatus } from "@/lib/lost-items/actions";
import { LostItemNewForm } from "./lost-item-new-form";
import { PriorityPill, StatusBadge, formatRelative } from "./shared";

type Member = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

type Props = {
  cases: LostItemCaseWithRelations[];
  properties: { id: string; name: string }[];
  members: Member[];
  stats: {
    total: number;
    open: number;
    overdue: number;
    by_status: Record<LostItemStatus, number>;
  };
};

type ViewMode = "board" | "list";

export function LostItemsDirectory({
  cases,
  properties,
  members,
  stats,
}: Props) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    LostItemStatus | "all" | "open"
  >("open");
  const [priorityFilter, setPriorityFilter] = useState<
    LostItemPriority | "all"
  >("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [view, setView] = useState<ViewMode>("board");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    return cases.filter((c) => {
      if (statusFilter === "open") {
        if (c.status === "completed" || c.status === "cancelled") return false;
      } else if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      if (propertyFilter !== "all" && c.property_id !== propertyFilter) return false;
      if (assigneeFilter === "unassigned") {
        if (c.assigned_to) return false;
      } else if (assigneeFilter !== "all" && c.assigned_to !== assigneeFilter) {
        return false;
      }
      if (overdueOnly) {
        if (!c.follow_up_date || c.follow_up_date >= today) return false;
        if (c.status === "completed" || c.status === "cancelled") return false;
      }
      if (needle) {
        const haystack = [
          c.case_number,
          c.item_description,
          c.item_category,
          c.found_location,
          c.guest_name,
          c.guest_email,
          c.guest_phone,
          c.reservation_ref,
          c.property_name,
          c.property?.name ?? null,
          c.cleaning_vendor,
          c.notes,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase())
          .join(" ");
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [
    cases,
    q,
    statusFilter,
    priorityFilter,
    propertyFilter,
    assigneeFilter,
    overdueOnly,
  ]);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile
          icon={<Inbox className="h-4 w-4 text-haven-coral-700" />}
          label="Open cases"
          value={stats.open}
        />
        <SummaryTile
          icon={<AlertTriangle className="h-4 w-4 text-rose-700" />}
          label="Overdue"
          value={stats.overdue}
          active={overdueOnly}
          onClick={() => setOverdueOnly((v) => !v)}
        />
        <SummaryTile
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
          label="Completed"
          value={stats.by_status.completed ?? 0}
        />
        <SummaryTile
          icon={<PackageSearch className="h-4 w-4 text-foreground/70" />}
          label="Total cases"
          value={stats.total}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by guest, property, item, case #…"
              className="pl-9"
            />
          </div>
          <FilterSelect
            value={priorityFilter}
            onChange={(v) =>
              setPriorityFilter(v as LostItemPriority | "all")
            }
            options={[
              { value: "all", label: "Any priority" },
              ...LOST_ITEM_PRIORITIES.map((p) => ({
                value: p,
                label: p[0].toUpperCase() + p.slice(1),
              })),
            ]}
          />
          <FilterSelect
            value={propertyFilter}
            onChange={setPropertyFilter}
            options={[
              { value: "all", label: "Any property" },
              ...properties.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <FilterSelect
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            options={[
              { value: "all", label: "Anyone" },
              { value: "unassigned", label: "Unassigned" },
              ...members.map((m) => ({
                value: m.id,
                label: m.full_name ?? m.email,
              })),
            ]}
          />
          <ViewToggle value={view} onChange={setView} />
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            New case
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <Chip
            label="Open"
            active={statusFilter === "open"}
            onClick={() => setStatusFilter("open")}
            count={stats.open}
          />
          <Chip
            label="All"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            count={stats.total}
          />
          {LOST_ITEM_PIPELINE.map((s) => {
            const count = stats.by_status[s] ?? 0;
            return (
              <Chip
                key={s}
                label={LOST_ITEM_STATUS_LABELS[s]}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                count={count}
              />
            );
          })}
          <Chip
            label="Cancelled"
            active={statusFilter === "cancelled"}
            onClick={() => setStatusFilter("cancelled")}
            count={stats.by_status.cancelled ?? 0}
          />
        </div>
      </div>

      {/* Body */}
      {cases.length === 0 ? (
        <EmptyState onNew={() => setShowForm(true)} />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground px-4 py-8">
          No cases match your filters.
        </p>
      ) : view === "board" ? (
        <BoardView cases={filtered} />
      ) : (
        <ListView cases={filtered} />
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New lost item case</DialogTitle>
          </DialogHeader>
          <LostItemNewForm
            properties={properties}
            members={members}
            onCreated={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary tile
// ---------------------------------------------------------------------------

function SummaryTile({
  icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={
        "text-left rounded-card border p-4 transition-all " +
        (active
          ? "border-foreground bg-accent-soft shadow-card"
          : "border-border bg-surface hover:border-foreground/30 " +
            (clickable ? "cursor-pointer" : "cursor-default"))
      }
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-heading text-2xl font-bold">{value}</div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Chips, filters, toggles
// ---------------------------------------------------------------------------

function Chip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-muted-foreground hover:text-foreground")
      }
    >
      {label}
      <span className="text-[10px] opacity-70">{count}</span>
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface p-0.5">
      <button
        type="button"
        onClick={() => onChange("board")}
        className={
          "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors " +
          (value === "board"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={
          "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors " +
          (value === "list"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        <ListIcon className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board view (kanban by status)
// ---------------------------------------------------------------------------

function BoardView({ cases }: { cases: LostItemCaseWithRelations[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, LostItemCaseWithRelations[]> = {};
    for (const s of LOST_ITEM_PIPELINE) map[s] = [];
    for (const c of cases) {
      if (c.status === "cancelled") continue;
      (map[c.status] ??= []).push(c);
    }
    return map;
  }, [cases]);

  const handleDrop = (target: LostItemStatus, id: string) => {
    if (!id) return;
    const c = cases.find((x) => x.id === id);
    if (!c || c.status === target) return;
    startTransition(async () => {
      const res = await setStatus(id, target);
      if (!res.ok) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
      {LOST_ITEM_PIPELINE.map((s) => {
        const items = grouped[s] ?? [];
        return (
          <div
            key={s}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || draggedId;
              if (id) handleDrop(s, id);
              setDraggedId(null);
            }}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface-alt/30 p-2 min-h-[200px]"
          >
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {LOST_ITEM_STATUS_LABELS[s]}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {items.length}
              </span>
            </div>
            {items.map((c) => (
              <BoardCard
                key={c.id}
                c={c}
                onDragStart={() => setDraggedId(c.id)}
                pending={pending}
              />
            ))}
            {items.length === 0 ? (
              <div className="px-2 py-4 text-[11px] text-muted-foreground/70">
                Drop cases here
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function BoardCard({
  c,
  onDragStart,
  pending,
}: {
  c: LostItemCaseWithRelations;
  onDragStart: () => void;
  pending: boolean;
}) {
  return (
    <Link
      href={`/operations/lost-items/${c.id}` as never}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", c.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className={
        "block rounded-card border border-border bg-surface p-3 text-sm shadow-sm hover:border-foreground/40 " +
        (pending ? "opacity-70" : "")
      }
    >
      <div className="flex items-center gap-2">
        <PriorityPill priority={c.priority} />
        <span className="text-[10px] font-mono text-muted-foreground">
          {c.case_number}
        </span>
      </div>
      <div className="mt-1.5 line-clamp-2 font-medium">
        {c.item_description}
      </div>
      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {c.property?.name ?? c.property_name ?? "No property"}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">
          {c.guest_name ?? "—"}
        </span>
        <span>{formatRelative(c.created_at)}</span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

function ListView({ cases }: { cases: LostItemCaseWithRelations[] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Case</th>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2">Property</th>
            <th className="px-3 py-2">Guest</th>
            <th className="px-3 py-2">Priority</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Assigned</th>
            <th className="px-3 py-2">Follow-up</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr
              key={c.id}
              className="border-t border-border hover:bg-surface-alt/30"
            >
              <td className="px-3 py-2 font-mono text-xs">
                <Link
                  href={`/operations/lost-items/${c.id}` as never}
                  className="text-haven-coral-700 hover:underline"
                >
                  {c.case_number}
                </Link>
              </td>
              <td className="px-3 py-2">
                <div className="font-medium line-clamp-1">
                  {c.item_description}
                </div>
                {c.item_category ? (
                  <div className="text-[11px] text-muted-foreground">
                    {c.item_category}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {c.property?.name ?? c.property_name ?? "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {c.guest_name ?? "—"}
              </td>
              <td className="px-3 py-2">
                <PriorityPill priority={c.priority} />
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {c.assignee?.full_name ?? c.assignee?.email ?? "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {c.follow_up_date ?? "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {formatRelative(c.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-16 text-center">
      <PackageSearch className="h-10 w-10 text-muted-foreground" />
      <h3 className="font-heading text-lg font-semibold">No lost items yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        When a guest tells the team they left something, log a case here and
        track it from intake through return.
      </p>
      <button
        type="button"
        onClick={onNew}
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95"
      >
        <Plus className="h-4 w-4" />
        New case
      </button>
    </div>
  );
}

