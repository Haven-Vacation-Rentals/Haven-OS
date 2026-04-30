-- Haven OS — Full-text search + notifications center
--
-- This migration powers two features highlighted by the platform audit:
--
-- 1. Full-text search across tasks (title + description + comments) and
--    properties (name + address + region + account/revenue manager + notes).
--    Uses Postgres' built-in `tsvector` with a `english` configuration and a
--    GIN index. Also enables `pg_trgm` for fuzzy/typo-tolerant matching on
--    short identifiers (task titles, property names).
--
-- 2. A generic notifications table that backs the in-app notification
--    center. Watcher-driven and assignee-driven events from server actions
--    write rows here; the UI reads them via RLS-scoped queries.
--
-- Run AFTER 0030_hr_candidate_notes.sql.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. TASKS — search_vector
--
-- Indexed fields:
--   * title           (weight A — strongest match)
--   * description     (weight B)
--   * comments.body   (weight C — joined in via trigger)
--
-- We avoid a generated column because comments live in a separate table; the
-- two triggers below recompute the vector when either row changes.
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists search_vector tsvector;

create or replace function public.tasks_search_vector(p_task_id uuid)
returns tsvector
language sql
stable
as $$
  with t as (
    select title, description from public.tasks where id = p_task_id
  ),
  c as (
    select string_agg(body, ' ') as body
    from public.comments
    where task_id = p_task_id
  )
  select
    setweight(to_tsvector('english', coalesce((select title from t), '')), 'A') ||
    setweight(to_tsvector('english', coalesce((select description from t), '')), 'B') ||
    setweight(to_tsvector('english', coalesce((select body from c), '')), 'C');
$$;

create or replace function public.tg_tasks_refresh_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := public.tasks_search_vector(new.id);
  return new;
end;
$$;

drop trigger if exists tasks_search_vector_trg on public.tasks;
create trigger tasks_search_vector_trg
  before insert or update of title, description on public.tasks
  for each row execute function public.tg_tasks_refresh_search_vector();

-- When a comment changes, recompute the parent task's search_vector.
create or replace function public.tg_comments_refresh_task_search()
returns trigger
language plpgsql
as $$
declare
  v_task_id uuid;
begin
  v_task_id := coalesce(new.task_id, old.task_id);
  if v_task_id is null then return coalesce(new, old); end if;
  update public.tasks
     set search_vector = public.tasks_search_vector(v_task_id)
   where id = v_task_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists comments_refresh_task_search_trg on public.comments;
create trigger comments_refresh_task_search_trg
  after insert or update or delete on public.comments
  for each row execute function public.tg_comments_refresh_task_search();

-- Backfill existing rows.
update public.tasks set search_vector = public.tasks_search_vector(id);

-- Indexes.
create index if not exists tasks_search_vector_idx
  on public.tasks using gin (search_vector);

create index if not exists tasks_title_trgm_idx
  on public.tasks using gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 2. PROPERTIES — search_vector
--
-- Indexed fields (all weight A or B since the corpus per row is small):
--   * name             (A)
--   * address          (B)
--   * region           (B)
--   * account_manager  (B)
--   * revenue_manager  (B)
--   * notes            (C)
-- ---------------------------------------------------------------------------

alter table public.properties
  add column if not exists search_vector tsvector
    generated always as (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(address, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(region, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(account_manager, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(revenue_manager, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(notes, '')), 'C')
    ) stored;

create index if not exists properties_search_vector_idx
  on public.properties using gin (search_vector);

create index if not exists properties_name_trgm_idx
  on public.properties using gin (name gin_trgm_ops);

create index if not exists properties_address_trgm_idx
  on public.properties using gin (address gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 3. NOTIFICATIONS table
--
-- A single denormalized inbox. Server actions insert one row per
-- recipient — easier to read and gives each user their own read/unread
-- state for free.
--
-- Subjects are linked by (subject_type, subject_id). The UI uses
-- subject_url to deep-link without re-resolving the subject.
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  kind          text not null,
  -- e.g. 'task_assigned', 'task_status_changed', 'task_due_changed',
  --      'task_comment_added', 'task_completed'
  subject_type  text not null,             -- 'task' | 'property' | …
  subject_id    uuid,                       -- nullable for system-wide pings
  subject_url   text,                       -- relative URL to deep-link
  title         text not null,
  body          text,
  metadata      jsonb not null default '{}'::jsonb,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, read_at, created_at desc);

create index if not exists notifications_subject_idx
  on public.notifications (subject_type, subject_id);

alter table public.notifications enable row level security;

-- A signed-in user can only read/update their own notifications. Inserts
-- are server-only (service role / authenticated server actions).
drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own"
  on public.notifications for select
  using (auth.uid() = recipient_id);

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "notifications insert auth" on public.notifications;
create policy "notifications insert auth"
  on public.notifications for insert
  with check (auth.uid() is not null);

drop policy if exists "notifications delete own" on public.notifications;
create policy "notifications delete own"
  on public.notifications for delete
  using (auth.uid() = recipient_id);
