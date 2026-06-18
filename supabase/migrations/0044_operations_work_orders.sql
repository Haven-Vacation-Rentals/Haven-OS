-- Haven OS — Operations Costs: daily work-order profitability tracker
--
-- Each row is ONE completed work order. It records who did the work
-- (maintenance tech or runner), what was charged to the client/owner
-- (revenue), and what the worker is paid for it (labor cost). Profit
-- per work order is a generated column = amount_charged - amount_paid.
--
-- The dashboard at /operations/costs rolls these up by day and by
-- employee so the team can see real-time profit per employee, and
-- filter history by maintenance tech or runner.
--
-- Primary ingestion path: an AI agent that has access to the
-- field-service data runs a skill / MCP tool (`upload_work_order_costs`)
-- and batch-upserts a day's completed work orders. A manual "Add work
-- order" path also exists in the UI.
--
-- Two write paths must work (mirrors lost_items):
--   1. Internal  (signed-in Haven team / Haven Assistant skill, RLS-aware)
--   2. External  (MCP tool / PAT REST, service-role client — bypasses RLS)
--
-- Idempotent upserts: an external system supplies `external_ref` (its own
-- stable work-order id) so re-running an upload updates the row in place
-- rather than creating duplicates.
--
-- Run AFTER 0043_hr_compensation_fixed_deal_payouts.sql.

-- ---------------------------------------------------------------------------
-- 1. updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.tg_operations_work_orders_set_updated_at()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. operations_work_orders — one row per completed work order
-- ---------------------------------------------------------------------------

create table if not exists public.operations_work_orders (
  id                uuid primary key default gen_random_uuid(),

  -- The business day this work order is counted against. Drives the daily
  -- dashboard + history. Defaults to today if the caller omits it.
  work_date         date not null default current_date,

  -- Who did the work --------------------------------------------------
  employee_name     text not null,
  employee_role     text not null default 'maintenance_tech'
                    check (employee_role in ('maintenance_tech', 'runner', 'other')),
  -- Optional link to a Haven profile (most agent uploads only know names).
  employee_id       uuid references public.profiles(id) on delete set null,

  -- What the work order was -------------------------------------------
  title             text,            -- short label, e.g. "HVAC filter swap"
  description       text,
  property_id       uuid references public.properties(id) on delete set null,
  property_name     text,            -- denormalised for agent uploads

  -- Money -------------------------------------------------------------
  -- amount_charged: revenue billed to the client/owner.
  -- amount_paid:    what the worker is paid for it (labor cost).
  -- profit:         generated, always charged - paid.
  amount_charged    numeric(12,2) not null default 0 check (amount_charged >= 0),
  amount_paid       numeric(12,2) not null default 0 check (amount_paid >= 0),
  profit            numeric(12,2)
                    generated always as (amount_charged - amount_paid) stored,

  -- Source / idempotency ----------------------------------------------
  source            text not null default 'manual'
                    check (source in ('manual', 'agent_upload', 'api', 'other')),
  external_ref      text,            -- caller's stable work-order id

  notes             text,

  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Idempotent upserts: a given external work-order id maps to exactly one row.
create unique index if not exists operations_work_orders_external_ref_unique
  on public.operations_work_orders (external_ref)
  where external_ref is not null;

create index if not exists operations_work_orders_work_date_idx
  on public.operations_work_orders (work_date desc);
create index if not exists operations_work_orders_employee_idx
  on public.operations_work_orders (lower(employee_name));
create index if not exists operations_work_orders_role_idx
  on public.operations_work_orders (employee_role);
create index if not exists operations_work_orders_property_idx
  on public.operations_work_orders (property_id);

drop trigger if exists set_updated_at on public.operations_work_orders;
create trigger set_updated_at
  before update on public.operations_work_orders
  for each row execute function public.tg_operations_work_orders_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. RLS — any signed-in Haven user can read + write. The external agent
--    path uses the service-role client, which bypasses RLS by design.
--    Coarse on purpose: this is operations data the team coordinates on.
-- ---------------------------------------------------------------------------

alter table public.operations_work_orders enable row level security;

drop policy if exists "auth_read"  on public.operations_work_orders;
drop policy if exists "auth_write" on public.operations_work_orders;

create policy "auth_read" on public.operations_work_orders
  for select to authenticated using (true);

create policy "auth_write" on public.operations_work_orders
  for all to authenticated using (true) with check (true);
