-- Haven OS — Properties module (272+ rental units)
--
-- Dedicated schema for property portfolio data. Typed columns (not JSONB)
-- because these fields are core business data, stable, and heavily filtered.
--
-- Run AFTER 0003_space_privacy.sql.

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

do $$ begin
  create type property_status as enum ('live', 'onboarding', 'paused', 'offboarding', 'offboarded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_tier as enum ('top', 'key', 'normal', 'junior', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_priority as enum ('high', 'normal', 'low', 'none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_sales_status as enum ('on_the_market', 'under_contract', 'sold', 'none');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- LOOKUP TABLES (for list relationships)
-- ---------------------------------------------------------------------------

create table if not exists public.property_vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  vendor_type text not null,                    -- 'cleaning' | 'pest' | 'pool' | 'lawn' | 'gas'
  contact     text,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_property_vendors_type on public.property_vendors(vendor_type);

alter table public.property_vendors enable row level security;
create policy "vendors read all" on public.property_vendors for select using (true);
create policy "vendors insert auth" on public.property_vendors for insert with check (auth.uid() is not null);
create policy "vendors update auth" on public.property_vendors for update using (auth.uid() is not null);
create policy "vendors delete auth" on public.property_vendors for delete using (auth.uid() is not null);

drop trigger if exists property_vendors_updated_at on public.property_vendors;
create trigger property_vendors_updated_at
  before update on public.property_vendors
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- PROPERTIES
-- ---------------------------------------------------------------------------

create table if not exists public.properties (
  id                        uuid primary key default gen_random_uuid(),

  -- Core identity
  name                      text not null,
  external_id               text unique,                       -- original ClickUp task ID for reference
  status                    property_status not null default 'onboarding',
  tier                      property_tier,
  priority                  property_priority not null default 'none',
  sales_status              property_sales_status not null default 'none',
  currently_hosting         boolean not null default false,

  -- Location
  address                   text,
  address_map               text,                              -- normalized/geocoded address
  region                    text,                              -- Free text for now (e.g. "Gatlinburg", "Knoxville")

  -- Team
  account_manager           text,                              -- Denormalized name (could FK to profiles later)
  revenue_manager           text,

  -- Counts & layout
  bedroom_count             int,
  bathroom_count_full       int,
  bathroom_count_half       int,
  king_beds                 int,
  queen_beds                int,
  full_beds                 int,
  twin_beds                 int,
  kitchen_count             int,
  indoor_pool_hot_tub       int,
  max_guests                int,                               -- Parsed from "Number of Guest" field
  extra_guest_fee_threshold int,                               -- Guest count before extra fee kicks in

  -- Platforms / IDs
  airbnb_account            text,                              -- Main/KnoxStaytion/Superhost/etc
  airbnb_listing_account    text,                              -- Label version (can be multiple)
  hostaway_id               text,
  breezeway_id              text,
  listing_link              text,
  platform_links            text,                              -- Free text block with multiple URLs

  -- Access & codes
  lockbox                   text,
  key_box_location          text,
  master_code               text,
  locks_and_codes           text,                              -- Long freeform
  wifi_login                text,
  thermostat                text,                              -- Ecobee / Nest / Honeywell

  -- Services / vendors (text for now, can migrate to relationships later)
  cleaning_vendor_id        uuid references public.property_vendors(id) on delete set null,
  pest_control_vendor_id    uuid references public.property_vendors(id) on delete set null,
  pool_vendor_id            uuid references public.property_vendors(id) on delete set null,
  cleaning_fee              numeric(10,2),
  cleaner_pay               numeric(10,2),
  pest_control_notes        text,
  pool_vendor_notes         text,
  lawn_care                 text,
  gas_company               text,
  water_source              text,

  -- Miscellaneous
  fireplace                 text,
  parking                   text,
  cancellation_policy       text,                              -- Firm / Strict / Moderate / Flexible
  pay_date                  text,
  hoa_community             text,
  offboarding_date          date,
  notes                     text,                              -- Long-form ClickUp "Task Content"

  -- Audit
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  archived_at               timestamptz
);

create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_tier on public.properties(tier);
create index if not exists idx_properties_region on public.properties(region);
create index if not exists idx_properties_account_manager on public.properties(account_manager);
create index if not exists idx_properties_airbnb_account on public.properties(airbnb_account);
create index if not exists idx_properties_name_search on public.properties using gin (to_tsvector('english', name));

alter table public.properties enable row level security;
create policy "properties read all" on public.properties for select using (true);
create policy "properties insert auth" on public.properties for insert with check (auth.uid() is not null);
create policy "properties update auth" on public.properties for update using (auth.uid() is not null);
create policy "properties delete auth" on public.properties for delete using (auth.uid() is not null);

drop trigger if exists properties_updated_at on public.properties;
create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.tg_set_updated_at();
