"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  Bath,
  ExternalLink,
  MapPin,
  UserCircle2,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, TierBadge } from "./property-badges";
import type { Property } from "@/lib/properties/types";

/**
 * Operational property directory — a list of cleanly-laid-out rows that
 * replaces the spreadsheet as the default view. Each row gives a clear
 * hierarchy: identity → location → status/tier chips → managers → quick
 * actions. Mobile collapses metadata into a stacked block.
 */
export function PropertyDirectory({ properties }: { properties: Property[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <ul className="divide-y divide-border/60">
        {properties.map((p) => (
          <PropertyRow key={p.id} property={p} />
        ))}
      </ul>
    </div>
  );
}

function PropertyRow({ property }: { property: Property }) {
  const guests = property.max_guests;
  const beds = property.bedroom_count;
  const baths = property.bathroom_count_full;
  const hasListing = !!property.listing_link;

  return (
    <li className="group">
      <Link
        href={`/properties/${property.id}` as never}
        className={cn(
          "flex flex-col gap-3 px-4 py-3.5 transition-colors",
          "md:flex-row md:items-center md:gap-4 md:px-5",
          "hover:bg-accent-soft/30 focus-visible:bg-accent-soft/40 focus-visible:outline-none",
        )}
      >
        {/* ── Identity column: name + address ─────────────────────────── */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg",
              "bg-accent-soft text-accent font-heading font-bold text-sm",
            )}
            aria-hidden
          >
            {initials(property.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h3 className="truncate font-heading text-[15.5px] font-bold leading-tight text-foreground group-hover:text-accent">
                {property.name}
              </h3>
              {property.currently_hosting ? (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                  title="Currently hosting"
                  aria-label="Currently hosting"
                />
              ) : null}
            </div>
            {property.address ? (
              <div className="mt-0.5 flex items-start gap-1 text-[12px] text-muted-foreground">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{property.address}</span>
              </div>
            ) : null}
            {/* Mobile metadata stack */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted-foreground md:hidden">
              {property.region ? <span>{property.region}</span> : null}
              {beds != null ? (
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-3 w-3" />
                  <span className="tabular-nums font-semibold text-foreground/80">
                    {beds}
                  </span>
                </span>
              ) : null}
              {baths != null ? (
                <span className="inline-flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  <span className="tabular-nums font-semibold text-foreground/80">
                    {baths}
                  </span>
                </span>
              ) : null}
              {guests != null ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="tabular-nums font-semibold text-foreground/80">
                    {guests}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Region (desktop) ────────────────────────────────────────── */}
        <div className="hidden w-[140px] shrink-0 md:block">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Region
          </div>
          <div className="mt-0.5 truncate text-[13px] font-medium text-foreground/85">
            {property.region ?? <span className="text-muted-foreground/60">—</span>}
          </div>
        </div>

        {/* ── Capacity (desktop) ──────────────────────────────────────── */}
        <div className="hidden w-[120px] shrink-0 md:block">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Capacity
          </div>
          <div className="mt-0.5 flex items-center gap-2.5 text-[13px] tabular-nums text-foreground/85">
            {beds != null ? (
              <span className="inline-flex items-center gap-1" title={`${beds} bedrooms`}>
                <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                {beds}
              </span>
            ) : null}
            {baths != null ? (
              <span className="inline-flex items-center gap-1" title={`${baths} bathrooms`}>
                <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                {baths}
              </span>
            ) : null}
            {guests != null ? (
              <span className="inline-flex items-center gap-1" title={`Sleeps ${guests}`}>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                {guests}
              </span>
            ) : null}
            {beds == null && baths == null && guests == null ? (
              <span className="text-muted-foreground/60">—</span>
            ) : null}
          </div>
        </div>

        {/* ── Status / tier chips. Reserved column with vertical stacking
            so chips never overlap or collide with adjacent data. ────── */}
        <div className="flex shrink-0 items-center gap-1.5 md:w-[150px] md:flex-col md:items-start md:gap-1">
          <StatusBadge status={property.status} />
          {property.tier ? <TierBadge tier={property.tier} /> : null}
        </div>

        {/* ── Managers (desktop) ──────────────────────────────────────── */}
        <div className="hidden w-[200px] shrink-0 md:block">
          <ManagerLine
            icon={UserCircle2}
            label="Account"
            value={property.account_manager}
          />
          <ManagerLine
            icon={UserCog}
            label="Revenue"
            value={property.revenue_manager}
          />
        </div>

        {/* ── Action affordance ───────────────────────────────────────── */}
        <div className="hidden shrink-0 items-center gap-1 text-muted-foreground md:flex">
          {hasListing ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(property.listing_link!, "_blank", "noopener,noreferrer");
              }}
              className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-alt hover:text-foreground"
              title="Open listing"
              aria-label="Open listing in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          ) : null}
          <span
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground/60 group-hover:text-accent"
            aria-hidden
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}

function ManagerLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] leading-tight">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground/70" />
      <span className="w-[48px] shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {value ? (
        <span className="truncate font-medium text-foreground/85">{value}</span>
      ) : (
        <span className="text-muted-foreground/50">Unassigned</span>
      )}
    </div>
  );
}

function initials(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}
