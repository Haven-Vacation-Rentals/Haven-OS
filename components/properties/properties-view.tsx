"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Rows3,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Table2,
  UserX,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyEditor } from "./property-editor";
import { StatusBadge, TierBadge } from "./property-badges";
import { PropertyTable } from "./property-table";
import { PropertyDirectory } from "./property-directory";
import type {
  Property,
  PropertyFilter,
  PropertyStatus,
  PropertyTier,
} from "@/lib/properties/types";

type ViewMode = "directory" | "cards" | "sheet";

type Facets = {
  regions: string[];
  account_managers: string[];
  airbnb_accounts: string[];
  revenue_managers: string[];
};

export function PropertiesView({
  properties,
  total,
  page,
  pageSize,
  hasMore,
  initialFilters,
  facets,
}: {
  properties: Property[];
  /** Total properties matching the active filters across all pages. */
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  initialFilters?: PropertyFilter;
  facets: Facets;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalCount = total ?? properties.length;
  const currentPage = page ?? 0;
  const effectivePageSize = pageSize ?? Math.max(properties.length, 50);
  const moreAvailable = hasMore ?? false;

  const [view, setView] = useState<ViewMode>("directory");
  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const status = (initialFilters?.status ?? "all") as "all" | PropertyStatus;
  const tier = (initialFilters?.tier ?? "all") as "all" | PropertyTier;
  const region = initialFilters?.region ?? "all";
  const manager = initialFilters?.account_manager ?? "all";
  const airbnb = initialFilters?.airbnb_account ?? "all";
  const [createOpen, setCreateOpen] = useState(false);

  const updateParam = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      let touchedFilter = false;
      for (const [key, val] of Object.entries(patch)) {
        if (key !== "page") touchedFilter = true;
        if (!val || val === "all") next.delete(key);
        else next.set(key, val);
      }
      if (touchedFilter) next.delete("page");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`${pathname}?${next.toString()}` as any);
    },
    [router, pathname, searchParams],
  );

  const setStatus = useCallback(
    (v: "all" | PropertyStatus) => updateParam({ status: v }),
    [updateParam],
  );
  const setTier = useCallback(
    (v: "all" | PropertyTier) => updateParam({ tier: v }),
    [updateParam],
  );
  const setRegion = useCallback(
    (v: string) => updateParam({ region: v }),
    [updateParam],
  );
  const setManager = useCallback(
    (v: string) => updateParam({ account_manager: v }),
    [updateParam],
  );
  const setAirbnb = useCallback(
    (v: string) => updateParam({ airbnb_account: v }),
    [updateParam],
  );

  // Debounced search → URL → server query.
  useEffect(() => {
    const t = setTimeout(() => {
      const initial = initialFilters?.search ?? "";
      if (search !== initial) {
        updateParam({ search: search.trim() || undefined });
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = properties;

  const activeFilters = [
    status !== "all" && {
      key: "status",
      label: `Status: ${status}`,
      clear: () => setStatus("all"),
    },
    tier !== "all" && {
      key: "tier",
      label: `Tier: ${tier}`,
      clear: () => setTier("all"),
    },
    region !== "all" && {
      key: "region",
      label: `Region: ${region}`,
      clear: () => setRegion("all"),
    },
    manager !== "all" && {
      key: "manager",
      label: `AM: ${manager}`,
      clear: () => setManager("all"),
    },
    airbnb !== "all" && {
      key: "airbnb",
      label: `Airbnb: ${airbnb}`,
      clear: () => setAirbnb("all"),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  // Stat tiles use the visible page only — adding a separate aggregated
  // query just for these would double the round-trip cost on every
  // filter change.
  const stats = useMemo(() => {
    const live = filtered.filter((p) => p.status === "live").length;
    const onboarding = filtered.filter((p) => p.status === "onboarding").length;
    const missingManager = filtered.filter(
      (p) => !p.account_manager || !p.revenue_manager,
    ).length;
    return { total: totalCount, live, onboarding, missingManager };
  }, [filtered, totalCount]);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={Home}
          label="Total properties"
          value={stats.total}
          tint="charcoal"
        />
        <StatTile
          icon={Sparkles}
          label="Live"
          value={stats.live}
          tint="emerald"
        />
        <StatTile
          icon={Users}
          label="Onboarding"
          value={stats.onboarding}
          tint="amber"
        />
        <StatTile
          icon={UserX}
          label="Missing manager"
          value={stats.missingManager}
          tint="coral"
          subtle="On this page"
        />
      </div>

      {/* Search + controls */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, address, manager, or region…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <div
              className="flex items-center gap-0.5 rounded-md border border-border bg-surface-alt p-0.5"
              role="tablist"
              aria-label="View"
            >
              <ViewToggle
                active={view === "directory"}
                onClick={() => setView("directory")}
                icon={Rows3}
                label="Directory"
              />
              <ViewToggle
                active={view === "cards"}
                onClick={() => setView("cards")}
                icon={LayoutGrid}
                label="Cards"
              />
              <ViewToggle
                active={view === "sheet"}
                onClick={() => setView("sheet")}
                icon={Table2}
                label="Sheet"
              />
            </div>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add property</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
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
              { value: "all", label: "All account managers" },
              ...facets.account_managers.map((m) => ({ value: m, label: m })),
            ]}
          />
          <FilterSelect
            value={airbnb}
            onChange={setAirbnb}
            options={[
              { value: "all", label: "All Airbnb accounts" },
              ...facets.airbnb_accounts.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
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
      ) : view === "cards" ? (
        <PropertyGrid properties={filtered} />
      ) : view === "sheet" ? (
        <PropertyTable properties={filtered} facets={facets} />
      ) : (
        <PropertyDirectory properties={filtered} />
      )}

      {/* Pagination */}
      {totalCount > effectivePageSize ? (
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            {(() => {
              const start = currentPage * effectivePageSize + 1;
              const end = Math.min(
                start + filtered.length - 1,
                totalCount,
              );
              return `${start.toLocaleString()}–${end.toLocaleString()} of ${totalCount.toLocaleString()}`;
            })()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-[12px]"
              disabled={currentPage === 0}
              onClick={() =>
                updateParam({
                  page:
                    currentPage <= 1 ? undefined : String(currentPage - 1),
                })
              }
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-[12px]"
              disabled={!moreAvailable}
              onClick={() => updateParam({ page: String(currentPage + 1) })}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      <PropertyEditor open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  subtle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tint: "charcoal" | "emerald" | "amber" | "coral";
  subtle?: string;
}) {
  const tints = {
    charcoal: "bg-haven-sage text-haven-charcoal dark:bg-haven-charcoal/30 dark:text-foreground",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    coral: "bg-accent-soft text-accent",
  };
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full",
          tints[tint],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="font-heading text-xl font-bold tabular-nums leading-none">
          {value.toLocaleString()}
        </div>
        <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {subtle ? (
          <div className="text-[10px] text-muted-foreground/70">{subtle}</div>
        ) : null}
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
      role="tab"
      aria-selected={active}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-semibold transition-colors",
        active
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden md:inline">{label}</span>
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
// Cards view
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
      {/* Header — name + address. Status/tier moved BELOW so chips never
          overlap a long property name. */}
      <div className="min-w-0">
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

      {/* Chips row — flex-wrap so they reflow rather than collide. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={property.status} />
        {property.tier ? <TierBadge tier={property.tier} /> : null}
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
