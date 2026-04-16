-- Haven OS — Work module schema
--
-- Hierarchy: Space → Folder? → List → Task → Subtask
-- Custom fields are per-List (schema) with per-Task values (JSONB).
--
-- Run AFTER 0001_init_profiles.sql.
-- Paste into Supabase SQL Editor or use `supabase db push`.

-- ---------------------------------------------------------------------------
-- SPACES
-- ---------------------------------------------------------------------------
create table if not exists public.spaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  color       text default '#FF564E',
  icon        text default 'folder-kanban',
  "order"     integer not null default 0,
  archived_at timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.spaces enable row level security;
create policy "spaces read all" on public.spaces for select using (true);
create policy "spaces insert auth" on public.spaces for insert with check (auth.uid() is not null);
create policy "spaces update auth" on public.spaces for update using (auth.uid() is not null);
create policy "spaces delete auth" on public.spaces for delete using (auth.uid() is not null);

drop trigger if exists spaces_set_updated_at on public.spaces;
create trigger spaces_set_updated_at
  before update on public.spaces
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- FOLDERS (optional grouping within a Space)
-- ---------------------------------------------------------------------------
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  name        text not null,
  "order"     integer not null default 0,
  archived_at timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.folders enable row level security;
create policy "folders read all" on public.folders for select using (true);
create policy "folders insert auth" on public.folders for insert with check (auth.uid() is not null);
create policy "folders update auth" on public.folders for update using (auth.uid() is not null);
create policy "folders delete auth" on public.folders for delete using (auth.uid() is not null);

drop trigger if exists folders_set_updated_at on public.folders;
create trigger folders_set_updated_at
  before update on public.folders
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- LISTS
-- ---------------------------------------------------------------------------
create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  folder_id   uuid references public.folders(id) on delete cascade,
  name        text not null,
  description text,
  "order"     integer not null default 0,
  archived_at timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.lists enable row level security;
create policy "lists read all" on public.lists for select using (true);
create policy "lists insert auth" on public.lists for insert with check (auth.uid() is not null);
create policy "lists update auth" on public.lists for update using (auth.uid() is not null);
create policy "lists delete auth" on public.lists for delete using (auth.uid() is not null);

drop trigger if exists lists_set_updated_at on public.lists;
create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- STATUSES (per-List, ordered)
-- ---------------------------------------------------------------------------
create type task_status_category as enum ('todo', 'in_progress', 'done', 'closed');

create table if not exists public.statuses (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists(id) on delete cascade,
  name        text not null,
  color       text not null default '#424242',
  category    task_status_category not null default 'todo',
  "order"     integer not null default 0
);

alter table public.statuses enable row level security;
create policy "statuses read all" on public.statuses for select using (true);
create policy "statuses insert auth" on public.statuses for insert with check (auth.uid() is not null);
create policy "statuses update auth" on public.statuses for update using (auth.uid() is not null);
create policy "statuses delete auth" on public.statuses for delete using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- CUSTOM FIELD DEFINITIONS (per-List schema)
-- ---------------------------------------------------------------------------
create type custom_field_type as enum (
  'text', 'number', 'currency', 'percent',
  'select', 'multi_select',
  'date', 'checkbox', 'url', 'email', 'phone',
  'people', 'labels'
);

create table if not exists public.custom_field_defs (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists(id) on delete cascade,
  name        text not null,
  field_type  custom_field_type not null,
  -- JSON config: { options: [{value,label,color}], currency, required, default }
  config      jsonb not null default '{}',
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.custom_field_defs enable row level security;
create policy "cfd read all" on public.custom_field_defs for select using (true);
create policy "cfd insert auth" on public.custom_field_defs for insert with check (auth.uid() is not null);
create policy "cfd update auth" on public.custom_field_defs for update using (auth.uid() is not null);
create policy "cfd delete auth" on public.custom_field_defs for delete using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------------------------
create type task_priority as enum ('urgent', 'high', 'normal', 'low', 'none');

create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  list_id       uuid not null references public.lists(id) on delete cascade,
  status_id     uuid references public.statuses(id) on delete set null,
  parent_id     uuid references public.tasks(id) on delete cascade,

  title         text not null,
  description   text,
  priority      task_priority not null default 'none',

  due_date      date,
  start_date    date,
  time_estimate integer,  -- minutes

  "order"       integer not null default 0,

  -- Custom field values: { "<field_def_id>": <value> }
  custom_fields jsonb not null default '{}',

  -- Denormalised assignee array for fast queries / display.
  -- Source of truth is the task_assignees join table.
  assignee_ids  uuid[] not null default '{}',

  tags          text[] not null default '{}',

  archived_at   timestamptz,
  completed_at  timestamptz,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tasks_list_id_idx on public.tasks(list_id);
create index tasks_status_id_idx on public.tasks(status_id);
create index tasks_parent_id_idx on public.tasks(parent_id);
create index tasks_due_date_idx on public.tasks(due_date) where due_date is not null;
create index tasks_assignees_idx on public.tasks using gin(assignee_ids);

alter table public.tasks enable row level security;
create policy "tasks read all" on public.tasks for select using (true);
create policy "tasks insert auth" on public.tasks for insert with check (auth.uid() is not null);
create policy "tasks update auth" on public.tasks for update using (auth.uid() is not null);
create policy "tasks delete auth" on public.tasks for delete using (auth.uid() is not null);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- TASK ASSIGNEES (join table)
-- ---------------------------------------------------------------------------
create table if not exists public.task_assignees (
  task_id     uuid not null references public.tasks(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);

alter table public.task_assignees enable row level security;
create policy "ta read all" on public.task_assignees for select using (true);
create policy "ta insert auth" on public.task_assignees for insert with check (auth.uid() is not null);
create policy "ta delete auth" on public.task_assignees for delete using (auth.uid() is not null);

-- Trigger to keep tasks.assignee_ids in sync
create or replace function public.tg_sync_assignee_ids()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.tasks
      set assignee_ids = array(
        select profile_id from public.task_assignees where task_id = new.task_id
      )
      where id = new.task_id;
  elsif (tg_op = 'DELETE') then
    update public.tasks
      set assignee_ids = array(
        select profile_id from public.task_assignees where task_id = old.task_id
      )
      where id = old.task_id;
  end if;
  return null;
end;
$$;

drop trigger if exists task_assignees_sync on public.task_assignees;
create trigger task_assignees_sync
  after insert or delete on public.task_assignees
  for each row execute function public.tg_sync_assignee_ids();

-- ---------------------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid not null references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index comments_task_id_idx on public.comments(task_id);

alter table public.comments enable row level security;
create policy "comments read all" on public.comments for select using (true);
create policy "comments insert auth" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments update own" on public.comments for update using (auth.uid() = author_id);
create policy "comments delete own" on public.comments for delete using (auth.uid() = author_id);

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- SEED: default statuses helper
-- Call: select seed_default_statuses('<list-id>');
-- ---------------------------------------------------------------------------
create or replace function public.seed_default_statuses(p_list_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.statuses (list_id, name, color, category, "order") values
    (p_list_id, 'To Do',        '#94a3b8', 'todo',        0),
    (p_list_id, 'In Progress',  '#3b82f6', 'in_progress', 1),
    (p_list_id, 'In Review',    '#f59e0b', 'in_progress', 2),
    (p_list_id, 'Done',         '#22c55e', 'done',        3),
    (p_list_id, 'Closed',       '#6b7280', 'closed',      4);
end;
$$;
