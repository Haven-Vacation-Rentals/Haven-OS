-- Haven OS — HR (private)
-- People directory, performance reviews, issues, hiring funnel, policies & procedures.
-- Gated to members of hr_admins (enforced in server actions).
-- Run AFTER 0013_board.sql.

-- ---------------------------------------------------------------------------
-- Admin whitelist — separate from board_admins
-- ---------------------------------------------------------------------------

create table if not exists public.hr_admins (
  email       text primary key,
  created_at  timestamptz not null default now()
);

-- Seed initial HR admin.
insert into public.hr_admins (email) values
  ('jack@havenvacationrentals.com'),
  ('jack13zoppa@gmail.com')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- People directory
-- ---------------------------------------------------------------------------

create table if not exists public.hr_employees (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text,
  role_title    text,
  department    text,
  start_date    date,
  status        text not null default 'active',   -- active | inactive | terminated
  avatar_url    text,
  notes         text default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_employees_status_idx on public.hr_employees(status);

-- ---------------------------------------------------------------------------
-- Performance reviews
-- ---------------------------------------------------------------------------

create table if not exists public.hr_performance_reviews (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.hr_employees(id) on delete cascade,
  review_date     date not null default current_date,
  reviewer_email  text,
  rating          text,   -- e.g. "exceeds" | "meets" | "below" | free text
  summary         text default '',
  goals           text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists hr_reviews_employee_idx
  on public.hr_performance_reviews(employee_id, review_date desc);

-- ---------------------------------------------------------------------------
-- Issues
-- ---------------------------------------------------------------------------

create table if not exists public.hr_issues (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.hr_employees(id) on delete cascade,
  reported_by     text,
  reported_date   date not null default current_date,
  category        text not null default 'other',  -- performance | behavior | attendance | safety | other
  severity        text not null default 'low',    -- low | medium | high
  title           text not null,
  description     text default '',
  status          text not null default 'open',   -- open | in_progress | resolved
  resolution      text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists hr_issues_employee_idx
  on public.hr_issues(employee_id, reported_date desc);

-- ---------------------------------------------------------------------------
-- Hiring — roles
-- ---------------------------------------------------------------------------

create table if not exists public.hr_roles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  department    text,
  location      text,
  employment_type text,                   -- full_time | part_time | contract | seasonal
  description   text default '',          -- markdown body shown on landing page
  responsibilities text default '',
  perks         text default '',
  status        text not null default 'draft',  -- draft | open | closed
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_roles_status_idx on public.hr_roles(status);

-- ---------------------------------------------------------------------------
-- Hiring — candidates
-- ---------------------------------------------------------------------------

create table if not exists public.hr_candidates (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references public.hr_roles(id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  resume_url    text,
  cover_letter  text default '',
  stage         text not null default 'applied',  -- applied | screen | interview | offer | hired | rejected
  source        text not null default 'manual',   -- public_form | referral | manual
  notes         text default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_candidates_role_idx
  on public.hr_candidates(role_id, stage, created_at desc);

-- ---------------------------------------------------------------------------
-- Policies & Procedures
-- ---------------------------------------------------------------------------

create table if not exists public.hr_docs (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null,           -- 'policy' | 'procedure'
  title         text not null,
  body          text default '',         -- markdown
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_docs_kind_idx on public.hr_docs(kind, updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuse board function if present, else create our own)
-- ---------------------------------------------------------------------------

create or replace function public.tg_hr_set_updated_at()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'hr_employees',
      'hr_performance_reviews',
      'hr_issues',
      'hr_roles',
      'hr_candidates',
      'hr_docs'
    ])
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at
         before update on public.%I
         for each row execute function public.tg_hr_set_updated_at();', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Pattern: everything is authenticated-only EXCEPT:
--   * hr_roles has public select for status='open' (powers /careers)
--   * hr_candidates has public insert (powers the apply form)
-- Server actions enforce the hr_admin check for writes/reads; the DB policy
-- just confirms the caller is signed in, matching the board pattern.

alter table public.hr_admins             enable row level security;
alter table public.hr_employees          enable row level security;
alter table public.hr_performance_reviews enable row level security;
alter table public.hr_issues             enable row level security;
alter table public.hr_roles              enable row level security;
alter table public.hr_candidates         enable row level security;
alter table public.hr_docs               enable row level security;

-- Drop any existing policies so this migration is idempotent.
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'hr_admins','hr_employees','hr_performance_reviews',
        'hr_issues','hr_roles','hr_candidates','hr_docs'
      )
  loop
    execute format('drop policy %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end;
$$;

-- Authenticated read/write for all HR tables. The real gating is in
-- server actions (requireHrAdmin).
create policy "auth_read" on public.hr_admins            for select to authenticated using (true);
create policy "auth_write" on public.hr_admins           for all    to authenticated using (true) with check (true);

create policy "auth_read" on public.hr_employees         for select to authenticated using (true);
create policy "auth_write" on public.hr_employees        for all    to authenticated using (true) with check (true);

create policy "auth_read" on public.hr_performance_reviews for select to authenticated using (true);
create policy "auth_write" on public.hr_performance_reviews for all  to authenticated using (true) with check (true);

create policy "auth_read" on public.hr_issues            for select to authenticated using (true);
create policy "auth_write" on public.hr_issues           for all    to authenticated using (true) with check (true);

create policy "auth_read" on public.hr_roles             for select to authenticated using (true);
create policy "auth_write" on public.hr_roles            for all    to authenticated using (true) with check (true);

create policy "auth_read" on public.hr_candidates        for select to authenticated using (true);
create policy "auth_write" on public.hr_candidates       for all    to authenticated using (true) with check (true);

create policy "auth_read" on public.hr_docs              for select to authenticated using (true);
create policy "auth_write" on public.hr_docs             for all    to authenticated using (true) with check (true);

-- Public-facing policies for /careers:
-- 1) Anyone (including anon) can SELECT hr_roles where status='open' — landing pages.
create policy "public_open_roles_read" on public.hr_roles
  for select to anon using (status = 'open');

-- 2) Anyone (including anon) can INSERT hr_candidates — the apply form.
create policy "public_apply_insert" on public.hr_candidates
  for insert to anon with check (true);
