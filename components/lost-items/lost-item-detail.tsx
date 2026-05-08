"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Slack, MessageCircle, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LOST_ITEM_PIPELINE,
  LOST_ITEM_STATUS_LABELS,
  type LostItemCaseWithRelations,
  type LostItemEventWithActor,
} from "@/lib/lost-items/types";
import {
  updateCase,
  setStatus,
  setAssignee,
  addComment,
  deleteCase,
} from "@/lib/lost-items/actions";
import { StatusBadge, formatDateTime, formatRelative } from "./shared";

type Member = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

type Props = {
  item: LostItemCaseWithRelations;
  events: LostItemEventWithActor[];
  properties: { id: string; name: string }[];
  members: Member[];
  isAdmin: boolean;
};

export function LostItemDetail({
  item,
  events,
  properties,
  members,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const apply = (mutator: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await mutator();
      if (!res.ok) {
        setError(res.error ?? "Update failed");
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        `Delete case ${item.case_number}? This removes the case and its activity history. This cannot be undone.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteCase(item.id);
      if (!res.ok) {
        setError(res.error ?? "Delete failed");
        return;
      }
      router.push("/operations/lost-items");
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* Main column */}
      <div className="flex flex-col gap-5">
        <div>
          <Link
            href={"/operations/lost-items" as never}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to all cases
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {item.case_number}
          </span>
          <StatusBadge status={item.status} />
          <span className="text-xs text-muted-foreground">
            opened {formatRelative(item.created_at)}
          </span>
        </div>

        <h2 className="font-heading text-2xl font-bold">
          {item.item_description}
        </h2>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
            {error}
          </div>
        ) : null}

        {/* Pipeline progress */}
        <div className="flex flex-wrap gap-1.5">
          {LOST_ITEM_PIPELINE.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() =>
                apply(() => setStatus(item.id, s))
              }
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                (item.status === s
                  ? s === "failed"
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground")
              }
            >
              {LOST_ITEM_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Activity feed — comments first-class */}
        <ActivityFeed
          caseId={item.id}
          events={events}
          pending={pending}
          onApply={apply}
        />

        {/* Editable details */}
        <DetailsCard
          item={item}
          properties={properties}
          pending={pending}
          onApply={apply}
        />
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-3">
        <SidePanel title="Assignment">
          <SelectField
            label="Owner"
            value={item.assigned_to ?? ""}
            disabled={pending}
            onChange={(v) =>
              apply(() => setAssignee(item.id, v || null))
            }
            options={[
              { value: "", label: "Unassigned" },
              ...members.map((m) => ({
                value: m.id,
                label: m.full_name ?? m.email,
              })),
            ]}
          />
          <DateField
            label="Follow-up date"
            value={item.follow_up_date ?? ""}
            disabled={pending}
            onChange={(v) =>
              apply(() => updateCase(item.id, { follow_up_date: v || null }))
            }
          />
        </SidePanel>

        <SidePanel title="Links">
          <LinkRow
            icon={<Slack className="h-3.5 w-3.5" />}
            label="Slack thread"
            url={item.slack_thread_url}
          />
          <LinkRow
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            label="Conversation"
            url={item.conversation_url}
          />
          {item.external_url ? (
            <LinkRow
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              label={item.external_source ?? "Source system"}
              url={item.external_url}
            />
          ) : null}
        </SidePanel>

        <SidePanel title="Source">
          <KV label="Origin" value={item.source} />
          {item.external_source ? (
            <KV label="External system" value={item.external_source} />
          ) : null}
          {item.external_id ? (
            <KV label="External ID" value={item.external_id} mono />
          ) : null}
        </SidePanel>

        <SidePanel title="Timeline">
          <KV label="Opened" value={formatDateTime(item.created_at)} />
          <KV label="Pickup scheduled" value={formatDateTime(item.pickup_scheduled_at)} />
          <KV label="Pickup completed" value={formatDateTime(item.pickup_completed_at)} />
          <KV label="Delivered" value={formatDateTime(item.delivered_at)} />
          <KV label="Completed" value={formatDateTime(item.completed_at)} />
        </SidePanel>

        {isAdmin ? (
          <SidePanel title="Danger zone">
            <button
              type="button"
              disabled={pending}
              onClick={handleDelete}
              className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              Delete case
            </button>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Removes the case and its activity history. Admin only.
            </p>
          </SidePanel>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details card
// ---------------------------------------------------------------------------

function DetailsCard({
  item,
  properties,
  pending,
  onApply,
}: {
  item: LostItemCaseWithRelations;
  properties: { id: string; name: string }[];
  pending: boolean;
  onApply: (
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({
    item_description: item.item_description,
    found_location: item.found_location ?? "",
    property_id: item.property_id ?? "",
    guest_name: item.guest_name ?? "",
    guest_email: item.guest_email ?? "",
    guest_phone: item.guest_phone ?? "",
    slack_thread_url: item.slack_thread_url ?? "",
    conversation_url: item.conversation_url ?? "",
    cleaning_vendor: item.cleaning_vendor ?? "",
    return_method: item.return_method ?? "",
    shipping_carrier: item.shipping_carrier ?? "",
    shipping_tracking: item.shipping_tracking ?? "",
    notes: item.notes ?? "",
  }));

  const save = () => {
    onApply(async () => {
      const res = await updateCase(item.id, {
        item_description: draft.item_description.trim(),
        found_location: draft.found_location.trim() || null,
        property_id: draft.property_id || null,
        guest_name: draft.guest_name.trim() || null,
        guest_email: draft.guest_email.trim() || null,
        guest_phone: draft.guest_phone.trim() || null,
        slack_thread_url: draft.slack_thread_url.trim() || null,
        conversation_url: draft.conversation_url.trim() || null,
        cleaning_vendor: draft.cleaning_vendor.trim() || null,
        return_method: (draft.return_method || null) as
          | "shipped"
          | "guest_pickup"
          | "in_person"
          | "other"
          | null,
        shipping_carrier: draft.shipping_carrier.trim() || null,
        shipping_tracking: draft.shipping_tracking.trim() || null,
        notes: draft.notes.trim() || null,
      });
      if (res.ok) setEditing(false);
      return res;
    });
  };

  if (!editing) {
    return (
      <div className="rounded-card border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">Case details</h3>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-haven-coral-700 hover:underline"
          >
            Edit
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <KV label="Item" value={item.item_description} />
          <KV label="Found at" value={item.found_location ?? "—"} />
          <KV
            label="Property"
            value={item.property?.name ?? item.property_name ?? "—"}
          />
          <KV label="Guest" value={item.guest_name ?? "—"} />
          <KV label="Guest email" value={item.guest_email ?? "—"} />
          <KV label="Guest phone" value={item.guest_phone ?? "—"} />
          <KV label="Cleaning vendor" value={item.cleaning_vendor ?? "—"} />
          <KV label="Return method" value={item.return_method ?? "—"} />
          <KV label="Carrier" value={item.shipping_carrier ?? "—"} />
          <KV
            label="Tracking #"
            value={item.shipping_tracking ?? "—"}
            mono
          />
        </dl>
        {item.notes ? (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{item.notes}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h3 className="font-heading text-base font-semibold">Edit case</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <FieldRow label="Item description">
          <Input
            value={draft.item_description}
            onChange={(e) =>
              setDraft({ ...draft, item_description: e.target.value })
            }
          />
        </FieldRow>
        <FieldRow label="Found at">
          <Input
            value={draft.found_location}
            onChange={(e) =>
              setDraft({ ...draft, found_location: e.target.value })
            }
          />
        </FieldRow>
        <FieldRow label="Property">
          <select
            value={draft.property_id}
            onChange={(e) =>
              setDraft({ ...draft, property_id: e.target.value })
            }
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">— none —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Guest name">
          <Input
            value={draft.guest_name}
            onChange={(e) => setDraft({ ...draft, guest_name: e.target.value })}
          />
        </FieldRow>
        <FieldRow label="Guest email">
          <Input
            value={draft.guest_email}
            onChange={(e) =>
              setDraft({ ...draft, guest_email: e.target.value })
            }
          />
        </FieldRow>
        <FieldRow label="Guest phone">
          <Input
            value={draft.guest_phone}
            onChange={(e) =>
              setDraft({ ...draft, guest_phone: e.target.value })
            }
          />
        </FieldRow>
        <FieldRow label="Slack thread link">
          <Input
            value={draft.slack_thread_url}
            onChange={(e) =>
              setDraft({ ...draft, slack_thread_url: e.target.value })
            }
            placeholder="https://haven.slack.com/archives/…"
          />
        </FieldRow>
        <FieldRow label="Conversation link">
          <Input
            value={draft.conversation_url}
            onChange={(e) =>
              setDraft({ ...draft, conversation_url: e.target.value })
            }
            placeholder="Hostaway/Airbnb/email thread"
          />
        </FieldRow>
        <FieldRow label="Cleaning vendor">
          <Input
            value={draft.cleaning_vendor}
            onChange={(e) =>
              setDraft({ ...draft, cleaning_vendor: e.target.value })
            }
          />
        </FieldRow>
        <FieldRow label="Return method">
          <select
            value={draft.return_method}
            onChange={(e) =>
              setDraft({ ...draft, return_method: e.target.value })
            }
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">— unset —</option>
            <option value="shipped">Shipped</option>
            <option value="guest_pickup">Guest pickup</option>
            <option value="in_person">In person</option>
            <option value="other">Other</option>
          </select>
        </FieldRow>
        <FieldRow label="Carrier">
          <Input
            value={draft.shipping_carrier}
            onChange={(e) =>
              setDraft({ ...draft, shipping_carrier: e.target.value })
            }
          />
        </FieldRow>
        <FieldRow label="Tracking #">
          <Input
            value={draft.shipping_tracking}
            onChange={(e) =>
              setDraft({ ...draft, shipping_tracking: e.target.value })
            }
          />
        </FieldRow>
        <div className="col-span-2">
          <FieldRow label="Notes">
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </FieldRow>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs"
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity feed (comments first-class)
// ---------------------------------------------------------------------------

function ActivityFeed({
  caseId,
  events,
  pending,
  onApply,
}: {
  caseId: string;
  events: LostItemEventWithActor[];
  pending: boolean;
  onApply: (
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) => void;
}) {
  const [comment, setComment] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onApply(async () => {
      const res = await addComment(caseId, comment);
      if (res.ok) setComment("");
      return res;
    });
  };

  const comments = events.filter((e) => e.event_type === "comment");
  const otherEvents = events.filter((e) => e.event_type !== "comment");

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
        <MessageSquare className="h-4 w-4" />
        Comments & activity
      </h3>

      <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              submit(e as unknown as React.FormEvent);
            }
          }}
          rows={2}
          placeholder="Add a comment for the team — context, next steps, what the guest said…"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {comments.length} comment{comments.length === 1 ? "" : "s"}
          </span>
          <button
            type="submit"
            disabled={pending || !comment.trim()}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:brightness-95 disabled:opacity-60"
          >
            Post comment
          </button>
        </div>
      </form>

      {/* Comments — most prominent */}
      {comments.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {comments.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1 rounded-md border border-border bg-accent-soft/30 p-3"
            >
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">
                  {e.actor?.full_name ??
                    e.actor?.email ??
                    e.actor_label ??
                    "system"}
                </span>
                <span>·</span>
                <span>{formatDateTime(e.created_at)}</span>
              </div>
              <div className="whitespace-pre-wrap">{e.body}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          No comments yet. Be the first to add context for the team.
        </p>
      )}

      {/* Other events (status changes, assignments, created) */}
      {otherEvents.length > 0 ? (
        <details className="mt-5 group">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Activity log ({otherEvents.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {otherEvents.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-0.5 rounded-md border border-border bg-surface-alt/40 p-2.5"
              >
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {e.actor?.full_name ??
                      e.actor?.email ??
                      e.actor_label ??
                      "system"}
                  </span>
                  <span>·</span>
                  <span>{formatDateTime(e.created_at)}</span>
                  <span>·</span>
                  <span className="uppercase tracking-wider">
                    {e.event_type}
                  </span>
                </div>
                {e.event_type === "status_change" ? (
                  <div>
                    Status: <strong>{e.from_value ?? "—"}</strong> →{" "}
                    <strong>{e.to_value ?? "—"}</strong>
                  </div>
                ) : e.event_type === "assignment" ? (
                  <div>
                    Assigned: <strong>{e.from_value ?? "—"}</strong> →{" "}
                    <strong>{e.to_value ?? "—"}</strong>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{e.body}</div>
                )}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SidePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function KV({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={"text-sm " + (mono ? "font-mono text-xs" : "")}>
        {value}
      </dd>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
      />
    </label>
  );
}

function LinkRow({
  icon,
  label,
  url,
}: {
  icon: React.ReactNode;
  label: string;
  url: string | null;
}) {
  if (!url) {
    return (
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span>—</span>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-alt/40 px-2 py-1.5 text-xs text-haven-coral-700 hover:bg-accent-soft/50"
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="truncate text-muted-foreground max-w-[180px]">
        Open ↗
      </span>
    </a>
  );
}
