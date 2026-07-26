# Onboarding Module — Inspection & Port Plan

A full inspection of Haven OS's **Onboarding** section (`/onboarding`) and a
platform-agnostic plan for re-implementing it in another software system.
Written from a code-level audit of the module as it exists on this branch.

---

## Part 1 — What the Onboarding section is

### 1.1 Purpose

The Onboarding module manages **new-property onboarding** — everything that
happens between a signed service agreement and the property being handed off
to Owner Relations. Each property being onboarded is a **project**,
instantiated from a **master task template** (originally extracted from the
live ClickUp project "John Kuvshinikov 2948"). Staff work the project via
five different views, tracking ~75 tasks across 14 departments, with
key-date milestones and embedded sub-checklists.

### 1.2 Where it lives in the codebase

| Layer | Files |
|---|---|
| Schema + template seed | `supabase/migrations/0015_onboarding.sql` |
| Types & enums | `lib/onboarding/types.ts` |
| Display helpers (tones, date math, pipeline, timeline buckets) | `lib/onboarding/utils.ts` |
| Business logic (server actions) | `lib/onboarding/actions.ts` (~15 functions) |
| Routes | `app/(app)/onboarding/{page,new/page,[id]/page,layout,error}.tsx` |
| UI | `components/onboarding/**` (12 components, ~4,000 lines) |
| AI/automation | `lib/agents/tools.ts` — 12 agent tools wrapping the same actions |
| Human-readable template reference | `docs/onboarding-template.md` |

### 1.3 Data model (4 tables)

**`onboarding_projects`** — one row per property being onboarded.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `property_nickname` | text, required | e.g. "John Kuvshinikov 2948" |
| `owner_name` / `owner_email` / `owner_phone` | text, nullable | |
| `status` | enum | see pipeline below |
| `start_date` / `target_open_date` / `actual_open_date` | date | |
| `slack_channel` | text | plain text, no integration |
| `owner_profile_folder_url` | text | Google Drive link |
| `notes` | text, default `''` | |
| `created_by` | text (email) | |
| `created_at` / `updated_at` | timestamptz | `updated_at` via touch trigger |

**`onboarding_tasks`** — recursive task tree (max observed depth: 2, i.e. 3 levels).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | FK → projects, cascade delete | |
| `parent_task_id` | self-FK, cascade delete | tree structure |
| `template_key` | text, nullable | provenance link to template node; null for ad-hoc tasks |
| `title` / `description` | text | descriptions hold full SOPs (some are multi-paragraph) |
| `department` | enum, nullable | 14 values |
| `status` | enum | `not_started` / `in_progress` / `blocked` / `done` / `na` |
| `is_key_date` | boolean | milestone flag; drives Timeline view + directory stats |
| `due_date` | date | |
| `completed_at` / `completed_by` | audit | set/cleared automatically on status change |
| `assignee_email` | text | free text, **not** an FK to users |
| `notes` | text | |
| `order_index` / `depth` | int | sibling ordering + denormalized tree depth |

**`onboarding_checklist_items`** — flat checklist embedded in a task.
`task_id` FK, `label`, `is_checked`, `checked_at`/`checked_by` audit,
`order_index`.

**`onboarding_task_templates`** — the master template.
`template_key` (unique slug, e.g. `root-5--tech-stack-install`),
`parent_template_key` (self-FK, deferrable), `title`, `description`,
`department`, `is_key_date`, `order_index`, `depth`, `has_checklist`,
`checklist_items` (jsonb array of label strings).
Seeded in the migration with **~75 nodes**: 29 top-level phases, 3 levels
deep, 8 embedded checklists totaling ~45 items.

### 1.4 Enums

- **Project status** (the pipeline): `onboarding` → `owner_relations_onboarding`
  → `ready_to_pass` → `done`; off-pipeline: `on_hold`, `no_longer_onboarding`.
- **Task status**: `not_started`, `in_progress`, `blocked`, `done`, `na`.
- **Department** (14): onboarding, owner_relations, revenue, cleaning,
  guest_comms, finance, dispatch, sales, maintenance, runner, leadership,
  haven, tendwell, stillwater. Each has a display label and a color tone.

### 1.5 The operational process encoded in the template

The 29 top-level phases, in order (subtask counts in parentheses):

1. **Start Onboarding** (9) — tag tasks with internal listing name, create
   Slack thread, confirm service agreement (reassign to Sales if unsigned),
   create Owner Profile Folder + Green Light Doc (GLD), Owner Profile
   Worksheet, save SA PDF, HubSpot template, skeleton listing, HubSpot
   property name.
2. **1st owner email** — "Sales Handoff Template" via HubSpot.
3. **Allocate owner linens.**
4. **First-call notes** via HubSpot playbook.
5. **Key Dates block** (11, all ⭐ key dates) — Haven Full Access, Cleaning
   Fee Inspection, Green Light Doc (with 2 subtasks), Execute Linen Plan,
   Tech Stack Install (with checklist: lock → DACK/SmartThings, owner/vendor
   codes, GLD update), Listing Creation, Initial Listing Check, Deep/PreGuest
   Clean, Pro Photos Scheduled, Go/No-Go, Breezeway schedule.
6. **2nd owner email** — post-first-call timeline overview.
7. **Send Clearing invite.**
8. **W9 request via Tax1099** (full SOP in description).
9. **Primary listing creation** (10) — tracking sheet copy, delete skeleton,
   Airbnb ×2, Hostaway, PDM, SuiteOp, Breezeway, GLD transfer, Conduit.
10. **3rd owner email** — post-GLD purchase list + documents.
11. **Owner-approved action items** (4) — purchases, runner delivery
    scheduling, maintenance list to Dispatch, install Haven sign.
12. **Owner contact info into Breezeway profile.**
13. **Set up vendors** (checklist: pest control, lawncare, pool, water
    filtration, propane).
14. **Transfer guests** (if applicable).
15. **Photography fee into Owner Profile Worksheet.**
16. **Set prices** (Revenue dept; PriceLabs SOP).
17. **Primary listing check** (3, per-department, each with its own
    checklist) — Onboarding check (Airbnb/Hostaway), Guest Comms & Dispatch
    check (8-item DACK/codes/messaging checklist), Finance + Revenue check
    (3-item fees checklist).
18. **Secondary listing creation** (4) — Vrbo, Marriott, Booking.com, direct site.
19. **Secondary listing check** (4-item checklist).
20. **Upload pro photos** (7) — full photo replacement workflow with
    approval step.
21. **Revenue check** (2) — 48-hour and 7-day checks.
22. **Open Calendar!** (5-item go-live checklist).
23. **"Calendar Open" owner email.**
24. **Create finance classes** — Divvy, Bill.com, Dext.
25. **Final checks to pass to Accounts** (14-item checklist — the master
    handoff audit: HubSpot deal fields, GLD completeness, W9, insurance,
    permits, listing quality, Breezeway cleanup, Drive folder move, etc.).
26. **"Onboarding Invoice + Payout Info" owner email.**
27. **Send onboarding invoice.**
28. **30-day post-open check** (2) — GM reviews messaging/reviews, OB
    updates listing.
29. **Send handoff package to CEO/COO/EA.**

External systems referenced by the process (as instructions, not
integrations): HubSpot, Slack, Google Drive/Docs/Sheets, Hostaway, Airbnb,
Vrbo, Booking.com, Marriott, Breezeway, DACK, SmartThings, SuiteOp, Conduit,
PriceLabs, Clearing, Tax1099, Divvy, Bill.com, Dext.

### 1.6 Business rules & invariants

1. **Template instantiation**: creating a project copies the *entire*
   template tree into `onboarding_tasks` (depth-by-depth insert, mapping
   `template_key` → new task id to wire parents), then copies each
   `has_checklist` template's items into `onboarding_checklist_items`.
2. **Percent complete** = `done / (total − na)`, rounded. `na` tasks are
   excluded from the denominator but included in raw totals.
3. **Completion audit**: setting status to `done` stamps
   `completed_at`/`completed_by`; any other status clears both. Same pattern
   for checklist `checked_at`/`checked_by`.
4. **Key dates** drive the Timeline tab and directory stats: next upcoming
   key date (earliest due, not done/na), overdue key-date count.
5. **Ad-hoc tasks** may be added under any parent: depth = parent.depth + 1,
   order_index = max(sibling) + 1. They have `template_key = null`.
6. **Ordering** is purely `order_index` within a parent. There are **no
   task dependencies** — sequence is convention, not enforced.
7. **Directory rollups** are computed in one pass server-side (fetch all
   projects + all tasks, group in memory) to avoid N+1.
8. **Deletes cascade**: project → tasks → checklist items; parent task →
   subtree.
9. **Off-pipeline statuses** (`on_hold`, `no_longer_onboarding`) render
   outside the 4-stage visual pipeline and are excluded from "active"
   rollups (along with `done`).
10. **Timeline buckets**: overdue / today / this week (≤7d) / next week
    (≤14d) / later / no date.
11. **Access**: admin-only. The layout redirects non-admins; *every* server
    action re-checks `requireOnboardingAdmin()`. The admin list is shared
    with HR (`hr_admins` table). Postgres RLS is permissive for any
    authenticated user — the app layer is the real gate.

### 1.7 UI surface

**`/onboarding` — Projects Directory** (admin-gated layout with "New
Project" CTA):
- Summary tiles: Active projects · Target open ≤14 days · Overdue key dates
  · Blocked tasks. The last three are clickable **smart filters**.
- Toolbar: text search (nickname/owner/email), status filter chips,
  view toggle.
- Three views: **Board** (kanban grouped by project status), **List**
  (dense table), **Timeline** (grouped by target open date).

**`/onboarding/new`** — creation form: nickname (required) + owner info,
start/target dates, Slack channel, folder URL, notes → creates the full
templated project → redirects to detail.

**`/onboarding/[id]` — Project Detail**:
- **Hero**: inline-editable fields (nickname, owner contact, dates, Slack,
  folder URL), status menu, 4-stage pipeline visual, progress ring,
  stat tiles.
- **Tabs**:
  - *Overview* — blockers panel, upcoming key dates (next 6), department
    progress, in-progress list.
  - *Checklist* — the workhorse: nested task tree with one-click circular
    checkboxes, "X/Y done" parent rollups, mark-all-done per section,
    hover ⋯ row menu, department badge shown only when it differs from the
    parent's, embedded checklist rows, keyboard support (Space = toggle,
    Enter = open drawer).
  - *Timeline* — key-date tasks in the 6 timeline buckets.
  - *By Department* — grouped with per-department progress bars.
  - *Kanban* — drag-and-drop between status columns (dnd-kit), optimistic
    update with revert-on-error.
- **Task Drawer** (right slide-in panel, Radix Dialog): edit
  title/description/department/due date/assignee/key-date flag; status
  menu; checklist toggle/add/delete; delete task. Opens from any tab; state
  keyed by task id so server revalidation keeps it fresh.

A **Clean Transition** sub-page (`/onboarding/clean-transition`) is nested
under the route but is a separate feature (cleaning intake/approval) — out
of scope for this port unless explicitly wanted.

### 1.8 Automation surface

Twelve Claude agent tools in `lib/agents/tools.ts` wrap the same server
actions: list/get projects, get full tree, create project from template,
update project fields, update task status/fields, add ad-hoc task, delete
task, toggle/add checklist items. This makes the module fully drivable by
the HavenOS assistant/MCP — worth preserving as an explicit API in the port.

---

## Part 2 — Implementation plan for the target software

The plan is written stack-agnostic: every phase states *what* to build and
the acceptance criteria; the "how" maps onto any web stack (Rails, Django,
Laravel, another Next.js app, .NET) or a configurable PM platform. Where the
target choice changes the work, it's called out.

### Phase 0 — Decisions before writing code

1. **Target type.** Two very different paths:
   - **(A) Custom app module** (recommended if the target is software you
     own): port schema + logic + UI as specified below. Full plan applies.
   - **(B) Configurable PM platform** (ClickUp/Asana/Monday/Notion): you
     only port the *template and process* (Part 1.5), using the platform's
     native template, custom-field (department, key-date), and dashboard
     features. Phases 1–2 collapse into "model the template natively";
     Phases 3–5 become dashboard configuration; you lose the tailored
     Checklist-tab UX and the API-first automation surface. Note the irony:
     this process originally lived in ClickUp and Haven built this module
     to escape its limits — going back to (B) should be a deliberate choice.
2. **Auth & roles.** The source gates everything behind a shared HR-admin
   whitelist. Decide the target's equivalent (dedicated `onboarding_admin`
   role recommended rather than piggybacking on another department's list).
3. **Template ownership.** Today the template is only editable via SQL/seed.
   Decide whether the port needs a template-editor UI (recommended as a
   fast-follow, not v1) or keeps seed-file management.
4. **De-Haven-ing the template.** The seed hardcodes employee names (Dennis,
   Alyssa, Jack, Issa, Andrew, Summer, Kim), Google Doc URLs, and Haven's
   vendor stack. Decide: port verbatim (if the target is still for Haven) or
   parameterize (role placeholders + configurable links) if it's for a
   different company/product.
5. **Scale assumptions.** Directory stats load *all* tasks of *all* projects
   into memory. Fine for tens of projects × ~75 tasks; if the target expects
   hundreds+, plan aggregate queries (GROUP BY) instead.

### Phase 1 — Schema + template seed (foundation)

Recreate the four tables (§1.3) with the target's idioms:

- Portable DDL notes: the enums can be CHECK constraints or lookup tables if
  the target DB lacks enum types. `template_key`/`parent_template_key` can
  stay a string self-reference; the deferrable FK is only needed if seeding
  parents after children — insert in depth order and a plain FK works.
- Keep the three indexes per tasks table: `(project_id, parent_task_id,
  order_index)`, `(project_id, department)`, `(project_id, status)`.
- Keep `updated_at` touch triggers (or ORM-level equivalent).
- **Seed migration**: export the template from the source with
  `select * from onboarding_task_templates order by depth, order_index`
  (or lift it straight from `0015_onboarding.sql` lines 187–321) into a
  JSON fixture, then write the target's seeder.
- ⚠️ **Data gotcha**: checklist labels in the seed contain HTML entities
  (`&amp;`, `&quot;`) — unescape once during export so the port renders
  clean text.

**Acceptance**: seeding an empty DB yields ~75 template rows; tree integrity
check passes (every `parent_template_key` resolves; depth matches actual
ancestry; order_index unique per sibling group).

### Phase 2 — Core service layer / API

Implement these operations (mirroring `lib/onboarding/actions.ts`), each
behind the admin gate:

| Operation | Behavior to preserve |
|---|---|
| `createProjectFromTemplate(input)` | Insert project → copy template tree depth-by-depth mapping keys→ids → copy checklists. Must be transactional in the port (the source does sequential inserts; wrap in a DB transaction to avoid half-created projects). |
| `listProjects(status?)` | Simple filtered list, newest first. |
| `listProjectsWithStats()` | Per-project rollup: total/done/inProgress/blocked/notStarted, percentComplete (na-exclusion rule!), keyDates total/done, nextKeyDate {title, due_date}, overdueKeyDates, lastActivity (max task updated_at). |
| `getProject(id)` / `updateProject(id, patch)` / `deleteProject(id)` | Partial updates; delete cascades. |
| `getProjectTree(id)` | Project + nested task tree (children sorted by order_index) + checklists attached per task + totals block. |
| `updateTaskStatus(id, status)` | Stamps/clears completed_at/by. |
| `updateTask(id, patch)` | title/description/department/is_key_date/due_date/assignee/notes. |
| `addAdHocTask(input)` | depth/order_index computation per §1.6.5. |
| `deleteTask(id)` | Cascades to subtree + checklists. |
| `toggleChecklistItem(id, checked)` | Stamps/clears checked_at/by. |
| `addChecklistItem(taskId, label)` / `deleteChecklistItem(id)` | Appends order_index. |

Expose them as the target's native mutation mechanism (REST/GraphQL/server
actions) **and**, if the target has an AI/automation layer, register the
same 12 tools as in §1.8.

**Acceptance**: API-level test creating a project and asserting: 75 tasks
created, parent wiring correct, 8 tasks have checklists (~45 items),
percentComplete math matches the na-exclusion rule, done→not_started
transition clears the audit fields.

### Phase 3 — Projects Directory UI

Build `/onboarding` per §1.7: summary tiles with smart filters, search +
status chips, Board/List/Timeline views. Board columns = the 6 project
statuses; Timeline groups by target_open_date. Reuse the source's date
helpers (`daysUntil`, `formatRelative`, `timelineBucket` in
`lib/onboarding/utils.ts`) — they're dependency-free TypeScript and port
almost verbatim.

**Acceptance**: with seeded demo data, each smart filter narrows correctly;
a project with an overdue key date surfaces in both the tile count and the
filtered set.

### Phase 4 — Project Detail: Hero + Checklist tab + Task Drawer

This is the core working surface — build it before the other tabs.

- Hero with inline-edit fields (each field saves independently with
  optimistic feedback + error toast), status menu, pipeline visual
  (4 stages; off-pipeline note for on_hold/no_longer_onboarding),
  progress ring.
- Checklist tab: nested tree, one-click done-toggle checkbox, parent "X/Y
  done" + mark-all-done, department badge suppression when same as parent,
  embedded checklist rows, add-task affordance (ad-hoc, at any level),
  hover row menu (edit/delete), keyboard toggle/open.
- Task drawer: full task editing + checklist CRUD + status + delete, opened
  from any row, survives data refresh (key by task id, re-resolve against
  fresh tree).

**Acceptance**: an operator can run an entire onboarding end-to-end from
this tab alone — every task completable, every checklist checkable, ad-hoc
tasks insertable — without touching the DB.

### Phase 5 — Remaining views

- Overview tab (blockers / upcoming key dates / dept progress / in-progress).
- Timeline tab (key dates in 6 buckets).
- By Department tab (14 groups with progress bars).
- Kanban tab (drag-and-drop status change, optimistic with revert). Use the
  target's DnD idiom; require a small activation distance so click still
  opens the drawer.

These are all pure projections of the same flat task list — no new backend
work.

### Phase 6 — Permissions & admin

- Dedicated onboarding-admin role/whitelist; gate the module's routes *and*
  every mutation server-side (don't rely on hiding the nav link).
- If the target DB supports row-level security, mirror the source's posture
  (authenticated read; writes via the app layer) or tighten it — the
  source's permissive-RLS-plus-app-gate is a known soft spot; the port is a
  chance to enforce the admin check in policy too.

### Phase 7 — Data migration (if live projects must move)

1. Export from source Supabase: `onboarding_projects`, `onboarding_tasks`,
   `onboarding_checklist_items` (JSON/CSV, preserving ids).
2. Import in dependency order: projects → tasks depth 0..n (remap ids if
   the target generates its own; carry a source-id column during migration)
   → checklist items.
3. Preserve `template_key`, audit fields, and statuses verbatim.
4. Verify per project: task count, done count, percentComplete identical to
   the source's directory stats.
5. Freeze writes in the source during cutover (it's admin-only, so a Slack
   announcement + revoking the admin list suffices).

### Phase 8 — Hardening & follow-ons (post-parity)

Known gaps in the source worth fixing in the port rather than replicating:

- **assignee_email is free text** → make it a user reference with a picker.
- **No notifications** — key dates and blocked tasks are pull-only. Add
  digest/notification on overdue key dates and blocked>N-days.
- **No task dependencies** — consider optional "blocked by" links if the
  target process needs enforcement (the team has managed fine on convention).
- **Template editing UI** — CRUD on template nodes + versioning
  (`template_key` provenance already supports "which template version
  spawned this task" analysis).
- **Slack channel is a text field** — if the target has a Slack integration,
  auto-create the property thread (template phase 1 task) from it.
- **Per-department task views across projects** ("all Cleaning onboarding
  tasks everywhere") — the schema supports it; the source UI never built it.

### Testing & acceptance summary

- Unit: percentComplete math (na exclusion), timeline bucketing, depth/order
  computation for ad-hoc tasks, audit stamping.
- Integration: template instantiation (counts + wiring + checklists),
  cascade deletes, admin-gate enforcement on every mutation.
- E2E: create project → work tasks across all five views → drawer edits →
  status pipeline to done.
- Migration: source-vs-target stat parity per project.

### Effort estimate (custom-app path, one experienced full-stack dev)

| Phase | Estimate |
|---|---|
| 0 Decisions | 0.5 day (mostly stakeholder answers) |
| 1 Schema + seed | 1–2 days |
| 2 Service layer + tests | 2–3 days |
| 3 Directory | 2–3 days |
| 4 Hero/Checklist/Drawer | 4–5 days |
| 5 Remaining views | 2–3 days |
| 6 Permissions | 1 day |
| 7 Migration | 1–2 days |
| **Total to parity** | **~3 weeks** |

Platform-config path (B): 2–4 days to model the template + dashboards, at
the cost of the custom UX and API surface.
