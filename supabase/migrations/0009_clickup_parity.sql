-- Haven OS — ClickUp-parity: checklists, time tracking, activity log, attachments
-- Migration 0009: new tables + triggers for status-change logging and completed_at
--
-- Run AFTER 0008_tasks_list_level_fields.sql.
-- Idempotent (IF NOT EXISTS, OR REPLACE, DROP TRIGGER IF EXISTS).

-- ---------------------------------------------------------------------------
-- CHECKLISTS
-- ---------------------------------------------------------------------------
create table if not exists public.checklists (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  name       text not null default 'Checklist',
  "order"    integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.checklists enable row level security;

drop policy if exists "checklists read all" on public.checklists;
create policy "checklists read all"
  on public.checklists for select
  using (true);

drop policy if exists "checklists insert auth" on public.checklists;
create policy "checklists insert auth"
  on public.checklists for insert
  with check (auth.uid() is not null);

drop policy if exists "checklists update auth" on public.checklists;
create policy "checklists update auth"
  on public.checklists for update
  using (auth.uid() is not null);

drop policy if exists "checklists delete auth" on public.checklists;
create policy "checklists delete auth"
  on public.checklists for delete
  using (auth.uid() is not null);

create index if not exists idx_checklists_task_id
  on public.checklists(task_id);

-- ---------------------------------------------------------------------------
-- CHECKLIST ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.checklist_items (
  id           uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  content      text not null,
  completed    boolean not null default false,
  assignee_id  uuid references public.profiles(id),
  "order"      integer not null default 0,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.checklist_items enable row level security;

drop policy if exists "checklist_items read all" on public.checklist_items;
create policy "checklist_items read all"
  on public.checklist_items for select
  using (true);

drop policy if exists "checklist_items insert auth" on public.checklist_items;
create policy "checklist_items insert auth"
  on public.checklist_items for insert
  with check (auth.uid() is not null);

drop policy if exists "checklist_items update auth" on public.checklist_items;
create policy "checklist_items update auth"
  on public.checklist_items for update
  using (auth.uid() is not null);

drop policy if exists "checklist_items delete auth" on public.checklist_items;
create policy "checklist_items delete auth"
  on public.checklist_items for delete
  using (auth.uid() is not null);

create index if not exists idx_checklist_items_checklist_id
  on public.checklist_items(checklist_id);

-- ---------------------------------------------------------------------------
-- TIME ENTRIES
-- ---------------------------------------------------------------------------
create table if not exists public.time_entries (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id),
  description text,
  started_at  timestamptz not null,
  ended_at    timestamptz,
  duration_ms bigint,  -- calculated on stop or entered manually
  created_at  timestamptz not null default now()
);

alter table public.time_entries enable row level security;

drop policy if exists "time_entries read all" on public.time_entries;
create policy "time_entries read all"
  on public.time_entries for select
  using (true);

drop policy if exists "time_entries insert auth" on public.time_entries;
create policy "time_entries insert auth"
  on public.time_entries for insert
  with check (auth.uid() is not null);

drop policy if exists "time_entries update auth" on public.time_entries;
create policy "time_entries update auth"
  on public.time_entries for update
  using (auth.uid() is not null);

drop policy if exists "time_entries delete auth" on public.time_entries;
create policy "time_entries delete auth"
  on public.time_entries for delete
  using (auth.uid() is not null);

create index if not exists idx_time_entries_task_id
  on public.time_entries(task_id);

create index if not exists idx_time_entries_user_id
  on public.time_entries(user_id);

-- ---------------------------------------------------------------------------
-- TASK ACTIVITY
-- ---------------------------------------------------------------------------
create table if not exists public.task_activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  actor_id   uuid references public.profiles(id),
  action     text not null,  -- 'created','status_changed','assignee_added','priority_changed', etc.
  from_value jsonb,
  to_value   jsonb,
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.task_activity enable row level security;

drop policy if exists "task_activity read all" on public.task_activity;
create policy "task_activity read all"
  on public.task_activity for select
  using (true);

drop policy if exists "task_activity insert auth" on public.task_activity;
create policy "task_activity insert auth"
  on public.task_activity for insert
  with check (auth.uid() is not null);

drop policy if exists "task_activity update auth" on public.task_activity;
create policy "task_activity update auth"
  on public.task_activity for update
  using (auth.uid() is not null);

drop policy if exists "task_activity delete auth" on public.task_activity;
create policy "task_activity delete auth"
  on public.task_activity for delete
  using (auth.uid() is not null);

create index if not exists idx_task_activity_task_id_created_at
  on public.task_activity(task_id, created_at desc);

-- ---------------------------------------------------------------------------
-- TASK ATTACHMENTS
-- ---------------------------------------------------------------------------
create table if not exists public.task_attachments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  uploader_id  uuid references public.profiles(id),
  file_name    text not null,
  file_size    bigint not null,
  mime_type    text,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

alter table public.task_attachments enable row level security;

drop policy if exists "task_attachments read all" on public.task_attachments;
create policy "task_attachments read all"
  on public.task_attachments for select
  using (true);

drop policy if exists "task_attachments insert auth" on public.task_attachments;
create policy "task_attachments insert auth"
  on public.task_attachments for insert
  with check (auth.uid() is not null);

drop policy if exists "task_attachments update auth" on public.task_attachments;
create policy "task_attachments update auth"
  on public.task_attachments for update
  using (auth.uid() is not null);

drop policy if exists "task_attachments delete auth" on public.task_attachments;
create policy "task_attachments delete auth"
  on public.task_attachments for delete
  using (auth.uid() is not null);

create index if not exists idx_task_attachments_task_id
  on public.task_attachments(task_id);

-- ---------------------------------------------------------------------------
-- TRIGGER: log status changes into task_activity
-- ---------------------------------------------------------------------------
create or replace function public.tg_log_task_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Only fire when status_id actually changes
  if (old.status_id is distinct from new.status_id) then
    insert into public.task_activity (
      task_id,
      actor_id,
      action,
      from_value,
      to_value,
      metadata
    ) values (
      new.id,
      auth.uid(),
      'status_changed',
      jsonb_build_object('status_id', old.status_id),
      jsonb_build_object('status_id', new.status_id),
      '{}'::jsonb
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tg_log_task_status_change on public.tasks;
create trigger tg_log_task_status_change
  after update on public.tasks
  for each row execute function public.tg_log_task_status_change();

-- ---------------------------------------------------------------------------
-- TRIGGER: keep tasks.completed_at in sync with status category
-- ---------------------------------------------------------------------------
create or replace function public.tg_update_task_completed_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_category task_status_category;
begin
  -- Only fire when status_id actually changes
  if (old.status_id is distinct from new.status_id) then
    if new.status_id is not null then
      select category into v_category
        from public.statuses
        where id = new.status_id;

      if v_category in ('done', 'closed') then
        new.completed_at = now();
      else
        new.completed_at = null;
      end if;
    else
      -- status cleared → clear completed_at
      new.completed_at = null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tg_update_task_completed_at on public.tasks;
create trigger tg_update_task_completed_at
  before update on public.tasks
  for each row execute function public.tg_update_task_completed_at();
