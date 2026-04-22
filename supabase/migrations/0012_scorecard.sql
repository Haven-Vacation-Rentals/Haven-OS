-- Haven OS — Northstar Scorecard
-- Monthly KPI tracking with archivable months and inline-editable rows.
-- Run AFTER 0011_task_recurrence.sql.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type scorecard_month_status as enum ('active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type scorecard_metric_type as enum ('Total', 'Avg');
exception when duplicate_object then null; end $$;

do $$ begin
  create type scorecard_row_status as enum ('green', 'yellow', 'red');
exception when duplicate_object then null; end $$;

do $$ begin
  create type scorecard_section_variant as enum ('olive', 'blue', 'red');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One record per tracked month (active or archived).
create table if not exists public.scorecard_months (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,                     -- "April 2025"
  year         smallint not null,
  month        smallint not null,                 -- 1-12
  week_labels  text[] not null default array['', '', '', '', '']::text[],
  status       scorecard_month_status not null default 'active',
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- Ordered sections within a month (Evergreen, Sales, etc.).
create table if not exists public.scorecard_sections (
  id           uuid primary key default gen_random_uuid(),
  month_id     uuid not null references public.scorecard_months(id) on delete cascade,
  title        text not null,
  variant      scorecard_section_variant not null default 'red',
  order_index  int not null default 0,
  created_at   timestamptz not null default now()
);

-- Individual metric rows within a section.
create table if not exists public.scorecard_rows (
  id               uuid primary key default gen_random_uuid(),
  section_id       uuid not null references public.scorecard_sections(id) on delete cascade,
  month_id         uuid not null references public.scorecard_months(id) on delete cascade,
  metric           text not null,
  order_index      int not null default 0,
  -- Five weekly slots (W1-W4 + Remainder)
  week1_value      text,
  week1_note       text,
  week2_value      text,
  week2_note       text,
  week3_value      text,
  week3_note       text,
  week4_value      text,
  week4_note       text,
  remainder_value  text,
  remainder_note   text,
  -- Monthly summary columns
  monthly_target   text,
  metric_type      scorecard_metric_type,
  monthly_actual   text,
  -- Status & ownership
  status           scorecard_row_status,
  metric_owner     text,
  metric_source    text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuse the function from 0007 if present)
-- ---------------------------------------------------------------------------

create or replace function public.tg_scorecard_set_updated_at()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.scorecard_rows;
create trigger set_updated_at
  before update on public.scorecard_rows
  for each row execute function public.tg_scorecard_set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists scorecard_months_status_idx
  on public.scorecard_months(status);

create index if not exists scorecard_sections_month_idx
  on public.scorecard_sections(month_id, order_index);

create index if not exists scorecard_rows_section_idx
  on public.scorecard_rows(section_id, order_index);

create index if not exists scorecard_rows_month_idx
  on public.scorecard_rows(month_id);

-- ---------------------------------------------------------------------------
-- Row-level security (all authenticated users share org data)
-- ---------------------------------------------------------------------------

alter table public.scorecard_months  enable row level security;
alter table public.scorecard_sections enable row level security;
alter table public.scorecard_rows     enable row level security;

drop policy if exists "auth_all" on public.scorecard_months;
drop policy if exists "auth_all" on public.scorecard_sections;
drop policy if exists "auth_all" on public.scorecard_rows;

create policy "auth_all" on public.scorecard_months
  for all to authenticated using (true) with check (true);

create policy "auth_all" on public.scorecard_sections
  for all to authenticated using (true) with check (true);

create policy "auth_all" on public.scorecard_rows
  for all to authenticated using (true) with check (true);
