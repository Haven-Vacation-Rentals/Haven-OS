"use client";

/**
 * Public, unauthenticated intake form for /lost-items/intake.
 *
 * Posts to /api/public/lost-items/intake. Includes a honeypot field
 * ("website") that real users never fill in — bots that auto-fill
 * everything trip it and the server silently accepts + drops the
 * submission. Property selection uses a debounced server-side search
 * so we don't ship the entire portfolio to the client.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type PropertyOption = { id: string; name: string };
type AssigneeOption = { id: string; name: string };

type Submitted = {
  case_number: string;
};

export function LostItemPublicIntakeForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Submitted | null>(null);

  const [itemDescription, setItemDescription] = useState("");
  const [foundLocation, setFoundLocation] = useState("");

  const [propertyQuery, setPropertyQuery] = useState("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [propertyName, setPropertyName] = useState<string>("");
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [reporterName, setReporterName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [slackThreadUrl, setSlackThreadUrl] = useState("");
  const [conversationUrl, setConversationUrl] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [cleaningVendor, setCleaningVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/lost-items/assignees", {
          method: "GET",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { assignees?: AssigneeOption[] };
        if (!cancelled) setAssigneeOptions(json.assignees ?? []);
      } catch {
        // Silent — assignee picker is optional.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!showSuggest) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/public/lost-items/properties?q=${encodeURIComponent(propertyQuery)}`,
          { method: "GET" },
        );
        if (!res.ok) {
          setPropertyOptions([]);
          return;
        }
        const json = (await res.json()) as { properties: PropertyOption[] };
        setPropertyOptions(json.properties ?? []);
      } catch {
        setPropertyOptions([]);
      }
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [propertyQuery, showSuggest]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!itemDescription.trim()) {
      setError("Item description is required");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/public/lost-items/intake", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            item_description: itemDescription.trim(),
            found_location: foundLocation.trim() || null,
            property_id: propertyId || null,
            property_name:
              propertyName.trim() || (propertyId ? null : propertyQuery.trim() || null),
            reporter_name: reporterName.trim() || null,
            guest_name: guestName.trim() || null,
            guest_email: guestEmail.trim() || null,
            guest_phone: guestPhone.trim() || null,
            slack_thread_url: slackThreadUrl.trim() || null,
            conversation_url: conversationUrl.trim() || null,
            follow_up_date: followUpDate || null,
            assigned_to: assignedTo || null,
            cleaning_vendor: cleaningVendor.trim() || null,
            notes: notes.trim() || null,
            website,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          case_number?: string;
          error?: string;
        };
        if (!res.ok || json.error) {
          setError(json.error ?? `Submission failed (HTTP ${res.status})`);
          return;
        }
        setDone({ case_number: json.case_number ?? "" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      }
    });
  };

  if (done) {
    return (
      <div className="rounded-card border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <h2 className="font-heading text-xl font-bold">Case opened</h2>
        </div>
        <p className="mt-3 text-sm">
          Thanks — the Haven operations team has been notified. Your case
          number is{" "}
          <span className="font-mono font-semibold">{done.case_number}</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setItemDescription("");
            setFoundLocation("");
            setPropertyId("");
            setPropertyName("");
            setPropertyQuery("");
            setReporterName("");
            setGuestName("");
            setGuestEmail("");
            setGuestPhone("");
            setSlackThreadUrl("");
            setConversationUrl("");
            setFollowUpDate("");
            setAssignedTo("");
            setCleaningVendor("");
            setNotes("");
          }}
          className="mt-5 inline-flex items-center rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Log another item
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 text-sm"
    >
      <Field label="Item description *">
        <Input
          required
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="e.g. Black iPhone 15, Patagonia jacket, kid's stuffed bear"
          maxLength={2000}
        />
      </Field>

      <Field label="Where the item was found / left">
        <Input
          value={foundLocation}
          onChange={(e) => setFoundLocation(e.target.value)}
          placeholder="left bedroom nightstand"
          maxLength={200}
        />
      </Field>

      <div className="relative">
        <Field label="Property">
          <Input
            value={propertyQuery}
            onChange={(e) => {
              setPropertyQuery(e.target.value);
              setPropertyId("");
              setPropertyName("");
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggest(false), 150);
            }}
            placeholder="Start typing the property name…"
            maxLength={200}
            autoComplete="off"
          />
        </Field>
        {showSuggest && propertyOptions.length > 0 ? (
          <div className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-auto rounded-md border border-border bg-surface shadow-card">
            {propertyOptions.map((p) => (
              <button
                type="button"
                key={p.id}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  setPropertyId(p.id);
                  setPropertyName(p.name);
                  setPropertyQuery(p.name);
                  setShowSuggest(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent-soft"
              >
                {p.name}
              </button>
            ))}
          </div>
        ) : null}
        {!propertyId && propertyQuery.trim() ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            No exact match? You can leave the typed name — operations will
            match it on intake.
          </p>
        ) : null}
      </div>

      <Field label="Your name (so we know who reported it)">
        <Input
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          maxLength={200}
          autoComplete="name"
        />
      </Field>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Guest name">
          <Input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            maxLength={200}
          />
        </Field>
        <Field label="Guest email">
          <Input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            maxLength={200}
          />
        </Field>
        <Field label="Guest phone">
          <Input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            maxLength={200}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Slack thread link">
          <Input
            type="url"
            value={slackThreadUrl}
            onChange={(e) => setSlackThreadUrl(e.target.value)}
            placeholder="https://haven.slack.com/archives/…"
            maxLength={200}
          />
        </Field>
        <Field label="Conversation link">
          <Input
            type="url"
            value={conversationUrl}
            onChange={(e) => setConversationUrl(e.target.value)}
            placeholder="Hostaway / Airbnb / email thread URL"
            maxLength={200}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
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
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:shadow-ring"
          >
            <option value="">Unassigned</option>
            {assigneeOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cleaning vendor">
          <Input
            value={cleaningVendor}
            onChange={(e) => setCleaningVendor(e.target.value)}
            placeholder="Cleaning company name (optional)"
            maxLength={200}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:shadow-ring"
          placeholder="Anything else useful — guest's preferred contact method, urgency context, shipping address…"
        />
      </Field>

      {/* Honeypot — must remain empty; visually hidden from real users. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-10000px",
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-haven-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-haven-coral-700 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Open case"}
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
