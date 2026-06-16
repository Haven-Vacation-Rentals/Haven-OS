"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitCompensationResponse } from "@/lib/hr/compensation";
import {
  type CompensationActivityType,
  type DbCompensationForm,
} from "@/lib/hr/compensation-types";

export function CompensationPublicForm({
  form,
}: {
  form: DbCompensationForm;
}) {
  const [activityType, setActivityType] =
    useState<CompensationActivityType>(
      form.allow_booked_meetings ? "booked_meeting" : "closed_deal",
    );
  const [repName, setRepName] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [contactName, setContactName] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [meetingDatetime, setMeetingDatetime] = useState("");
  const [dealCount, setDealCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  const estimatedPayout =
    activityType === "booked_meeting"
      ? form.meeting_payout_amount
      : (Math.max(1, Math.floor(Number(dealCount) || 1)) *
          form.closed_deal_payout_amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || submitted) return;
    setError(null);
    if (!repName.trim()) return setError("Sales rep name is required");
    if (repEmail.trim() && !repEmail.includes("@")) {
      return setError("Email looks invalid");
    }
    if (!accountName.trim()) return setError("Account name is required");
    if (activityType === "booked_meeting" && !form.allow_booked_meetings) {
      return setError("This form is not accepting booked meetings");
    }
    if (activityType === "closed_deal" && !form.allow_closed_deals) {
      return setError("This form is not accepting closed deals");
    }
    if (activityType === "closed_deal" && Number(dealCount) <= 0) {
      return setError("Number of closed deals is required");
    }

    submittingRef.current = true;
    startTransition(async () => {
      try {
        const result = await submitCompensationResponse({
          form_id: form.id,
          slug: form.slug,
          rep_name: repName,
          rep_email: repEmail,
          activity_type: activityType,
          account_name: accountName,
          contact_name: contactName,
          activity_date: activityDate,
          meeting_datetime: meetingDatetime,
          deal_count: Math.max(1, Math.floor(Number(dealCount) || 1)),
          notes,
          user_agent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        });
        if (result.ok) setSubmitted(true);
        else setError(result.error);
      } catch {
        setError("Something went wrong submitting this response.");
      } finally {
        submittingRef.current = false;
      }
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-emerald-200 bg-emerald-50/50 px-4 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        <div>
          <div className="font-heading text-[18px] font-bold">Logged</div>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Your submission was recorded for HR review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="rounded-card border border-border bg-surface p-4">
        <h3 className="font-heading text-[14px] font-bold">
          Booked Meetings or Closed Deals
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {form.allow_booked_meetings ? (
            <TypeOption
              checked={activityType === "booked_meeting"}
              title="Booked meeting"
              detail={`$${form.meeting_payout_amount.toFixed(2)} payout`}
              onChange={() => setActivityType("booked_meeting")}
            />
          ) : null}
          {form.allow_closed_deals ? (
            <TypeOption
              checked={activityType === "closed_deal"}
              title="Closed deal"
              detail={`$${form.closed_deal_payout_amount.toFixed(2)} per deal`}
              onChange={() => setActivityType("closed_deal")}
            />
          ) : null}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <h3 className="font-heading text-[14px] font-bold">Details</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Sales rep name" required>
            <Input value={repName} onChange={(e) => setRepName(e.target.value)} />
          </Field>
          <Field label="Sales rep email">
            <Input
              type="email"
              value={repEmail}
              onChange={(e) => setRepEmail(e.target.value)}
            />
          </Field>
          <Field label="Account / prospect" required>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </Field>
          <Field label="Contact name">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </Field>
          <Field label={activityType === "closed_deal" ? "Close date" : "Booked date"}>
            <Input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
            />
          </Field>
          {activityType === "booked_meeting" ? (
            <Field label="Meeting time">
              <Input
                type="datetime-local"
                value={meetingDatetime}
                onChange={(e) => setMeetingDatetime(e.target.value)}
              />
            </Field>
          ) : (
            <Field label="Number of closed deals" required>
              <Input
                type="number"
                min="1"
                step="1"
                value={dealCount}
                onChange={(e) => setDealCount(e.target.value)}
              />
            </Field>
          )}
        </div>
        <Field label="Notes" className="mt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-ring"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-alt/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Estimated payout
          </div>
          <div className="font-heading text-[22px] font-bold">
            ${estimatedPayout.toFixed(2)}
          </div>
        </div>
        <Button type="submit" variant="cta" size="lg" disabled={pending}>
          Submit
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}
    </form>
  );
}

function TypeOption({
  checked,
  title,
  detail,
  onChange,
}: {
  checked: boolean;
  title: string;
  detail: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
        checked
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface-alt/30 hover:bg-surface-alt"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4"
      />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-[12px] text-muted-foreground">{detail}</span>
      </span>
    </label>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-[12px] font-medium ${className ?? ""}`}>
      <span>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
