-- Haven OS — The Board
-- Quarterly Loom + team announcements + admin whitelist.
-- Run AFTER 0012_scorecard.sql.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Single-row key/value store for Board-level settings (quarterly Loom, etc.)
create table if not exists public.board_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- Whitelist of admin emails. Anyone in this table can edit The Board.
create table if not exists public.board_admins (
  email       text primary key,
  created_at  timestamptz not null default now()
);

-- Announcements feed. Rendered on The Board, most recent first (pinned first).
create table if not exists public.board_announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null default '',
  is_pinned   boolean not null default false,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

-- Seed initial admins.
insert into public.board_admins (email) values
  ('jack13zoppa@gmail.com'),
  ('jack@havenvacationrentals.com')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.tg_board_set_updated_at()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.board_announcements;
create trigger set_updated_at
  before update on public.board_announcements
  for each row execute function public.tg_board_set_updated_at();

drop trigger if exists set_updated_at on public.board_settings;
create trigger set_updated_at
  before update on public.board_settings
  for each row execute function public.tg_board_set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists board_announcements_feed_idx
  on public.board_announcements(is_pinned desc, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — all authenticated users read; only admins write (enforced in server actions)
-- ---------------------------------------------------------------------------

alter table public.board_settings      enable row level security;
alter table public.board_admins        enable row level security;
alter table public.board_announcements enable row level security;

drop policy if exists "auth_read"  on public.board_settings;
drop policy if exists "auth_write" on public.board_settings;
drop policy if exists "auth_read"  on public.board_admins;
drop policy if exists "auth_write" on public.board_admins;
drop policy if exists "auth_read"  on public.board_announcements;
drop policy if exists "auth_write" on public.board_announcements;

-- Reads: any authenticated user.
create policy "auth_read" on public.board_settings
  for select to authenticated using (true);

create policy "auth_read" on public.board_admins
  for select to authenticated using (true);

create policy "auth_read" on public.board_announcements
  for select to authenticated using (true);

-- Writes: authenticated (server actions gate on admin email before the query).
-- This mirrors the pattern used in 0012_scorecard.sql for consistency.
create policy "auth_write" on public.board_settings
  for all to authenticated using (true) with check (true);

create policy "auth_write" on public.board_admins
  for all to authenticated using (true) with check (true);

create policy "auth_write" on public.board_announcements
  for all to authenticated using (true) with check (true);
