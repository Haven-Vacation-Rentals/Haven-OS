"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Copy,
  DollarSign,
  ExternalLink,
  Filter,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
  X,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canonicalUrl } from "@/lib/canonical-url";
import {
  createCompensationForm,
  updateCompensationForm,
  updateCompensationSubmissionStatus,
} from "@/lib/hr/compensation";
import {
  COMPENSATION_ACTIVITY_LABELS,
  COMPENSATION_FORM_STATUS_LABELS,
  COMPENSATION_SUBMISSION_STATUS_LABELS,
  type CompensationFormListItem,
  type CompensationFormStatus,
  type CompensationSubmissionStatus,
  type CompensationSubmissionWithForm,
} from "@/lib/hr/compensation-types";

const STATUS_TONE: Record<
  CompensationFormStatus,
  "neutral" | "success" | "warn"
> = {
  draft: "neutral",
  active: "success",
  closed: "warn",
};

const SUBMISSION_TONE: Record<
  CompensationSubmissionStatus,
  "neutral" | "success" | "warn" | "danger"
> = {
  pending: "warn",
  approved: "success",
  paid: "neutral",
  rejected: "danger",
};

type TimelineFilter =
  | "all"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "year_to_date"
  | "custom";

type PayoutTotals = {
  count: number;
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
  total: number;
};

type RepOption = {
  key: string;
  label: string;
  email: string | null;
};

type MonthlyRepSummary = PayoutTotals & {
  key: string;
  monthKey: string;
  monthLabel: string;
  repName: string;
  repEmail: string | null;
  lastSubmittedAt: string;
};

const EMPTY_TOTALS: PayoutTotals = {
  count: 0,
  pending: 0,
  approved: 0,
  paid: 0,
  rejected: 0,
  total: 0,
};

const TIMELINE_LABELS: Record<TimelineFilter, string> = {
  all: "All time",
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  year_to_date: "Year to date",
  custom: "Custom dates",
};

const SELECT_CLASS =
  "h-9 rounded-md border border-border bg-surface px-2 text-sm";

export function CompensationDashboard({
  forms,
  submissions,
}: {
  forms: CompensationFormListItem[];
  submissions: CompensationSubmissionWithForm[];
}) {
  const [pending, startTransition] = useTransition();
  const [showCreator, setShowCreator] = useState(forms.length === 0);
  const [title, setTitle] = useState("Sales compensation form");
  const [description, setDescription] = useState(
    "Log booked meetings and closed deals for payout review.",
  );
  const [allowBookedMeetings, setAllowBookedMeetings] = useState(true);
  const [allowClosedDeals, setAllowClosedDeals] = useState(true);
  const [meetingPayout, setMeetingPayout] = useState("25");
  const [dealPayout, setDealPayout] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [repFilter, setRepFilter] = useState("all");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const totals = useMemo(() => {
    return calculateTotals(submissions);
  }, [submissions]);

  const repOptions = useMemo(() => {
    const reps = new Map<string, RepOption>();
    for (const row of submissions) {
      const key = getRepKey(row);
      if (!reps.has(key)) {
        reps.set(key, {
          key,
          label: row.rep_name.trim() || "Unknown rep",
          email: row.rep_email?.trim() || null,
        });
      }
    }
    return [...reps.values()].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((row) => {
      if (repFilter !== "all" && getRepKey(row) !== repFilter) return false;
      return isInTimeline(row, timelineFilter, customStart, customEnd);
    });
  }, [customEnd, customStart, repFilter, submissions, timelineFilter]);

  const filteredTotals = useMemo(() => {
    return calculateTotals(filteredSubmissions);
  }, [filteredSubmissions]);

  const monthlySummaries = useMemo(() => {
    return buildMonthlyRepSummaries(filteredSubmissions);
  }, [filteredSubmissions]);

  const resetFilters = () => {
    setRepFilter("all");
    setTimelineFilter("all");
    setCustomStart("");
    setCustomEnd("");
  };

  const createForm = () => {
    setError(null);
    if (!allowBookedMeetings && !allowClosedDeals) {
      setError("Turn on booked meetings, closed deals, or both.");
      return;
    }
    startTransition(async () => {
      try {
        await createCompensationForm({
          title,
          description,
          status: "active",
          allow_booked_meetings: allowBookedMeetings,
          allow_closed_deals: allowClosedDeals,
          meeting_payout_amount: Number(meetingPayout) || 0,
          closed_deal_payout_amount: Number(dealPayout) || 0,
        });
        setTitle("Sales compensation form");
        setDescription(
          "Log booked meetings and closed deals for payout review.",
        );
        setAllowBookedMeetings(true);
        setAllowClosedDeals(true);
        setMeetingPayout("25");
        setDealPayout("100");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-heading text-[18px] font-bold">
            Sales compensation
          </h2>
          <p className="text-sm text-muted-foreground">
            Publish payout forms for reps and review booked meetings or closed
            deals from one log.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right">
          <Metric label="Pending" value={`$${totals.pending.toFixed(2)}`} />
          <Metric label="Approved" value={`$${totals.approved.toFixed(2)}`} />
          <Metric label="Paid" value={`$${totals.paid.toFixed(2)}`} />
        </div>
      </div>

      <section className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-[15px] font-bold">
              Booked Meetings or Closed Deals
            </h3>
          </div>
          {forms.length > 0 && !showCreator ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setShowCreator(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New form
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          {showCreator ? (
            <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-surface-alt/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading text-[14px] font-bold">
                    New compensation form
                  </h4>
                  <p className="text-[12px] text-muted-foreground">
                    Create a separate public link for another sales rep or team.
                  </p>
                </div>
                {forms.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setShowCreator(false);
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr_auto]">
                <Field label="Form name">
                  <Input
                    value={title}
                    placeholder="Sales rep compensation form"
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Field>
                <Field label="Form description">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
                <div className="flex items-end">
                  <Button onClick={createForm} disabled={pending}>
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ActivitySetup
                  checked={allowBookedMeetings}
                  onCheckedChange={setAllowBookedMeetings}
                  title="Booked meetings"
                  description="Sales reps can log meetings they booked."
                >
                  <Field label="Dollar amount paid per booked meeting">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={meetingPayout}
                      onChange={(e) => setMeetingPayout(e.target.value)}
                      disabled={!allowBookedMeetings}
                    />
                  </Field>
                </ActivitySetup>
                <ActivitySetup
                  checked={allowClosedDeals}
                  onCheckedChange={setAllowClosedDeals}
                  title="Closed deals"
                  description="Sales reps can log one or more closed deals."
                >
                  <Field label="Dollar amount paid per closed deal">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={dealPayout}
                      onChange={(e) => setDealPayout(e.target.value)}
                      disabled={!allowClosedDeals}
                    />
                  </Field>
                </ActivitySetup>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Turn on booked meetings, closed deals, or both. The dollar
                fields determine the estimated payout shown on the public form.
              </p>
            </div>
          ) : null}
          {forms.length > 0 ? (
            <div className="flex flex-col gap-2">
              {forms.map((form) => (
                <FormRow key={form.id} form={form} pending={pending} />
              ))}
            </div>
          ) : showCreator ? null : (
            <div className="rounded-md border border-dashed border-border bg-surface-alt/30 px-4 py-8 text-center text-sm text-muted-foreground">
              No compensation forms have been created yet.
            </div>
          )}
        </div>
        {error ? (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-heading text-[15px] font-bold">
            Logged responses
          </h3>
          <span className="text-[12px] text-muted-foreground">
            {filteredTotals.count} of {totals.count} total
          </span>
        </div>
        {submissions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-surface-alt/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No compensation responses have been logged yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border bg-surface-alt/30 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-heading text-[14px] font-bold">
                    Payout filters
                  </h4>
                </div>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Sales rep">
                  <select
                    value={repFilter}
                    onChange={(e) => setRepFilter(e.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="all">All sales reps</option>
                    {repOptions.map((rep) => (
                      <option key={rep.key} value={rep.key}>
                        {rep.email ? `${rep.label} (${rep.email})` : rep.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Timeline">
                  <select
                    value={timelineFilter}
                    onChange={(e) =>
                      setTimelineFilter(e.target.value as TimelineFilter)
                    }
                    className={SELECT_CLASS}
                  >
                    {Object.entries(TIMELINE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                {timelineFilter === "custom" ? (
                  <>
                    <Field label="Start date">
                      <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                      />
                    </Field>
                    <Field label="End date">
                      <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                      />
                    </Field>
                  </>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-5">
                <Metric
                  label="Responses"
                  value={String(filteredTotals.count)}
                />
                <Metric
                  label="Pending"
                  value={formatMoney(filteredTotals.pending)}
                />
                <Metric
                  label="Approved"
                  value={formatMoney(filteredTotals.approved)}
                />
                <Metric label="Paid" value={formatMoney(filteredTotals.paid)} />
                <Metric
                  label="Total"
                  value={formatMoney(filteredTotals.total)}
                />
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Total excludes rejected submissions. Use Approved as the payout
                amount ready for payroll and Paid as the amount already settled.
              </p>
            </div>

            {monthlySummaries.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-surface-alt/30 px-4 py-8 text-center text-sm text-muted-foreground">
                No compensation responses match these filters.
              </div>
            ) : (
              <>
                <div className="rounded-md border border-border">
                  <div className="border-b border-border px-3 py-2">
                    <h4 className="font-heading text-[14px] font-bold">
                      Monthly payout summary
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[880px] text-left text-[13px]">
                      <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Month</th>
                          <th className="px-3 py-2 font-semibold">Rep</th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Responses
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Pending
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Approved
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Paid
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Rejected
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummaries.map((summary) => (
                          <tr
                            key={summary.key}
                            className="border-b border-border/60 last:border-0"
                          >
                            <td className="px-3 py-3 align-top font-medium">
                              {summary.monthLabel}
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="font-medium">
                                {summary.repName}
                              </div>
                              {summary.repEmail ? (
                                <div className="text-[12px] text-muted-foreground">
                                  {summary.repEmail}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 text-right align-top">
                              {summary.count}
                            </td>
                            <td className="px-3 py-3 text-right align-top">
                              {formatMoney(summary.pending)}
                            </td>
                            <td className="px-3 py-3 text-right align-top font-semibold">
                              {formatMoney(summary.approved)}
                            </td>
                            <td className="px-3 py-3 text-right align-top">
                              {formatMoney(summary.paid)}
                            </td>
                            <td className="px-3 py-3 text-right align-top">
                              {formatMoney(summary.rejected)}
                            </td>
                            <td className="px-3 py-3 text-right align-top font-semibold">
                              {formatMoney(summary.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] text-left text-[13px]">
                    <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-2 py-2 font-semibold">Rep</th>
                        <th className="px-2 py-2 font-semibold">Type</th>
                        <th className="px-2 py-2 font-semibold">Account</th>
                        <th className="px-2 py-2 font-semibold">Date</th>
                        <th className="px-2 py-2 text-right font-semibold">
                          Deal
                        </th>
                        <th className="px-2 py-2 text-right font-semibold">
                          Payout
                        </th>
                        <th className="px-2 py-2 font-semibold">Status</th>
                        <th className="px-2 py-2 font-semibold">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((row) => (
                        <SubmissionRow
                          key={row.id}
                          row={row}
                          pending={pending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function calculateTotals(rows: CompensationSubmissionWithForm[]): PayoutTotals {
  return rows.reduce(
    (acc, row) => {
      acc.count += 1;
      if (row.status === "pending") acc.pending += row.payout_amount;
      if (row.status === "approved") acc.approved += row.payout_amount;
      if (row.status === "paid") acc.paid += row.payout_amount;
      if (row.status === "rejected") acc.rejected += row.payout_amount;
      if (row.status !== "rejected") acc.total += row.payout_amount;
      return acc;
    },
    { ...EMPTY_TOTALS },
  );
}

function buildMonthlyRepSummaries(
  rows: CompensationSubmissionWithForm[],
): MonthlyRepSummary[] {
  const summaries = new Map<string, MonthlyRepSummary>();

  for (const row of rows) {
    const monthKey = getMonthKey(row);
    const repKey = getRepKey(row);
    const key = `${monthKey}:${repKey}`;
    const summary = summaries.get(key) ?? {
      ...EMPTY_TOTALS,
      key,
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      repName: row.rep_name.trim() || "Unknown rep",
      repEmail: row.rep_email?.trim() || null,
      lastSubmittedAt: row.submitted_at,
    };

    summary.count += 1;
    if (row.status === "pending") summary.pending += row.payout_amount;
    if (row.status === "approved") summary.approved += row.payout_amount;
    if (row.status === "paid") summary.paid += row.payout_amount;
    if (row.status === "rejected") summary.rejected += row.payout_amount;
    if (row.status !== "rejected") summary.total += row.payout_amount;
    if (row.submitted_at > summary.lastSubmittedAt) {
      summary.lastSubmittedAt = row.submitted_at;
    }
    summaries.set(key, summary);
  }

  return [...summaries.values()].sort((a, b) => {
    if (a.monthKey !== b.monthKey) return b.monthKey.localeCompare(a.monthKey);
    return a.repName.localeCompare(b.repName, undefined, {
      sensitivity: "base",
    });
  });
}

function getRepKey(row: CompensationSubmissionWithForm): string {
  const email = row.rep_email?.trim().toLowerCase();
  if (email) return `email:${email}`;
  return `name:${(row.rep_name.trim() || "Unknown rep").toLowerCase()}`;
}

function getSubmissionDate(row: CompensationSubmissionWithForm): Date {
  if (row.activity_date) {
    return new Date(`${row.activity_date}T00:00:00`);
  }
  return new Date(row.submitted_at);
}

function getMonthKey(row: CompensationSubmissionWithForm): string {
  const date = getSubmissionDate(row);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatMonthLabel(monthKey: string): string {
  if (monthKey === "Unknown") return "Unknown";
  return format(new Date(`${monthKey}-01T00:00:00`), "MMM yyyy");
}

function isInTimeline(
  row: CompensationSubmissionWithForm,
  timeline: TimelineFilter,
  customStart: string,
  customEnd: string,
): boolean {
  if (timeline === "all") return true;

  const date = getSubmissionDate(row);
  if (Number.isNaN(date.getTime())) return false;

  if (timeline === "custom") {
    const start = parseDateBoundary(customStart, false);
    const end = parseDateBoundary(customEnd, true);
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  }

  const now = new Date();
  const end = endOfDay(now);
  let start: Date;

  if (timeline === "this_month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (timeline === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      date >= start &&
      date <= endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
    );
  } else if (timeline === "last_3_months") {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return date >= start && date <= end;
}

function parseDateBoundary(value: string, end: boolean): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return end ? endOfDay(date) : date;
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function FormRow({
  form,
  pending,
}: {
  form: CompensationFormListItem;
  pending: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(form.title);
  const [allowBookedMeetings, setAllowBookedMeetings] = useState(
    form.allow_booked_meetings,
  );
  const [allowClosedDeals, setAllowClosedDeals] = useState(
    form.allow_closed_deals,
  );
  const [meetingPayout, setMeetingPayout] = useState(
    String(form.meeting_payout_amount),
  );
  const [dealPayout, setDealPayout] = useState(
    String(form.closed_deal_payout_amount),
  );
  const [transitioning, startTransition] = useTransition();
  const publicUrl = canonicalUrl(`/sales-comp/${form.slug}`);
  const status = form.status;

  const setStatus = (next: CompensationFormStatus) => {
    startTransition(async () => {
      await updateCompensationForm(form.id, { status: next });
    });
  };

  const save = () => {
    if (!allowBookedMeetings && !allowClosedDeals) {
      alert("Turn on booked meetings, closed deals, or both.");
      return;
    }
    startTransition(async () => {
      await updateCompensationForm(form.id, {
        title,
        allow_booked_meetings: allowBookedMeetings,
        allow_closed_deals: allowClosedDeals,
        meeting_payout_amount: Number(meetingPayout) || 0,
        closed_deal_payout_amount: Number(dealPayout) || 0,
      });
      setEditing(false);
    });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-md border border-border bg-surface-alt/30 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-[360px]"
              />
            ) : (
              <h4 className="truncate font-heading text-[14px] font-bold">
                {form.title}
              </h4>
            )}
            <Badge tone={STATUS_TONE[status]}>
              {COMPENSATION_FORM_STATUS_LABELS[status]}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
            <span>{form.submission_count} responses</span>
            <span>{form.pending_count} pending</span>
            <span>
              Last{" "}
              {form.last_submission_at
                ? `${formatDistanceToNowStrict(new Date(form.last_submission_at))} ago`
                : "never"}
            </span>
          </div>
          {editing ? (
            <div className="mt-3 grid max-w-[680px] grid-cols-1 gap-3 md:grid-cols-2">
              <ActivitySetup
                checked={allowBookedMeetings}
                onCheckedChange={setAllowBookedMeetings}
                title="Booked meetings"
                description="Allow reps to submit booked meetings."
              >
                <Field label="Dollar amount paid per booked meeting">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={meetingPayout}
                    onChange={(e) => setMeetingPayout(e.target.value)}
                    disabled={!allowBookedMeetings}
                  />
                </Field>
              </ActivitySetup>
              <ActivitySetup
                checked={allowClosedDeals}
                onCheckedChange={setAllowClosedDeals}
                title="Closed deals"
                description="Allow reps to submit closed deals."
              >
                <Field label="Dollar amount paid per closed deal">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dealPayout}
                    onChange={(e) => setDealPayout(e.target.value)}
                    disabled={!allowClosedDeals}
                  />
                </Field>
              </ActivitySetup>
            </div>
          ) : (
            <div className="mt-1 text-[12px] text-muted-foreground">
              {form.allow_booked_meetings
                ? `$${form.meeting_payout_amount.toFixed(2)} per meeting`
                : "Booked meetings off"}
              {" · "}
              {form.allow_closed_deals
                ? `$${form.closed_deal_payout_amount.toFixed(2)} per closed deal`
                : "Closed deals off"}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-[13px] font-semibold hover:bg-surface"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          {editing ? (
            <Button
              size="sm"
              onClick={save}
              disabled={transitioning || pending}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
          {status !== "active" ? (
            <Button
              size="sm"
              onClick={() => setStatus("active")}
              disabled={transitioning || pending}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Activate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("closed")}
              disabled={transitioning || pending}
            >
              <PauseCircle className="h-3.5 w-3.5" />
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({
  row,
  pending,
}: {
  row: CompensationSubmissionWithForm;
  pending: boolean;
}) {
  const [transitioning, startTransition] = useTransition();
  const setStatus = (status: CompensationSubmissionStatus) => {
    startTransition(async () => {
      await updateCompensationSubmissionStatus(row.id, status);
    });
  };

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-2 py-3 align-top">
        <div className="font-medium">{row.rep_name}</div>
        <div className="text-[12px] text-muted-foreground">{row.rep_email}</div>
      </td>
      <td className="px-2 py-3 align-top">
        {COMPENSATION_ACTIVITY_LABELS[row.activity_type]}
      </td>
      <td className="px-2 py-3 align-top">
        <div className="font-medium">{row.account_name}</div>
        <div className="text-[12px] text-muted-foreground">
          {row.contact_name || row.form_title}
        </div>
      </td>
      <td className="px-2 py-3 align-top">
        {row.activity_date
          ? format(new Date(`${row.activity_date}T00:00:00`), "MMM d, yyyy")
          : "—"}
      </td>
      <td className="px-2 py-3 text-right align-top">
        {row.deal_count
          ? `${row.deal_count} × $${(row.deal_value ?? 0).toFixed(2)}`
          : "—"}
      </td>
      <td className="px-2 py-3 text-right align-top font-semibold">
        ${row.payout_amount.toFixed(2)}
      </td>
      <td className="px-2 py-3 align-top">
        <div className="flex flex-col gap-1">
          <Badge tone={SUBMISSION_TONE[row.status]}>
            {COMPENSATION_SUBMISSION_STATUS_LABELS[row.status]}
          </Badge>
          <select
            value={row.status}
            disabled={pending || transitioning}
            onChange={(e) =>
              setStatus(e.target.value as CompensationSubmissionStatus)
            }
            className="h-8 rounded-md border border-border bg-surface px-2 text-[12px]"
          >
            {Object.entries(COMPENSATION_SUBMISSION_STATUS_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
      </td>
      <td className="px-2 py-3 align-top text-[12px] text-muted-foreground">
        {format(new Date(row.submitted_at), "MMM d, yyyy h:mm a")}
      </td>
    </tr>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-heading text-[16px] font-bold">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ActivitySetup({
  checked,
  onCheckedChange,
  title,
  description,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-md border p-3 transition-colors ${
        checked
          ? "border-accent/60 bg-accent-soft/60"
          : "border-border bg-surface-alt/30"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-[13px] font-semibold">{title}</span>
          <span className="block text-[12px] text-muted-foreground">
            {description}
          </span>
        </span>
      </label>
      <div className="mt-3">{children}</div>
    </div>
  );
}
