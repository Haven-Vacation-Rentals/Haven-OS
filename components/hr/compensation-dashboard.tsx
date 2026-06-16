"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Copy,
  DollarSign,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
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

const STATUS_TONE: Record<CompensationFormStatus, "neutral" | "success" | "warn"> = {
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

export function CompensationDashboard({
  forms,
  submissions,
}: {
  forms: CompensationFormListItem[];
  submissions: CompensationSubmissionWithForm[];
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("Sales compensation form");
  const [description, setDescription] = useState(
    "Log booked meetings and closed deals for payout review.",
  );
  const [allowBookedMeetings, setAllowBookedMeetings] = useState(true);
  const [allowClosedDeals, setAllowClosedDeals] = useState(true);
  const [meetingPayout, setMeetingPayout] = useState("25");
  const [dealPercent, setDealPercent] = useState("3");
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return submissions.reduce(
      (acc, row) => {
        acc.count += 1;
        if (row.status === "pending") acc.pending += row.payout_amount;
        if (row.status === "approved") acc.approved += row.payout_amount;
        if (row.status === "paid") acc.paid += row.payout_amount;
        return acc;
      },
      { count: 0, pending: 0, approved: 0, paid: 0 },
    );
  }, [submissions]);

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
          deal_commission_percent: Number(dealPercent) || 0,
        });
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
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-[15px] font-bold">
            Booked Meetings or Closed Deals
          </h3>
        </div>
        {forms.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr_auto]">
              <Field label="Form name">
                <Input
                  value={title}
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
                description="Sales reps can log closed deals for commission."
              >
                <Field label="Commission percentage paid on closed deal value">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={dealPercent}
                    onChange={(e) => setDealPercent(e.target.value)}
                    disabled={!allowClosedDeals}
                  />
                </Field>
              </ActivitySetup>
            </div>
            <p className="text-[12px] text-muted-foreground">
              Turn on booked meetings, closed deals, or both. The dollar fields
              determine the estimated payout shown on the public form.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {forms.map((form) => (
              <FormRow key={form.id} form={form} pending={pending} />
            ))}
          </div>
        )}
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
            {totals.count} total
          </span>
        </div>
        {submissions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-surface-alt/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No compensation responses have been logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[13px]">
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-semibold">Rep</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">Account</th>
                  <th className="px-2 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 text-right font-semibold">Deal</th>
                  <th className="px-2 py-2 text-right font-semibold">Payout</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((row) => (
                  <SubmissionRow key={row.id} row={row} pending={pending} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
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
  const [dealPercent, setDealPercent] = useState(
    String(form.deal_commission_percent),
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
        deal_commission_percent: Number(dealPercent) || 0,
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
                <Field label="Commission percentage paid on closed deal value">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={dealPercent}
                    onChange={(e) => setDealPercent(e.target.value)}
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
                ? `${form.deal_commission_percent}% of closed deal value`
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
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          {editing ? (
            <Button size="sm" onClick={save} disabled={transitioning || pending}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
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
        {row.deal_value !== null ? `$${row.deal_value.toFixed(2)}` : "—"}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
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
        checked ? "border-accent/60 bg-accent-soft/60" : "border-border bg-surface-alt/30"
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
