"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Archive, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  updateRowCell,
  updateWeekLabel,
  archiveActiveMonth,
  getMonth,
  listMonths,
} from "@/lib/scorecard/actions";
import type {
  ScorecardMonth,
  ScorecardSection,
  ScorecardRow,
  MonthSummary,
  MetricStatus,
  MetricType,
} from "@/lib/scorecard/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_HEADER: Record<string, string> = {
  olive: "bg-[#5C6B2C] text-white",
  blue:  "bg-[#3B6EA0] text-white",
  red:   "bg-[#B52A2A] text-white",
};
const TABLE_HEADER = "bg-[#7A6E40] text-white";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyRowField(
  row: ScorecardRow,
  field: string,
  value: string | null,
): ScorecardRow {
  const w = field.match(/^week(\d)_(value|note)$/);
  if (w) {
    const idx = parseInt(w[1]) - 1;
    const weeks = [...row.weeks] as typeof row.weeks;
    weeks[idx] = { ...weeks[idx], [w[2]]: value };
    return { ...row, weeks };
  }
  if (field === "remainder_value") {
    const weeks = [...row.weeks] as typeof row.weeks;
    weeks[4] = { ...weeks[4], value };
    return { ...row, weeks };
  }
  if (field === "remainder_note") {
    const weeks = [...row.weeks] as typeof row.weeks;
    weeks[4] = { ...weeks[4], note: value };
    return { ...row, weeks };
  }
  const direct: Record<string, keyof ScorecardRow> = {
    metric: "metric",
    monthly_target: "monthlyTarget",
    metric_type: "metricType",
    monthly_actual: "monthlyActual",
    status: "status",
    metric_owner: "metricOwner",
    metric_source: "metricSource",
    notes: "notes",
  };
  const prop = direct[field];
  if (prop) return { ...row, [prop]: value };
  return row;
}

function patchMonth(
  month: ScorecardMonth,
  rowId: string,
  field: string,
  value: string | null,
): ScorecardMonth {
  return {
    ...month,
    sections: month.sections.map((sec) => ({
      ...sec,
      rows: sec.rows.map((r) =>
        r.id === rowId ? applyRowField(r, field, value) : r,
      ),
    })),
  };
}

// ---------------------------------------------------------------------------
// Editable text cell
// ---------------------------------------------------------------------------

interface EditableCellProps {
  value: string | null;
  field: string;
  rowId: string;
  readonly: boolean;
  onOptimistic: (rowId: string, field: string, value: string | null) => void;
  placeholder?: string;
  className?: string;
  center?: boolean;
}

function EditableCell({
  value,
  field,
  rowId,
  readonly,
  onOptimistic,
  placeholder = "—",
  className,
  center,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const next = draft.trim() || null;
    if (next !== (value ?? null)) {
      onOptimistic(rowId, field, next);
      startTransition(() => { updateRowCell(rowId, field, next); });
    }
    setEditing(false);
  }

  if (readonly) {
    return (
      <span className={cn("block", center && "text-center", !value && "text-muted-foreground/40", className)}>
        {value || placeholder}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
        }}
        className={cn(
          "w-full min-w-[60px] bg-transparent text-[13px] outline-none",
          "border-b border-accent",
          center && "text-center",
          className,
        )}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
      className={cn(
        "block cursor-text rounded px-0.5 transition-colors",
        "hover:bg-accent/10",
        center && "text-center",
        !value && "text-muted-foreground/40",
        className,
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status select
// ---------------------------------------------------------------------------

function StatusCell({
  value,
  rowId,
  readonly,
  onOptimistic,
}: {
  value: MetricStatus;
  rowId: string;
  readonly: boolean;
  onOptimistic: (rowId: string, field: string, value: string | null) => void;
}) {
  const [, startTransition] = useTransition();

  function handle(next: string) {
    const v = (next || null) as MetricStatus;
    onOptimistic(rowId, "status", v);
    startTransition(() => { updateRowCell(rowId, "status", v); });
  }

  const chipClass = cn(
    "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold text-white",
    value === "green"  && "bg-emerald-600",
    value === "yellow" && "bg-amber-500",
    value === "red"    && "bg-rose-600",
    !value             && "bg-muted text-muted-foreground",
  );

  if (readonly) {
    return value ? <span className={chipClass}>{value.charAt(0).toUpperCase() + value.slice(1)}</span> : null;
  }

  return (
    <select
      value={value ?? ""}
      onChange={(e) => handle(e.target.value)}
      className={cn(chipClass, "cursor-pointer appearance-none pr-1 outline-none")}
    >
      <option value="">—</option>
      <option value="green">Green</option>
      <option value="yellow">Yellow</option>
      <option value="red">Red</option>
    </select>
  );
}

// ---------------------------------------------------------------------------
// Metric type select
// ---------------------------------------------------------------------------

function MetricTypeCell({
  value,
  rowId,
  readonly,
  onOptimistic,
}: {
  value: MetricType;
  rowId: string;
  readonly: boolean;
  onOptimistic: (rowId: string, field: string, value: string | null) => void;
}) {
  const [, startTransition] = useTransition();

  function handle(next: string) {
    const v = (next || null) as MetricType;
    onOptimistic(rowId, "metric_type", v);
    startTransition(() => { updateRowCell(rowId, "metric_type", v); });
  }

  if (readonly) return <span className="text-[13px] text-muted-foreground">{value ?? ""}</span>;

  return (
    <select
      value={value ?? ""}
      onChange={(e) => handle(e.target.value)}
      className="w-full cursor-pointer bg-transparent text-[13px] text-muted-foreground outline-none hover:bg-accent/10 rounded"
    >
      <option value="">—</option>
      <option value="Total">Total</option>
      <option value="Avg">Avg</option>
    </select>
  );
}

// ---------------------------------------------------------------------------
// Editable week label (in thead)
// ---------------------------------------------------------------------------

function WeekLabelCell({
  value,
  weekIndex,
  monthId,
  readonly,
  onOptimistic,
}: {
  value: string;
  weekIndex: number;
  monthId: string;
  readonly: boolean;
  onOptimistic: (idx: number, label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function commit() {
    const next = draft.trim();
    if (next !== value) {
      onOptimistic(weekIndex, next);
      startTransition(() => { updateWeekLabel(monthId, weekIndex, next); });
    }
    setEditing(false);
  }

  if (readonly || !editing) {
    return (
      <span
        onClick={() => { if (!readonly) { setDraft(value); setEditing(true); } }}
        className={cn(
          "block text-[10px] font-normal text-white/70",
          !readonly && "cursor-text hover:text-white",
        )}
      >
        ({value || "click to set"})
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      className="w-full bg-transparent text-[10px] text-white outline-none border-b border-white/40"
    />
  );
}

// ---------------------------------------------------------------------------
// Data row
// ---------------------------------------------------------------------------

function DataRow({
  row,
  monthId,
  weekLabels,
  readonly,
  onOptimistic,
}: {
  row: ScorecardRow;
  monthId: string;
  weekLabels: [string, string, string, string, string];
  readonly: boolean;
  onOptimistic: (rowId: string, field: string, value: string | null) => void;
}) {
  const weekFields = [
    "week1_value", "week2_value", "week3_value", "week4_value", "remainder_value",
  ] as const;

  return (
    <tr className="border-b border-border/40 hover:bg-surface-alt/50 transition-colors group">
      {/* Metric name */}
      <td className="px-3 py-1.5 text-[13px] font-medium text-foreground min-w-[220px]">
        <EditableCell
          value={row.metric}
          field="metric"
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
        />
      </td>

      {/* Week values */}
      {row.weeks.map((week, i) => (
        <td key={i} className="px-2 py-1.5 text-[13px] text-center min-w-[80px]">
          <EditableCell
            value={week.value}
            field={weekFields[i]}
            rowId={row.id}
            readonly={readonly}
            onOptimistic={onOptimistic}
            center
          />
        </td>
      ))}

      {/* Monthly target */}
      <td className="px-2 py-1.5 text-[13px] text-center min-w-[80px]">
        <EditableCell
          value={row.monthlyTarget}
          field="monthly_target"
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
          center
        />
      </td>

      {/* Metric type */}
      <td className="px-2 py-1.5 text-center min-w-[70px]">
        <MetricTypeCell
          value={row.metricType}
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
        />
      </td>

      {/* Monthly actual */}
      <td className="px-2 py-1.5 text-[13px] text-center min-w-[90px]">
        <EditableCell
          value={row.monthlyActual}
          field="monthly_actual"
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
          center
        />
      </td>

      {/* Status */}
      <td className="px-2 py-1.5 text-center min-w-[80px]">
        <StatusCell
          value={row.status}
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
        />
      </td>

      {/* Metric owner */}
      <td className="px-2 py-1.5 text-[13px] min-w-[90px]">
        <EditableCell
          value={row.metricOwner}
          field="metric_owner"
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
        />
      </td>

      {/* Metric source */}
      <td className="px-2 py-1.5 text-[13px] min-w-[90px]">
        <EditableCell
          value={row.metricSource}
          field="metric_source"
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
        />
      </td>

      {/* Notes */}
      <td className="px-2 py-1.5 text-[13px] min-w-[120px]">
        <EditableCell
          value={row.notes}
          field="notes"
          rowId={row.id}
          readonly={readonly}
          onOptimistic={onOptimistic}
        />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Section block (collapsible)
// ---------------------------------------------------------------------------

function SectionBlock({
  section,
  monthId,
  weekLabels,
  readonly,
  onOptimistic,
}: {
  section: ScorecardSection;
  monthId: string;
  weekLabels: [string, string, string, string, string];
  readonly: boolean;
  onOptimistic: (rowId: string, field: string, value: string | null) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const headerClass = SECTION_HEADER[section.variant] ?? SECTION_HEADER.red;

  return (
    <>
      <tr>
        <td
          colSpan={13}
          className={cn(
            "px-3 py-2 text-[11px] font-bold uppercase tracking-widest cursor-pointer select-none",
            headerClass,
          )}
          onClick={() => setCollapsed((v) => !v)}
        >
          <span className="inline-flex items-center gap-1.5">
            {collapsed
              ? <ChevronRight className="h-3 w-3 shrink-0" />
              : <ChevronDown className="h-3 w-3 shrink-0" />}
            {section.title}
          </span>
        </td>
      </tr>
      {!collapsed &&
        section.rows.map((row) => (
          <DataRow
            key={row.id}
            row={row}
            monthId={monthId}
            weekLabels={weekLabels}
            readonly={readonly}
            onOptimistic={onOptimistic}
          />
        ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function NorthstarScorecard({
  initialMonth,
  initialAllMonths,
}: {
  initialMonth: ScorecardMonth;
  initialAllMonths: MonthSummary[];
}) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [allMonths, setAllMonths] = useState(initialAllMonths);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Sync when server re-renders with a different initialMonth (after navigation)
  useEffect(() => { setMonth(initialMonth); }, [initialMonth.id]);
  useEffect(() => { setAllMonths(initialAllMonths); }, [initialAllMonths]);

  const readonly = month.status === "archived";

  // Optimistic cell update
  const handleOptimistic = useCallback(
    (rowId: string, field: string, value: string | null) => {
      setMonth((prev) => patchMonth(prev, rowId, field, value));
    },
    [],
  );

  // Optimistic week label update
  const handleWeekLabelOptimistic = useCallback(
    (idx: number, label: string) => {
      setMonth((prev) => {
        const labels = [...prev.weekLabels] as typeof prev.weekLabels;
        labels[idx] = label;
        return { ...prev, weekLabels: labels };
      });
    },
    [],
  );

  // Month selector change
  async function switchMonth(id: string) {
    if (id === month.id) return;
    setSwitching(true);
    const data = await getMonth(id);
    if (data) setMonth(data);
    setSwitching(false);
    // Keep URL in sync
    if (data?.status === "active") {
      router.replace("/scorecard", { scroll: false });
    } else {
      router.replace(`/scorecard?m=${id}`, { scroll: false });
    }
  }

  // Archive current month
  async function handleArchive() {
    setArchiving(true);
    try {
      const newMonth = await archiveActiveMonth();
      const newList = await listMonths();
      setMonth(newMonth);
      setAllMonths(newList);
      router.replace("/scorecard", { scroll: false });
    } finally {
      setArchiving(false);
      setArchiveOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Month selector */}
        <div className="flex items-center gap-2">
          <select
            value={month.id}
            onChange={(e) => switchMonth(e.target.value)}
            disabled={switching}
            className={cn(
              "rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium",
              "text-foreground outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer",
              switching && "opacity-50",
            )}
          >
            {allMonths.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}{m.status === "active" ? " (active)" : ""}
              </option>
            ))}
          </select>
          {readonly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-muted-foreground border border-border">
              <Archive className="h-3 w-3" />
              Archived
            </span>
          )}
        </div>

        {/* Archive button (active months only) */}
        {!readonly && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setArchiveOpen(true)}
            className="gap-1.5"
          >
            <Archive className="h-3.5 w-3.5" />
            Close Month
          </Button>
        )}
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              Close {month.label}?
            </DialogTitle>
            <DialogDescription>
              This will archive <strong>{month.label}</strong> and open a fresh blank scorecard
              for the next month. The archived month is saved and can be viewed any time from
              the month selector above.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={archiving}>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              size="sm"
              onClick={handleArchive}
              disabled={archiving}
              className="gap-1.5"
            >
              <Archive className="h-3.5 w-3.5" />
              {archiving ? "Archiving…" : "Yes, close month"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editable hint */}
      {!readonly && (
        <p className="text-[12px] text-muted-foreground -mt-2">
          Click any cell to edit · changes save automatically
        </p>
      )}

      {/* Scorecard table */}
      <div className="overflow-x-auto rounded-xl border border-border shadow-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className={cn("text-[11px] font-semibold uppercase tracking-wide", TABLE_HEADER)}>
              <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[220px]">Metric</th>
              {month.weekLabels.slice(0, 4).map((label, i) => (
                <th key={i} className="px-2 py-2.5 text-center whitespace-nowrap min-w-[90px]">
                  Week {i + 1}
                  <br />
                  <WeekLabelCell
                    value={label}
                    weekIndex={i}
                    monthId={month.id}
                    readonly={readonly}
                    onOptimistic={handleWeekLabelOptimistic}
                  />
                </th>
              ))}
              <th className="px-2 py-2.5 text-center whitespace-nowrap min-w-[90px]">
                Remainder
                <br />
                <WeekLabelCell
                  value={month.weekLabels[4]}
                  weekIndex={4}
                  monthId={month.id}
                  readonly={readonly}
                  onOptimistic={handleWeekLabelOptimistic}
                />
              </th>
              <th className="px-2 py-2.5 text-center whitespace-nowrap">Monthly Target</th>
              <th className="px-2 py-2.5 text-center whitespace-nowrap">Metric Type</th>
              <th className="px-2 py-2.5 text-center whitespace-nowrap">Monthly Actual</th>
              <th className="px-2 py-2.5 text-center whitespace-nowrap">Status</th>
              <th className="px-2 py-2.5 text-left whitespace-nowrap">Metric Owner</th>
              <th className="px-2 py-2.5 text-left whitespace-nowrap">Metric Source</th>
              <th className="px-2 py-2.5 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {month.sections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                monthId={month.id}
                weekLabels={month.weekLabels}
                readonly={readonly}
                onOptimistic={handleOptimistic}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
