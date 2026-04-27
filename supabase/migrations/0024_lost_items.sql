-- Haven OS — Lost / Left-Behind Items tracker
--
-- Operations module: when a guest leaves something at a property, the
-- Haven team (or an external agent like a cleaning vendor) creates a
-- case here. The case moves through a kanban-style pipeline:
--
--   intake → pending_pickup → picked_up → in_transit → delivered → completed
--
-- Cases can also enter a `cancelled` state (guest never claimed,
-- duplicate, etc.).
--
-- Two creation paths must work:
--   1. Internal form  (signed-in Haven team, server action, RLS-aware)
--   2. External API   (`POST /api/lost-items`, x-haven-api-key header,
--                      writes via service-role client — bypasses RLS)
--
-- A future goal is bi-directional sync with an external partner DB.
-- We bake that in now via:
--   - `source`              — where the case originated
--   - `external_source`     — partner name / system identifier
--   - `external_id`         — partner's stable id (unique per source)
--   - `case_number`         — short human id we hand back to partners
--
-- Run AFTER 0023_work_access_controls.sql.

-- ---------------------------------------------------------------------------
-- 1. Reusable updated_at trigger (re-use existing if present, otherwise
--    create a local one to avoid coupling to other modules).
-- ---------------------------------------------------------------------------

create or replace function public.tg_lost_items_set_updated_at()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Sequence powering the human-readable case number (LI-000123)
-- ---------------------------------------------------------------------------

create sequence if not exists public.lost_items_case_seq start 1000 increment 1;

-- ---------------------------------------------------------------------------
-- 3. lost_items — the case table
-- ---------------------------------------------------------------------------

create table if not exists public.lost_items (
  id              uuid primary key default gen_random_uuid(),

  -- Stable, human-shareable identifier ("LI-001023"). Generated in BEFORE
  -- INSERT trigger so partners can rely on it when they sync back.
  case_number     text unique,

  -- Pipeline ----------------------------------------------------------
  status          text not null default 'intake'
                  check (status in (
                    'intake',
                    'pending_pickup',
                    'picked_up',
                    'in_transit',
                    'delivered',
                    'completed',
                    'cancelled'
                  )),
  priority        text not null default 'normal'
                  check (priority in ('urgent', 'high', 'normal', 'low')),

  -- Item ---------------------------------------------------------------
  item_description text not null,
  item_category    text,            -- e.g. electronics, clothing, jewelry
  found_location   text,            -- e.g. "left bedroom nightstand"
  photo_urls       text[] not null default '{}',  -- public storage URLs

  -- Property -----------------------------------------------------------
  property_id      uuid references public.properties(id) on delete set null,
  property_name    text,            -- denormalised for API/external creates
                                    -- where caller may not know our id

  -- Guest --------------------------------------------------------------
  guest_name       text,
  guest_email      text,
  guest_phone      text,
  reservation_ref  text,            -- Hostaway/Airbnb confirmation code, etc.

  -- Logistics ----------------------------------------------------------
  cleaning_vendor       text,        -- vendor name (free text — we don't
                                     -- always have a structured record)
  pickup_scheduled_at   timestamptz,
  pickup_completed_at   timestamptz,
  return_method         text         -- shipped|guest_pickup|in_person|other
                        check (return_method in ('shipped','guest_pickup','in_person','other')
                               or return_method is null),
  shipping_carrier      text,
  shipping_tracking     text,
  shipped_at            timestamptz,
  delivered_at          timestamptz,
  completed_at          timestamptz,

  -- Ownership ----------------------------------------------------------
  assigned_to       uuid references public.profiles(id) on delete set null,
  follow_up_date    date,

  -- Source tracking (designed for future external sync) ---------------
  source            text not null default 'internal_form'
                    check (source in (
                      'internal_form',
                      'external_agent',
                      'api',
                      'cleaning_vendor',
                      'guest_email',
                      'other'
                    )),
  external_source   text,         -- partner system label, e.g. "breezeway"
  external_id       text,         -- partner's stable id within that system
  external_url      text,         -- partner deep-link

  -- Notes / freeform --------------------------------------------------
  notes            text,

  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- A given external system shouldn't be able to create the same case
-- twice (idempotent partner upserts).
create unique index if not exists lost_items_external_unique
  on public.lost_items (external_source, external_id)
  where external_source is not null and external_id is not null;

create index if not exists lost_items_status_idx       on public.lost_items (status);
create index if not exists lost_items_priority_idx     on public.lost_items (priority);
create index if not exists lost_items_property_idx     on public.lost_items (property_id);
create index if not exists lost_items_assigned_idx     on public.lost_items (assigned_to);
create index if not exists lost_items_created_idx      on public.lost_items (created_at desc);

-- ---------------------------------------------------------------------------
-- 4. case_number generator + updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.tg_lost_items_assign_case_number()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if new.case_number is null then
    new.case_number := 'LI-' || lpad(nextval('public.lost_items_case_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists assign_case_number on public.lost_items;
create trigger assign_case_number
  before insert on public.lost_items
  for each row execute function public.tg_lost_items_assign_case_number();

drop trigger if exists set_updated_at on public.lost_items;
create trigger set_updated_at
  before update on public.lost_items
  for each row execute function public.tg_lost_items_set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. lost_item_events — append-only timeline (status changes, comments)
-- ---------------------------------------------------------------------------

create table if not exists public.lost_item_events (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.lost_items(id) on delete cascade,
  event_type  text not null
              check (event_type in ('status_change', 'comment', 'assignment',
                                    'created', 'updated')),
  body        text,
  from_value  text,
  to_value    text,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_label text,                 -- "external:breezeway", "Sarah K", etc.
  created_at  timestamptz not null default now()
);

create index if not exists lost_item_events_case_idx
  on public.lost_item_events (case_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. RLS — any signed-in Haven user can read + write. The external API
--    path uses the service-role client, which bypasses RLS by design.
--    Coarser than HR/employee scoping is intentional: this is operations
--    data the whole team coordinates on.
-- ---------------------------------------------------------------------------

alter table public.lost_items       enable row level security;
alter table public.lost_item_events enable row level security;

drop policy if exists "auth_read"  on public.lost_items;
drop policy if exists "auth_write" on public.lost_items;
drop policy if exists "auth_read"  on public.lost_item_events;
drop policy if exists "auth_write" on public.lost_item_events;

create policy "auth_read" on public.lost_items
  for select to authenticated using (true);

create policy "auth_write" on public.lost_items
  for all to authenticated using (true) with check (true);

create policy "auth_read" on public.lost_item_events
  for select to authenticated using (true);

create policy "auth_write" on public.lost_item_events
  for all to authenticated using (true) with check (true);
