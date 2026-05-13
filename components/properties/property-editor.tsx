"use client";

/**
 * PropertyEditor — modal dialog for creating a new property with all of
 * the fields tracked in the `properties` table.
 *
 * Used by the "Add property" action on the Properties space. Posts to the
 * `createProperty` server action and navigates to the new detail page on
 * success. Field grouping mirrors `property-detail.tsx`.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProperty } from "@/lib/properties/actions";
import type {
  Property,
  PropertyPriority,
  PropertySalesStatus,
  PropertyStatus,
  PropertyTier,
} from "@/lib/properties/types";

type FormState = Partial<
  Omit<Property, "id" | "created_at" | "updated_at" | "archived_at">
> & { name: string };

const STATUSES: PropertyStatus[] = [
  "onboarding",
  "live",
  "paused",
  "offboarding",
  "offboarded",
];

const TIERS: PropertyTier[] = ["top", "key", "normal", "junior", "low"];

const PRIORITIES: PropertyPriority[] = ["high", "normal", "low", "none"];

const SALES_STATUSES: PropertySalesStatus[] = [
  "none",
  "on_the_market",
  "under_contract",
  "sold",
];

export function PropertyEditor({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState>({
    name: "",
    status: "onboarding",
    priority: "none",
    sales_status: "none",
    currently_hosting: false,
  });

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    start(async () => {
      const result = await createProperty(form);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.name} created`);
      onOpenChange(false);
      router.push(`/properties/${result.data.id}` as never);
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={() => !pending && onOpenChange(false)}
    >
      <div className="absolute inset-0 animate-fade-in bg-foreground/30 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[95vh] w-full max-w-3xl animate-slide-up flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="flex-1 font-heading text-base font-bold">Add property</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-6">
            <Section title="Identity">
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="123 Main Street"
                  autoFocus
                />
              </Field>
              <Field label="External ID">
                <Input
                  value={form.external_id ?? ""}
                  onChange={(e) => set("external_id", e.target.value)}
                  placeholder="Optional — legacy ID for cross-reference"
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={form.status ?? "onboarding"}
                  onChange={(v) => set("status", v as PropertyStatus)}
                  options={STATUSES.map((s) => ({ value: s, label: cap(s) }))}
                />
              </Field>
              <Field label="Tier">
                <SelectInput
                  value={form.tier ?? ""}
                  onChange={(v) => set("tier", (v || null) as PropertyTier | null)}
                  options={[
                    { value: "", label: "—" },
                    ...TIERS.map((t) => ({ value: t, label: cap(t) })),
                  ]}
                />
              </Field>
              <Field label="Priority">
                <SelectInput
                  value={form.priority ?? "none"}
                  onChange={(v) => set("priority", v as PropertyPriority)}
                  options={PRIORITIES.map((p) => ({ value: p, label: cap(p) }))}
                />
              </Field>
              <Field label="Sales status">
                <SelectInput
                  value={form.sales_status ?? "none"}
                  onChange={(v) => set("sales_status", v as PropertySalesStatus)}
                  options={SALES_STATUSES.map((s) => ({
                    value: s,
                    label: cap(s.replace(/_/g, " ")),
                  }))}
                />
              </Field>
              <Field label="Currently hosting">
                <label className="flex h-9 items-center gap-2 px-1 text-[13px]">
                  <input
                    type="checkbox"
                    checked={!!form.currently_hosting}
                    onChange={(e) => set("currently_hosting", e.target.checked)}
                    className="h-4 w-4"
                  />
                  Yes
                </label>
              </Field>
            </Section>

            <Section title="Location">
              <Field label="Address" wide>
                <Input
                  value={form.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street, City, State ZIP"
                />
              </Field>
              <Field label="Map address (geocoded)">
                <Input
                  value={form.address_map ?? ""}
                  onChange={(e) => set("address_map", e.target.value)}
                  placeholder="Optional — used for the map link"
                />
              </Field>
              <Field label="Region">
                <Input
                  value={form.region ?? ""}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="e.g. Gatlinburg"
                />
              </Field>
            </Section>

            <Section title="Team">
              <Field label="Account manager">
                <Input
                  value={form.account_manager ?? ""}
                  onChange={(e) => set("account_manager", e.target.value)}
                />
              </Field>
              <Field label="Revenue manager">
                <Input
                  value={form.revenue_manager ?? ""}
                  onChange={(e) => set("revenue_manager", e.target.value)}
                />
              </Field>
            </Section>

            <Section title="Layout">
              <Field label="Bedrooms">
                <NumberInput
                  value={form.bedroom_count}
                  onChange={(v) => set("bedroom_count", v)}
                />
              </Field>
              <Field label="Full baths">
                <NumberInput
                  value={form.bathroom_count_full}
                  onChange={(v) => set("bathroom_count_full", v)}
                />
              </Field>
              <Field label="Half baths">
                <NumberInput
                  value={form.bathroom_count_half}
                  onChange={(v) => set("bathroom_count_half", v)}
                />
              </Field>
              <Field label="Max guests">
                <NumberInput
                  value={form.max_guests}
                  onChange={(v) => set("max_guests", v)}
                />
              </Field>
              <Field label="Extra-guest threshold">
                <NumberInput
                  value={form.extra_guest_fee_threshold}
                  onChange={(v) => set("extra_guest_fee_threshold", v)}
                />
              </Field>
              <Field label="Kitchens">
                <NumberInput
                  value={form.kitchen_count}
                  onChange={(v) => set("kitchen_count", v)}
                />
              </Field>
              <Field label="Indoor pool / hot tub">
                <NumberInput
                  value={form.indoor_pool_hot_tub}
                  onChange={(v) => set("indoor_pool_hot_tub", v)}
                />
              </Field>
              <Field label="King beds">
                <NumberInput
                  value={form.king_beds}
                  onChange={(v) => set("king_beds", v)}
                />
              </Field>
              <Field label="Queen beds">
                <NumberInput
                  value={form.queen_beds}
                  onChange={(v) => set("queen_beds", v)}
                />
              </Field>
              <Field label="Full beds">
                <NumberInput
                  value={form.full_beds}
                  onChange={(v) => set("full_beds", v)}
                />
              </Field>
              <Field label="Twin beds">
                <NumberInput
                  value={form.twin_beds}
                  onChange={(v) => set("twin_beds", v)}
                />
              </Field>
            </Section>

            <Section title="Platforms & IDs">
              <Field label="Airbnb account">
                <Input
                  value={form.airbnb_account ?? ""}
                  onChange={(e) => set("airbnb_account", e.target.value)}
                />
              </Field>
              <Field label="Airbnb listing account">
                <Input
                  value={form.airbnb_listing_account ?? ""}
                  onChange={(e) => set("airbnb_listing_account", e.target.value)}
                />
              </Field>
              <Field label="Hostaway ID">
                <Input
                  value={form.hostaway_id ?? ""}
                  onChange={(e) => set("hostaway_id", e.target.value)}
                  placeholder="Leave blank — Hostaway sync will populate"
                />
              </Field>
              <Field label="Breezeway ID">
                <Input
                  value={form.breezeway_id ?? ""}
                  onChange={(e) => set("breezeway_id", e.target.value)}
                />
              </Field>
              <Field label="Listing link" wide>
                <Input
                  value={form.listing_link ?? ""}
                  onChange={(e) => set("listing_link", e.target.value)}
                  placeholder="https://www.airbnb.com/rooms/…"
                />
              </Field>
              <Field label="Other platform links" wide>
                <Textarea
                  value={form.platform_links ?? ""}
                  onChange={(v) => set("platform_links", v)}
                  rows={2}
                />
              </Field>
            </Section>

            <Section title="Access & codes">
              <Field label="Lockbox">
                <Input
                  value={form.lockbox ?? ""}
                  onChange={(e) => set("lockbox", e.target.value)}
                />
              </Field>
              <Field label="Key box location">
                <Input
                  value={form.key_box_location ?? ""}
                  onChange={(e) => set("key_box_location", e.target.value)}
                />
              </Field>
              <Field label="Master code">
                <Input
                  value={form.master_code ?? ""}
                  onChange={(e) => set("master_code", e.target.value)}
                />
              </Field>
              <Field label="Wifi login">
                <Input
                  value={form.wifi_login ?? ""}
                  onChange={(e) => set("wifi_login", e.target.value)}
                />
              </Field>
              <Field label="Thermostat">
                <Input
                  value={form.thermostat ?? ""}
                  onChange={(e) => set("thermostat", e.target.value)}
                  placeholder="e.g. Ecobee"
                />
              </Field>
              <Field label="Locks & codes" wide>
                <Textarea
                  value={form.locks_and_codes ?? ""}
                  onChange={(v) => set("locks_and_codes", v)}
                  rows={2}
                />
              </Field>
            </Section>

            <Section title="Services & fees">
              <Field label="Cleaning fee ($)">
                <NumberInput
                  value={form.cleaning_fee}
                  onChange={(v) => set("cleaning_fee", v)}
                  step="0.01"
                />
              </Field>
              <Field label="Cleaner pay ($)">
                <NumberInput
                  value={form.cleaner_pay}
                  onChange={(v) => set("cleaner_pay", v)}
                  step="0.01"
                />
              </Field>
              <Field label="Pest-control notes" wide>
                <Textarea
                  value={form.pest_control_notes ?? ""}
                  onChange={(v) => set("pest_control_notes", v)}
                  rows={2}
                />
              </Field>
              <Field label="Pool vendor notes" wide>
                <Textarea
                  value={form.pool_vendor_notes ?? ""}
                  onChange={(v) => set("pool_vendor_notes", v)}
                  rows={2}
                />
              </Field>
              <Field label="Lawn care">
                <Input
                  value={form.lawn_care ?? ""}
                  onChange={(e) => set("lawn_care", e.target.value)}
                />
              </Field>
              <Field label="Gas company">
                <Input
                  value={form.gas_company ?? ""}
                  onChange={(e) => set("gas_company", e.target.value)}
                />
              </Field>
              <Field label="Water source">
                <Input
                  value={form.water_source ?? ""}
                  onChange={(e) => set("water_source", e.target.value)}
                />
              </Field>
            </Section>

            <Section title="Misc">
              <Field label="Fireplace">
                <Input
                  value={form.fireplace ?? ""}
                  onChange={(e) => set("fireplace", e.target.value)}
                />
              </Field>
              <Field label="Parking">
                <Input
                  value={form.parking ?? ""}
                  onChange={(e) => set("parking", e.target.value)}
                />
              </Field>
              <Field label="Cancellation policy">
                <Input
                  value={form.cancellation_policy ?? ""}
                  onChange={(e) => set("cancellation_policy", e.target.value)}
                  placeholder="Strict / Moderate / Flexible…"
                />
              </Field>
              <Field label="Pay date">
                <Input
                  value={form.pay_date ?? ""}
                  onChange={(e) => set("pay_date", e.target.value)}
                />
              </Field>
              <Field label="HOA / community">
                <Input
                  value={form.hoa_community ?? ""}
                  onChange={(e) => set("hoa_community", e.target.value)}
                />
              </Field>
              <Field label="Offboarding date">
                <Input
                  type="date"
                  value={form.offboarding_date ?? ""}
                  onChange={(e) => set("offboarding_date", e.target.value || null)}
                />
              </Field>
              <Field label="Notes" wide>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(v) => set("notes", v)}
                  rows={4}
                />
              </Field>
            </Section>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-alt/40 px-5 py-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Creating…" : "Create property"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field primitives
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="haven-eyebrow">{title}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={"flex flex-col gap-1 " + (wide ? "md:col-span-2" : "")}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="text-haven-coral"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  step = "1",
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  step?: string;
}) {
  return (
    <Input
      type="number"
      step={step}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") onChange(null);
        else {
          const n = step === "1" ? parseInt(v, 10) : parseFloat(v);
          onChange(Number.isNaN(n) ? null : n);
        }
      }}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-border bg-surface px-2 text-[13px] focus:outline-none focus:shadow-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:shadow-ring"
    />
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
