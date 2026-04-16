-- Haven OS — Tendwell-style task lists
-- Migration 0006: lists.type, list_members, task_assignees.role/sort_order, task_watchers
--
-- Run AFTER 0005_seed_properties.sql.
-- Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout for idempotency.

-- ---------------------------------------------------------------------------
-- 1. lists.type column
-- ---------------------------------------------------------------------------
alter table public.lists
  add column if not exists type text not null default 'shared';

alter table public.lists
  drop constraint if exists lists_type_check;

alter table public.lists
  add constraint lists_type_check check (type in ('private', 'shared', 'public'));

-- ---------------------------------------------------------------------------
-- 2. list_members table
-- ---------------------------------------------------------------------------
create table if not exists public.list_members (
  list_id     uuid not null references public.lists(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member',   -- 'owner' | 'member'
  color       text not null default '#6366f1',
  added_by    uuid references public.profiles(id) on delete set null,
  added_at    timestamptz not null default now(),
  primary key (list_id, profile_id)
);

alter table public.list_members enable row level security;

-- RLS: read all authenticated, insert/update/delete authenticated
drop policy if exists "lm read all" on public.list_members;
create policy "lm read all"
  on public.list_members for select
  using (auth.uid() is not null);

drop policy if exists "lm insert auth" on public.list_members;
create policy "lm insert auth"
  on public.list_members for insert
  with check (auth.uid() is not null);

drop policy if exists "lm update auth" on public.list_members;
create policy "lm update auth"
  on public.list_members for update
  using (auth.uid() is not null);

drop policy if exists "lm delete auth" on public.list_members;
create policy "lm delete auth"
  on public.list_members for delete
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- 3. Trigger: auto-add list creator as owner member
--    Mirrors the pattern in 0003_space_privacy.sql (tg_auto_add_space_creator)
-- ---------------------------------------------------------------------------
create or replace function public.tg_auto_add_list_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.list_members (list_id, profile_id, role, added_by)
    values (new.id, new.created_by, 'owner', new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists list_auto_add_creator on public.lists;
create trigger list_auto_add_creator
  after insert on public.lists
  for each row execute function public.tg_auto_add_list_creator();

-- ---------------------------------------------------------------------------
-- 4. task_assignees — add role and sort_order columns
-- ---------------------------------------------------------------------------
alter table public.task_assignees
  add column if not exists role text not null default 'secondary';

alter table public.task_assignees
  add column if not exists sort_order integer not null default 0;

-- ---------------------------------------------------------------------------
-- 5. task_watchers table
-- ---------------------------------------------------------------------------
create table if not exists public.task_watchers (
  task_id     uuid not null references public.tasks(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (task_id, profile_id)
);

alter table public.task_watchers enable row level security;

drop policy if exists "tw read all" on public.task_watchers;
create policy "tw read all"
  on public.task_watchers for select
  using (auth.uid() is not null);

drop policy if exists "tw insert auth" on public.task_watchers;
create policy "tw insert auth"
  on public.task_watchers for insert
  with check (auth.uid() is not null);

drop policy if exists "tw delete auth" on public.task_watchers;
create policy "tw delete auth"
  on public.task_watchers for delete
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- 6. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_list_members_profile on public.list_members(profile_id);
create index if not exists idx_task_watchers_task    on public.task_watchers(task_id);
create index if not exists idx_task_watchers_profile on public.task_watchers(profile_id);
