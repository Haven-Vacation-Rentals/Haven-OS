"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ScorecardConfig,
  ScorecardSection,
  ScorecardRow,
  MetricStatus,
} from "@/lib/scorecard/types";

const SECTION_HEADER_CLASS: Record<string, string> = {
  olive: "bg-[#5C6B2C] text-white",
  blue:  "bg-[#3B6EA0] text-white",
  red:   "bg-[#B52A2A] text-white",
};

const TABLE_HEADER_CLASS = "bg-[#7A6E40] text-white";

function StatusChip({ status }: { status: MetricStatus }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-[11px] font-semibold text-white",
        status === "green"  && "bg-emerald-600",
        status === "yellow" && "bg-amber-500",
        status === "red"    && "bg-rose-600",
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DataRow({ row }: { row: ScorecardRow }) {
  return (
    <tr className="border-b border-border/40 hover:bg-surface-alt/50 transition-colors">
      <td className="px-3 py-2 text-[13px] font-medium text-foreground">
        {row.metric}
      </td>
      {row.weeks.map((week, i) => (
        <td
          key={i}
          className="px-3 py-2 text-center text-[13px] text-foreground/80 whitespace-nowrap"
        >
          {week.value ?? ""}
          {week.note ? (
            <sup className="ml-0.5 text-[10px] text-muted-foreground">
              {week.note}
            </sup>
          ) : null}
        </td>
      ))}
      <td className="px-3 py-2 text-center text-[13px] text-foreground/80 whitespace-nowrap">
        {row.monthlyTarget ?? ""}
      </td>
      <td className="px-3 py-2 text-center text-[13px] text-muted-foreground whitespace-nowrap">
        {row.metricType ?? ""}
      </td>
      <td className="px-3 py-2 text-center text-[13px] text-foreground/80 whitespace-nowrap">
        {row.monthlyActual ?? ""}
      </td>
      <td className="px-3 py-2 text-center">
        <StatusChip status={row.status} />
      </td>
      <td className="px-3 py-2 text-[13px] text-foreground/70 whitespace-nowrap">
        {row.metricOwner ?? ""}
      </td>
      <td className="px-3 py-2 text-[13px] text-foreground/60 whitespace-nowrap">
        {row.metricSource ?? ""}
      </td>
      <td className="px-3 py-2 text-[13px] text-muted-foreground">
        {row.notes ?? ""}
      </td>
    </tr>
  );
}

function SectionBlock({ section }: { section: ScorecardSection }) {
  const [collapsed, setCollapsed] = useState(false);
  const headerClass = SECTION_HEADER_CLASS[section.variant] ?? SECTION_HEADER_CLASS.red;

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
        section.rows.map((row) => <DataRow key={row.id} row={row} />)}
    </>
  );
}

export function NorthstarScorecard({ config }: { config: ScorecardConfig }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className={cn("text-[11px] font-semibold uppercase tracking-wide", TABLE_HEADER_CLASS)}>
            <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[220px]">
              Metric
            </th>
            {config.weeks.slice(0, 4).map((w, i) => (
              <th key={i} className="px-3 py-2.5 text-center whitespace-nowrap">
                Week {i + 1}
                <br />
                <span className="text-[10px] font-normal text-white/70">({w})</span>
              </th>
            ))}
            <th className="px-3 py-2.5 text-center whitespace-nowrap">
              Remainder
              <br />
              <span className="text-[10px] font-normal text-white/70">({config.weeks[4]})</span>
            </th>
            <th className="px-3 py-2.5 text-center whitespace-nowrap">Monthly Target</th>
            <th className="px-3 py-2.5 text-center whitespace-nowrap">Metric Type</th>
            <th className="px-3 py-2.5 text-center whitespace-nowrap">Monthly Actual</th>
            <th className="px-3 py-2.5 text-center whitespace-nowrap">Status</th>
            <th className="px-3 py-2.5 text-left whitespace-nowrap">Metric Owner</th>
            <th className="px-3 py-2.5 text-left whitespace-nowrap">Metric Source</th>
            <th className="px-3 py-2.5 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {config.sections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
