# Haven OS — Task Management System: Master Replication Document

> **Purpose.** This is a self-contained specification of the "My Tasks" / Work task-management
> module as built in Haven OS, written so another engineer (or AI agent) can reproduce the
> functionality, data model, and UI/UX in a different project.
>
> The canonical entry point is the route `app/(app)/my-tasks/page.tsx`, but that page is a thin
> shell over a shared, ClickUp-parity engine that lives in `lib/work/*` (server) and
> `components/work/*` (client). Replicating "My Tasks" means replicating that engine.
>
> **How to read this document.** Sections 1–13 describe the system. **Section 15 ("Accuracy,
> Security & Operational Addenda") is mandatory reading before you ship** — it documents the
> real security posture (RLS is intentionally permissive; access is enforced in server actions,
> with gaps), exact RLS policies, data-integrity constraints that are *not* enforced today,
> transaction/concurrency behavior, validation, archival, and a test plan. Where this document
> says something "should" be enforced but isn't, it is flagged **⚠️ GAP** (a real
> characteristic of the current code) or **➕ RECOMMENDED** (a suggested addition that is *not*
> in the codebase today). The base spec documents **actual current behavior**; recommendations
> are always marked.
>
> **Core security assumption (read this first):** the entire access model assumes **all writes
> and sensitive reads go through these Next.js Server Actions, and end-user clients never talk
> to Supabase directly** (no anon-key client queries from the browser for Work data). Database
> RLS is deliberately loose (reads mostly `using(true)`, writes `auth.uid() is not null`); it is
> a backstop against anonymous access, **not** a per-row authorization layer. If you expose the
> Supabase client to browsers, this model is unsafe — see §15.1.

---

## Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Tech Stack & Exact Dependencies](#2-tech-stack--exact-dependencies)
3. [Database Schema (Postgres / Supabase)](#3-database-schema-postgres--supabase)
4. [TypeScript Domain Types](#4-typescript-domain-types)
5. [Access-Control Model](#5-access-control-model)
6. [Server Actions (the full API surface)](#6-server-actions-the-full-api-surface)
7. [Recurrence Engine](#7-recurrence-engine)
8. [Notifications Integration](#8-notifications-integration)
9. [The "My Tasks" Page (route composition)](#9-the-my-tasks-page-route-composition)
10. [Component Architecture & Tree](#10-component-architecture--tree)
11. [Component-by-Component UI/UX Spec](#11-component-by-component-uiux-spec)
12. [Design System: Tokens, Tailwind, Primitives](#12-design-system-tokens-tailwind-primitives)
13. [Interaction Patterns (DnD, keyboard, optimistic updates)](#13-interaction-patterns)
14. [Step-by-Step Replication Checklist](#14-step-by-step-replication-checklist)
15. [Accuracy, Security & Operational Addenda (mandatory)](#15-accuracy-security--operational-addenda-mandatory)
    - 15.1 Security model & assumptions
    - 15.2 Exact RLS policies (every table + storage)
    - 15.3 Per-action access-gating matrix (current vs. recommended)
    - 15.4 Data-integrity constraints: enforced vs. gaps
    - 15.5 Transaction boundaries for multi-step operations
    - 15.6 Concurrency & race handling
    - 15.7 Cache invalidation (normalized, accurate)
    - 15.8 `duplicateTask` exact copy semantics
    - 15.9 Subtask depth & DnD cycle prevention
    - 15.10 Archived & restore behavior
    - 15.11 Validation rules (actual vs. recommended)
    - 15.12 Environment & setup
    - 15.13 Known intentional limitations
    - 15.14 Test plan
    - 15.15 Performance & scale assumptions
    - 15.16 Mobile & accessibility (scope note)

---

## 1. System Overview & Architecture

### Conceptual hierarchy

```
Space ──> Folder? ──> List ──> Task ──> Subtask (Task with parent_id)
                        │
                        ├── Statuses        (per-list, ordered, categorised)
                        ├── Custom Field Defs (per-list schema)
                        └── List Members     (per-list access grants)

Personal "My Tasks" list = a List with space_id = NULL and personal_owner_id = <user>.
```

- A **Space** is a top-level container (like a ClickUp Space). It has privacy (`team` | `private`).
- A **Folder** is optional grouping inside a Space.
- A **List** holds tasks. It has its own ordered **Statuses** and its own **Custom Field**
  definitions. Lists can live under a space/folder OR be a *personal list* (the "My Tasks"
  inbox), anchored to a user instead of a space.
- A **Task** belongs to exactly one list, optionally has a `parent_id` (making it a subtask),
  a status, a priority, assignees, watchers, due/start dates, time estimate, tags, JSONB custom
  field values, and an optional recurrence rule.
- ClickUp-parity extras hang off tasks: **checklists** (+ items), **time entries**, **comments**,
  **activity log**, **attachments**, **watchers**.

### Runtime architecture

- **Next.js App Router**, React Server Components by default. The page is a server component
  (`export const dynamic = "force-dynamic"`) that fetches initial data, then hands it to a big
  **client component** (`ListViewTable`) that owns all interactivity.
- **Supabase** (Postgres + Auth + Storage) is the backend. There is **no REST/GraphQL API
  layer** — all reads/writes go through **Next.js Server Actions** (`"use server"`) in
  `lib/work/actions.ts`, which call the Supabase server client directly. Row-Level Security is
  enabled but permissive (`using (true)` for reads, `auth.uid() is not null` for writes);
  **fine-grained access control is enforced in the server actions**, not RLS.
- **Optimistic UI**: client components mutate local React state immediately, then fire the
  server action inside `useTransition`. On failure they roll back and show a `sonner` toast.
- **Cache invalidation**: every mutating action calls `revalidatePath("/work", "layout")` and
  `revalidatePath("/my-tasks")` so server components re-fetch.

### The two views built on the same engine

1. **List view** (`ListViewTable`) — used directly by `/my-tasks` and by per-list pages. Tasks
   grouped by status, drag-and-drop, inline editing, multi-select, custom-field columns.
2. **Global tasks view** (`global-tasks-view.tsx`) — cross-list/cross-space aggregation with
   filters, board mode, full-text search. (Not used by `/my-tasks` directly, but shares the
   actions layer; documented where relevant.)

---

## 2. Tech Stack & Exact Dependencies

| Concern | Choice | Version |
|---|---|---|
| Framework | `next` | `15.3.6` (App Router) |
| UI runtime | `react` / `react-dom` | `19.0.0` |
| Backend | `@supabase/supabase-js` | `^2.47.0` |
| SSR auth/cookies | `@supabase/ssr` | `^0.5.2` |
| Drag & drop | `@dnd-kit/core` / `@dnd-kit/sortable` / `@dnd-kit/utilities` | `^6.3.1` / `^10.0.0` / `^3.2.2` |
| Animation | `framer-motion` | `^12.38.0` |
| Icons | `lucide-react` | `^0.468.0` |
| Toasts | `sonner` | `^2.0.7` |
| Popovers/tabs/etc | `@radix-ui/react-popover` `^1.1.15`, `@radix-ui/react-tabs` `^1.1.13`, plus dialog/checkbox/dropdown/scroll-area/tooltip | — |
| Class utils | `clsx` `^2.1.1` + `tailwind-merge` `^2.5.5` + `class-variance-authority` `^0.7.1` | — |
| Dates | `date-fns` | `^4.1.0` |
| Styling | `tailwindcss` `^3.4.17` + `tailwindcss-animate` `^1.0.7` | — |
| Theme | `next-themes` | `^0.4.4` (`darkMode: "class"`) |
| Command palette | `cmdk` | `^1.0.4` |
| Node | engines | `>=20` |

Scripts: `dev: next dev`, `build: next build`, `start: next start`, `lint: next lint`,
`typecheck: tsc --noEmit`, `format: prettier --write .`.

`next`, `react`, `react-dom` are pinned (no caret); everything else is caret-ranged.

---

## 3. Database Schema (Postgres / Supabase)

> Migrations live in `supabase/migrations/`. The numbering below maps to the real files. All
> migrations are idempotent (`if not exists`, `or replace`, `drop ... if exists`). Tables enable
> RLS; the policies are intentionally broad (reads open, writes require a signed-in user) because
> the **server actions** enforce real access rules (see §5).

### 3.1 Prerequisite (migration 0001)

Assumes a `public.profiles` table keyed by the Supabase auth user id:

```sql
-- profiles(id uuid pk = auth.users.id, full_name text, email text, avatar_url text, role text, ...)
```

And a shared trigger function used everywhere:

```sql
create or replace function public.tg_set_updated_at() ...  -- sets new.updated_at = now()
```

### 3.2 Core Work schema (migration 0002 — `0002_work_module.sql`)

**Enums**

```sql
create type task_status_category as enum ('todo', 'in_progress', 'done', 'closed');
create type task_priority        as enum ('urgent', 'high', 'normal', 'low', 'none');
create type custom_field_type     as enum (
  'text','number','currency','percent','select','multi_select',
  'date','checkbox','url','email','phone','people','labels'
);
```

**spaces**

```sql
create table public.spaces (
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
-- RLS: read using(true); insert/update/delete with auth.uid() is not null
-- trigger spaces_set_updated_at before update -> tg_set_updated_at()
```

**folders** (exact DDL)

```sql
create table public.folders (
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
create policy "folders read all"   on public.folders for select using (true);
create policy "folders insert auth" on public.folders for insert with check (auth.uid() is not null);
create policy "folders update auth" on public.folders for update using (auth.uid() is not null);
create policy "folders delete auth" on public.folders for delete using (auth.uid() is not null);
create trigger folders_set_updated_at before update on public.folders
  for each row execute function public.tg_set_updated_at();
```

**lists** (as created in 0002; `type` added in 0006, `space_id` made nullable + `personal_owner_id`
added in 0010 — final effective DDL)

```sql
create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid references public.spaces(id) on delete cascade,  -- nullable after 0010
  folder_id   uuid references public.folders(id) on delete cascade,
  name        text not null,
  description text,
  "order"     integer not null default 0,
  archived_at timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- added by migration 0006:
  type        text not null default 'shared',
  constraint  lists_type_check check (type in ('private','shared','public')),
  -- added by migration 0010:
  personal_owner_id uuid references public.profiles(id) on delete cascade,
  constraint  lists_space_or_owner_chk check (space_id is not null or personal_owner_id is not null)
);
alter table public.lists enable row level security;
create policy "lists read all"   on public.lists for select using (true);
create policy "lists insert auth" on public.lists for insert with check (auth.uid() is not null);
create policy "lists update auth" on public.lists for update using (auth.uid() is not null);
create policy "lists delete auth" on public.lists for delete using (auth.uid() is not null);
create trigger lists_set_updated_at before update on public.lists
  for each row execute function public.tg_set_updated_at();
```

**statuses** (per-list, ordered, categorised)

```sql
create table public.statuses (
  id       uuid primary key default gen_random_uuid(),
  list_id  uuid not null references public.lists(id) on delete cascade,
  name     text not null,
  color    text not null default '#424242',
  category task_status_category not null default 'todo',
  "order"  integer not null default 0
);
```

**custom_field_defs** (per-list schema; values stored on the task JSONB)

```sql
create table public.custom_field_defs (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.lists(id) on delete cascade,
  name       text not null,
  field_type custom_field_type not null,
  -- config JSON: { options:[{value,label,color}], currency, required, default }
  config     jsonb not null default '{}',
  "order"    integer not null default 0,
  created_at timestamptz not null default now()
);
```

**tasks**

```sql
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  list_id       uuid not null references public.lists(id) on delete cascade,
  status_id     uuid references public.statuses(id) on delete set null,
  parent_id     uuid references public.tasks(id) on delete cascade,   -- subtask link
  title         text not null,
  description   text,
  priority      task_priority not null default 'none',
  due_date      date,
  start_date    date,
  time_estimate integer,                       -- minutes
  "order"       integer not null default 0,
  custom_fields jsonb not null default '{}',   -- { "<field_def_id>": <value> }
  assignee_ids  uuid[] not null default '{}',  -- DENORMALISED mirror of task_assignees
  tags          text[] not null default '{}',
  archived_at   timestamptz,
  completed_at  timestamptz,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tasks_list_id_idx   on public.tasks(list_id);
create index tasks_status_id_idx on public.tasks(status_id);
create index tasks_parent_id_idx on public.tasks(parent_id);
create index tasks_due_date_idx  on public.tasks(due_date) where due_date is not null;
create index tasks_assignees_idx on public.tasks using gin(assignee_ids);
-- trigger tasks_set_updated_at before update -> tg_set_updated_at()
```

**task_assignees** (join table; the source of truth — `tasks.assignee_ids` is kept in sync by trigger)

```sql
create table public.task_assignees (
  task_id     uuid not null references public.tasks(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);
-- added by migration 0006 (role/sort_order are real columns, not notes):
alter table public.task_assignees add column role       text    not null default 'secondary'; -- 'primary'|'secondary'
alter table public.task_assignees add column sort_order integer not null default 0;

alter table public.task_assignees enable row level security;
create policy "ta read all"   on public.task_assignees for select using (true);
create policy "ta insert auth" on public.task_assignees for insert with check (auth.uid() is not null);
create policy "ta delete auth" on public.task_assignees for delete using (auth.uid() is not null);
-- NOTE: there is NO update policy on task_assignees, yet setPrimaryAssignee() issues UPDATEs
--       on `role`. ⚠️ GAP — add an "update auth" policy or those writes fail under RLS.

-- Keeps the denormalised tasks.assignee_ids array in sync (security definer):
create function public.tg_sync_assignee_ids() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.tasks set assignee_ids =
      array(select profile_id from public.task_assignees where task_id = new.task_id)
      where id = new.task_id;
  elsif (tg_op = 'DELETE') then
    update public.tasks set assignee_ids =
      array(select profile_id from public.task_assignees where task_id = old.task_id)
      where id = old.task_id;
  end if;
  return null;
end; $$;
create trigger task_assignees_sync after insert or delete on public.task_assignees
  for each row execute function public.tg_sync_assignee_ids();
```

**comments**

```sql
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  author_id  uuid not null references public.profiles(id),
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- RLS here is stricter: insert/update/delete require auth.uid() = author_id
```

**Seed helper** (called when any list is created):

```sql
create function public.seed_default_statuses(p_list_id uuid) returns void ... as $$
  insert into public.statuses (list_id, name, color, category, "order") values
    (p_list_id, 'To Do',       '#94a3b8', 'todo',        0),
    (p_list_id, 'In Progress', '#3b82f6', 'in_progress', 1),
    (p_list_id, 'In Review',   '#f59e0b', 'in_progress', 2),
    (p_list_id, 'Done',        '#22c55e', 'done',        3),
    (p_list_id, 'Closed',      '#6b7280', 'closed',      4);
$$;
```

### 3.3 Space privacy & members (migration 0003)

```sql
alter table public.spaces add column privacy text not null default 'team';
-- 'team' = everyone signed-in sees it; 'private' = members only

create table public.space_members (
  space_id   uuid not null references public.spaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member',   -- 'admin' | 'member' | 'viewer'
  added_at   timestamptz not null default now(),
  primary key (space_id, profile_id)
);
alter table public.space_members enable row level security;
create policy "sm read all"   on public.space_members for select using (true);
create policy "sm insert auth" on public.space_members for insert with check (auth.uid() is not null);
create policy "sm update auth" on public.space_members for update using (auth.uid() is not null);
create policy "sm delete auth" on public.space_members for delete using (auth.uid() is not null);

-- Auto-add the space creator as 'admin' on insert:
create function public.tg_auto_add_space_creator() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.space_members (space_id, profile_id, role)
    values (new.id, new.created_by, 'admin') on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger space_auto_add_creator after insert on public.spaces
  for each row execute function public.tg_auto_add_space_creator();
```

Migration 0023 later adds a CHECK constraint: `space_members_role_chk check (role in ('admin','member','viewer'))`.

### 3.3b Lists `type`, list members, watchers (migration 0006 — `0006_task_lists_tendwell.sql`)

> **This migration was previously under-documented. It creates `list_members` and `task_watchers`,
> adds `lists.type` (§3.2), adds `task_assignees.role`/`sort_order` (§3.2), and wires two
> auto-membership triggers.** Exact DDL:

**list_members** (the per-list access grant table — central to the access model in §5)

```sql
create table public.list_members (
  list_id     uuid not null references public.lists(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member',   -- 'owner' | 'member'  (legacy; drives assignee color)
  color       text not null default '#6366f1',
  added_by    uuid references public.profiles(id) on delete set null,
  added_at    timestamptz not null default now(),
  primary key (list_id, profile_id)
);
alter table public.list_members enable row level security;
-- NOTE: list_members read is gated to signed-in users (NOT using(true)):
create policy "lm read all"   on public.list_members for select using (auth.uid() is not null);
create policy "lm insert auth" on public.list_members for insert with check (auth.uid() is not null);
create policy "lm update auth" on public.list_members for update using (auth.uid() is not null);
create policy "lm delete auth" on public.list_members for delete using (auth.uid() is not null);

-- access_level added by migration 0023:
alter table public.list_members add column access_level text not null default 'editor';
alter table public.list_members add constraint list_members_access_level_chk
  check (access_level in ('viewer','editor','admin'));

-- Auto-add the list creator as an 'owner' member on insert:
create function public.tg_auto_add_list_creator() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.list_members (list_id, profile_id, role, added_by)
    values (new.id, new.created_by, 'owner', new.created_by) on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger list_auto_add_creator after insert on public.lists
  for each row execute function public.tg_auto_add_list_creator();
```

> ⚠️ **GAP (legacy `role` vs. `access_level`):** the auto-add trigger sets `role='owner'` but does
> **not** set `access_level` (defaults to `'editor'`). The 0023 backfill (`role='owner' →
> access_level='admin'`) only runs once at migration time, so **lists created after 0023 give their
> creator `access_level='editor'`, not `'admin'`**. `getListAccessLevel` mitigates this by treating
> `role==='owner'` as `'admin'` when `access_level` is null — but it is **not** null here (it's
> `'editor'`), so a list creator may end up with editor (not admin) on their own list. ➕ RECOMMENDED:
> have the trigger insert `access_level='admin'` for owners, or have `createList` upsert the owner
> grant explicitly (as `getOrCreatePersonalList` does).

**task_watchers**

```sql
create table public.task_watchers (
  task_id    uuid not null references public.tasks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (task_id, profile_id)
);
alter table public.task_watchers enable row level security;
create policy "tw read all"   on public.task_watchers for select using (auth.uid() is not null);
create policy "tw insert auth" on public.task_watchers for insert with check (auth.uid() is not null);
create policy "tw delete auth" on public.task_watchers for delete using (auth.uid() is not null);

create index idx_list_members_profile on public.list_members(profile_id);
create index idx_task_watchers_task    on public.task_watchers(task_id);
create index idx_task_watchers_profile on public.task_watchers(profile_id);
```

### 3.4 List-view indexes (migration 0008)

```sql
create index idx_tasks_parent_id_non_null on public.tasks(parent_id) where parent_id is not null;
create index idx_tasks_list_parent        on public.tasks(list_id, parent_id);
create index idx_task_assignees_task_id   on public.task_assignees(task_id);
```

### 3.5 ClickUp-parity tables (migration 0009)

**checklists**

```sql
create table public.checklists (
  id uuid pk default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  name text not null default 'Checklist',
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);
```

**checklist_items**

```sql
create table public.checklist_items (
  id uuid pk default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  content text not null,
  completed boolean not null default false,
  assignee_id uuid references public.profiles(id),
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

**time_entries**

```sql
create table public.time_entries (
  id uuid pk default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_ms bigint,            -- computed on stop or entered manually
  created_at timestamptz not null default now()
);
```

**task_activity** (audit log)

```sql
create table public.task_activity (
  id uuid pk default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,          -- 'created','status_changed','priority_changed',...
  from_value jsonb,
  to_value jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_task_activity_task_id_created_at on public.task_activity(task_id, created_at desc);
```

**task_attachments**

```sql
create table public.task_attachments (
  id uuid pk default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploader_id uuid references public.profiles(id),
  file_name text not null,
  file_size bigint not null,
  mime_type text,
  storage_path text not null,
  created_at timestamptz not null default now()
);
```

**Two important triggers (migration 0009):**

```sql
-- 1) Log status changes into task_activity (fires only when status_id changes)
create function public.tg_log_task_status_change() ... 
create trigger tg_log_task_status_change after update on public.tasks for each row ...;

-- 2) Keep tasks.completed_at in sync with the status CATEGORY:
--    moving to a 'done' or 'closed' status sets completed_at = now();
--    any other status (or null) clears it.
create function public.tg_update_task_completed_at() ...
create trigger tg_update_task_completed_at before update on public.tasks for each row ...;
```

> **Why this matters for replication:** "done-ness" is derived from the status *category*, not a
> boolean. The DB trigger guarantees `completed_at` is correct even if a client forgets to set it.
> The client *also* sets `completed_at` optimistically for instant UI feedback.

### 3.6 Personal lists / "My Tasks" (migration 0010)

```sql
alter table public.lists alter column space_id drop not null;
alter table public.lists add column personal_owner_id uuid references public.profiles(id) on delete cascade;

-- exactly one personal list per user
create unique index lists_personal_owner_unique on public.lists (personal_owner_id)
  where personal_owner_id is not null;

-- a list must be anchored to EITHER a space OR a personal owner
alter table public.lists add constraint lists_space_or_owner_chk
  check (space_id is not null or personal_owner_id is not null);

create index lists_personal_owner_idx on public.lists (personal_owner_id)
  where personal_owner_id is not null;
```

### 3.7 Recurring tasks (migration 0011)

```sql
alter table public.tasks add column recurrence_rule jsonb;        -- shape in §7
alter table public.tasks add column recurrence_count integer not null default 0;
create index tasks_recurring_idx on public.tasks ((recurrence_rule is not null))
  where recurrence_rule is not null;
```

`recurrence_rule` JSON shape (all optional unless noted):

```jsonc
{
  "pattern": "daily|weekly|monthly|yearly",   // REQUIRED
  "interval": 1,                               // every N units; default 1
  "days_of_week": [1,3,5],                     // 0=Sun..6=Sat (weekly only)
  "day_of_month": 15,                          // 1..31 (monthly only)
  "anchor": "due_date",                        // "due_date" | "completion"; default due_date
  "ends": { "type": "never" }                  // | {type:"on",date:"YYYY-MM-DD"} | {type:"after",count:N}
}
```

### 3.8 Granular list access (migration 0023 — `0023_work_access_controls.sql`)

> `list_members` itself is created in **migration 0006** (§3.3b), not 0002/0003. Migration 0023
> adds `access_level`, constrains `space_members.role`, adds per-user indexes, and ships two SQL
> helper functions that mirror the TypeScript access logic (used by RPC callers / future RLS).

```sql
alter table public.list_members add column access_level text not null default 'editor';
alter table public.list_members add constraint list_members_access_level_chk
  check (access_level in ('viewer','editor','admin'));
update public.list_members set access_level='admin' where role='owner' and access_level='editor';

alter table public.space_members add constraint space_members_role_chk
  check (role in ('admin','member','viewer'));

create index list_members_profile_id_idx  on public.list_members  (profile_id);
create index space_members_profile_id_idx on public.space_members (profile_id);
```

**SQL access helpers (the DB-side mirror of §5):**

```sql
create function public.work_access_rank(level text) returns int language sql immutable as $$
  select case lower(coalesce(level,''))
    when 'admin' then 3 when 'editor' then 2 when 'member' then 2 when 'viewer' then 1 else 0 end;
$$;

-- Returns true if (user, list) has >= p_min_level. Walks: super_admin → personal owner →
-- explicit list_members grant → inherited space_members grant → shared/public + team fallback.
create function public.user_has_list_access(p_user_id uuid, p_list_id uuid, p_min_level text default 'viewer')
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_role text; v_space_id uuid; v_list_type text; v_personal_owner uuid;
        v_required int := work_access_rank(p_min_level); v_have int := 0;
begin
  if p_user_id is null then return false; end if;
  select role into v_role from public.profiles where id = p_user_id;
  if v_role = 'super_admin' then return true; end if;
  select space_id, type, personal_owner_id into v_space_id, v_list_type, v_personal_owner
    from public.lists where id = p_list_id;
  if not found then return false; end if;
  if v_personal_owner is not null then return v_personal_owner = p_user_id; end if;
  select work_access_rank(access_level) into v_have from public.list_members
    where list_id = p_list_id and profile_id = p_user_id limit 1;
  if v_have >= v_required then return true; end if;
  if v_space_id is not null then
    select work_access_rank(role) into v_have from public.space_members
      where space_id = v_space_id and profile_id = p_user_id limit 1;
    if v_have >= v_required then return true; end if;
  end if;
  if v_list_type in ('shared','public') then
    if v_space_id is null then return v_required <= 2; end if;  -- editor+
    declare v_privacy text;
    begin
      select privacy into v_privacy from public.spaces where id = v_space_id;
      if v_privacy = 'team' then return v_required <= 2; end if;
    end;
  end if;
  return false;
end; $$;
grant execute on function public.user_has_list_access(uuid,uuid,text) to authenticated;
```

> ⚠️ Note: `user_has_list_access` exists but **the server actions do NOT call it** — they
> re-implement the same logic in TypeScript (`getListAccessLevel`, §5.4). It is, however, the
> ready-made building block if you decide to harden RLS (§15.1).

### 3.9 Full-text search (migration 0031 — used by the global view, not /my-tasks)

```sql
create extension if not exists pg_trgm;
alter table public.tasks add column search_vector tsvector;

-- weighted vector: title (A) + description (B) + joined comment bodies (C)
create function public.tasks_search_vector(p_task_id uuid) returns tsvector ...;

-- recompute on task title/description change AND on any comment change to that task
create trigger tasks_search_vector_trg before insert or update of title, description ...;
create trigger ... on public.comments ...;   -- recomputes parent task's vector
```

Query side uses `websearch_to_tsquery('english', term)` for terms ≥ 3 chars, falling back to
`ilike` for 1–2 char queries.

**notifications** (same migration 0031; backs the in-app notification center — **optional** for a
pure `/my-tasks` replication, see §8):

```sql
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  kind         text not null,           -- 'task_assigned','task_status_changed','task_due_changed',
                                         -- 'task_comment_added','task_completed',...
  subject_type text not null,           -- 'task' | 'property' | 'system'
  subject_id   uuid,                     -- nullable for system-wide pings
  subject_url  text,                     -- relative deep-link URL
  title        text not null,
  body         text,
  metadata     jsonb not null default '{}'::jsonb,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.notifications enable row level security;
-- These policies ARE properly per-row (unlike the Work tables):
create policy "notifications read own"   on public.notifications for select using (recipient_id = auth.uid());
create policy "notifications update own"  on public.notifications for update using (recipient_id = auth.uid());
create policy "notifications insert auth" on public.notifications for insert with check (auth.uid() is not null);
create policy "notifications delete own"  on public.notifications for delete using (recipient_id = auth.uid());
```

### 3.10 Storage bucket (attachments) — `supabase/storage/task-attachments-bucket.sql`

**Current (as shipped) — private 10 MB bucket, but the object policies are too broad:**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-attachments','task-attachments', false, 10485760, null)  -- private, 10MB, any mime
on conflict (id) do update set file_size_limit = excluded.file_size_limit, public = excluded.public;

create policy "task-attachments upload auth" on storage.objects for insert
  with check (bucket_id = 'task-attachments' and auth.uid() is not null);
create policy "task-attachments read auth"   on storage.objects for select
  using (bucket_id = 'task-attachments' and auth.uid() is not null);
create policy "task-attachments delete auth" on storage.objects for delete
  using (bucket_id = 'task-attachments' and auth.uid() is not null);
```

> 🔴 **SECURITY GAP (confirmed):** these policies let **any signed-in user read or delete *any*
> object in the bucket**, regardless of which task/list it belongs to. The bucket is private (no
> public URL), but cross-tenant read/delete is possible for authenticated users. The
> `storage_path` convention is `"{userId}/{taskId}/{timestamp}_{filename}"`, so the *uploader's*
> id is the first path segment — usable to at least scope **delete** to the owner.
>
> ➕ **RECOMMENDED hardened policies** (scope read/delete; ideally also check list access via the
> `tasks`/`task_attachments` join so only people with list access can read):
>
> ```sql
> -- delete only your own uploads (first path segment = uploader id)
> create policy "task-attachments delete own" on storage.objects for delete
>   using (bucket_id='task-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
>
> -- read only objects attached to a task on a list you can access
> create policy "task-attachments read scoped" on storage.objects for select
>   using (
>     bucket_id='task-attachments' and exists (
>       select 1 from public.task_attachments ta
>       join public.tasks t on t.id = ta.task_id
>       where ta.storage_path = storage.objects.name
>         and public.user_has_list_access(auth.uid(), t.list_id, 'viewer')
>     )
>   );
> ```
>
> Also ➕ RECOMMENDED: set `allowed_mime_types` instead of `null`, and sanitize `file.name` before
> building the path (today it is interpolated raw — see §15.11).

---

## 4. TypeScript Domain Types

> File: `lib/work/types.ts`. These mirror the schema as plain interfaces (no generated Supabase
> client). Reproduce verbatim.

### 4.1 Enums / unions

```ts
export type TaskStatusCategory = "todo" | "in_progress" | "done" | "closed";
export type ListType = "private" | "shared" | "public";
export type ListMemberRole = "owner" | "member";
export type ListAccessLevel = "viewer" | "editor" | "admin";
export type AssigneeRole = "primary" | "secondary";
export type TaskPriority = "urgent" | "high" | "normal" | "low" | "none";
export type CustomFieldType =
  | "text" | "number" | "currency" | "percent"
  | "select" | "multi_select"
  | "date" | "checkbox" | "url" | "email" | "phone"
  | "people" | "labels";
export type SpacePrivacy = "team" | "private";
export type SpaceMemberRole = "admin" | "member" | "viewer";

export type ActivityAction =
  | "created" | "status_changed" | "assignee_added" | "assignee_removed"
  | "priority_changed" | "title_changed" | "description_changed"
  | "due_date_changed" | "start_date_changed" | "comment_added" | "comment_deleted"
  | "attachment_added" | "attachment_deleted" | "checklist_added"
  | "checklist_item_completed" | "archived" | "unarchived";
```

### 4.2 Recurrence types

```ts
export type RecurrencePattern = "daily" | "weekly" | "monthly" | "yearly";
export type RecurrenceAnchor = "due_date" | "completion";
export type RecurrenceEnd =
  | { type: "never" }
  | { type: "on"; date: string }      // ISO yyyy-mm-dd
  | { type: "after"; count: number };
export interface RecurrenceRule {
  pattern: RecurrencePattern;
  interval: number;                   // every N units (default 1)
  days_of_week?: number[];            // 0=Sun..6=Sat (weekly)
  day_of_month?: number;              // 1..31 (monthly)
  anchor?: RecurrenceAnchor;          // default "due_date"
  ends: RecurrenceEnd;
}
```

### 4.3 Core entities (exact interfaces)

```ts
export interface Space {
  id: string; name: string; description: string | null;
  color: string; icon: string; order: number;
  privacy: SpacePrivacy; archived_at: string | null;
  created_by: string | null; created_at: string; updated_at: string;
}
export interface Folder {
  id: string; space_id: string; name: string; order: number;
  archived_at: string | null; created_by: string | null;
  created_at: string; updated_at: string;
}
export interface List {
  id: string; space_id: string | null; folder_id: string | null;
  personal_owner_id: string | null; name: string; description: string | null;
  order: number; type: ListType; archived_at: string | null;
  created_by: string | null; created_at: string; updated_at: string;
}
export interface ListMember {
  list_id: string; profile_id: string; role: ListMemberRole;
  access_level: ListAccessLevel; color: string;
  added_by: string | null; added_at: string;
  profile?: { id: string; full_name: string | null; email: string; avatar_url: string | null };
}
export interface Status {
  id: string; list_id: string; name: string; color: string;
  category: TaskStatusCategory; order: number;
}
export interface CustomFieldDef {
  id: string; list_id: string; name: string; field_type: CustomFieldType;
  config: Record<string, unknown>; order: number; created_at: string;
}
export type FieldDef = CustomFieldDef;

export interface Task {
  id: string; list_id: string; status_id: string | null; parent_id: string | null;
  title: string; description: string | null; priority: TaskPriority;
  due_date: string | null; start_date: string | null; time_estimate: number | null;
  order: number; custom_fields: Record<string, unknown>;
  assignee_ids: string[]; tags: string[];
  archived_at: string | null; completed_at: string | null;
  created_by: string | null; created_at: string; updated_at: string;
  recurrence_rule: RecurrenceRule | null; recurrence_count: number;
}
export interface Comment {
  id: string; task_id: string; author_id: string; body: string;
  created_at: string; updated_at: string;
}
export interface Checklist { id: string; task_id: string; name: string; order: number; created_at: string; }
export interface ChecklistItem {
  id: string; checklist_id: string; content: string; completed: boolean;
  assignee_id: string | null; order: number; created_at: string; completed_at: string | null;
}
export interface TimeEntry {
  id: string; task_id: string; user_id: string; description: string | null;
  started_at: string; ended_at: string | null; duration_ms: number | null; created_at: string;
}
export interface TaskActivity {
  id: string; task_id: string; actor_id: string | null;
  action: ActivityAction | string;
  from_value: Record<string, unknown> | null; to_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>; created_at: string;
}
export interface TaskAttachment {
  id: string; task_id: string; uploader_id: string | null;
  file_name: string; file_size: number; mime_type: string | null;
  storage_path: string; created_at: string;
}
export interface TaskWatcher { task_id: string; profile_id: string; added_at: string; }
```

### 4.4 Composite / view types

```ts
export interface TaskWithRelations extends Task {
  status: Status | null;
  subtask_count: number;
  assignees: { id: string; full_name: string | null; avatar_url: string | null }[];
}
// Returned by getTasksForListView — the shape the list view consumes:
export type TaskWithSubtasks = TaskWithRelations & {
  subtasks_done: number;
  subtask_list: TaskWithRelations[];
};
export interface FlatTask extends TaskWithRelations { depth: number; children: FlatTask[]; }
export interface SpaceTree extends Space {
  folders: (Folder & { lists: List[] })[];
  lists: List[];                       // lists directly under the space (no folder)
}
// Global view types:
export interface GlobalTask extends TaskWithRelations {
  list: Pick<List,"id"|"name"|"type"> & { space_id: string };
  space: Pick<Space,"id"|"name"|"color">;
}
export interface GlobalTaskFilters {
  search?: string; statuses?: string[]; priorities?: TaskPriority[];
  assignee_ids?: string[]; list_ids?: string[]; space_ids?: string[];
  due?: "all"|"overdue"|"today"|"this_week"|"none";
  include_archived?: boolean; include_completed?: boolean;
  page?: number; page_size?: number;
}
export interface PaginatedTasks { tasks: GlobalTask[]; total: number; page: number; page_size: number; has_more: boolean; }
```

### 4.5 Input types for actions

```ts
export type CreateSpaceInput  = Pick<Space,"name"> & Partial<Pick<Space,"description"|"color"|"icon">>;
export type CreateFolderInput = Pick<Folder,"space_id"|"name">;
export type CreateListInput   = Pick<List,"space_id"|"name"> & Partial<Pick<List,"folder_id"|"description"|"type">>;
export type CreateTaskInput   = Pick<Task,"list_id"|"title"> &
  Partial<Pick<Task,"status_id"|"parent_id"|"description"|"priority"|"due_date"|"start_date"|"time_estimate"|"tags">>;
export type UpdateTaskInput   = Partial<Pick<Task,
  "title"|"description"|"status_id"|"priority"|"due_date"|"start_date"|"time_estimate"|
  "order"|"tags"|"custom_fields"|"archived_at"|"completed_at"|"parent_id"|"recurrence_rule">>;
```

---

## 5. Access-Control Model

> Implemented in `lib/work/actions.ts` (helpers near the top). RLS is permissive; **these helpers
> are the real gate**. Reproduce this logic exactly or you'll either leak private lists or lock
> people out.

### 5.1 Rank table

```ts
const ACCESS_RANK = { admin: 3, editor: 2, member: 2, viewer: 1 };  // unknown -> 0
```

`member` (a space role) is editor-equivalent on lists.

### 5.2 Permissions source

`getPermissions()` (from `lib/auth/permissions.ts`, wrapped in React `cache()`) returns:

```ts
type CurrentPermissions = {
  user_id: string | null; email: string | null;
  role: "user" | "admin" | "super_admin";
  has_any_hr_access: boolean; is_super_admin: boolean; is_admin_or_above: boolean;
};
```

- Anonymous → all-false defaults.
- Reads `profiles.role`; auto-creates a `profiles` row (role `user`) via service-role client if missing.
- `is_super_admin = role === "super_admin"`.

### 5.3 Space access — `getSpaceAccessLevel(spaceId)`

Returns `SpaceMemberRole | null`:
1. No user → `null`. Super admin → `"admin"`.
2. Load `spaces.privacy`. If missing → `null`.
3. If a `space_members` row exists → that `role`.
4. Else if `privacy = 'team'` → default `"member"` (everyone signed-in).
5. Else → `null`.

### 5.4 List access — `getListAccessLevel(listId)` (the important one)

Returns `ListAccessLevel | null`:
1. No user → `null`. Super admin → `"admin"`.
2. Load `lists.{space_id, type, personal_owner_id}`.
3. **Personal list:** if `personal_owner_id` set → `"admin"` iff it's the caller, else `null`.
   *(This is what makes "My Tasks" private to its owner.)*
4. Explicit `list_members` row → `access_level` (fallback: `role==='owner' ? 'admin' : 'editor'`).
5. Inherited from parent space: if `getSpaceAccessLevel(space_id)` is non-null →
   `admin→admin`, `viewer→viewer`, `member→` (`'editor'` only if list type ≠ `private`, else `null`).
6. Public list with no space → `"editor"` for any signed-in user.
7. Else → `null`.

Helpers:
```ts
hasListAccess(listId, min='viewer'): Promise<boolean>          // rank(level) >= rank(min)
requireListAccess(listId, min='viewer'): throws if not allowed
requireSpaceAccess(spaceId, min='viewer'): throws if not allowed
visibleSpaceIds(): string[] | null   // null = "everything" (super admin); used to filter trees
```

### 5.5 Where each mutation gates

- `createTask` / `updateTask` / `deleteTask` / `setTaskFieldValue`(implicitly) → `requireListAccess(listId, "editor")`.
- `updateList` / `deleteList` / list-member mgmt / `updateListType` → `requireListAccess(listId, "admin")`.
- `getTasks*` / `getStatuses` / `getCustomFieldDefs` / `getListMembers` → return `[]` if `!hasListAccess(listId,"viewer")`.
- `createList` → `requireSpaceAccess(space_id, "member")` (if anchored to a space).
- Space CRUD/members/privacy → `requireSpaceAccess(spaceId, "admin")`.

---

## 6. Server Actions (the full API surface)

> File: `lib/work/actions.ts` (`"use server"`). Helpers: `db()` returns the Supabase server
> client (throws if unconfigured); `currentUserId()` throws `"Not authenticated"` if no session.
> Cache invalidation is **not uniform** — see the authoritative table in **§15.7**. In short:
> the core space/folder/list/task/member CRUD revalidates both `/work` (layout) and `/my-tasks`;
> the later ClickUp-parity CRUD (statuses, custom fields, checklists, time, comments,
> attachments) revalidates **only** `/work`, so `/my-tasks` will not auto-refresh after those
> until the next full load. This is a real inconsistency, not a doc simplification.

### 6.1 Spaces / Folders / Lists

| Action | Signature | Notes |
|---|---|---|
| `getSpaces()` | `() => Space[]` | filtered by `visibleSpaceIds()`, non-archived, ordered |
| `getSpaceTree()` | `() => SpaceTree[]` | spaces→folders→lists, fully access-filtered in JS (no N+1) |
| `createSpace(input)` | `CreateSpaceInput => Space` | appends at max order |
| `updateSpace(id, patch)` / `deleteSpace(id)` | admin-gated |
| `createFolder` / `updateFolder` / `deleteFolder` | per Space |
| `getList(id)` | `=> List \| null` | null if no viewer access |
| `createList(input)` | seeds default statuses via RPC `seed_default_statuses` |
| `updateList(id, {name,description,type})` / `deleteList(id)` | admin-gated |
| **`getOrCreatePersonalList()`** | `() => List` | **the My Tasks anchor — see below** |

**`getOrCreatePersonalList()`** (reproduce exactly):
```ts
// find lists where personal_owner_id = userId (maybeSingle). If exists, return.
// else insert { space_id:null, folder_id:null, personal_owner_id:userId,
//   name:"My Tasks", description:"Your personal task list.", order:0, type:"private", created_by:userId }
// then: rpc seed_default_statuses({p_list_id});
//       upsert list_members { list_id, profile_id:userId, role:"owner", color:"#FF564E", added_by:userId }
```

### 6.2 Statuses

| Action | Signature |
|---|---|
| `getStatuses(listId)` | `=> Status[]` (viewer-gated) |
| `createStatus(listId, {name,color,category,order?})` | appends at end if no order |
| `updateStatus(id, patch)` | patch of name/color/category/order |
| `deleteStatus(id, reassignTo?)` | **refuses if tasks still use it unless `reassignTo` given**; moves tasks then deletes |
| `reorderStatuses(listId, idsInOrder)` | writes `order = index` |

### 6.3 Custom fields

| Action | Signature |
|---|---|
| `getCustomFieldDefs(listId)` | `=> CustomFieldDef[]` (viewer-gated) |
| `createFieldDef(listId, {name, field_type, config?})` | appends at end |
| `createCustomFieldDef({list_id,name,field_type,config?})` | simpler variant |
| `updateFieldDef(id, patch)` / `deleteFieldDef(id)` | — |
| `reorderFieldDefs(listId, idsInOrder)` | — |
| **`setTaskFieldValue(taskId, fieldDefId, value)`** | merges into `tasks.custom_fields`; `value=null` deletes the key |

### 6.4 Tasks (core)

| Action | Signature | Behaviour |
|---|---|---|
| `getTasks(listId, {includeArchived?})` | `=> TaskWithRelations[]` | top-level only (`parent_id is null`), resolves assignee profiles in one batch query |
| `getTask(id)` | `=> Task \| null` | raw row |
| **`getTasksForListView(listId)`** | `=> TaskWithSubtasks[]` | **what the list view uses.** Fetches ALL rows (parents + subtasks) in one query, computes `subtask_count` + `subtasks_done`, attaches `subtask_list`, returns only parents |
| `getTasksWithHierarchy(listId)` | `=> FlatTask[]` | builds a tree and flattens depth-first with `depth` |
| `createTask(input)` | `=> Task` | editor-gated; if no `status_id`, auto-assigns first `todo` status; appends at max order within (list, parent) |
| **`updateTask(id, input)`** | `=> void` | editor-gated; see completion + recurrence + notifications below |
| `duplicateTask(taskId)` | `=> Task` | shallow copy — see §15.8 for the exact field list and what is **not** copied (subtasks, comments, checklists, attachments, assignees, watchers, recurrence). ⚠️ **no access gate** (§15.3) |
| `deleteTask(id)` | editor-gated hard delete (cascades subtasks/comments/etc.) |
| `reorderTask(taskId, newParentId, newOrder)` | single move/reparent |
| `reorderTasks(updates[])` | batch `{id, order, parent_id?}` in parallel |

**`updateTask` exact flow:**
1. Load prior `{list_id, title, status_id, due_date}`; `requireListAccess(list_id,"editor")`.
2. If `input.status_id` provided, look up its status `category`: if `done`/`closed` set
   `input.completed_at = now()` and mark `justCompleted`; else set `completed_at = null`.
3. Write the update.
4. If `justCompleted` → `rolloverRecurringTask(id)` (best-effort; errors logged, not thrown).
5. Fire-and-forget notifications (see §8): task_completed / task_status_changed / task_due_changed.
6. `revalidatePath`.

### 6.5 Assignees & watchers

| Action | Signature |
|---|---|
| `addAssignee(taskId, profileId, role="secondary")` | upsert join row + `task_assigned` notification |
| `removeAssignee(taskId, profileId)` | delete join row |
| `setPrimaryAssignee(taskId, profileId)` | demote all to secondary, upsert target as primary |
| `getMembers()` | `=> {id, full_name, email, avatar_url}[]` (all profiles, ordered by name) |
| `getWatchers(taskId)` / `addWatcher` / `removeWatcher` | task_watchers CRUD |

### 6.6 Comments

| Action | Signature | Notes |
|---|---|---|
| `getComments(taskId)` | joins `author:profiles` | ordered ascending |
| `createComment(taskId, body)` | inserts + `task_comment_added` notification (140-char preview) |
| `addComment(taskId, body)` | same insert, **no** notification (used by drawer) |
| `deleteComment(id)` | author-scoped delete |

### 6.7 Checklists

`createChecklist(taskId, name="Checklist")`, `renameChecklist`, `deleteChecklist`,
`getChecklists(taskId)` (returns `(Checklist & {items: ChecklistItem[]})[]`),
`addChecklistItem(checklistId, content)`, `toggleChecklistItem(id)` (flips `completed` +
sets/clears `completed_at`), `updateChecklistItemContent(id, content)`, `deleteChecklistItem(id)`,
`reorderChecklistItems(checklistId, idsInOrder)`.

### 6.8 Time tracking

`startTimer(taskId, description?)` (refuses if the user already has an open timer),
`stopTimer(entryId)` (computes `duration_ms`), `addManualTimeEntry(taskId, {startedAt, endedAt, description?})`
(validates positive duration), `deleteTimeEntry(id)`, `getActiveTimer(userId)`,
`getTaskTimeTotal(taskId) => {task_id, total_ms, entries}`.

### 6.9 Activity & attachments

`getTaskActivity(taskId, limit=50) => TaskActivityWithActor[]` (joins actor profile, desc).
`uploadAttachment(taskId, file)` (uploads to `task-attachments` at
`{userId}/{taskId}/{Date.now()}_{name}`, inserts metadata, rolls back the object if metadata fails),
`getTaskAttachments(taskId)`, `deleteAttachment(id)` (removes storage object then row).

### 6.10 Global / cross-list

`getGlobalTasks(filters)` and `getGlobalTasksPaginated(filters)` — aggregate across lists/spaces
with visibility filtering done in JS (super admin sees all; else explicit list grant, or
shared/public list with space access). Date filters (`overdue/today/this_week/none`) applied in JS
with inline `startOfDay/endOfDay/startOfWeek/endOfWeek`. `setTaskStatusByCategory(taskId, category)`
moves a task to the first status of a given category in its list (used by board drag-drop).

---

## 7. Recurrence Engine

> File: `lib/work/recurrence.ts`. Pure functions; the server is the source of truth for rollover.

### 7.1 `computeNextOccurrence(rule, prevDue, completedAt) => string | null`

- `interval = max(1, rule.interval ?? 1)`; `anchor = rule.anchor ?? "due_date"`.
- **Base date**: if `anchor==="completion"` OR no `prevDue` → use `completedAt`; else parse `prevDue`
  (`new Date(`${s}T00:00:00`)` — local, not UTC, matching how `due_date` is stored).
- By pattern:
  - `daily`: `base + interval days`.
  - `weekly`: if `days_of_week` given, find next weekday after base; if none later this week, wrap
    `7*interval - baseDay + days[0]`; else `base + 7*interval days`.
  - `monthly`: `base + interval months`; if `day_of_month`, clamp to `min(day_of_month, lastDayOfMonth)`.
  - `yearly`: `base + interval years`.
- If `rule.ends.type==="on"` and `next > ends.date` → return `null`.
- Returns `yyyy-mm-dd` (local) via `toIsoDate`.

### 7.2 `summarizeRule(rule) => string`

Human label, e.g. `"Every 2 weeks on Mon, Wed"`, `"Every month until 2026-12-31"`,
`"Every day, 10×"`. `null` → `"Doesn't repeat"`.

### 7.3 Rollover (server, inside `updateTask`)

`rolloverRecurringTask(taskId)`:
1. Load `{due_date, start_date, recurrence_rule, recurrence_count, completed_at, list_id}`.
2. If no rule → no-op. If `ends.type==="after"` and `recurrence_count >= count` → stop.
3. `nextDue = computeNextOccurrence(rule, due_date, completed_at ?? now)`. If null → stop.
4. If both `start_date` and `due_date` existed, shift `start_date` by the same delta so the lead
   time is preserved.
5. Find the list's first `todo` status; reopen the **same row** with `{due_date:nextDue,
   completed_at:null, recurrence_count+1, start_date?, status_id: todoStatus}`.

> **Design choice:** the same task row is reused (not cloned) so checklists/comments/watchers/
> attachments ride along — matching ClickUp's default recurring behaviour.

---

## 8. Notifications Integration

> File: `lib/notifications/actions.ts`. Best-effort: failures are logged, never thrown, never
> block the task mutation (always called inside a fire-and-forget IIFE).

- `deliverNotifications({recipientIds, actorId, kind, subjectType, subjectId, subjectUrl, title, body?, metadata?})`
  — inserts one `notifications` row per recipient; **dedups and drops the actor's own id**.
- `notifyTaskWatchers({taskId, actorId, kind, title, body?, metadata?})` — unions
  `task_watchers.profile_id` ∪ `tasks.assignee_ids`, then calls `deliverNotifications` with
  `subjectType:"task"`, `subjectUrl: \`/work/tasks?task=${taskId}\``.

Emitted kinds: `task_completed`, `task_status_changed`, `task_due_changed` (from `updateTask`),
`task_comment_added` (from `createComment`), `task_assigned` (from `addAssignee`).

> Notifications are optional for replication; if you drop them, just remove the IIFE blocks.

---

## 9. The "My Tasks" Page (route composition)

> Route: `app/(app)/my-tasks/`. Three files: `page.tsx`, `loading.tsx`, `error.tsx`.

### 9.1 `page.tsx` (server component)

```tsx
import type { Metadata } from "next";
export const dynamic = "force-dynamic";        // never statically cached

import {
  getOrCreatePersonalList, getStatuses, getCustomFieldDefs,
  getListMembers, getMembers, getTasksForListView,
} from "@/lib/work/actions";
import { ListViewTable } from "@/components/work/list-view-table";
import { requireUser } from "@/lib/auth/user";

export const metadata: Metadata = { title: "My Tasks — Haven OS" };

export default async function MyTasksPage() {
  const user = await requireUser();                 // redirects to /login if no session
  const list = await getOrCreatePersonalList();      // creates the personal list on first visit

  const [tasks, statuses, fieldDefs, listMembers, allMembers] = await Promise.all([
    getTasksForListView(list.id),
    getStatuses(list.id),
    getCustomFieldDefs(list.id),
    getListMembers(list.id),
    getMembers(),
  ]);

  // Members visible in pickers = owner + any explicit list members
  const memberIdSet = new Set(listMembers.map((m) => m.profile_id));
  memberIdSet.add(user.id);
  const members = allMembers.filter((m) => memberIdSet.has(m.id));

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-heading text-display-3 font-bold">My Tasks</h1>
          <p className="text-[13px] text-muted-foreground">
            Your personal task list — private to you.
          </p>
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">{tasks.length} total</span>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <ListViewTable list={list} tasks={tasks} statuses={statuses}
                       fieldDefs={fieldDefs} members={members} />
      </div>
    </div>
  );
}
```

Key points to replicate:
- It lives at the **top level of the `(app)` shell**, deliberately *bypassing* the Work layout
  (so there's no Spaces tree sidebar) — but uses the **exact same `ListViewTable`** as every list.
- `getOrCreatePersonalList()` is what makes the inbox appear on first visit with seeded statuses.

### 9.2 `loading.tsx`

```tsx
import { TableSkeleton } from "@/components/shell/loading-skeleton";
export default function MyTasksLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-32 animate-pulse rounded bg-muted/60 dark:bg-muted/30" />
      <TableSkeleton rows={8} />
    </div>
  );
}
```

### 9.3 `error.tsx`

```tsx
"use client";
import { ErrorFallback } from "@/components/shell/error-fallback";
export default function MyTasksError({ error, reset }:
  { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback error={error} reset={reset}
      title="Couldn't load My Tasks"
      description="Your task inbox didn't come back from the server. Try again." />
  );
}
```

### 9.4 The `(app)` shell layout (`app/(app)/layout.tsx`)

```tsx
export const dynamic = "force-dynamic";
// ...imports
export default async function AppLayout({ children }) {
  const user = await requireUser();
  const [canScorecard, canAgents, canHr, canSales, unread] = await Promise.all([...]);
  return (
    <div className="flex min-h-dvh">
      <Sidebar user={user} .../>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} initialUnread={unread} />
        <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
      <CommandPalette />
      <Toaster richColors position="bottom-right" />   {/* sonner — REQUIRED for toasts */}
    </div>
  );
}
```

> For replication, the only hard requirements from the shell are: (a) an auth gate, (b) a
> `<Toaster richColors position="bottom-right" />` from `sonner` mounted once, (c) `next-themes`
> dark-mode wiring lives in the **root** `app/layout.tsx` (`darkMode: "class"`).

---

## 10. Component Architecture & Tree

All under `components/work/` unless noted. Sizes show relative complexity.

```
ListViewTable                    (list-view-table.tsx)  ── the heart of /my-tasks
├── header: title + done badge + settings + Add task
├── filter pills (All/Open/To Do/In Progress/Done) + search box
├── column header row (sticky)
├── DndContext (single, wraps ALL status groups)
│   └── SortableContext (all task ids)
│       └── per status group:
│           ├── group header (collapsible chevron + colored dot + count)
│           └── DroppableGroupZone  (id="group:<statusId>")
│               ├── SortableTaskRow × N            (id=<taskId>)
│               │   ├── checkbox col
│               │   ├── drag handle (GripVertical)
│               │   ├── ListTaskRow                (list-task-row.tsx)
│               │   │   ├── nest drop zone (id="nest:<taskId>") on chevron
│               │   │   ├── StatusPickerPopover → status circle (Circle/CheckCircle2)
│               │   │   ├── InlineTitle (click=open drawer, dblclick=edit)
│               │   │   ├── "+ subtask" hover button + inline add form
│               │   │   ├── PriorityCell (dropdown)
│               │   │   ├── AssigneeCell (avatar stack + dropdown)
│               │   │   ├── DueDateCell (native date input, relative label)
│               │   │   └── subtask count badge ({done}/{total})
│               │   ├── StatusPickerPopover → StatusPill (status column)
│               │   └── CustomFieldCell × fieldDefs   (custom-field-cell.tsx)
│               ├── (expanded subtasks rendered as depth=1 SortableTaskRows)
│               └── ListAddRow (per group)           (list-add-row.tsx)
├── DragOverlay → TaskDragOverlay (tilted floating card)
├── context menu (right-click: Delete / Duplicate)
├── TaskDetailDrawer (when a task is opened)         (task-detail-drawer.tsx)
├── ListSettingsPanel (when settings opened)         (list-settings-panel.tsx)
└── BulkActionsBar (floating, when ≥1 selected)      (bulk-actions-bar.tsx)

Supporting:
  StatusPill                     (status-pill.tsx)
  StatusPickerPopover            (status-picker-popover.tsx)
  MentionInput / MentionText     (mention-input.tsx)
  TaskDetailDrawer sub-parts: FieldRow, PriorityPicker, DatePickerField,
    AssigneesField, WatchersField, RecurrencePicker, ChecklistSection,
    ChecklistItemRow, ManualTimeEntry
UI primitives (components/ui/): button, input, badge, popover, tabs
Shell (components/shell/): loading-skeleton (TableSkeleton), error-fallback (ErrorFallback)
```

---

## 11. Component-by-Component UI/UX Spec

### 11.1 `ListViewTable` (`list-view-table.tsx`, ~1360 lines) — the core

**Props**
```ts
{ list: List; tasks: TaskWithSubtasks[]; statuses: Status[];
  fieldDefs: CustomFieldDef[]; members: {id;full_name;avatar_url}[] }
```

**Local state**
- `tasks` (seeded from `initialTasks`; re-synced in a `useEffect` when the prop changes — server refresh).
- `selectedTaskId` (drawer), `settingsOpen`, `search`, `statusFilter` (`"all"`), fixed `sortKey="order"`,
  `sortDir="asc"`, `groupBy="status"`.
- `expandedGroups` (Set, **initialised to all status ids** — every group open by default).
- `expandedSubtasks` (Set), `contextMenu` ({taskId,x,y}|null), `selectedIds` (Set), `focusedTaskId`,
  `activeDragTaskId`, a `useTransition`.

**Derived**
- `stats = {total, done, open}` (done = status category done|closed).
- `filtered` = search (title+description, case-insensitive) → status-filter → sort by `order`.
- `groups` = Map seeded with every status (+ a `"__none__"` bucket), tasks pushed by `status_id`.
- `allTaskIds` = flattened ids across groups (single `SortableContext`).
- `taskStatusMap` = `Map<taskId, statusId>`.

**Header**: `<h1 class="font-heading text-xl font-bold">{list.name}</h1>` + `<Badge tone="neutral">{done}/{total} done</Badge>`;
right side: ghost icon `Settings2` (toggles settings panel) and a primary `Add task` button that
programmatically clicks `[data-add-task-trigger]`.

**Filter row**: pill buttons `All (n)`, `Open (n)`, `To Do`, `In Progress`, `Done`. Active pill:
`border-accent bg-accent text-accent-foreground`; inactive: `border-border text-muted-foreground
hover:bg-surface-alt`. Search input (`Input`, `h-8 w-44 pl-8 text-xs`) with a leading `Search` icon.

**Column header** (sticky, `z-20`, `bg-surface-alt/80 backdrop-blur-sm`, `text-[10px] font-bold
uppercase tracking-wider`): select-all checkbox (w-9), drag spacer (w-6), `Task` (flex-1, sticky
left), then fixed `ColHeader`s: **Status (112) · Priority (80) · Assignee (72) · Due Date (96) ·
Sub (56)**, then one 112-wide `ColHeader` per custom field.

**Groups**: each group is a collapsible `<button>` header (`ChevronDown/ChevronRight`, a 2.5×2.5
colored dot = status color, uppercase name, count). Body wrapped in `<AnimatePresence>` and
`DroppableGroupZone`. Empty non-searched group shows a dashed "Drop tasks here or add a new one"
hint (turns accent-colored while dragging). Each group ends with a `ListAddRow`.

**Status circle vs status pill:** the row shows BOTH — a status *circle* inside `ListTaskRow`
(left, near the title) and a status *pill* in the Status column. Both open the same
`StatusPickerPopover`.

**Optimistic mutation pattern** (`handleTaskUpdate`): merge into local `tasks` immediately, then in
a transition strip the view-only keys (`subtasks_done, subtask_list, status, subtask_count,
assignees`) and call `updateTask(id, serverUpdates)` only if anything remains.

**`handleStatusChange`**: sets `status_id`, `status`, and `completed_at` (now if done/closed else null).

**Delete**: `confirm("Delete this task?")`, remove locally, `deleteTask` in transition.
**Duplicate**: `duplicateTask` in transition (relies on revalidate to re-fetch).

**Multi-select**: per-row checkbox (`accent-accent`); `handleToggleSelected` supports **shift-click
range select** using `lastClickedId`. Header checkbox selects/clears all.

**Context menu**: right-click a row → fixed menu at cursor with Delete (rose) + Duplicate; closes on
outside mousedown or Escape.

**Drag & drop** — see §13.1 for the full algorithm. Sensors: `PointerSensor` with
`activationConstraint {distance:5, tolerance:5, delay:0}` (so a click still opens the drawer; only a
deliberate drag triggers DnD) + `KeyboardSensor`. `collisionDetection={closestCenter}`. Drop
animation 220ms `cubic-bezier(0.2,0.8,0.2,1)`, active row `opacity:0.5`.

**`TaskDragOverlay`**: a compact tilted card (`rotate(-1.5deg)`, `shadow-[0_12px_30px_rgba(0,0,0,0.18)]
backdrop-blur-md`) with a status-color dot, the title (line-through if done), and a tinted status chip.

**Empty state** (no tasks at all): centered, `CornerDownRight` in a rounded `bg-surface-alt` circle,
"No tasks yet", a `kbd` hint (press **N**), and an "Add your first task" button that focuses
`[data-add-task-input]`.

**Keyboard shortcuts** (window-level; ignored while typing in inputs/textareas/contenteditable):
| Key | Action |
|---|---|
| `n` | click `[data-add-task-trigger]` (open inline add) |
| `/` | focus the search box |
| `Esc` | close drawer → else clear selection → else close context menu |
| `⌘/Ctrl+A` | select all visible tasks |
| `↑` / `↓` | move `focusedTaskId` through the list |
| `Space` | open the focused task's drawer |

Row visual states: selected → `bg-accent-soft/40`; focused (not selected) → `bg-surface-alt/60`;
hover → `bg-surface-alt/30`; dragging → `opacity-0` (the overlay stands in).

### 11.2 `ListTaskRow` (`list-task-row.tsx`, ~755 lines)

Renders the left "Task" portion + the Priority/Assignee/DueDate/Sub fixed cells. Done tasks render
at `opacity-70`.

- **Nest drop zone**: the chevron area is the droppable (`nestDroppableProps`). When a drag hovers,
  it scales to `1.25` with an accent ring (`ring-2 ring-accent shadow-[0_0_0_3px_rgb(var(--accent)/0.15)]`)
  and title flips to "Release to nest as subtask". Tasks with no subtasks still expose a nest zone
  (shows a `ChevronRight` only while hovered).
- **Status circle**: `CheckCircle2` (done, colored by status) or `Circle` (open, colored by status);
  `hover:scale-110`; opens `StatusPickerPopover`.
- **`InlineTitle`**: single click → `onSelect` (open drawer); **double-click → inline edit** (input
  with `ring-1 ring-accent/40`); Enter blurs+saves (only if changed & non-empty), Esc reverts.
  Title is line-through + muted when done. Tooltip: "Click to view · Double-click to edit".
- **"+ subtask"**: hover-revealed button; opens an inline form indented to `(depth+1)*20 + 56` with
  `bg-accent/5`; Enter adds (calls `createTask` with `parent_id` + inherited `status_id`), keeps
  focus for rapid entry; Esc cancels; empty-blur closes. Calls `onSubtaskAdded` so the parent bumps
  `subtask_count` and auto-expands.
- **`PriorityCell`** (width 80): shows colored dot + abbreviation when not "none". Config:
  | priority | dot | text | abbr |
  |---|---|---|---|
  | urgent | `bg-rose-500` | `text-rose-600` | URG |
  | high | `bg-amber-500` | `text-amber-600` | HIGH |
  | normal | `bg-sky-500` | `text-sky-600` | NRM |
  | low | `bg-foreground/30` | `text-foreground/50` | LOW |
  | none | — | `text-muted-foreground/30` | (shows "—") |
  Click opens a small absolute dropdown (options listed urgent→none); outside-mousedown closes.
- **`AssigneeCell`** (width 72): up to 3 overlapping (`-space-x-1.5`) 5×5 avatars (or initial in
  `bg-accent/20`), else a faint `UserCircle2`. Click opens a 48-wide member dropdown; toggling calls
  `addAssignee`/`removeAssignee`; assigned rows show `bg-accent-soft` + ✓.
- **`DueDateCell`** (width 96): click reveals a native `type="date"` (auto-`showPicker()`), commits on
  change. Display uses **relative formatting** (`formatDueDate`): Today / Tomorrow / Yesterday /
  `Nd overdue` / `Nd` (≤7) / `MMM d`. Color: overdue → rose, today → amber, else muted; done → muted.
- **Subtask count** (width 56): `{done}/{total}` pill; all-done → emerald, else neutral; click toggles
  expansion. No subtasks → "—".

### 11.3 `StatusPill` (`status-pill.tsx`)

`motion.span` with `layoutId={`status-pill-${taskId}`}` (shared-layout animation across views),
spring transition. Colors derived from the status color via a `hexAlpha` helper: background =
15% alpha, border = 30% alpha, text = full color, plus a tiny solid dot. Sizes: `sm` (`h-[20px]
text-[11px]`) / `md` (`h-[22px] text-[12px]`). When `interactive`, wraps in a `motion.button`
(`whileHover scale 1.03`, `whileTap 0.97`). `null` status → "No Status" at `#94a3b8`.

### 11.4 `StatusPickerPopover` (`status-picker-popover.tsx`)

Radix `Popover`; content `w-52 p-1.5`, `align="start" sideOffset={6}`, entry animation
(`opacity/y -4`, 0.15s) via `AnimatePresence` + `forceMount`. Statuses grouped by category with
labels (To Do / In Progress / Done / Closed); each option renders a `StatusPill size="sm"` and a
`Check` on the current one. Optional `onManage` adds a divider + "Manage statuses" footer.

### 11.5 `ListAddRow` (`list-add-row.tsx`) & `AddTaskRow` (`add-task-row.tsx`)

Inline "+ Add task". Collapsed = a full-width ghost button (`data-add-task-trigger`) padded to align
with the title (`paddingLeft (depth*20)+68`). Active = a form with a `Plus`, an input
(`data-add-task-input`), and an `Enter` kbd hint. Enter saves via `createTask({list_id, title,
status_id?, parent_id?})` then **keeps focus** for rapid entry; Esc clears+closes; empty-blur closes.
`onAdded` pushes a minimal `TaskWithSubtasks` into the parent's local list. (`AddTaskRow` is the
simpler single-list variant; `ListAddRow` is the per-group/per-parent variant used by the list view.)

### 11.6 `BulkActionsBar` (`bulk-actions-bar.tsx`)

Floating pill, fixed `bottom-6 left-1/2 -translate-x-1/2 z-50`, spring slide-up via `AnimatePresence`
(`y:80→0`). Shown only when `selectedIds.size > 0`. Contents: "N selected" badge (accent), Status
(via `StatusPickerPopover`, bulk `updateTask`), Priority (popover with 5 colored options), Due date
(native date + "Clear due date"), Assign/Tag (placeholders), Delete (rose, `confirm`), and an X to
clear selection. Each bulk op runs `Promise.all(ids.map(updateTask|deleteTask))` then a `sonner` toast.
Priority option colors: urgent `#ef4444`, high `#f59e0b`, normal `#3b82f6`, low `#64748b`, none `#a1a1aa`.

### 11.7 `CustomFieldCell` (`custom-field-cell.tsx`, ~685 lines)

Dispatches on `fieldDef.field_type`; every mutation calls `setTaskFieldValue(taskId, fieldDef.id,
newVal)` then `onValueChange`. Has a `compact` mode (table cell, "—" placeholders) vs full mode
(drawer, "Click to edit"/"Add …" placeholders).

| type | rendering / editing |
|---|---|
| `text` | click→input; Enter blurs→commit `trim()||null`; Esc reverts |
| `url` | link (`https?://` stripped) + `ExternalLink` + pencil; edit = `type="url"` |
| `email` | `mailto:` link; edit = `type="email"` |
| `phone` | `tel:` link; edit = `type="tel"` |
| `number` | `toLocaleString()`; edit = `type="number"` → `parseFloat` |
| `currency` | NumberCell with `prefix="$"` |
| `percent` | NumberCell with `suffix="%"` |
| `date` | invisible overlaid `type="date"`; display via `date-fns format(d, "MMM d, yyyy")` |
| `checkbox` | `motion.button` (`whileTap scale 0.85`), filled accent + `Check` when true |
| `select` | invisible overlaid `<select>` from `config.options[{value,label,color}]`; label tinted by option color |
| `multi_select` | compact = colored chips (`{color}22` bg / `{color}44` border); full = toggle list |
| `labels` | free-text chips; full mode adds an inline "Add" input; removable in full mode |
| `people` | read-only text (no picker) |

`config.options` shape: `{ value: string; label: string; color?: string }[]`.

### 11.8 `MentionInput` / `MentionText` (`mention-input.tsx`)

`MentionInput` is a textarea with `@`-autocomplete. Typing `@` (when not preceded by a word char,
regex `/(^|[^a-zA-Z0-9])@([a-zA-Z0-9 ]*)$/`) opens a `w-56` dropdown of up to 6 users (filter by
name/email). ↑/↓ navigate, Enter/Tab insert, Esc dismisses. Inserted token format:
**`@[Full Name](userId)`**. Supports `autoGrow` (recomputes height from line-height up to `maxHeight`),
`rows`, and `onSubmit` (Enter without Shift, when the menu is closed). `MentionText` parses
`@[Name](id)` and renders names as accent chips (`bg-accent-soft text-accent`).

### 11.9 `TaskDetailDrawer` (`task-detail-drawer.tsx`, ~1925 lines)

**Presentation**: a centered modal (NOT a side drawer despite the name). Backdrop
`bg-black/35 backdrop-blur-[3px]` (fade 0.12s); panel `max-w-[1200px] max-h-[92vh] rounded-card
shadow-2xl`, entry `opacity/scale 0.985/y 4 → 1`, 0.14s `cubic-bezier(0.2,0.8,0.2,1)`. Clicking the
backdrop or container closes; the panel `stopPropagation`s. Renders a skeleton with the same layout
when `task` is null and no `initialTask` was passed (callers pass `initialTask` for instant open).

**Props**: `{ taskId, statuses, fieldDefs, members?, initialTask?, onClose }`.

**Data loading**: on mount, `Promise.all([getTask, getComments, getMembers, getWatchers])`. Tab data
loads on demand: checklist→`getChecklists`, activity→`getTaskActivity(…,50)`, time→`getTaskTimeTotal`.

**Header**: an inline-editable title `<input>` (`font-heading text-base font-bold`, focus underline),
a Delete button (`confirm` then `deleteTask`+close), and a Close (X) button.

**Tabs** (Radix `Tabs`): Details / Checklist / Comments / Activity / Time, with icons and number
hints. Comments tab shows a count badge. Hotkeys **1–5** switch tabs (ignored while typing).
Esc closes the drawer (but is allowed to pass through to the mention `@` menu when typing).

- **Details tab** — two columns (`lg:grid-cols-[minmax(0,1fr)_320px]`):
  - **Left**: Description via `MentionInput` (autoGrow, rows 4, maxHeight 700). A Save/Cancel pair
    appears only when the text differs from the stored value (`save({description: text||null})`).
  - **Right metadata sidebar** (each row via `FieldRow` = `grid-cols-[100px_1fr]`):
    Status (`StatusPickerPopover`+`StatusPill`, sets completed_at), **Priority** (`PriorityPicker`:
    Flag-icon popover, colors per priority), **Assignees** (`AssigneesField`: avatar stack + member
    popover), **Watchers** (`WatchersField`: Eye/EyeOff toggle, `addWatcher`/`removeWatcher`),
    **Due date** (`DatePickerField`: native input + quick chips Today/Tmrw/+1w + clear; overdue→rose),
    **Start date** (`DatePickerField` with `hideQuickButtons`), **Repeat** (`RecurrencePicker` — see
    below), **Estimate** (number input, minutes), **Tags** (sage badges with × remove + `prompt()` add),
    and **Custom Fields** (one `FieldRow` + `CustomFieldCell compact={false}` per def).
  - **`save(input)`**: `updateTask(taskId, input)` then `load()` (re-fetch the drawer's data).
- **Checklist tab** — `ChecklistSection` per checklist: header (name, `{done}/{total}`, delete),
  an animated emerald progress bar (`width %`), `ChecklistItemRow`s (animated checkbox, double-click
  to edit content, hover pencil/trash), an "Add item" inline input, and a dashed "Add checklist"
  button (name via `prompt()`).
- **Comments tab** — scrollable list (avatar, author, relative time via `formatDistanceToNow`,
  `MentionText` body, hover trash). Composer at the bottom = `MentionInput` (`onSubmit=handleComment`)
  + a `Send` button. `handleComment` → `addComment` then re-fetch.
- **Activity tab** — reverse-chron list; `ActivityIcon` per action (status_changed→ChevronRight accent,
  comment_added→MessageSquare sky, created→Plus emerald, priority_changed→Activity amber, else
  generic), actor name + humanised action (`action.replace(/_/g," ")`) + relative time.
- **Time tab** — a "Total Tracked" card (`formatDuration`), a Start/Stop timer (live ticking via a
  1s interval; pulsing emerald dot while running), `ManualTimeEntry` (datetime-local start/end +
  description), and the entries list (duration, optional description, `format(started_at, "MMM d,
  h:mm a")`, delete). `startTimer` errors (e.g. "timer already running") surface as toasts.

- **`RecurrencePicker`** — `Repeat`-icon trigger showing `summarizeRule(value)`. Popover (`w-72 p-3`)
  with: pattern grid (daily/weekly/monthly/yearly), interval number + pluralised unit, weekly weekday
  toggles (`S M T W T F S`), monthly day-of-month input (with "falls back to month-end" note), anchor
  toggle ("Previous due" vs "Completion"), and an Ends radio group (Never / On date / After N
  occurrences). Edits commit immediately via `onChange(rule)`; a Clear link sets `null`. Footer
  explains the reopen-in-place behaviour.

### 11.10 `ListSettingsPanel` (`list-settings-panel.tsx`)

A side panel (opened from the header `Settings2`) for managing the list's statuses, custom fields,
members/access, list type, and rename/delete — backed by the status/field/member actions in §6.
(Not strictly required to render `/my-tasks`, but it's the management surface for the same data.)

---

## 12. Design System: Tokens, Tailwind, Primitives

### 12.1 CSS variables (`app/globals.css`)

Colors are **space-separated RGB triples** (no commas) so they compose with Tailwind
`rgb(var(--x) / <alpha-value>)`.

```css
:root {
  --font-raleway: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --background: 255 255 255;  --surface: 255 255 255;  --surface-alt: 237 240 238;
  --muted: 241 243 242;       --muted-foreground: 115 120 118;
  --foreground: 66 66 66;     --ink-alt: 51 51 51;
  --accent: 255 86 78;        --accent-foreground: 255 255 255;  --accent-soft: 255 228 226;
  --border: 226 228 226;      --ring: 255 86 78;
}
.dark {
  --background: 22 24 23;  --surface: 28 31 30;  --surface-alt: 36 40 38;
  --muted: 40 44 42;       --muted-foreground: 160 167 163;
  --foreground: 237 240 238; --ink-alt: 200 205 202;
  --accent: 255 118 111;  --accent-foreground: 24 25 24;  --accent-soft: 80 36 34;
  --border: 50 54 52;      --ring: 255 118 111;
}
```

Base: `* { border-color: rgb(var(--border)); }`, body uses `--font-raleway` at `font-weight:500
font-size:15px`; headings use `"futura-pt","Futura",ui-sans-serif,system-ui` at 700,
`letter-spacing:-0.01em`; mobile forces 16px on inputs to stop iOS zoom.

Component utilities of note:
```css
.haven-kbd {
  @apply inline-flex items-center justify-center rounded-md border border-border
         bg-surface-alt px-1.5 font-mono text-[10px] font-semibold text-foreground/70
         min-w-[20px] h-[20px];
}
.haven-card { @apply rounded-card border border-border bg-surface shadow-card transition-shadow; }
```
Also `[data-dnd-dragging="true"] { cursor: grabbing !important; }` and a `.drag-insert-line::before`
2px accent insertion line.

### 12.2 Tailwind theme (`tailwind.config.ts`)

```ts
darkMode: "class",
theme.extend = {
  colors: {
    haven: { coral:"#FF564E","coral-700":"#E8463F","coral-100":"#FFE4E2",
             charcoal:"#424242", ink:"#333333", sage:"#EDF0EE","sage-200":"#DDE3E0",
             cream:"#FAF8F3", white:"#FFFFFF" },
    background:"rgb(var(--background) / <alpha-value>)",
    foreground:"rgb(var(--foreground) / <alpha-value>)",
    surface:"rgb(var(--surface) / <alpha-value>)",
    "surface-alt":"rgb(var(--surface-alt) / <alpha-value>)",
    muted:"rgb(var(--muted) / <alpha-value>)",
    "muted-foreground":"rgb(var(--muted-foreground) / <alpha-value>)",
    border:"rgb(var(--border) / <alpha-value>)",
    ring:"rgb(var(--ring) / <alpha-value>)",
    accent:"rgb(var(--accent) / <alpha-value>)",
    "accent-foreground":"rgb(var(--accent-foreground) / <alpha-value>)",
    "accent-soft":"rgb(var(--accent-soft) / <alpha-value>)",
  },
  fontFamily: {
    heading: ["futura-pt","Futura","ui-sans-serif","system-ui","sans-serif"],
    sans: ["var(--font-raleway)","Helvetica","Arial","sans-serif"],
    mono: ["ui-monospace","SFMono-Regular","Menlo","monospace"],
  },
  fontSize: {
    "display-1": ["40px",{lineHeight:"1.1", fontWeight:"700"}],
    "display-2": ["34px",{lineHeight:"1.15",fontWeight:"700"}],
    "display-3": ["29px",{lineHeight:"1.2", fontWeight:"700"}],   // used by My Tasks H1
    "display-4": ["24px",{lineHeight:"1.25",fontWeight:"700"}],
  },
  letterSpacing: { cta: "2px" },
  borderRadius: { pill: "30px", card: "14px" },     // rounded-card = 14px
  boxShadow: {
    card: "0 1px 2px rgba(66,66,66,0.06), 0 1px 1px rgba(66,66,66,0.03)",
    "card-hover": "0 4px 14px rgba(66,66,66,0.08), 0 2px 4px rgba(66,66,66,0.04)",
    ring: "0 0 0 3px rgba(255,86,78,0.25)",
  },
  keyframes: {
    "fade-in": { from:{opacity:"0"}, to:{opacity:"1"} },
    "slide-up": { from:{opacity:"0",transform:"translateY(6px)"}, to:{opacity:"1",transform:"translateY(0)"} },
  },
  animation: { "fade-in":"fade-in 200ms ease-out", "slide-up":"slide-up 240ms ease-out" },
},
plugins: [require("tailwindcss-animate")],
```

### 12.3 UI primitives (`components/ui/`)

- **`cn`** (`lib/utils.ts`): `twMerge(clsx(inputs))`.
- **`Button`** (cva): base `inline-flex items-center justify-center gap-2 transition-all
  duration-150 focus-visible:shadow-ring disabled:opacity-50`. Variants: `cta`, `primary` (default,
  coral fill, rounded-md), `secondary`, `outline`, `ghost`, `link`. Sizes: `sm` (`h-8 px-3 text-[13px]`),
  `md` (default `h-9 px-4 text-sm`), `lg` (`h-11 px-6`), `icon` (`h-9 w-9`). Also exports `buttonVariants`.
- **`Input`**: plain `<input>`, `h-10 md:h-9 w-full rounded-md border border-border bg-surface px-3
  text-base md:text-sm focus:shadow-ring`.
- **`Badge`** (cva): base `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs
  font-semibold`. `tone`: `neutral`(default), `coral`, `sage`, `success`, `warn`, `danger`, `dark`.
  Optional `dot` prop renders a leading `bg-current` dot.
- **`Popover`** (Radix): `Popover` (Root), `PopoverTrigger`, `PopoverContent` (portaled, default
  `align="center" sideOffset={4}`, `z-50 min-w-[8rem] rounded-xl border border-border bg-surface p-1
  shadow-lg` + Radix data-state animations), `PopoverAnchor`.
- **`Tabs`** (Radix): `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`. Active trigger styled via
  `data-[state=active]:bg-surface-alt`.
- **`TableSkeleton`** / **`ErrorFallback`** in `components/shell/` (full source supplied in §9.2/§9.3 region).

---

## 13. Interaction Patterns

### 13.1 Drag & drop (the full `handleDragEnd` algorithm)

One `DndContext` wraps all groups; one `SortableContext` holds all task ids. There are three kinds of
droppable: each sortable **task row** (`id=<taskId>`), each **group zone** (`id="group:<statusId>"`,
or `"group:__none__"`), and each row's **nest zone** (`id="nest:<taskId>"`). On drag end (ignore if
no `over` or `active===over`):

1. **`over` starts with `nest:`** → set the active task's `parent_id` to that target. The **only**
   guard is `targetTaskId === activeId` (refuse nesting into self). ⚠️ **GAP:** there is **no
   deeper cycle check** — nesting a parent under its own descendant is not prevented client-side,
   and the DB has no cycle constraint either (see §15.4/§15.9). Optimistically bump the target's
   `subtask_count`, set `parent_id`, expand the target, then `updateTask(activeId, {parent_id})`.
   Roll back + toast on failure.
2. **`over` starts with `group:`** → cross-group status change. Compute target status id
   (`__none__`→null); no-op if unchanged. Optimistically set `status_id/status/completed_at`, then
   `updateTask(activeId, {status_id, completed_at?})`. Roll back + toast on failure.
3. **`over` is another task id in a different status** → same as #2 but target status = that task's
   status.
4. **`over` is another task id in the same status** → reorder via `arrayMove`, then persist
   `reorderTasks(updates)` where updates = same-status rows re-indexed (`order = i`). Toast on failure.

Visual feedback: group zone highlights `bg-accent/[0.06] ring-1 ring-inset ring-accent/30` while
hovered; nest zone scales + accent ring; the dragged row goes `opacity-0` and a tilted
`TaskDragOverlay` follows the cursor; a top insertion line (`bg-accent
shadow-[0_0_8px_rgb(var(--accent)/0.6)]`) shows the drop target row.

### 13.2 Optimistic update + rollback recipe

```ts
const prev = tasks;                 // snapshot
setTasks(next);                     // optimistic
startTransition(async () => {
  try { await serverAction(...); }
  catch { setTasks(prev); toast.error("…reverted"); }
});
```

### 13.3 Completion semantics

A task is "done" when its status `category ∈ {done, closed}`. The client sets `completed_at`
optimistically; the DB trigger `tg_update_task_completed_at` is the backstop. Done rows render muted
+ line-through; the status circle becomes a filled `CheckCircle2`.

### 13.4 Inline-edit conventions (used everywhere)

Click to open value, Enter commits (`blur()`), Esc reverts, empty-blur cancels, commit only when the
value actually changed. Date cells use native `type="date"` (with `showPicker()` where supported).

---

## 14. Step-by-Step Replication Checklist

Build in this order; each step is independently testable.

1. **Project skeleton**: Next.js 15 (App Router) + React 19 + TypeScript; Tailwind 3.4 +
   `tailwindcss-animate`; `next-themes` with `darkMode:"class"`. Add the design tokens (§12.1) and
   Tailwind theme (§12.2). Add `cn` and the UI primitives (§12.3). Mount `<Toaster richColors
   position="bottom-right" />` once in a layout.
2. **Supabase**: create the project; add the server client (`@supabase/ssr`, cookie-based) and
   `requireUser()`/`getPermissions()` auth helpers (§5.2). Provide a `profiles` table + `tg_set_updated_at`.
3. **Schema**: run migrations 0002 → 0003 → 0008 → 0009 → 0010 → 0011 → 0023 (and 0031 + the storage
   bucket if you want search/attachments). Verify enums, triggers (`tg_sync_assignee_ids`,
   `tg_log_task_status_change`, `tg_update_task_completed_at`), and `seed_default_statuses`.
   **Don't forget** the `role` column on `task_assignees` and `access_level` on `list_members`.
4. **Types**: drop in `lib/work/types.ts` verbatim (§4).
5. **Actions**: implement `lib/work/actions.ts` (§6) including the access helpers (§5) and
   `getOrCreatePersonalList`. Wire `revalidatePath` on every mutation.
6. **Recurrence**: add `lib/work/recurrence.ts` (§7) and the rollover call inside `updateTask`.
7. **(Optional) Notifications**: add `deliverNotifications`/`notifyTaskWatchers` and the fire-and-forget
   calls, or stub them out.
8. **Primitives & supporting components**: `StatusPill`, `StatusPickerPopover`, `MentionInput`,
   `CustomFieldCell`, `ListAddRow`, `BulkActionsBar`, `TableSkeleton`, `ErrorFallback`.
9. **Rows**: `ListTaskRow` (+ its `InlineTitle`, `PriorityCell`, `AssigneeCell`, `DueDateCell`).
10. **Detail drawer**: `TaskDetailDrawer` with its 5 tabs and field sub-components (§11.9).
11. **The engine**: `ListViewTable` — grouping, filters, DnD (§13.1), multi-select, keyboard shortcuts,
    context menu, drawer/settings/bulk wiring.
12. **The route**: `app/(app)/my-tasks/{page,loading,error}.tsx` (§9) — the thin server shell calling
    `getOrCreatePersonalList` + the five parallel fetches and rendering `ListViewTable`.
13. **Verify acceptance criteria** (below).

### Acceptance criteria (what "done" looks like)

- Visiting `/my-tasks` for a brand-new user auto-creates a private personal list with the 5 default
  statuses and shows an empty state.
- Add task (button, `n`, or per-group row); task appears under the correct status group instantly.
- Click a row opens the detail modal; double-click the title edits inline.
- Status circle/pill both open the grouped status picker; choosing a done/closed status mutes the row
  and stamps completion.
- Drag a row within a group reorders; across groups changes status; onto a chevron nests it as a subtask.
- Priority/assignee/due-date/custom-field cells edit inline and persist.
- Multi-select (checkbox / shift-click / ⌘A) reveals the floating bulk bar; bulk status/priority/
  due-date/delete work with toasts.
- Detail drawer tabs (Details/Checklist/Comments/Activity/Time) all function; recurrence config saves
  and a completed recurring task reopens on its next due date in the first "to do" status.
- Everything is access-gated: another user cannot read or mutate your personal list.

---

## 15. Accuracy, Security & Operational Addenda (mandatory)

> This section documents **actual current behavior**, including weaknesses. Items marked
> **⚠️ GAP** are real characteristics of the shipped code. Items marked **➕ RECOMMENDED** are
> suggested additions that are **not** in the codebase today — do not assume they exist.

### 15.1 Security model & assumptions

- **Trust boundary.** Authorization for Work data lives in the **server actions**, not the
  database. RLS is a coarse anonymous-vs-authenticated gate only (most reads `using(true)`;
  writes `with check (auth.uid() is not null)`). The notifications table is the **only** Work-area
  table with true per-row RLS (`recipient_id = auth.uid()`).
- **Hard assumption:** browsers/clients **never** query Supabase directly for Work data — they
  call server actions. If you ship an anon-key client that reads `tasks`/`comments`/etc. from the
  browser, **any signed-in user can read/modify all of it**, because RLS won't stop them.
- **Super admin bypass:** `profiles.role = 'super_admin'` short-circuits every access check to
  `admin`.
- **Personal-list privacy** is enforced in `getListAccessLevel` (and the SQL mirror
  `user_has_list_access`): a list with `personal_owner_id` is accessible **only** to that owner.
  This is the load-bearing rule for "My Tasks" privacy. The DB `lists` RLS does **not** enforce
  it — so again, only safe if reads go through server actions.
- ➕ **RECOMMENDED hardening** if you want defense-in-depth: replace the permissive policies on
  `tasks/comments/checklists/checklist_items/time_entries/task_activity/task_attachments/
  task_assignees/task_watchers/statuses/custom_field_defs` with policies that call
  `public.user_has_list_access(auth.uid(), <list_id>, '<level>')` (join through `tasks` for the
  child tables). The function already exists (§3.8).

### 15.2 Exact RLS policies (every table + storage)

> Policy *names* and predicates as shipped. "auth" = `auth.uid() is not null`. Unless noted,
> tables `enable row level security`.

| Table | SELECT | INSERT (with check) | UPDATE (using) | DELETE (using) |
|---|---|---|---|---|
| `spaces` | `true` | auth | auth | auth |
| `folders` | `true` | auth | auth | auth |
| `lists` | `true` | auth | auth | auth |
| `statuses` | `true` | auth | auth | auth |
| `custom_field_defs` | `true` | auth | auth | auth |
| `tasks` | `true` | auth | auth | auth |
| `task_assignees` | `true` | auth | — *(none)* ⚠️ | auth |
| `task_watchers` | auth | auth | — | auth |
| `comments` | `true` | `auth.uid() = author_id` | `auth.uid() = author_id` | `auth.uid() = author_id` |
| `checklists` | `true` | auth | auth | auth |
| `checklist_items` | `true` | auth | auth | auth |
| `time_entries` | `true` | auth | auth | auth |
| `task_activity` | `true` | auth | auth | auth |
| `task_attachments` | `true` | auth | auth | auth |
| `space_members` | `true` | auth | auth | auth |
| `list_members` | auth | auth | auth | auth |
| `notifications` | `recipient_id = auth.uid()` | auth | `recipient_id = auth.uid()` | `recipient_id = auth.uid()` |
| `storage.objects` (bucket `task-attachments`) | auth ⚠️ too broad | auth | — | auth ⚠️ too broad |

⚠️ Two concrete RLS bugs to carry over knowingly (or fix): (1) `task_assignees` has **no UPDATE
policy** but `setPrimaryAssignee` UPDATEs `role` → those writes fail under RLS; (2) storage
read/delete are bucket-wide (see §3.10). `comments` is the model to copy for per-row ownership.

### 15.3 Per-action access-gating matrix (current vs. recommended)

> "Session" = requires a logged-in user (via `currentUserId()`), but performs **no list/space
> authorization**. "RLS-only" = the action does not even call `currentUserId()`; it relies purely
> on RLS. ⚠️ marks an authorization gap relative to what the data sensitivity warrants.

**Reads**

| Action | Current gate | ⚠️ / ➕ |
|---|---|---|
| `getSpaces`, `getSpaceTree` | visibility-filtered in JS | ok |
| `getList`, `getStatuses`, `getCustomFieldDefs`, `getTasks`, `getTasksForListView`, `getListMembers` | `hasListAccess(viewer)` | ok |
| `getSpaceMembers` | `requireSpaceAccess(viewer)` | ok |
| `getGlobalTasks` / `…Paginated` | JS visibility filter | ok |
| `getTask` | **RLS-only** (no check) | ⚠️ returns any task to any session → ➕ add `hasListAccess(viewer)` |
| `getTasksWithHierarchy` | **RLS-only** | ⚠️ ➕ add `hasListAccess(viewer)` |
| `getComments` | **RLS-only** | ⚠️ ➕ gate by parent task's list |
| `getChecklists` | **RLS-only** | ⚠️ ➕ gate by parent task's list |
| `getWatchers` | **RLS-only** | ⚠️ ➕ gate |
| `getTaskActivity` | **RLS-only** | ⚠️ ➕ gate |
| `getTaskTimeTotal` | **RLS-only** | ⚠️ ➕ gate |
| `getTaskAttachments` | **RLS-only** | ⚠️ ➕ gate |
| `getActiveTimer(userId)` | **RLS-only**, takes a userId arg | ⚠️ caller-supplied id; ➕ derive from session |
| `getMembers` | **RLS-only** | returns **all** profiles to any session — by design (assignee picker), but consider scoping |

**Mutations**

| Action | Current gate | ⚠️ / ➕ |
|---|---|---|
| `createTask`, `updateTask`, `deleteTask`, `setTaskStatusByCategory` | `requireListAccess(editor)` | ok |
| `updateList`, `deleteList`, `updateListType`, `addListMember`, `removeListMember`, `updateListMemberAccessLevel` | `requireListAccess(admin)` | ok |
| `updateListMemberColor` | `requireListAccess(editor)` | ok |
| `createList` | `requireSpaceAccess(member)` if space-anchored | ok |
| `createSpace` | Session | any user may create a space (by design) |
| `updateSpace`, `deleteSpace`, space-member CRUD, `updateSpacePrivacy` | `requireSpaceAccess(admin)` | ok |
| `createFolder` | Session | ⚠️ ➕ `requireSpaceAccess(member)` |
| `updateFolder`, `deleteFolder` | **RLS-only** | ⚠️ ➕ space admin |
| `duplicateTask` | Session | ⚠️ no list check; can clone any task you can name |
| `reorderTask`, `reorderTasks` | **RLS-only** | ⚠️ ➕ `requireListAccess(editor)` |
| `createStatus`, `updateStatus`, `deleteStatus`, `reorderStatuses` | Session | ⚠️ ➕ `requireListAccess(admin/editor)` |
| `createFieldDef`, `updateFieldDef`, `deleteFieldDef`, `reorderFieldDefs`, `createCustomFieldDef` | Session (`createCustomFieldDef` is **RLS-only**) | ⚠️ ➕ `requireListAccess(editor)` |
| `setTaskFieldValue` | Session | ⚠️ ➕ gate by task's list |
| `addAssignee` | Session | ⚠️ ➕ gate by task's list |
| `removeAssignee`, `setPrimaryAssignee` | **RLS-only** | ⚠️ (+ `setPrimaryAssignee` blocked by missing UPDATE policy, §15.2) |
| `addWatcher`, `removeWatcher` | **RLS-only** | ⚠️ ➕ gate |
| `createComment`, `addComment` | Session (insert RLS enforces `author_id`) | ⚠️ no list check |
| `deleteComment` | Session + author-scoped `delete … eq(author_id)` | ok (author only) |
| checklist CRUD (`createChecklist`…`reorderChecklistItems`) | Session | ⚠️ ➕ gate by task's list |
| time CRUD (`startTimer`, `stopTimer`, `addManualTimeEntry`, `deleteTimeEntry`) | Session | ⚠️ ➕ gate; `delete/stop` not owner-scoped |
| `uploadAttachment`, `deleteAttachment` | Session | ⚠️ ➕ gate by task's list; `delete` not owner-scoped |

> **For a faithful replication you have two honest choices:** (a) reproduce these gaps exactly
> (matches today's behavior) and document them, or (b) close them by adding `requireListAccess`
> to the ⚠️ rows. The base spec reflects (a). The acceptance test in §11 ("another user cannot
> read or mutate your personal list") **passes only because** personal-list reads in the UI go
> through the gated `getTasksForListView`; the ungated `getTask`/`getComments`/etc. would leak a
> personal task's contents to any signed-in user who knows the id. Decide deliberately.

### 15.4 Data-integrity constraints: enforced vs. gaps

**Enforced today (DB level):**
- `lists_type_check` (`type in private|shared|public`); `lists_space_or_owner_chk`
  (a list must have a space or a personal owner); `lists_personal_owner_unique` (one personal
  list per user).
- `list_members_access_level_chk`, `space_members_role_chk`.
- FK cascades: deleting a list cascades statuses/custom_field_defs/tasks; deleting a task cascades
  subtasks (`parent_id … on delete cascade`), assignees, watchers, comments, checklists (→ items),
  time_entries, activity, attachments. Deleting a status sets dependent `tasks.status_id` to NULL
  (`on delete set null`).
- `tasks.completed_at` correctness vs. status category (trigger `tg_update_task_completed_at`).
- `tasks.assignee_ids` ↔ `task_assignees` consistency (trigger `tg_sync_assignee_ids`).

**NOT enforced (⚠️ GAP) — neither DB constraints nor server validation prevent these:**
- A task's `status_id` may reference a status from a **different list**. `createTask`/rollover pick
  a same-list status, but `updateTask({status_id})` and `setTaskFieldValue` do **not** verify the
  status belongs to the task's list.
- `deleteStatus(id, reassignTo)` does **not** verify `reassignTo` belongs to the same list.
- A task's `parent_id` may reference a task in a **different list**; the list view simply won't
  render such a "subtask". No constraint stops it.
- **Subtask cycles** (A→B→A) are not prevented (DnD only refuses self; see §15.9).
- A custom-field **value** key (`tasks.custom_fields[fieldDefId]`) is not validated to be a real
  `custom_field_defs.id` of the task's list, nor type-checked against the def.
- `time_estimate`, recurrence `interval`/`day_of_month` ranges are only loosely guarded in the UI.

➕ **RECOMMENDED** (DB-side examples):
```sql
-- same-list status (composite FK):
alter table public.statuses add unique (id, list_id);
alter table public.tasks add constraint tasks_status_same_list
  foreign key (status_id, list_id) references public.statuses(id, list_id) on delete set null;
-- same-list parent:
alter table public.tasks add constraint tasks_parent_same_list
  foreign key (parent_id, list_id) references public.tasks(id, list_id) on delete cascade; -- needs unique(id,list_id) on tasks
```
…plus a recursive `BEFORE INSERT/UPDATE` trigger or server check for cycles, and a server-side
validation that custom-field keys/values match the list's defs.

### 15.5 Transaction boundaries for multi-step operations

> ⚠️ **There are no explicit DB transactions anywhere in `actions.ts`.** Every step is a separate
> network round-trip via the Supabase client. Each multi-step op is therefore **non-atomic** and
> can leave partial state if it fails midway. Documented behavior + recommendation per op:

| Operation | Steps (in order) | Failure mode today | ➕ RECOMMENDED |
|---|---|---|---|
| `getOrCreatePersonalList` | (1) `select` existing → (2) `insert` list → (3) `rpc seed_default_statuses` → (4) `upsert` owner `list_members` | if (3)/(4) fail, the list exists with no statuses/owner row; concurrent first-visits race (see §15.6) | wrap (2)+(3)+(4) in a Postgres function (`security definer`) called via one `rpc` |
| `createList` | `insert` list → `rpc seed_default_statuses` | list without statuses on partial failure | same — single RPC |
| `deleteStatus(id, reassignTo)` | `count` tasks → `update` tasks.status_id=reassignTo → `delete` status | if delete fails after reassign, tasks moved but old status lingers; race if a task is created on the old status between count and delete | single RPC with `for update` lock |
| `reorderTasks(updates)` | `Promise.all` of N independent `update`s | partial reorder on any failure (some rows updated, some not) | single RPC doing a bulk `update … from (values …)` in one statement |
| `reorderStatuses` / `reorderFieldDefs` / `reorderChecklistItems` | `Promise.all` of N `update`s | same partial-update risk | bulk update RPC |
| recurrence rollover | (inside `updateTask`) update task done → **separate** `rolloverRecurringTask` read+update | if rollover throws it's swallowed (logged) — task is completed but **not** rolled forward | fold rollover into the same RPC/transaction as completion |
| `duplicateTask` | read src → read max order → insert copy | copy is shallow (no children) regardless; not atomic but single insert so low risk | n/a unless deep-copy added |
| `uploadAttachment` | storage `upload` → `insert` metadata; on insert error → storage `remove` (manual compensating action) | best-effort rollback already present; if `remove` also fails, an orphan object remains | keep compensating delete; add a periodic orphan sweep |
| `addAssignee` | `upsert` join row (+ trigger syncs array) (+ fire-and-forget notify) | array sync is a trigger (atomic with the upsert); notify is best-effort | ok |

### 15.6 Concurrency & race handling

- **Personal-list first-visit race.** Two simultaneous first requests can both pass the
  `select … maybeSingle()` and both attempt `insert`. The **partial unique index**
  `lists_personal_owner_unique (personal_owner_id) where personal_owner_id is not null` makes the
  second insert fail with a unique violation — but `getOrCreatePersonalList` does **not** catch it,
  so the losing request throws. ➕ RECOMMENDED: catch the unique-violation and re-`select`, or move
  the whole thing into an `insert … on conflict (personal_owner_id) do nothing returning *` RPC.
- **Concurrent reorder writes.** `reorderTasks` writes `order=index` per row with no locking;
  two clients dragging at once can interleave and produce inconsistent ordering (last-writer-wins
  per row). Orders are plain integers with no uniqueness, so it self-heals on next load but can
  briefly look wrong. ➕ consider fractional ordering or a server-sequenced bulk update.
- **One active timer per user.** Enforced **only** in `startTimer` (it `select`s for an open entry
  first). ⚠️ Two concurrent `startTimer` calls can both pass the check and create two open
  entries. ➕ RECOMMENDED partial unique index:
  ```sql
  create unique index time_entries_one_active_per_user
    on public.time_entries(user_id) where ended_at is null;
  ```
- **Status/completion vs. rollover.** Completion update and rollover are sequential; a client that
  re-reads between them can momentarily see the task completed before it reopens. The
  `recurrence_count` cap is checked against the row read inside rollover, so a double-complete
  could double-advance. ➕ fold into one transaction (see §15.5).
- **Optimistic UI** assumes the action succeeds; on throw it rolls back local state and toasts
  (§13.2). It does **not** reconcile against concurrent edits by others until the next
  `revalidatePath`-driven refresh.

### 15.7 Cache invalidation (normalized, accurate)

Actual `revalidatePath` calls per action group:

| Action group | Revalidates |
|---|---|
| Spaces, folders, lists, `getOrCreatePersonalList`, tasks core (`create/update/delete/duplicate/reorderTask(s)`), assignees, watchers, `createComment`, space-member & list-member CRUD | `revalidatePath("/work","layout")` **and** `revalidatePath("/my-tasks")` |
| Statuses CRUD (`createStatus/updateStatus/deleteStatus/reorderStatuses`), custom-field defs CRUD, `setTaskFieldValue`, checklists, time tracking, `addComment`/`deleteComment`, attachments | `revalidatePath("/work")` **only** |
| `createStatus`/`createFieldDef` etc. specifically | `revalidatePath("/work")` (no `,"layout"`, no `/my-tasks`) |

⚠️ **Consequence:** renaming a status, adding a custom field, toggling a checklist item, logging
time, or adding an attachment **will not refresh `/my-tasks`** on the next server render (the page
keeps stale server data until a full reload). The client view stays correct only because it also
mutates local state optimistically. ➕ RECOMMENDED: standardize a single helper, e.g.
`revalidateWork()` that calls `revalidatePath("/work","layout")` + `revalidatePath("/my-tasks")`,
and call it from **every** mutation.

### 15.8 `duplicateTask` exact copy semantics

`duplicateTask(taskId)` inserts **one** new task row with these fields copied from the source:

`list_id, status_id, parent_id, title (+ " (copy)"), description, priority, due_date, start_date,
time_estimate, custom_fields, tags`, plus `order = maxOrder+1` within `(list_id, parent_id)` and
`created_by = currentUser`.

**NOT copied (⚠️ confirm against expectations):** `assignee_ids`/`task_assignees`, `task_watchers`,
`comments`, `checklists` + items, `time_entries`, `task_attachments`, `task_activity`,
`recurrence_rule`/`recurrence_count` (the copy is **non-recurring**), `completed_at`/`archived_at`
(implicitly null on a fresh insert). Subtasks of the source are **not** cloned — duplicating a
parent yields a childless copy. ➕ RECOMMENDED if deep-duplicate is desired: do it in an RPC that
also copies children + checklists.

### 15.9 Subtask depth & DnD cycle prevention

- **Data model** allows arbitrary nesting depth (`tasks.parent_id` self-FK; `getTasksWithHierarchy`
  builds an N-level tree with `depth`).
- **The list view (`/my-tasks`) renders only ONE level of subtasks.** `getTasksForListView`
  attaches a single `subtask_list` (direct children) to each top-level task; the table renders
  parents at `depth=0` and their direct children at `depth=1`. Grandchildren exist in the DB but
  are **not shown** in this view (they'd appear as top-level rows only if their parent is itself a
  top-level task — which it isn't). So effective UI nesting = **1 level**.
- **Cycle prevention:** the DnD nest handler only checks `targetTaskId === activeId`. ⚠️ There is
  **no** check preventing nesting a task under one of its own descendants, and **no** DB cycle
  constraint. A cycle would orphan rows from the list view (they'd stop appearing as top-level) but
  is otherwise unguarded. ➕ RECOMMENDED: before reparenting, walk `parent_id` upward from the
  target and refuse if `activeId` is encountered; ideally also enforce via a DB trigger.

### 15.10 Archived & restore behavior

- `spaces`, `folders`, `lists`, `tasks` each have a nullable `archived_at`.
- **Reads filter archived out by default.** `getSpaces`/`getSpaceTree`/list queries use
  `is("archived_at", null)`. `getTasksForListView` and `getTasks` filter `archived_at is null`
  (the latter accepts `{includeArchived:true}` to include them; the list view never passes it).
  So **archived tasks do not appear in My Tasks.**
- **There is no dedicated archive/unarchive/restore action.** `archived_at` is part of
  `UpdateTaskInput`, so a task is archived/restored by calling `updateTask(id, {archived_at: <ts>})`
  / `{archived_at: null}`. There is **no UI affordance** for this on `/my-tasks` today (no archive
  button in the row/drawer). ⚠️ GAP if archiving is a desired feature — it must be added.
- **Subtasks of an archived parent:** subtasks are independent rows; archiving the parent does not
  archive children (no cascade on `archived_at`). But since the list view only shows non-archived
  top-level tasks and their direct children, archiving a parent removes the whole branch from view;
  the children remain non-archived in the DB.
- `getGlobalTasks` honors `include_archived`; deletion (`deleteTask`) is a **hard** delete (cascade),
  not an archive.

### 15.11 Validation rules (actual vs. recommended)

**Actual (today):**
- **Titles:** client trims; create/update refuse empty/whitespace-only on the client
  (`title.trim()`), and only save on change. Server `createTask` does **not** re-validate length or
  emptiness (relies on `title text not null` — an empty string would still insert if called
  directly). No max length.
- **Tags:** free-form strings added via `prompt()` (drawer) — `tag.trim()`, no format/charset/length
  rules, duplicates possible.
- **Custom fields:** client coerces by widget (`parseFloat` for numeric, ISO for date, arrays for
  multi/labels). No server-side shape/type validation against the field def.
- **Attachments:** 10 MB enforced by the **bucket** (`file_size_limit`); MIME unrestricted
  (`allowed_mime_types = null`). **Filename is not sanitized** — `uploadAttachment` builds
  `${userId}/${taskId}/${Date.now()}_${file.name}` with the raw name. ⚠️ path-injection / odd-char
  risk.
- **Numbers/dates:** recurrence `interval` clamped `>=1` client-side; `day_of_month` 1–31 via input
  attrs; `addManualTimeEntry` rejects non-positive duration **server-side** (the one explicit server
  validation). `startTimer` rejects a second concurrent timer (server check, race-prone §15.6).
- **Mentions:** `@[Name](id)` tokens are not validated to be real user ids on save.

➕ **RECOMMENDED** (do not claim these exist): server-side title length cap + non-empty check; tag
normalization (lowercase, max length, dedupe, charset allow-list); custom-field server validation
against the def (type + option membership); filename sanitization
(`name.replace(/[^a-zA-Z0-9._-]/g,"_")`) + `allowed_mime_types`; verifying mention ids.

### 15.12 Environment & setup

- **Env vars** (resolved in `lib/supabase/config.ts` → `getSupabaseConfig()`): the public Supabase
  URL + anon key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for the SSR/browser
  client; a **service-role key** (server-only) for the admin client used by `getPermissions` to
  auto-create a `profiles` row. See `.env.example` in the repo for the authoritative list.
- **Supabase clients:** `lib/supabase/server.ts` builds a cookie-bound `createServerClient`
  (`@supabase/ssr`) per request; returns `null` if unconfigured (every action's `db()` throws
  `"Supabase not configured"` in that case). There is also an admin (service-role) client used
  outside the Work module.
- **Postgres extensions required:** `pgcrypto`/`gen_random_uuid` (UUID defaults) and, for search,
  `pg_trgm` (migration 0031). `tsvector` is built-in.
- **Storage:** create the `task-attachments` bucket (private, 10 MB) and its policies (§3.10)
  before attachments work.
- **Migrations:** apply `0001 → 0011`, `0023`, and (optional) `0031` + the storage SQL, in order.
  The minimum set for `/my-tasks`: 0001, 0002, 0003, 0006, 0008, 0009, 0010, 0011, 0023.
- **Auth:** any Supabase Auth provider; `requireUser()` redirects to `/login`. A `profiles` row per
  auth user is required (auto-created by `getPermissions`).

### 15.13 Known intentional limitations

These are deliberate scope choices in the current build — call them out rather than treat as bugs:
- **One level of visible subtask nesting** in the list view (§15.9), despite an N-level data model.
- **No transactions / no optimistic-concurrency control** (§15.5/§15.6) — acceptable for a
  low-contention internal tool.
- **RLS is a coarse gate; authorization lives in server actions** (§15.1) — a deliberate tradeoff
  predicated on "clients never touch Supabase directly."
- **`people` custom field is display-only** (no picker). `Assign`/`Tag` buttons in the bulk bar are
  **placeholders** (no handlers).
- **Bulk actions** issue N independent `updateTask` calls (`Promise.all`), not a batch endpoint.
- **No board/calendar/Gantt view on `/my-tasks`** — list view only. (A separate global board view
  exists; out of scope here.)
- **Cache-invalidation inconsistency** (§15.7) is known.
- **Recurrence** reuses the same row (no per-occurrence history); "anchor=completion" computes from
  the completion timestamp.
- **Notifications** are best-effort and never block; the whole subsystem can be removed.

### 15.14 Test plan

> Reproduce these as automated (Playwright/RTL + Supabase test project) and manual checks.

**Auth & access**
1. New user → `/my-tasks` auto-creates a private personal list with 5 seeded statuses; empty state shows.
2. User B cannot see User A's personal list in any list-scoped read (`getTasksForListView` returns `[]`).
3. ⚠️ Regression guard for the §15.3 gaps: assert whether `getTask`/`getComments` leak across users —
   pick the behavior you intend and lock it with a test.
4. Viewer-level member cannot create/update/delete tasks (editor required); non-admin cannot
   delete the list or manage members.

**Tasks CRUD & list view**
5. Add task via button, `n`, and per-group add row; appears under correct status group.
6. Inline title edit (double-click), priority change, assignee add/remove, due-date set/clear,
   custom-field edit per type — all persist after reload.
7. Status change to done/closed mutes the row + sets `completed_at`; moving back clears it (verify
   the DB trigger value, not just UI).
8. Delete (row context menu + drawer) and duplicate; verify §15.8 copy semantics exactly.

**Drag & drop**
9. Reorder within a group persists `order`. Cross-group drag changes status. Drag onto a chevron
   nests as subtask (depth 1). Self-nest refused. ⚠️ Cycle attempt (nest parent under its child) —
   assert intended behavior (currently unguarded).

**Subtasks & hierarchy**
10. Add subtask inline; parent count `{done}/{total}` updates; expand/collapse works. Confirm a
    grandchild is not rendered in the list view (§15.9).

**Recurrence**
11. Set each pattern (daily/weekly w/ weekdays/monthly w/ day-of-month/yearly), each anchor, each
    end condition. Complete a recurring task → it reopens at next due date in the first `todo`
    status, `recurrence_count` increments, checklists/comments/watchers persist. `ends:after` stops
    at N. `ends:on` stops past the date. Month-end clamping for day 31 in short months.

**Detail drawer tabs**
12. Details save/cancel for description; checklist add/toggle/edit/delete + progress bar; comments
    add/delete + `@`-mention insert and render; activity logs status changes; time start/stop (live
    tick), manual entry (rejects non-positive duration), delete entry, total recompute.

**Bulk & keyboard**
13. Multi-select (checkbox, shift-range, ⌘A), bulk status/priority/due-date/delete with toasts.
    Keyboard: `n`, `/`, `Esc` cascade, `↑/↓`, `Space`, drawer `1–5`.

**Concurrency (where feasible)**
14. Two parallel `startTimer` → assert only one open entry (will FAIL today → drives the §15.6 index).
15. Parallel first-visit `getOrCreatePersonalList` → exactly one list, no unhandled throw (drives the
    on-conflict fix).

**Cache**
16. Rename a status / add a custom field, then hard-reload `/my-tasks` → confirm whether it reflects
    (documents the §15.7 gap).

### 15.15 Performance & scale assumptions

- **Designed for personal/team lists in the hundreds of tasks, not tens of thousands.**
  `getTasksForListView` fetches **all** rows of the list (parents + subtasks) in one query and does
  grouping/sorting/filtering **in-memory on the client**. There is no pagination or virtualization
  in the list view — every row is in the DOM. Expect smooth behavior to ~500–1,000 tasks/list;
  beyond that, add windowing (e.g. `@tanstack/react-virtual`) and server-side grouping.
- **Assignee resolution** is one batched `profiles` query per fetch (good — avoids N+1).
- **Global view** uses `getGlobalTasksPaginated`, but pagination is applied **after** fetching all
  visible rows and filtering in JS (`getGlobalTasks` returns everything, then `.slice`) — i.e.
  `page_size` limits render, not the query. ⚠️ This does not scale; ➕ push filters + `range()` into
  the SQL for large datasets.
- **Indexes present** cover the common access paths (`tasks(list_id)`, `(list_id,parent_id)`,
  `status_id`, `due_date`, GIN on `assignee_ids`, list/space member by profile, FTS GIN). Add
  composite/covering indexes if you move grouping server-side.
- **Realtime:** not used — freshness relies on `revalidatePath` + optimistic updates. ➕ Supabase
  Realtime subscriptions would be the upgrade path for multi-user live updates.

### 15.16 Mobile & accessibility (scope note)

> The current implementation is **desktop-first** and only partially mobile/a11y-complete. This is
> a deliberate scope boundary; the items below are an honest status + the bar to clear for
> production parity (mostly ➕ RECOMMENDED, not present today).

- **Responsive:** the table relies on horizontal scroll on narrow viewports (fixed-width columns,
  sticky title column). Inputs use `text-base` on mobile (16px) to prevent iOS zoom. The detail
  "drawer" is a centered modal that goes near-full-screen on small screens
  (`max-h-[96vh] p-2`). There is **no** dedicated mobile card layout, swipe gestures, or
  bottom-sheet. ➕ Provide a stacked/card view < `md`.
- **Keyboard:** rich shortcuts exist for the list view and drawer (§11.1/§11.9). DnD has a
  `KeyboardSensor` (dnd-kit) so reordering is keyboard-operable.
- **Accessibility gaps (➕ RECOMMENDED):** the detail modal does **not** implement a focus trap or
  restore focus on close, and the backdrop click is the primary dismiss; Radix `Popover`/`Tabs`
  bring their own ARIA, but the custom dropdowns (priority, assignee in the row) are
  ad-hoc `<button>` menus without `role="menu"`/`aria-activedescendant`. Color is sometimes the
  only signal (priority dots, status). No explicit `prefers-reduced-motion` handling for the
  framer-motion animations. Add: focus trap + return focus, ARIA roles on custom menus, visible
  focus rings everywhere (most interactive elements already use `focus-visible:ring`), text labels
  alongside color, and a reduced-motion guard.

---

*End of master document.*
