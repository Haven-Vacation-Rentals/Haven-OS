"use client";

/**
 * LostItemsDirectory — landing page for /operations/lost-items.
 *
 * Sections (top to bottom):
 *  1. Summary tiles (open / overdue / completed / total)
 *  2. Toolbar (search + filters + view toggle + new case)
 *  3. Body (Board kanban / List table)
 *
 * Board uses @dnd-kit/core (whole-card drag, 6px activation, optimistic
 * update with revert + toast on failure, highlighted drop zones,
 * keyboard-friendly).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Search,
  PackageSearch,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  LayoutGrid,
  List as ListIcon,
  Plus,
  GripVertical,
  Slack,
  MessageCircle,
  Link2,
  Check,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { canonicalUrl } from "@/lib/canonical-url";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LOST_ITEM_PIPELINE,
  LOST_ITEM_STATUS_LABELS,
  type LostItemCaseWithRelations,
  type LostItemStatus,
} from "@/lib/lost-items/types";
import { setStatus } from "@/lib/lost-items/actions";
import { LostItemNewForm } from "./lost-item-new-form";
import { StatusBadge, formatRelative } from "./shared";

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
        if (c.status === "completed" || c.status === "failed") return false;
      } else if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }
      if (propertyFilter !== "all" && c.property_id !== propertyFilter) return false;
      if (assigneeFilter === "unassigned") {
        if (c.assigned_to) return false;
      } else if (assigneeFilter !== "all" && c.assigned_to !== assigneeFilter) {
        return false;
      }
      if (overdueOnly) {
        if (!c.follow_up_date || c.follow_up_date >= today) return false;
        if (c.status === "completed" || c.status === "failed") return false;
      }
      if (needle) {
        const haystack = [
          c.case_number,
          c.item_description,
          c.found_location,
          c.guest_name,
          c.guest_email,
          c.guest_phone,
          c.property_name,
          c.property?.name ?? null,
          c.cleaning_vendor,
          c.notes,
          c.slack_thread_url,
          c.conversation_url,
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
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
          <div className="relative flex-1 md:min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by guest, property, item, case #…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:contents">
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
            <SharePublicLinkButton />
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="ml-auto inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95 md:ml-0"
            >
              <Plus className="h-4 w-4" />
              New case
            </button>
          </div>
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
// Share public intake link
// ---------------------------------------------------------------------------

function SharePublicLinkButton() {
  const [copied, setCopied] = useState(false);
  const publicUrl = useMemo(() => canonicalUrl("/lost-items/intake"), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Public intake link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Try again.");
    }
  };
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface text-xs">
      <button
        type="button"
        onClick={copy}
        title={publicUrl}
        className="inline-flex items-center gap-1.5 px-2.5 py-2 font-medium text-foreground hover:bg-surface-alt/50"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy public form link"}
      </button>
      <Link
        href={"/lost-items/intake" as never}
        target="_blank"
        rel="noopener noreferrer"
        className="border-l border-border px-2 py-2 text-muted-foreground hover:text-foreground"
        title="Open public intake form in a new tab"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
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
// Board view (kanban by status, dnd-kit)
// ---------------------------------------------------------------------------

function BoardView({ cases }: { cases: LostItemCaseWithRelations[] }) {
  const router = useRouter();
  const [board, setBoard] = useState<LostItemCaseWithRelations[]>(cases);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resync when parent feeds in fresh data.
  useEffect(() => {
    setBoard(cases);
  }, [cases]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const grouped = useMemo(() => {
    const map = new Map<LostItemStatus, LostItemCaseWithRelations[]>();
    for (const s of LOST_ITEM_PIPELINE) map.set(s, []);
    for (const c of board) {
      map.get(c.status)?.push(c);
    }
    return map;
  }, [board]);

  const activeCase = activeId
    ? board.find((c) => c.id === activeId) ?? null
    : null;

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const caseId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    let targetCol: LostItemStatus | null = null;
    if ((LOST_ITEM_PIPELINE as string[]).includes(overId)) {
      targetCol = overId as LostItemStatus;
    } else {
      const overCase = board.find((c) => c.id === overId);
      if (overCase) targetCol = overCase.status;
    }
    if (!targetCol) return;

    const c = board.find((x) => x.id === caseId);
    if (!c) return;
    if (c.status === targetCol) return;

    const prevStatus = c.status;
    setBoard((curr) =>
      curr.map((x) => (x.id === caseId ? { ...x, status: targetCol! } : x)),
    );

    void (async () => {
      const res = await setStatus(caseId, targetCol!);
      if (!res.ok) {
        setBoard((curr) =>
          curr.map((x) =>
            x.id === caseId ? { ...x, status: prevStatus } : x,
          ),
        );
        toast.error(res.error ?? "Failed to move case");
      } else {
        toast.success(
          `Moved to ${LOST_ITEM_STATUS_LABELS[targetCol!]}`,
        );
        router.refresh();
      }
    })();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* Horizontal-scrolling board on mobile/tablet, grid on desktop */}
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <div className="flex gap-3 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-3">
          {LOST_ITEM_PIPELINE.map((s) => (
            <BoardColumn
              key={s}
              status={s}
              cases={grouped.get(s) ?? []}
              activeId={activeId}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCase ? <BoardCard c={activeCase} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({
  status,
  cases,
  activeId,
}: {
  status: LostItemStatus;
  cases: LostItemCaseWithRelations[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={
        "flex flex-col gap-2 rounded-card border bg-surface-alt/30 p-2 min-h-[220px] w-[260px] shrink-0 md:w-auto transition-colors " +
        (isOver
          ? "border-haven-coral-600 bg-accent-soft/50 ring-2 ring-haven-coral-600/30"
          : "border-border")
      }
    >
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {LOST_ITEM_STATUS_LABELS[status]}
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {cases.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {cases.map((c) => (
          <DraggableBoardCard
            key={c.id}
            c={c}
            isOverlayActive={activeId === c.id}
          />
        ))}
        {cases.length === 0 ? (
          <div
            className={
              "px-2 py-4 text-center text-[11px] rounded-md border border-dashed " +
              (isOver
                ? "text-haven-coral-700 border-haven-coral-300 bg-accent-soft/40"
                : "text-muted-foreground/70 border-border")
            }
          >
            {isOver ? "Drop here" : "No cases"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DraggableBoardCard({
  c,
  isOverlayActive,
}: {
  c: LostItemCaseWithRelations;
  isOverlayActive: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: c.id,
  });
  const open = () => router.push(`/operations/lost-items/${c.id}`);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      style={{ opacity: isDragging || isOverlayActive ? 0.4 : 1 }}
      className="touch-none cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:shadow-ring rounded-card"
    >
      <BoardCard c={c} />
    </div>
  );
}

function BoardCard({
  c,
  isDragging,
}: {
  c: LostItemCaseWithRelations;
  isDragging?: boolean;
}) {
  return (
    <div
      className={
        "group relative rounded-card border border-border bg-surface p-3 pl-4 text-sm shadow-sm " +
        (isDragging
          ? "shadow-lg border-haven-coral-300 rotate-1"
          : "hover:shadow-md hover:border-foreground/30 transition-all")
      }
    >
      <GripVertical className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">
          {c.case_number}
        </span>
        {c.slack_thread_url ? (
          <Slack className="h-3 w-3 text-muted-foreground" aria-label="Slack thread linked" />
        ) : null}
        {c.conversation_url ? (
          <MessageCircle className="h-3 w-3 text-muted-foreground" aria-label="Conversation linked" />
        ) : null}
      </div>
      <div className="mt-1.5 line-clamp-2 font-medium">
        {c.item_description}
      </div>
      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {c.property?.name ?? c.property_name ?? "No property"}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{c.guest_name ?? "—"}</span>
        <span>{formatRelative(c.created_at)}</span>
      </div>
    </div>
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
                {c.found_location ? (
                  <div className="text-[11px] text-muted-foreground">
                    {c.found_location}
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
        track it from pickup through return.
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
