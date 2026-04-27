"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Home,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyEditor } from "./property-editor";
import { StatusBadge, TierBadge } from "./property-badges";
import { PropertyTable } from "./property-table";
import type {
  Property,
  PropertyStatus,
  PropertyTier,
} from "@/lib/properties/types";

type ViewMode = "grid" | "list";

export function PropertiesView({
  properties,
  facets,
}: {
  properties: Property[];
  facets: {
    regions: string[];
    account_managers: string[];
    airbnb_accounts: string[];
    revenue_managers: string[];
  };
}) {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | PropertyStatus>("all");
  const [tier, setTier] = useState<"all" | PropertyTier>("all");
  const [region, setRegion] = useState<string>("all");
  const [manager, setManager] = useState<string>("all");
  const [airbnb, setAirbnb] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (tier !== "all" && p.tier !== tier) return false;
      if (region !== "all" && p.region !== region) return false;
      if (manager !== "all" && p.account_manager !== manager) return false;
      if (airbnb !== "all" && p.airbnb_account !== airbnb) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.address?.toLowerCase().includes(q) ?? false) ||
        (p.account_manager?.toLowerCase().includes(q) ?? false) ||
        (p.region?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [properties, search, status, tier, region, manager, airbnb]);

  const activeFilters = [
    status !== "all" && { key: "status", label: `Status: ${status}`, clear: () => setStatus("all") },
    tier !== "all" && { key: "tier", label: `Tier: ${tier}`, clear: () => setTier("all") },
    region !== "all" && { key: "region", label: `Region: ${region}`, clear: () => setRegion("all") },
    manager !== "all" && { key: "manager", label: `AM: ${manager}`, clear: () => setManager("all") },
    airbnb !== "all" && { key: "airbnb", label: `Airbnb: ${airbnb}`, clear: () => setAirbnb("all") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const stats = useMemo(() => {
    const total = filtered.length;
    const live = filtered.filter((p) => p.status === "live").length;
    const onboarding = filtered.filter((p) => p.status === "onboarding").length;
    const bedrooms = filtered.reduce((sum, p) => sum + (p.bedroom_count ?? 0), 0);
    return { total, live, onboarding, bedrooms };
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Home} label="Properties" value={stats.total} tint="accent" />
        <StatCard
          icon={Sparkles}
          label="Live"
          value={stats.live}
          tint="emerald"
        />
        <StatCard
          icon={Home}
          label="Onboarding"
          value={stats.onboarding}
          tint="amber"
        />
        <StatCard
          icon={BedDouble}
          label="Total Bedrooms"
          value={stats.bedrooms}
          tint="sky"
        />
      </div>

      {/* Search + controls */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, address, manager, or region…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface-alt p-0.5">
            <ViewToggle
              active={view === "list"}
              onClick={() => setView("list")}
              icon={ListIcon}
              label="List"
            />
            <ViewToggle
              active={view === "grid"}
              onClick={() => setView("grid")}
              icon={LayoutGrid}
              label="Grid"
            />
          </div>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add property
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "live", label: "Live" },
              { value: "onboarding", label: "Onboarding" },
              { value: "paused", label: "Paused" },
              { value: "offboarding", label: "Offboarding" },
              { value: "offboarded", label: "Offboarded" },
            ]}
          />
          <FilterSelect
            value={tier}
            onChange={(v) => setTier(v as typeof tier)}
            options={[
              { value: "all", label: "All tiers" },
              { value: "top", label: "Top" },
              { value: "key", label: "Key" },
              { value: "normal", label: "Normal" },
              { value: "junior", label: "Junior" },
              { value: "low", label: "Low" },
            ]}
          />
          <FilterSelect
            value={region}
            onChange={setRegion}
            options={[
              { value: "all", label: "All regions" },
              ...facets.regions.map((r) => ({ value: r, label: r })),
            ]}
          />
          <FilterSelect
            value={manager}
            onChange={setManager}
            options={[
              { value: "all", label: "All managers" },
              ...facets.account_managers.map((m) => ({ value: m, label: m })),
            ]}
          />
          <FilterSelect
            value={airbnb}
            onChange={setAirbnb}
            options={[
              { value: "all", label: "All Airbnb accts" },
              ...facets.airbnb_accounts.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={f.clear}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent hover:brightness-95"
              >
                {f.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setStatus("all");
                setTier("all");
                setRegion("all");
                setManager("all");
                setAirbnb("all");
              }}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState onAdd={() => setCreateOpen(true)} />
      ) : view === "grid" ? (
        <PropertyGrid properties={filtered} />
      ) : (
        <PropertyTable properties={filtered} facets={facets} />
      )}

      <PropertyEditor open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tint: "accent" | "emerald" | "amber" | "sky";
}) {
  const tints = {
    accent: "bg-accent-soft text-accent",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <span className={cn("grid h-10 w-10 place-items-center rounded-full", tints[tint])}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-heading text-xl font-bold tabular-nums">
          {value.toLocaleString()}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------------

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-semibold transition-colors",
        active
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Filter select
// ---------------------------------------------------------------------------

function FilterSelect({
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
      className={cn(
        "h-8 rounded-md border border-border bg-surface px-2 text-[12.5px] font-medium",
        "outline-none focus:shadow-ring",
        value !== "all" && "border-accent/40 bg-accent-soft/40 text-accent",
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/30 py-16 text-center">
      <Home className="h-10 w-10 text-muted-foreground/50" />
      <div className="font-heading text-base font-bold">No properties match</div>
      <div className="max-w-xs text-[13px] text-muted-foreground">
        Try clearing some filters or broadening your search — or add a new property.
      </div>
      <Button variant="primary" onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add property
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid view — cards
// ---------------------------------------------------------------------------

function PropertyGrid({ properties }: { properties: Property[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/properties/${property.id}` as never}
      className={cn(
        "group flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card",
        "transition-all hover:-translate-y-px hover:shadow-card-hover",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[15px] font-bold leading-tight group-hover:text-accent">
            {property.name}
          </h3>
          {property.address ? (
            <div className="mt-1 flex items-start gap-1 text-[11.5px] text-muted-foreground">
              <MapPin className="mt-px h-3 w-3 shrink-0" />
              <span className="line-clamp-2">{property.address}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={property.status} />
          <TierBadge tier={property.tier} />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 pt-2.5 text-[12px]">
        {property.bedroom_count != null ? (
          <Stat icon={BedDouble} value={`${property.bedroom_count} BR`} />
        ) : null}
        {property.bathroom_count_full != null ? (
          <Stat
            icon={Bath}
            value={`${property.bathroom_count_full}${
              property.bathroom_count_half ? `.${property.bathroom_count_half}` : ""
            } BA`}
          />
        ) : null}
        {property.max_guests != null ? (
          <Stat icon={Users} value={`${property.max_guests}`} />
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px]">
        <span className="truncate text-muted-foreground">
          {property.region ?? "—"}
        </span>
        <span className="truncate font-semibold text-foreground/70">
          {property.account_manager ?? "Unassigned"}
        </span>
      </div>
    </Link>
  );
}

function Stat({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-foreground/80">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}

