"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  website: string;
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
  website: "",
};

export function CleanTransitionPublicIntakeForm() {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.property_name.trim()) {
      setError("Property name is required");
      return;
    }
    if (!form.old_price || !form.new_price) {
      setError("Old price and new price are required");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/public/clean-transition", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...form,
            property_name: form.property_name.trim(),
            address: form.address.trim() || null,
            owner_name: form.owner_name.trim() || null,
            submitted_by_name: form.submitted_by_name.trim() || null,
            cleaning_contact: form.cleaning_contact.trim() || null,
            transition_date: form.transition_date || null,
            old_price: form.old_price,
            new_price: form.new_price,
            notes: form.notes.trim() || null,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };
        if (!res.ok || json.error) {
          setError(json.error ?? `Submission failed (HTTP ${res.status})`);
          return;
        }
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-card border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <h2 className="font-heading text-xl font-bold">Submitted</h2>
        </div>
        <p className="mt-3 text-sm">
          Thanks. This clean transition request is now in Haven OS for approval.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setForm(emptyForm);
          }}
          className="mt-5 inline-flex items-center rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Submit another property
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 text-sm"
    >
      <Field label="Property name *">
        <Input
          required
          value={form.property_name}
          onChange={(event) => update("property_name", event.target.value)}
          placeholder="Cabin or listing name"
          maxLength={180}
        />
      </Field>

      <Field label="Address">
        <Input
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
          placeholder="Street, city, state"
          maxLength={240}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Owner">
          <Input
            value={form.owner_name}
            onChange={(event) => update("owner_name", event.target.value)}
            maxLength={140}
          />
        </Field>
        <Field label="Submitted by">
          <Input
            value={form.submitted_by_name}
            onChange={(event) =>
              update("submitted_by_name", event.target.value)
            }
            maxLength={140}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Old cleaning price *">
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.old_price}
            onChange={(event) => update("old_price", event.target.value)}
          />
        </Field>
        <Field label="New cleaning price *">
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.new_price}
            onChange={(event) => update("new_price", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Transition date">
          <Input
            type="date"
            value={form.transition_date}
            onChange={(event) => update("transition_date", event.target.value)}
          />
        </Field>
        <Field label="Cleaning contact">
          <Input
            value={form.cleaning_contact}
            onChange={(event) => update("cleaning_contact", event.target.value)}
            maxLength={180}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={4}
          maxLength={1200}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-ring"
          placeholder="Bedrooms, cleaning scope, special instructions, or approval context"
        />
      </Field>

      <input
        type="text"
        value={form.website}
        onChange={(event) => update("website", event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        <Send className="h-4 w-4" />
        {pending ? "Submitting..." : "Submit for Approval"}
      </Button>
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
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
