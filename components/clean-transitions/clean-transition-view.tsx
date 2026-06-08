"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  HelpCircle,
  Home,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createCleanTransitionSubmission,
  reviewCleanTransitionSubmission,
  type CleanTransitionCounts,
  type CleanTransitionStatus,
  type CleanTransitionSubmission,
} from "@/lib/clean-transitions/actions";

type FormState = {
  property_name: string;
  address: string;
  owner_name: string;
  submitted_by_name: string;
  cleaning_contact: string;
  transition_date: string;
  old_price: string;
  new_price: string;
  notes: string;
};

const emptyForm: FormState = {
  property_name: "",
  address: "",
  owner_name: "",
  submitted_by_name: "",
  cleaning_contact: "",
  transition_date: "",
  old_price: "",
  new_price: "",
  notes: "",
};

const statusMeta: Record<
  CleanTransitionStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  pending: {
    label: "Pending",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Clock3,
  },
  needs_info: {
    label: "Needs Info",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: HelpCircle,
  },
  approved: {
    label: "Approved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: XCircle,
  },
};

export function CleanTransitionView({
  submissions,
  counts,
  canReview,
}: {
  submissions: CleanTransitionSubmission[];
  counts: CleanTransitionCounts;
  canReview: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(emptyForm);

  const visibleSubmissions = submissions.filter((submission) =>
    ["pending", "needs_info", "approved"].includes(submission.status),
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.property_name.trim()) {
      toast.error("Property name is required");
      return;
    }
    if (!form.old_price || !form.new_price) {
      toast.error("Old price and new price are required");
      return;
    }

    startTransition(async () => {
      const result = await createCleanTransitionSubmission({
        ...form,
        old_price: Number(form.old_price),
        new_price: Number(form.new_price),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Clean transition submitted");
      setForm(emptyForm);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
      <form onSubmit={onSubmit} className="haven-card flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            New Property
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Property details and cleaning price change for approval.
          </p>
        </div>

        <Field label="Property name" required>
          <Input
            value={form.property_name}
            onChange={(event) => update("property_name", event.target.value)}
            placeholder="Cabin or listing name"
            required
          />
        </Field>

        <Field label="Address">
          <Input
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Street, city, state"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field label="Owner">
            <Input
              value={form.owner_name}
              onChange={(event) => update("owner_name", event.target.value)}
            />
          </Field>
          <Field label="Submitted by">
            <Input
              value={form.submitted_by_name}
              onChange={(event) =>
                update("submitted_by_name", event.target.value)
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Old price" required>
            <Input
              value={form.old_price}
              onChange={(event) => update("old_price", event.target.value)}
              type="number"
              min="0"
              step="0.01"
              required
            />
          </Field>
          <Field label="New price" required>
            <Input
              value={form.new_price}
              onChange={(event) => update("new_price", event.target.value)}
              type="number"
              min="0"
              step="0.01"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field label="Transition date">
            <Input
              value={form.transition_date}
              onChange={(event) =>
                update("transition_date", event.target.value)
              }
              type="date"
            />
          </Field>
          <Field label="Cleaning contact">
            <Input
              value={form.cleaning_contact}
              onChange={(event) =>
                update("cleaning_contact", event.target.value)
              }
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-ring"
            placeholder="Bedrooms, scope, cleaner notes, or approval context"
          />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          <Send className="h-4 w-4" />
          {pending ? "Submitting..." : "Submit for Approval"}
        </Button>
      </form>

      <section className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Total" value={counts.total} tone="charcoal" />
          <Stat label="Pending" value={counts.pending} tone="blue" />
          <Stat label="Needs Info" value={counts.needs_info} tone="amber" />
          <Stat label="Approved" value={counts.approved} tone="emerald" />
          <Stat label="Rejected" value={counts.rejected} tone="rose" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Approval Queue
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted cleaning price changes waiting on review.
              </p>
            </div>
            <Badge tone={canReview ? "success" : "neutral"}>
              {canReview ? "Reviewer" : "Submitter"}
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {visibleSubmissions.length ? (
              visibleSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  canReview={canReview}
                />
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border bg-surface-alt/50 px-4 py-10 text-center text-sm text-muted-foreground">
                No active clean transition submissions.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({
  submission,
  canReview,
}: {
  submission: CleanTransitionSubmission;
  canReview: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reviewNote, setReviewNote] = useState(submission.review_note ?? "");
  const meta = statusMeta[submission.status];
  const Icon = meta.icon;
  const delta = Number(submission.price_delta ?? 0);

  function review(status: CleanTransitionStatus) {
    startTransition(async () => {
      const result = await reviewCleanTransitionSubmission({
        id: submission.id,
        status,
        review_note: reviewNote,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Submission marked ${statusMeta[status].label.toLowerCase()}`,
      );
      router.refresh();
    });
  }

  return (
    <article className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-base font-bold text-foreground">
              {submission.property_name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold",
                meta.className,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
          </div>
          {submission.address ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {submission.address}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Change
          </div>
          <div
            className={cn(
              "text-xl font-bold",
              delta >= 0 ? "text-emerald-700" : "text-rose-700",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {money(delta)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <PriceTile label="Old Price" value={submission.old_price} />
        <PriceTile label="New Price" value={submission.new_price} />
        <InfoTile
          label="Percent"
          value={
            submission.price_delta_pct === null
              ? "-"
              : `${Number(submission.price_delta_pct).toFixed(1)}%`
          }
        />
        <InfoTile
          label="Transition"
          value={submission.transition_date ?? "-"}
        />
      </div>

      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
        <span>
          {submission.owner_name
            ? `Owner: ${submission.owner_name}`
            : "Owner: -"}
        </span>
        <span>
          {submission.cleaning_contact
            ? `Cleaning: ${submission.cleaning_contact}`
            : "Cleaning: -"}
        </span>
        <span>
          {submission.submitted_by_name
            ? `Submitted by: ${submission.submitted_by_name}`
            : "Submitted by: -"}
        </span>
      </div>

      {submission.notes ? (
        <p className="mt-3 rounded-md border border-border bg-surface-alt px-3 py-2 text-sm text-foreground/80">
          {submission.notes}
        </p>
      ) : null}

      {canReview ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Reviewer note"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => review("approved")}
            >
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => review("needs_info")}
            >
              Needs Info
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => review("rejected")}
            >
              Reject
            </Button>
          </div>
        </div>
      ) : submission.review_note ? (
        <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {submission.review_note}
        </p>
      ) : null}
    </article>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-haven-coral-700">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "charcoal" | "blue" | "amber" | "emerald" | "rose";
}) {
  const toneClass = {
    charcoal: "border-border bg-surface text-foreground",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className={cn("rounded-md border p-3", toneClass)}>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-75">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function PriceTile({ label, value }: { label: string; value: number }) {
  return (
    <InfoTile
      label={label}
      value={
        <span className="inline-flex items-center gap-1">
          <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          {money(value)}
        </span>
      }
    />
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface-alt px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function money(value: number | string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}
