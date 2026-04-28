"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { createCase } from "@/lib/lost-items/actions";

type Member = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

type Props = {
  properties: { id: string; name: string }[];
  members: Member[];
  onCreated?: (id: string) => void;
};

export function LostItemNewForm({
  properties,
  members,
  onCreated,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [itemDescription, setItemDescription] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [slackThreadUrl, setSlackThreadUrl] = useState("");
  const [conversationUrl, setConversationUrl] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [cleaningVendor, setCleaningVendor] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!itemDescription.trim()) {
      setError("Item description is required");
      return;
    }
    startTransition(async () => {
      const res = await createCase({
        item_description: itemDescription.trim(),
        found_location: foundLocation.trim() || null,
        property_id: propertyId || null,
        guest_name: guestName.trim() || null,
        guest_email: guestEmail.trim() || null,
        guest_phone: guestPhone.trim() || null,
        slack_thread_url: slackThreadUrl.trim() || null,
        conversation_url: conversationUrl.trim() || null,
        follow_up_date: followUpDate || null,
        assigned_to: assignedTo || null,
        cleaning_vendor: cleaningVendor.trim() || null,
        notes: notes.trim() || null,
        source: "internal_form",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onCreated?.(res.data.id);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 text-sm">
      <Field label="Item description *">
        <Input
          required
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="e.g. Black iPhone 15, Patagonia jacket, kid's stuffed bear"
        />
      </Field>

      <Field label="Where item was found / left">
        <Input
          value={foundLocation}
          onChange={(e) => setFoundLocation(e.target.value)}
          placeholder="left bedroom nightstand"
        />
      </Field>

      <Field label="Property">
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Select property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Guest name">
          <Input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </Field>
        <Field label="Guest email">
          <Input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />
        </Field>
        <Field label="Guest phone">
          <Input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Slack thread link">
          <Input
            value={slackThreadUrl}
            onChange={(e) => setSlackThreadUrl(e.target.value)}
            placeholder="https://haven.slack.com/archives/…"
          />
        </Field>
        <Field label="Conversation link">
          <Input
            value={conversationUrl}
            onChange={(e) => setConversationUrl(e.target.value)}
            placeholder="Hostaway/Airbnb/email thread URL"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Follow-up date">
          <Input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </Field>
        <Field label="Assign to">
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? m.email}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Cleaning vendor">
        <Input
          value={cleaningVendor}
          onChange={(e) => setCleaningVendor(e.target.value)}
          placeholder="Cleaning company name (optional)"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          placeholder="Anything else useful — guest's preferred contact method, urgency context, shipping address…"
        />
      </Field>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create case"}
        </button>
      </div>
    </form>
  );
}

function Field({
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
