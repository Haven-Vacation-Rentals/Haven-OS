#!/usr/bin/env python3
"""Generate 0005_seed_properties.sql from the ClickUp CSV export."""

import csv
import re
import sys
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent.parent / (
    "2026-04-16T15_26_31.448Z Haven Workspace - Company Hub - Property Detail Master.csv"
)
OUT = Path(__file__).resolve().parent.parent / "supabase" / "migrations" / "0005_seed_properties.sql"


def sql_escape(v):
    """Escape a value for inline SQL (PostgreSQL E'...' literals)."""
    if v is None:
        return "NULL"
    s = str(v)
    if not s.strip() or s.strip() == "[]":
        return "NULL"
    # Use E'' syntax for safer escaping
    s = s.replace("\\", "\\\\").replace("'", "''")
    # Normalize newlines
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    # Strip wrapping brackets (ClickUp array notation)
    stripped = s.strip()
    if stripped.startswith("[") and stripped.endswith("]"):
        inner = stripped[1:-1].strip()
        if inner:
            s = inner
    return "'" + s + "'"


def parse_int(v):
    if not v or not str(v).strip():
        return "NULL"
    s = str(v).strip()
    # Sometimes value is "10 (6)" or "3 bedroom"
    m = re.match(r"^-?\d+", s)
    if m:
        return m.group(0)
    return "NULL"


def parse_number(v):
    if not v or not str(v).strip():
        return "NULL"
    s = str(v).strip().replace("$", "").replace(",", "")
    m = re.match(r"^-?\d+(\.\d+)?", s)
    if m:
        return m.group(0)
    return "NULL"


def parse_bool(v):
    if not v:
        return "false"
    s = str(v).strip().lower()
    if s in ("true", "yes", "1", "checked"):
        return "true"
    return "false"


def parse_date(v):
    """Parse 'Friday, April 10th 2026, 4:27:19 pm -04:00' style → ISO date."""
    if not v or not str(v).strip():
        return "NULL"
    from datetime import datetime

    s = str(v).strip()
    # Remove ordinal suffixes (st, nd, rd, th) from day numbers
    s = re.sub(r"(\d+)(st|nd|rd|th)", r"\1", s)
    # Try multiple formats
    for fmt in (
        "%A, %B %d %Y, %I:%M:%S %p %z",
        "%A, %B %d %Y, %I:%M:%S %p",
        "%Y-%m-%d",
        "%m/%d/%Y",
    ):
        try:
            dt = datetime.strptime(s, fmt)
            return "'" + dt.strftime("%Y-%m-%d") + "'"
        except ValueError:
            pass
    return "NULL"


def map_status(v):
    s = (v or "").strip().lower()
    if s in ("live", "onboarding", "paused", "offboarding", "offboarded"):
        return "'" + s + "'"
    return "'onboarding'"


def map_tier(v):
    """'[Key]' → 'key'; empty → NULL"""
    if not v:
        return "NULL"
    s = v.strip("[] ").strip().lower()
    if s in ("top", "key", "normal", "junior", "low"):
        return "'" + s + "'"
    return "NULL"


def map_priority(v):
    s = (v or "").strip().lower()
    if s in ("high", "normal", "low", "none"):
        return "'" + s + "'"
    return "'none'"


def map_sales_status(v):
    if not v:
        return "'none'"
    s = v.strip("[] ").strip().lower()
    mapping = {
        "on the market": "'on_the_market'",
        "under contract": "'under_contract'",
        "sold": "'sold'",
    }
    return mapping.get(s, "'none'")


def strip_brackets(v):
    if not v:
        return None
    s = v.strip()
    if s.startswith("[") and s.endswith("]"):
        s = s[1:-1].strip()
    return s or None


def parse_guest_fee(v):
    """'10 (6)' → (10, 6);  '8' → (8, None); '' → (None, None)"""
    if not v:
        return (None, None)
    s = str(v).strip()
    m = re.match(r"(\d+)\s*\((\d+)\)", s)
    if m:
        return (int(m.group(1)), int(m.group(2)))
    m = re.match(r"(\d+)", s)
    if m:
        return (int(m.group(1)), None)
    return (None, None)


def main():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    sql = []
    sql.append("-- Auto-generated seed data — do not hand-edit.")
    sql.append("-- Re-run scripts/seed_properties.py to regenerate.")
    sql.append("")
    sql.append("-- Wipe existing properties to make this migration idempotent.")
    sql.append("truncate table public.properties restart identity cascade;")
    sql.append("")
    sql.append("insert into public.properties (")
    cols = [
        "external_id", "name", "status", "tier", "priority", "sales_status",
        "currently_hosting",
        "address", "address_map", "region",
        "account_manager", "revenue_manager",
        "bedroom_count", "bathroom_count_full", "bathroom_count_half",
        "king_beds", "queen_beds", "full_beds", "twin_beds",
        "kitchen_count", "indoor_pool_hot_tub", "max_guests", "extra_guest_fee_threshold",
        "airbnb_account", "airbnb_listing_account",
        "hostaway_id", "breezeway_id", "listing_link", "platform_links",
        "lockbox", "key_box_location", "master_code", "locks_and_codes",
        "wifi_login", "thermostat",
        "cleaning_fee", "cleaner_pay",
        "pest_control_notes", "pool_vendor_notes", "lawn_care", "gas_company",
        "water_source",
        "fireplace", "parking", "cancellation_policy", "pay_date",
        "hoa_community", "notes",
    ]
    sql.append("  " + ",\n  ".join(cols))
    sql.append(") values")

    values = []
    for r in rows:
        max_guests, fee_threshold = parse_guest_fee(r.get("Number of Guest (Extra Guest Fee_) (short text)"))
        region = strip_brackets(r.get("Region (labels)"))
        airbnb_listing = strip_brackets(r.get("Airbnb Account (labels)"))

        parts = [
            sql_escape(r.get("Task ID")),
            sql_escape(r.get("Task Name")),
            map_status(r.get("Status")),
            map_tier(r.get("Property Tier (labels)")),
            map_priority(r.get("Priority")),
            map_sales_status(r.get("Property Sales Status (labels)")),
            parse_bool(r.get("Currently Hosting (checkbox)")),
            sql_escape(r.get("Address (short text)")),
            sql_escape(r.get("Address for Map (location)")),
            sql_escape(region),
            sql_escape(r.get("Account Manager (drop down)")),
            sql_escape(r.get("Revenue Manager (drop down)")),
            parse_int(r.get("Bedroom Count (number)")),
            parse_int(r.get("Number of Full Bathrooms (number)")),
            parse_int(r.get("Number of Half Bathrooms (number)")),
            parse_int(r.get("King Beds (number)")),
            parse_int(r.get("Queen Beds (number)")),
            parse_int(r.get("Full/Double Beds (number)")),
            parse_int(r.get("Twin Beds (number)")),
            parse_int(r.get("Kitchen/Kitchenette (number)")),
            parse_int(r.get("Indoor Pool/Hot Tub (number)")),
            str(max_guests) if max_guests is not None else "NULL",
            str(fee_threshold) if fee_threshold is not None else "NULL",
            sql_escape(r.get("Airbnb Account  (drop down)")),
            sql_escape(airbnb_listing),
            sql_escape(r.get("Hostaway ID (short text)")),
            sql_escape(r.get("Breezeway ID (short text)")),
            sql_escape(r.get("Listing Link (url)")),
            sql_escape(r.get("Platform Links (short text)")),
            sql_escape(r.get("Lockbox (short text)")),
            sql_escape(r.get("Key Box Location/Number (short text)")),
            sql_escape(r.get("Master Code (short text)")),
            sql_escape(r.get("Locks + Codes: (short text)")),
            sql_escape(r.get("Wifi Log In (short text)")),
            sql_escape(r.get("Thermostat (drop down)")),
            parse_number(r.get("Cleaning Fee (currency)")),
            parse_number(r.get("Cleaner Pay (currency)")),
            sql_escape(r.get("Pest Control (short text)")),
            sql_escape(r.get("Pool Vendor (short text)")),
            sql_escape(r.get("Lawn Care (drop down)")),
            sql_escape(r.get("Gas Company (drop down)")),
            sql_escape(r.get("Water source (short text)")),
            sql_escape(r.get("Fireplace (text)")),
            sql_escape(r.get("Parking/Driveway (text)")),
            sql_escape(r.get("Cancellation Policy (drop down)")),
            sql_escape(r.get("Pay date (short text)")),
            sql_escape(r.get("HOA/Community (list relationship)")),
            sql_escape(r.get("Task Content")),
        ]
        # Use E'' prefix for any literal containing a backslash or control chars
        values.append("(" + ", ".join(parts) + ")")

    sql.append(",\n".join(values) + ";")
    sql.append("")

    OUT.write_text("\n".join(sql), encoding="utf-8")
    print(f"Wrote {OUT} ({len(values)} properties)")


if __name__ == "__main__":
    sys.exit(main())
