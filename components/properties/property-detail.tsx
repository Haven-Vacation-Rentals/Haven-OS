"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Calendar,
  Clipboard,
  ClipboardCheck,
  DoorOpen,
  ExternalLink,
  Flame,
  Home,
  Key,
  MapPin,
  Pencil,
  Snowflake,
  Sparkles,
  UserRound,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge, TierBadge } from "./property-badges";
import { updateProperty } from "@/lib/properties/actions";
import type { Property } from "@/lib/properties/types";

export function PropertyDetail({ property: initial }: { property: Property }) {
  const [property, setProperty] = useState(initial);
  const [pending, start] = useTransition();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(property.notes ?? "");

  function save<K extends keyof Property>(field: K, value: Property[K]) {
    setProperty((p) => ({ ...p, [field]: value }));
    start(async () => {
      await updateProperty(property.id, { [field]: value } as Partial<Property>);
    });
  }

  const mapHref = property.address_map
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address_map)}`
    : property.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div className="flex flex-col gap-3">
        <Link
          href={"/properties" as never}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Properties
        </Link>

        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={property.status} />
              <TierBadge tier={property.tier} />
              {property.currently_hosting ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Sparkles className="h-3 w-3" /> Hosting
                </span>
              ) : null}
              {property.region ? (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {property.region}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 font-heading text-display-3 font-bold leading-tight tracking-tight">
              {property.name}
            </h1>
            {property.address ? (
              <a
                href={mapHref ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-start gap-1.5 text-[13.5px] text-muted-foreground hover:text-accent"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{property.address}</span>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
              </a>
            ) : null}
          </div>

          {/* Quick stats */}
          <div className="grid shrink-0 grid-cols-4 gap-2 text-center md:grid-cols-4">
            <QuickStat
              icon={BedDouble}
              label="Beds"
              value={property.bedroom_count}
            />
            <QuickStat
              icon={Bath}
              label="Baths"
              value={
                property.bathroom_count_full != null
                  ? `${property.bathroom_count_full}${
                      property.bathroom_count_half
                        ? `.${property.bathroom_count_half}`
                        : ""
                    }`
                  : null
              }
            />
            <QuickStat icon={Users} label="Guests" value={property.max_guests} />
            <QuickStat
              icon={UserRound}
              label="Manager"
              value={property.account_manager?.split(" ")[0] ?? null}
              small
            />
          </div>
        </div>
      </div>

      {/* Body — 2-col layout on wide screens */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Sleeping arrangements */}
          <Section title="Sleeping Arrangements" icon={BedDouble}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Counter label="King Beds" value={property.king_beds} />
              <Counter label="Queen Beds" value={property.queen_beds} />
              <Counter label="Full/Double" value={property.full_beds} />
              <Counter label="Twin Beds" value={property.twin_beds} />
            </div>
          </Section>

          {/* Access & codes */}
          <Section title="Access & Codes" icon={Key}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CopyField label="Lockbox" value={property.lockbox} />
              <CopyField label="Master Code" value={property.master_code} />
              <CopyField
                label="Key Box Location"
                value={property.key_box_location}
              />
              <Field
                label="Thermostat"
                value={property.thermostat}
                icon={Snowflake}
              />
            </div>
            {property.locks_and_codes ? (
              <Field
                label="Locks + Codes"
                value={property.locks_and_codes}
                multiline
              />
            ) : null}
            {property.wifi_login ? (
              <Field
                label="Wi-Fi"
                value={property.wifi_login}
                icon={Wifi}
                multiline
              />
            ) : null}
          </Section>

          {/* Property features */}
          <Section title="Property Features" icon={Home}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Kitchens"
                value={property.kitchen_count?.toString()}
              />
              <Field
                label="Indoor Pool / Hot Tub"
                value={property.indoor_pool_hot_tub?.toString()}
                icon={Waves}
              />
              <Field
                label="Fireplace"
                value={property.fireplace}
                icon={Flame}
                multiline
              />
              <Field
                label="Parking / Driveway"
                value={property.parking}
                icon={DoorOpen}
                multiline
              />
              <Field label="Water Source" value={property.water_source} />
              <Field label="Gas Company" value={property.gas_company} />
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes" icon={Pencil}>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={8}
                  className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:shadow-ring"
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      save("notes", notesDraft || null);
                      setEditingNotes(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotesDraft(property.notes ?? "");
                      setEditingNotes(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : property.notes ? (
              <div className="group relative">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                  {property.notes}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingNotes(true)}
                  className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingNotes(true)}
                className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-[13px] text-muted-foreground hover:border-accent/50 hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                Add notes…
              </button>
            )}
          </Section>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-4">
          {/* Team */}
          <Section title="Team" icon={UserRound}>
            <div className="space-y-2.5">
              <TeamRow label="Account Manager" name={property.account_manager} />
              <TeamRow label="Revenue Manager" name={property.revenue_manager} />
              <TeamRow label="Cleaning" name={property.cleaning_vendor_id ? "Assigned" : null} />
              <TeamRow
                label="Lawn Care"
                name={property.lawn_care}
              />
              <TeamRow
                label="Pest Control"
                name={property.pest_control_notes}
              />
              <TeamRow label="Pool Vendor" name={property.pool_vendor_notes} />
            </div>
          </Section>

          {/* Listings */}
          <Section title="Listings & IDs" icon={ExternalLink}>
            <div className="space-y-2.5">
              <Field
                label="Airbnb Account"
                value={property.airbnb_account}
                compact
              />
              <Field
                label="Listing Account"
                value={property.airbnb_listing_account}
                compact
              />
              <Field
                label="Hostaway ID"
                value={property.hostaway_id}
                compact
                mono
              />
              <Field
                label="Breezeway ID"
                value={property.breezeway_id}
                compact
                mono
              />
              {property.listing_link ? (
                <a
                  href={property.listing_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open listing
                </a>
              ) : null}
              {property.platform_links ? (
                <details className="rounded border border-border bg-surface-alt/30 p-2">
                  <summary className="cursor-pointer text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    Platform links
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] text-foreground/80">
                    {property.platform_links}
                  </pre>
                </details>
              ) : null}
            </div>
          </Section>

          {/* Business */}
          <Section title="Business" icon={Calendar}>
            <div className="space-y-2.5">
              <Field
                label="Cancellation Policy"
                value={property.cancellation_policy}
                compact
              />
              <Field label="Pay Date" value={property.pay_date} compact />
              <Field
                label="Max Guests"
                value={
                  property.max_guests != null
                    ? `${property.max_guests}${
                        property.extra_guest_fee_threshold
                          ? ` (fee after ${property.extra_guest_fee_threshold})`
                          : ""
                      }`
                    : null
                }
                compact
              />
              <Field
                label="Cleaning Fee"
                value={
                  property.cleaning_fee != null
                    ? `$${property.cleaning_fee.toLocaleString()}`
                    : null
                }
                compact
              />
              <Field
                label="Cleaner Pay"
                value={
                  property.cleaner_pay != null
                    ? `$${property.cleaner_pay.toLocaleString()}`
                    : null
                }
                compact
              />
              <Field
                label="HOA / Community"
                value={property.hoa_community}
                compact
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick stat (header)
// ---------------------------------------------------------------------------

function QuickStat({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | null;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md bg-surface-alt/50 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div
        className={cn(
          "font-heading font-bold leading-none",
          small ? "text-[13px]" : "text-[18px]",
        )}
      >
        {value ?? "—"}
      </div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Counter chip
// ---------------------------------------------------------------------------

function Counter({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-surface-alt/40 px-3 py-2">
      <span className="text-[12px] font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="font-heading text-[16px] font-bold tabular-nums">
        {value ?? "—"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field (label + value)
// ---------------------------------------------------------------------------

function Field({
  label,
  value,
  icon: Icon,
  multiline,
  compact,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
  multiline?: boolean;
  compact?: boolean;
  mono?: boolean;
}) {
  if (!value) {
    return (
      <div className={cn(compact ? "flex items-center justify-between gap-2" : "space-y-1")}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-[12.5px] text-muted-foreground/40">—</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "truncate text-[12.5px] font-medium",
            mono && "font-mono",
          )}
          title={value}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon className="h-3 w-3 text-muted-foreground" /> : null}
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "rounded bg-surface-alt/40 px-2.5 py-1.5 text-[12.5px] text-foreground/90",
          multiline && "whitespace-pre-wrap leading-relaxed",
          mono && "font-mono",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CopyField — value with copy-to-clipboard button
// ---------------------------------------------------------------------------

function CopyField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!value) {
    return (
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="mt-1 rounded bg-surface-alt/40 px-2.5 py-1.5 text-[12.5px] text-muted-foreground/40">
          —
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={copy}
        className="mt-1 flex w-full items-center gap-2 rounded bg-surface-alt/40 px-2.5 py-1.5 text-left font-mono text-[12.5px] hover:bg-surface-alt"
      >
        <span className="flex-1 truncate">{value}</span>
        {copied ? (
          <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team row
// ---------------------------------------------------------------------------

function TeamRow({ label, name }: { label: string; name: string | null }) {
  const initial = (name ?? "?")[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
        {name ? initial : "—"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-[12.5px] font-semibold">
          {name ?? "Unassigned"}
        </div>
      </div>
    </div>
  );
}
