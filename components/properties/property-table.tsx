"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateProperty } from "@/lib/properties/actions";
import { StatusBadge, TierBadge } from "./property-badges";
import type {
  Property,
  PropertyStatus,
  PropertyTier,
} from "@/lib/properties/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Facets = {
  regions: string[];
  account_managers: string[];
  airbnb_accounts: string[];
  revenue_managers: string[];
};

type ColDef = {
  key: keyof Property;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: { value: string; label: string }[];
  align?: "center";
  minW?: string;
};

/* ------------------------------------------------------------------ */
/*  Static option lists                                                */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: "live", label: "Live" },
  { value: "onboarding", label: "Onboarding" },
  { value: "paused", label: "Paused" },
  { value: "offboarding", label: "Offboarding" },
  { value: "offboarded", label: "Offboarded" },
];

const TIER_OPTIONS = [
  { value: "", label: "— None —" },
  { value: "top", label: "Top" },
  { value: "key", label: "Key" },
  { value: "normal", label: "Normal" },
  { value: "junior", label: "Junior" },
  { value: "low", label: "Low" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

const SALES_STATUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "on_the_market", label: "On the Market" },
  { value: "under_contract", label: "Under Contract" },
  { value: "sold", label: "Sold" },
];

/* ------------------------------------------------------------------ */
/*  Build columns from facets                                          */
/* ------------------------------------------------------------------ */

function buildColumns(facets: Facets): ColDef[] {
  const sel = (arr: string[]) => [
    { value: "", label: "— None —" },
    ...arr.map((v) => ({ value: v, label: v })),
  ];

  return [
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS, minW: "110px" },
    { key: "tier", label: "Tier", type: "select", options: TIER_OPTIONS, minW: "90px" },
    { key: "priority", label: "Priority", type: "select", options: PRIORITY_OPTIONS, minW: "95px" },
    { key: "region", label: "Region", type: "select", options: sel(facets.regions), minW: "130px" },
    { key: "account_manager", label: "Acct Manager", type: "select", options: sel(facets.account_managers), minW: "150px" },
    { key: "revenue_manager", label: "Rev Manager", type: "select", options: sel(facets.revenue_managers), minW: "140px" },
    { key: "bedroom_count", label: "Beds", type: "number", align: "center", minW: "60px" },
    { key: "bathroom_count_full", label: "Bath F", type: "number", align: "center", minW: "65px" },
    { key: "bathroom_count_half", label: "Bath H", type: "number", align: "center", minW: "65px" },
    { key: "max_guests", label: "Guests", type: "number", align: "center", minW: "70px" },
    { key: "extra_guest_fee_threshold", label: "Fee Thr", type: "number", align: "center", minW: "70px" },
    { key: "king_beds", label: "King", type: "number", align: "center", minW: "55px" },
    { key: "queen_beds", label: "Queen", type: "number", align: "center", minW: "60px" },
    { key: "full_beds", label: "Full", type: "number", align: "center", minW: "55px" },
    { key: "twin_beds", label: "Twin", type: "number", align: "center", minW: "55px" },
    { key: "kitchen_count", label: "Kitch", type: "number", align: "center", minW: "55px" },
    { key: "indoor_pool_hot_tub", label: "Pool/HT", type: "number", align: "center", minW: "65px" },
    { key: "currently_hosting", label: "Hosting", type: "boolean", align: "center", minW: "70px" },
    { key: "sales_status", label: "Sales", type: "select", options: SALES_STATUS_OPTIONS, minW: "120px" },
    { key: "address", label: "Address", type: "text", minW: "200px" },
    { key: "cleaning_fee", label: "Clean $", type: "number", align: "center", minW: "75px" },
    { key: "cleaner_pay", label: "Pay $", type: "number", align: "center", minW: "70px" },
    { key: "airbnb_account", label: "Airbnb Acct", type: "select", options: sel(facets.airbnb_accounts), minW: "130px" },
    { key: "airbnb_listing_account", label: "Airbnb List", type: "text", minW: "110px" },
    { key: "hostaway_id", label: "Hostaway", type: "text", minW: "95px" },
    { key: "breezeway_id", label: "Breezeway", type: "text", minW: "95px" },
    { key: "listing_link", label: "Listing Link", type: "text", minW: "120px" },
    { key: "lockbox", label: "Lockbox", type: "text", minW: "100px" },
    { key: "key_box_location", label: "Key Box", type: "text", minW: "110px" },
    { key: "master_code", label: "Master Code", type: "text", minW: "100px" },
    { key: "locks_and_codes", label: "Locks/Codes", type: "text", minW: "120px" },
    { key: "wifi_login", label: "WiFi", type: "text", minW: "110px" },
    { key: "thermostat", label: "Thermostat", type: "text", minW: "100px" },
    { key: "cancellation_policy", label: "Cancel Policy", type: "text", minW: "120px" },
    { key: "pay_date", label: "Pay Date", type: "text", minW: "95px" },
    { key: "pest_control_notes", label: "Pest Control", type: "text", minW: "110px" },
    { key: "pool_vendor_notes", label: "Pool Vendor", type: "text", minW: "110px" },
    { key: "lawn_care", label: "Lawn Care", type: "text", minW: "100px" },
    { key: "gas_company", label: "Gas", type: "text", minW: "90px" },
    { key: "water_source", label: "Water", type: "text", minW: "95px" },
    { key: "fireplace", label: "Fireplace", type: "text", minW: "95px" },
    { key: "parking", label: "Parking", type: "text", minW: "95px" },
    { key: "hoa_community", label: "HOA", type: "text", minW: "100px" },
    { key: "offboarding_date", label: "Offboard Date", type: "text", minW: "105px" },
    { key: "platform_links", label: "Platform Links", type: "text", minW: "120px" },
    { key: "notes", label: "Notes", type: "text", minW: "180px" },
  ];
}

/* ------------------------------------------------------------------ */
/*  Dropdown (portal)                                                  */
/* ------------------------------------------------------------------ */

function Dropdown({
  options,
  value,
  onSelect,
  onClose,
  anchor,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  anchor: DOMRect;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const spaceBelow = window.innerHeight - anchor.bottom;
  const flipUp = spaceBelow < 200;
  const top = flipUp ? anchor.top - 4 : anchor.bottom + 4;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[100] max-h-[240px] overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg"
      style={{
        top,
        left: anchor.left,
        minWidth: Math.max(160, anchor.width),
        transform: flipUp ? "translateY(-100%)" : undefined,
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={cn(
            "flex w-full items-center px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-surface-alt",
            opt.value === value && "font-bold text-accent bg-accent-soft/30",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  TextCell                                                           */
/* ------------------------------------------------------------------ */

function TextCell({
  propertyId,
  field,
  value,
  isNumber,
  isMoney,
  align,
}: {
  propertyId: string;
  field: keyof Property;
  value: string | number | null;
  isNumber?: boolean;
  isMoney?: boolean;
  align?: "center";
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function save(raw: string) {
    setEditing(false);
    const parsed: string | number | null = isNumber
      ? raw === ""
        ? null
        : Number(raw)
      : raw.trim() || null;
    if (parsed === value) return;
    setLocalVal(parsed);
    startTransition(async () => {
      await updateProperty(propertyId, { [field]: parsed } as never);
    });
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={isNumber ? "number" : "text"}
        defaultValue={localVal != null ? String(localVal) : ""}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            save((e.target as HTMLInputElement).value);
          if (e.key === "Escape") setEditing(false);
        }}
        className={cn(
          "h-7 w-full rounded border border-accent/40 bg-surface px-1.5 text-[12px] outline-none focus:shadow-ring",
          align === "center" && "text-center",
        )}
      />
    );
  }

  const empty = localVal == null || localVal === "";
  let display: React.ReactNode;
  if (empty) {
    display = <span className="text-muted-foreground/40">—</span>;
  } else if (isMoney) {
    display = `$${localVal}`;
  } else {
    display = String(localVal);
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        "block cursor-pointer truncate rounded px-1.5 py-0.5 transition-colors hover:bg-accent-soft/40",
        isPending && "opacity-50",
        align === "center" && "text-center tabular-nums",
      )}
    >
      {display}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  SelectCell                                                         */
/* ------------------------------------------------------------------ */

function SelectCell({
  propertyId,
  field,
  value,
  options,
  renderDisplay,
}: {
  propertyId: string;
  field: keyof Property;
  value: string | null;
  options: { value: string; label: string }[];
  renderDisplay?: (v: string | null) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const [isPending, startTransition] = useTransition();
  const cellRef = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleClose = useCallback(() => setOpen(false), []);

  function handleOpen() {
    if (cellRef.current) {
      setAnchor(cellRef.current.getBoundingClientRect());
      setOpen(true);
    }
  }

  const handleSelect = useCallback(
    (v: string) => {
      setOpen(false);
      const parsed = v || null;
      if (parsed === localVal) return;
      setLocalVal(parsed);
      startTransition(async () => {
        await updateProperty(propertyId, { [field]: parsed } as never);
      });
    },
    [propertyId, field, localVal],
  );

  let displayNode: React.ReactNode;
  if (renderDisplay) {
    displayNode = renderDisplay(localVal);
  } else if (localVal) {
    const opt = options.find((o) => o.value === localVal);
    displayNode = opt?.label ?? localVal;
  } else {
    displayNode = <span className="text-muted-foreground/40">—</span>;
  }

  return (
    <>
      <span
        ref={cellRef}
        onClick={handleOpen}
        className={cn(
          "block cursor-pointer truncate rounded px-1.5 py-0.5 transition-colors hover:bg-accent-soft/40",
          isPending && "opacity-50",
        )}
      >
        {displayNode}
      </span>
      {open && anchor ? (
        <Dropdown
          options={options}
          value={String(localVal ?? "")}
          onSelect={handleSelect}
          onClose={handleClose}
          anchor={anchor}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  BooleanCell                                                        */
/* ------------------------------------------------------------------ */

function BooleanCell({
  propertyId,
  field,
  value,
}: {
  propertyId: string;
  field: keyof Property;
  value: boolean;
}) {
  const [localVal, setLocalVal] = useState(value);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  function toggle() {
    const next = !localVal;
    setLocalVal(next);
    startTransition(async () => {
      await updateProperty(propertyId, { [field]: next } as never);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "mx-auto flex h-4 w-4 items-center justify-center rounded border transition-colors",
        localVal
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface hover:border-foreground/40",
        isPending && "opacity-50",
      )}
    >
      {localVal ? <Check className="h-3 w-3" /> : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  NameCell (click → detail, double-click → edit)                     */
/* ------------------------------------------------------------------ */

function NameCell({ property }: { property: Property }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function save(raw: string) {
    setEditing(false);
    const val = raw.trim();
    if (!val || val === property.name) return;
    startTransition(async () => {
      await updateProperty(property.id, { name: val });
    });
  }

  if (editing) {
    return (
      <input
        ref={ref}
        defaultValue={property.name}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            save((e.target as HTMLInputElement).value);
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 w-full rounded border border-accent/40 bg-surface px-1.5 text-[13px] font-semibold outline-none focus:shadow-ring"
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5", isPending && "opacity-50")}>
      <Link
        href={`/properties/${property.id}` as never}
        onDoubleClick={(e) => {
          e.preventDefault();
          setEditing(true);
        }}
        className="font-semibold leading-tight hover:text-accent"
        title="Double-click to edit name"
      >
        {property.name}
      </Link>
      {property.address ? (
        <span className="truncate text-[11px] text-muted-foreground">
          {property.address}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PropertyTable                                                      */
/* ------------------------------------------------------------------ */

export function PropertyTable({
  properties,
  facets,
}: {
  properties: Property[];
  facets: Facets;
}) {
  const columns = useMemo(() => buildColumns(facets), [facets]);

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-border bg-surface-alt/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-20 bg-surface-alt/95 backdrop-blur-sm px-3 py-2 text-left min-w-[200px]">
                Property
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-2 py-2 whitespace-nowrap",
                    col.align === "center" ? "text-center" : "text-left",
                  )}
                  style={{ minWidth: col.minW }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {properties.map((p, i) => (
              <tr
                key={p.id}
                className={cn(
                  "group border-b border-border/30 transition-colors hover:bg-surface-alt/30",
                  i === properties.length - 1 && "border-b-0",
                )}
              >
                {/* Sticky name column */}
                <td className="sticky left-0 z-10 bg-surface group-hover:bg-surface-alt/30 px-3 py-1.5 min-w-[200px] transition-colors">
                  <NameCell property={p} />
                </td>

                {/* Editable data columns */}
                {columns.map((col) => {
                  const val = p[col.key];

                  if (col.type === "boolean") {
                    return (
                      <td key={col.key} className="px-2 py-1.5 text-center">
                        <BooleanCell
                          propertyId={p.id}
                          field={col.key}
                          value={!!val}
                        />
                      </td>
                    );
                  }

                  if (col.type === "select") {
                    let renderDisplay:
                      | ((v: string | null) => React.ReactNode)
                      | undefined;
                    if (col.key === "status") {
                      renderDisplay = (v) =>
                        v ? (
                          <StatusBadge status={v as PropertyStatus} />
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        );
                    } else if (col.key === "tier") {
                      renderDisplay = (v) =>
                        v ? (
                          <TierBadge tier={v as PropertyTier} />
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        );
                    }
                    return (
                      <td key={col.key} className="px-2 py-1.5">
                        <SelectCell
                          propertyId={p.id}
                          field={col.key}
                          value={val as string | null}
                          options={col.options!}
                          renderDisplay={renderDisplay}
                        />
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "px-2 py-1.5",
                        col.align === "center" && "text-center",
                      )}
                    >
                      <TextCell
                        propertyId={p.id}
                        field={col.key}
                        value={val as string | number | null}
                        isNumber={col.type === "number"}
                        isMoney={
                          col.key === "cleaning_fee" ||
                          col.key === "cleaner_pay"
                        }
                        align={col.align}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
