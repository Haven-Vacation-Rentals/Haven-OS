-- Haven OS — ClickUp import prep
-- Migration 0046: identity columns + feature-gap tables for the full
-- ClickUp workspace import (see docs/clickup-audit/, esp. README.md
-- "Feature gaps" and 09-automations-and-templates.md).
--
-- What this adds:
--   1. clickup_id on every work-module table the importer writes (plus
--      clickup_user_id on profiles), each with a partial unique index so
--      the importer is idempotent / re-runnable for delta sync.
--   2. import_meta jsonb on tasks + comments — provenance for rows whose
--      original ClickUp creator has no HavenOS profile, original URLs,
--      and any lossy artifacts.
--   3. New custom_field_type enum values: relationship, rating,
--      attachment, location, formula, progress (audit gaps #1, #6, #10).
--   4. Space/folder-scoped custom field definitions (audit gap #2 —
--      ClickUp shares field defs above the list level).
--   5. task_dependencies — waiting_on / blocking / linked (audit gap #8).
--   6. task_templates — apply-template-on-create (audit gap #3 / doc 09).
--   7. automation_rules — date-based priority escalation, template
--      application, status moves, notifications (audit gap #3 / doc 09).
--   8. space_tags — per-space tag registry with colors (audit gap #7;
--      tasks.tags stays a free text[]).
--
-- Run AFTER 0045_paid_advertising_repurpose.sql.
-- Idempotent (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DROP POLICY /
-- TRIGGER / CONSTRAINT IF EXISTS, ADD VALUE IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- 1. ClickUp identity columns (idempotent import keys)
--    One clickup_id per imported row; partial unique so non-imported rows
--    (clickup_id is null) are unconstrained. Mirrors properties.external_id
--    (0004) and operations_work_orders.external_ref (0044).
-- ---------------------------------------------------------------------------

alter table public.spaces
  add column if not exists clickup_id text;
create unique index if not exists spaces_clickup_id_unique
  on public.spaces (clickup_id) where clickup_id is not null;

alter table public.folders
  add column if not exists clickup_id text;
create unique index if not exists folders_clickup_id_unique
  on public.folders (clickup_id) where clickup_id is not null;

alter table public.lists
  add column if not exists clickup_id text;
create unique index if not exists lists_clickup_id_unique
  on public.lists (clickup_id) where clickup_id is not null;

alter table public.statuses
  add column if not exists clickup_id text;
create unique index if not exists statuses_clickup_id_unique
  on public.statuses (clickup_id) where clickup_id is not null;

alter table public.custom_field_defs
  add column if not exists clickup_id text;
create unique index if not exists custom_field_defs_clickup_id_unique
  on public.custom_field_defs (clickup_id) where clickup_id is not null;

alter table public.tasks
  add column if not exists clickup_id text;
create unique index if not exists tasks_clickup_id_unique
  on public.tasks (clickup_id) where clickup_id is not null;

alter table public.comments
  add column if not exists clickup_id text;
create unique index if not exists comments_clickup_id_unique
  on public.comments (clickup_id) where clickup_id is not null;

alter table public.checklists
  add column if not exists clickup_id text;
create unique index if not exists checklists_clickup_id_unique
  on public.checklists (clickup_id) where clickup_id is not null;

alter table public.checklist_items
  add column if not exists clickup_id text;
create unique index if not exists checklist_items_clickup_id_unique
  on public.checklist_items (clickup_id) where clickup_id is not null;

alter table public.task_attachments
  add column if not exists clickup_id text;
create unique index if not exists task_attachments_clickup_id_unique
  on public.task_attachments (clickup_id) where clickup_id is not null;

alter table public.time_entries
  add column if not exists clickup_id text;
create unique index if not exists time_entries_clickup_id_unique
  on public.time_entries (clickup_id) where clickup_id is not null;

-- ClickUp member ids are numeric — map each of the 56 members to a profile.
alter table public.profiles
  add column if not exists clickup_user_id bigint;
create unique index if not exists profiles_clickup_user_id_unique
  on public.profiles (clickup_user_id) where clickup_user_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Import metadata (provenance for lossy / unmapped data)
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists import_meta jsonb;

alter table public.comments
  add column if not exists import_meta jsonb;

comment on column public.tasks.import_meta is
  'ClickUp import provenance. Null for native rows. Shape (all optional): '
  '{ "creator_name": text, "creator_email": text (when the ClickUp user has '
  'no HavenOS profile), "clickup_url": text, plus any lossy artifacts the '
  'importer could not map 1:1. }';
comment on column public.comments.import_meta is
  'ClickUp import provenance — same shape as tasks.import_meta.';

-- ---------------------------------------------------------------------------
-- 3. New custom field types
--    relationship — FK to a task in another list (PDM ↔ vendors, invoices
--                   ↔ vendor contacts, …); config names the target list.
--    rating       — emoji/star rating (vendor rating, interview scorecards)
--    attachment   — file custom field (COI PDFs)
--    location     — address/geo (Address for Map)
--    formula      — computed (Tendwell Profit/Margin)
--    progress     — automatic/manual progress rollup (Rocks, Onboarding)
--
--    ADD VALUE IF NOT EXISTS is the repo's enum-extension pattern (0041).
--    It is transaction-safe on Postgres 12+ (Supabase runs 15+) as long as
--    the new values are not used later in the same transaction — this
--    migration only declares them.
-- ---------------------------------------------------------------------------

alter type public.custom_field_type add value if not exists 'relationship';
alter type public.custom_field_type add value if not exists 'rating';
alter type public.custom_field_type add value if not exists 'attachment';
alter type public.custom_field_type add value if not exists 'location';
alter type public.custom_field_type add value if not exists 'formula';
alter type public.custom_field_type add value if not exists 'progress';

-- ---------------------------------------------------------------------------
-- 4. Scoped field definitions (list- OR folder- OR space-level)
--    ClickUp shares one field def across all lists in a folder/space (the
--    Department 14-option set, the 428-option property labels). A def now
--    anchors to exactly one of list / folder / space; lists inherit defs
--    from their folder and space at read time (lib/work).
-- ---------------------------------------------------------------------------

-- list_id was NOT NULL in 0002; drop that so folder/space-scoped defs can
-- exist. DROP NOT NULL is a no-op when already nullable.
alter table public.custom_field_defs
  alter column list_id drop not null;

alter table public.custom_field_defs
  add column if not exists space_id uuid references public.spaces(id) on delete cascade;

alter table public.custom_field_defs
  add column if not exists folder_id uuid references public.folders(id) on delete cascade;

-- Exactly one scope anchor. Existing rows all have list_id set, so they
-- pass. Drop+recreate so re-running the migration is safe.
alter table public.custom_field_defs
  drop constraint if exists custom_field_defs_scope_chk;
alter table public.custom_field_defs
  add constraint custom_field_defs_scope_chk
    check (num_nonnulls(list_id, folder_id, space_id) = 1);

create index if not exists custom_field_defs_space_id_idx
  on public.custom_field_defs (space_id) where space_id is not null;
create index if not exists custom_field_defs_folder_id_idx
  on public.custom_field_defs (folder_id) where folder_id is not null;

-- ---------------------------------------------------------------------------
-- 5. Task dependencies (waiting_on / blocking / linked)
--    Directed rows: 'waiting_on' = task_id waits on depends_on_task_id;
--    'blocking' = task_id blocks depends_on_task_id; 'linked' = plain link.
-- ---------------------------------------------------------------------------

create table if not exists public.task_dependencies (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  type               text not null check (type in ('waiting_on', 'blocking', 'linked')),
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now(),
  unique (task_id, depends_on_task_id, type),
  check (task_id <> depends_on_task_id)
);

create index if not exists task_dependencies_task_id_idx
  on public.task_dependencies (task_id);
create index if not exists task_dependencies_depends_on_task_id_idx
  on public.task_dependencies (depends_on_task_id);

alter table public.task_dependencies enable row level security;

drop policy if exists "task_dependencies read all" on public.task_dependencies;
create policy "task_dependencies read all"
  on public.task_dependencies for select
  using (true);

drop policy if exists "task_dependencies insert auth" on public.task_dependencies;
create policy "task_dependencies insert auth"
  on public.task_dependencies for insert
  with check (auth.uid() is not null);

drop policy if exists "task_dependencies update auth" on public.task_dependencies;
create policy "task_dependencies update auth"
  on public.task_dependencies for update
  using (auth.uid() is not null);

drop policy if exists "task_dependencies delete auth" on public.task_dependencies;
create policy "task_dependencies delete auth"
  on public.task_dependencies for delete
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- 6. Task templates (apply-template-on-create)
--    Powers the four template-driven lists in doc 09 (Property On/Off-
--    boarding, Employee On/Offboarding). An on-create hook instantiates
--    the definition as a subtask tree.
-- ---------------------------------------------------------------------------

create table if not exists public.task_templates (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists(id) on delete cascade,
  name        text not null,
  -- Subtask tree, instantiated recursively:
  --   [{ "title": text,
  --      "assignee_emails": [text, ...],
  --      "due_offset_days": int,          -- due = created + N days
  --      "children": [ ...same shape... ] }, ...]
  definition  jsonb not null default '{}',
  clickup_id  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.task_templates.definition is
  'Subtask tree: [{title, assignee_emails[], due_offset_days, children:[...]}]. '
  'See migration 0046 / docs/clickup-audit/09-automations-and-templates.md.';

create index if not exists task_templates_list_id_idx
  on public.task_templates (list_id);
create unique index if not exists task_templates_clickup_id_unique
  on public.task_templates (clickup_id) where clickup_id is not null;

drop trigger if exists task_templates_set_updated_at on public.task_templates;
create trigger task_templates_set_updated_at
  before update on public.task_templates
  for each row execute function public.tg_set_updated_at();

alter table public.task_templates enable row level security;

drop policy if exists "task_templates read all" on public.task_templates;
create policy "task_templates read all"
  on public.task_templates for select
  using (true);

drop policy if exists "task_templates insert auth" on public.task_templates;
create policy "task_templates insert auth"
  on public.task_templates for insert
  with check (auth.uid() is not null);

drop policy if exists "task_templates update auth" on public.task_templates;
create policy "task_templates update auth"
  on public.task_templates for update
  using (auth.uid() is not null);

drop policy if exists "task_templates delete auth" on public.task_templates;
create policy "task_templates delete auth"
  on public.task_templates for delete
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- 7. Automation rules (per-list trigger → action)
--    Confirmed rules to rebuild (doc 09):
--      start_date_arrived → set_priority high   (Dylan's To Do, Tickets)
--      due_date_arrived   → set_priority urgent (Dylan's To Do, Tickets)
--      task_created       → apply_template      (the four template lists)
--      due_date_arrived   → move_status         (Insurance active→expired)
--    config carries the action payload, e.g. {"priority":"high"},
--    {"template_id":"…"}, {"status_name":"expired"}, {"notify":["…"]}.
--    Date triggers are evaluated by a scheduled job; task_created /
--    status_changed fire from lib/work/actions.ts.
-- ---------------------------------------------------------------------------

create table if not exists public.automation_rules (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists(id) on delete cascade,
  "trigger"   text not null check ("trigger" in
                ('task_created', 'start_date_arrived', 'due_date_arrived', 'status_changed')),
  action      text not null check (action in
                ('apply_template', 'set_priority', 'move_status', 'notify')),
  config      jsonb not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists automation_rules_list_id_idx
  on public.automation_rules (list_id);
-- The scheduled job scans active date-based rules across all lists.
create index if not exists automation_rules_trigger_idx
  on public.automation_rules ("trigger") where is_active;

drop trigger if exists automation_rules_set_updated_at on public.automation_rules;
create trigger automation_rules_set_updated_at
  before update on public.automation_rules
  for each row execute function public.tg_set_updated_at();

alter table public.automation_rules enable row level security;

drop policy if exists "automation_rules read all" on public.automation_rules;
create policy "automation_rules read all"
  on public.automation_rules for select
  using (true);

drop policy if exists "automation_rules insert auth" on public.automation_rules;
create policy "automation_rules insert auth"
  on public.automation_rules for insert
  with check (auth.uid() is not null);

drop policy if exists "automation_rules update auth" on public.automation_rules;
create policy "automation_rules update auth"
  on public.automation_rules for update
  using (auth.uid() is not null);

drop policy if exists "automation_rules delete auth" on public.automation_rules;
create policy "automation_rules delete auth"
  on public.automation_rules for delete
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- 8. Space tag registry
--    Per-space tag definitions with colors (ClickUp tags are space-scoped).
--    tasks.tags stays a free text[] — the registry is the pick-list /
--    color source, matched by name. unique(space_id, name) doubles as the
--    space_id lookup index.
-- ---------------------------------------------------------------------------

create table if not exists public.space_tags (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  name        text not null,
  color       text,
  created_at  timestamptz not null default now(),
  unique (space_id, name)
);

alter table public.space_tags enable row level security;

drop policy if exists "space_tags read all" on public.space_tags;
create policy "space_tags read all"
  on public.space_tags for select
  using (true);

drop policy if exists "space_tags insert auth" on public.space_tags;
create policy "space_tags insert auth"
  on public.space_tags for insert
  with check (auth.uid() is not null);

drop policy if exists "space_tags update auth" on public.space_tags;
create policy "space_tags update auth"
  on public.space_tags for update
  using (auth.uid() is not null);

drop policy if exists "space_tags delete auth" on public.space_tags;
create policy "space_tags delete auth"
  on public.space_tags for delete
  using (auth.uid() is not null);
