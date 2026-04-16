# Feature Spec: Tendwell-Style Task Lists

Bring task-list UX from `lyndeinvestments-lab/tendwell-ops` (Tendwell OS)
into Haven OS. Reference: the Tendwell repo is cloned at
`/home/user/workspace/tendwell-ops` — primary file to mirror is
`client/src/pages/tasks.tsx` (1723 lines) and SQL under
`supabase/migrations/20260411_task_management.sql`,
`20260414_task_lists.sql`, `20260414_task_subtasks.sql`.

Branch: `claude/tendwell-style-task-lists` (already cut).

## 1. Schema — `supabase/migrations/0006_task_lists_tendwell.sql`

Add to Haven-OS:

1. `lists.type` column — text, default `'shared'`, values
   `'private' | 'shared' | 'public'`. Add check constraint.
2. `list_members` table:
   - `list_id uuid references lists(id) on delete cascade`
   - `profile_id uuid references profiles(id) on delete cascade`
   - `role text default 'member'` ('owner' | 'member')
   - `color text default '#6366f1'` (per-user color for this list)
   - `added_by uuid references profiles(id) on delete set null`
   - `added_at timestamptz default now()`
   - Primary key `(list_id, profile_id)`
   - RLS: read all authenticated, insert/update/delete authenticated.
3. Trigger `tg_auto_add_list_creator`: when a list is inserted with
   `created_by not null`, auto-insert a `list_members` row with
   `role='owner'`. Mirror the pattern in `0003_space_privacy.sql`.
4. `task_assignees` — ADD columns:
   - `role text not null default 'secondary'` ('primary' | 'secondary')
   - `sort_order integer not null default 0`
5. `task_watchers` table:
   - `task_id uuid references tasks(id) on delete cascade`
   - `profile_id uuid references profiles(id) on delete cascade`
   - `added_at timestamptz default now()`
   - PK `(task_id, profile_id)`
   - RLS same as above.
6. Indexes:
   - `idx_list_members_profile on list_members(profile_id)`
   - `idx_task_watchers_task on task_watchers(task_id)`
   - `idx_task_watchers_profile on task_watchers(profile_id)`

Use `create ... if not exists` / `add column if not exists` everywhere
so the migration is idempotent.

## 2. Types — `lib/work/types.ts`

Add:

```ts
export type ListType = "private" | "shared" | "public";
export type ListMemberRole = "owner" | "member";
export type AssigneeRole = "primary" | "secondary";

export interface ListMember {
  list_id: string;
  profile_id: string;
  role: ListMemberRole;
  color: string;
  added_by: string | null;
  added_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface TaskWatcher {
  task_id: string;
  profile_id: string;
  added_at: string;
}
```

Extend `List` with `type: ListType`.
Extend `CreateListInput` with optional `type`.

For the global tasks page, add:

```ts
export interface GlobalTask extends TaskWithRelations {
  list: Pick<List, "id" | "name" | "type"> & { space_id: string };
  space: Pick<Space, "id" | "name" | "color">;
}

export interface GlobalTaskFilters {
  search?: string;
  statuses?: string[]; // status names
  priorities?: TaskPriority[];
  assignee_ids?: string[];
  list_ids?: string[];
  space_ids?: string[];
  due?: "all" | "overdue" | "today" | "this_week" | "none";
  include_archived?: boolean;
  include_completed?: boolean;
}
```

## 3. Actions — `lib/work/actions.ts`

Add (and modify `createList`, `updateList`, `getList` to include `type`):

- `getListMembers(listId)` → `ListMember[]` with joined profile.
- `addListMember(listId, profileId, { role?, color? })`
- `removeListMember(listId, profileId)`
- `updateListMemberColor(listId, profileId, color)`
- `updateListType(listId, type)`
- Watchers: `addWatcher(taskId, profileId)`, `removeWatcher(taskId, profileId)`, `getWatchers(taskId)`
- Assignees upgrade: existing `addAssignee` gains optional `role: AssigneeRole = 'secondary'` — upsert with role.
- `setPrimaryAssignee(taskId, profileId)` — set one assignee to primary, demote others to secondary in one transaction-style sequence of updates.
- `getGlobalTasks(filters: GlobalTaskFilters)` — server-side query joining tasks → lists → spaces → statuses; resolve profiles for assignees; return `GlobalTask[]`. Apply all filters at the DB layer where possible (title `ilike`, status name via joined statuses, priority enum, assignee_ids `@>`), filter in JS for date ranges (`due`). Respect list visibility: private → require caller is a list_member; shared → same; public → everyone.

All new actions call `revalidatePath("/work", "layout")`.

## 4. UI — Global Tasks Page

### Route
`app/(app)/work/tasks/page.tsx` — server component that reads filters
from `searchParams` and passes seed data to a client component.

### Client component: `components/work/global-tasks-view.tsx`

Mirror `tendwell-ops/client/src/pages/tasks.tsx` patterns (adapted to
Haven design system and server actions; no React Query — use
`useTransition` + `router.refresh()` or optimistic state).

Top-bar controls (left → right):
- Search input (`Search` icon, debounce 200ms, updates URL)
- Status multi-select chip filter (pulls distinct status names across
  selected lists, or fall back to the four categories if no list filter)
- Priority filter (Urgent/High/Medium/Low + "All")
- Assignee picker
- List picker (multi-select)
- View toggle: **List / Board / Calendar** (icons: `List`, `LayoutGrid`, `Calendar` from lucide-react)
- Export CSV button (right side) — uses Papa-parse; columns: `Title, Status, Priority, Due, List, Space, Primary Assignee, Watchers`

Views:
- **List view** (FULL polish — this is the anchor):
  - Sticky header, sortable columns (title, status, priority, due_date, assignee_name, list.name, created_at) with `ArrowUp/ArrowDown` indicators (copy Tendwell's `SortKey` handling).
  - Rows show: checkbox for done, priority pill, title (links to task detail drawer), status pill, due date (red if overdue, amber if today), assignee avatars with primary marked by a ring, list name chip (color from `lists.type` icon), space color dot.
  - Row click opens `TaskDetailDrawer` (existing `components/work/task-detail-drawer.tsx`). Drawer already exists — just wire it up.
  - Empty state: "No tasks match your filters."
- **Board view** (scaffolded, not polished): group by status category; each column shows task cards (title, priority, due, primary assignee avatar). No drag-drop needed in this branch — mark as TODO comment inline.
- **Calendar view** (scaffolded): simple month grid, tasks placed by `due_date`. Clicking a task opens drawer. Again, TODO comment on drag-reschedule.

All three views share the filter state — store it in URL search params
(so bookmarkable).

### Component: `components/work/list-type-icon.tsx`
Tiny helper: returns `Lock` for private, `Users` for shared, `Globe` for
public. Used in sidebar and global view.

### Sidebar enhancement — `components/work/work-sidebar.tsx`
In `ListNode`: render the list-type icon (size 3.5) before the list
name. If `list.type === 'private'` and the current user is NOT in
`list_members`, hide that list from the tree (fetch membership check in
the server component that builds the tree — see below).

### Server-side tree adjustment — `lib/work/actions.ts` → `getSpaceTree`
Filter out `private` lists the caller is not a member of. Keep `shared`
and `public` visible to all.

### Add-list flow
Extend the existing `AddFolderListButton` / `AddListInFolderButton`:
after creating the list, show a tiny picker for `type` (private / shared
/ public). For this branch, use a second `prompt()` or a simple inline
select — don't build a full modal; keep it pragmatic.

## 5. Navigation
Add a top-level link to `/work/tasks` in the Work module entry. Put it
at the very top of `WorkSidebar` above the space tree:

```tsx
<Link href="/work/tasks" ...>
  <CheckSquare /> All Tasks
</Link>
```

## 6. Dependencies
Install **only** `papaparse` + its types. Everything else (dnd-kit,
cmdk, lucide-react, date-fns) already exists. Use `npm install` (no
pnpm in sandbox).

```bash
npm install papaparse
npm install -D @types/papaparse
```

Note `date-fns` may not be in package.json — check first; if missing,
use small inline date helpers instead of adding a dep.

## 7. Verification

From `/home/user/workspace/Haven-OS`:

```bash
npm install          # if dependencies were added
npm run typecheck    # must pass
npm run build        # must pass
```

Do NOT attempt to run `npm run dev` — no Supabase env in sandbox.

The build must succeed with no type errors and no ESLint errors that
would fail Vercel's default build. Warnings OK.

## 8. Out of scope (leave TODO comments)
- Board drag-drop
- Calendar drag-reschedule
- Notifications for watchers (keep schema; no delivery yet)
- Per-user color picker UI (just default color on join)
- CSV import

## 9. Commit hygiene
Make ONE commit at the end with message:

```
Tendwell-style task lists: types, watchers, multi-assignee, /work/tasks global view

- Migration 0006: lists.type, list_members, task_assignees.role, task_watchers
- Actions: list members, watchers, setPrimaryAssignee, getGlobalTasks with filters
- New /work/tasks page with List/Board/Calendar views + CSV export
- Sidebar: list-type icons, hide private lists for non-members
- Hide-private-lists logic in getSpaceTree
```

Do NOT push. I'll push from the main agent after verifying.

## 10. Style guardrails
- Use existing Haven tokens: `bg-accent`, `text-foreground`, `border-border`, `bg-surface-alt`, etc. Do NOT hardcode grays — follow `components/work/list-view.tsx` for precedent.
- No emojis.
- Keep all new components under `components/work/`.
- Server actions: `"use server"` directive; server components for pages.
- Use Next.js App Router conventions (already established).
- Strict TS: no `any` — use `unknown` + narrow, or proper types.
