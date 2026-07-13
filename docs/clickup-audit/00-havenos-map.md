# HavenOS Codebase Map — for ClickUp Workspace Replication
(Produced by codebase-mapping agent, 2026-07-13)

## 1. App modules & routes (`app/`)

Next.js 15 App Router. Route groups: `app/(app)/` (authenticated shell) and `app/(auth)/` (login). Public routes: `app/careers`, `app/knowledge`, `app/pitch/[slug]`, `app/survey/[slug]`, `app/lead-magnet/[slug]`, `app/lost-items/intake`, `app/clean-transition/intake`, `app/sales-comp/[slug]`, `app/mcp/consent`.

Authenticated modules under `app/(app)/`:
- `dashboard/` — "The Board": announcements feed + quarterly Loom + admin whitelist. Tables `board_settings`, `board_admins`, `board_announcements`.
- `my-tasks/` — per-user task inbox (reads the `/work` tables via a personal list).
- `work/` — Project Management (the ClickUp-analog). Subroutes: `work/page.tsx` (landing), `work/list/[listId]/page.tsx` (list detail table), `work/tasks/page.tsx` (global cross-list view).
- `properties/` — property roster (`page.tsx`, `[id]/page.tsx`). Table `properties`.
- `onboarding/` — new-property onboarding workflow (`page.tsx`, `new/`, `[id]/`, `clean-transition/`).
- `operations/` — `lost-items/` (+ `[id]`), `reviews/`, `costs/`, `clean-transition/`.
- `sales/pitches/` — owner-facing pitch pages. Table `sales_pitches`. Nav label "Client Pitches".
- `gtm/lead-magnets/` (+ `[id]`) — lead-magnet landing page builder.
- `content/` — "Paid Ads" / Content Studio Kanban.
- `scorecard/` — Northstar KPI scorecard.
- `agents/` — Claude Managed Agent registry.
- `hr/` — people directory + surveys + hiring + compensation + policies/procedures. Subroutes: `people/`, `surveys/`, `hiring/` (+ `[roleId]`, candidates), `compensation/`, `policies/`, `procedures/`.
- `settings/` — `page.tsx`, `users/`, `departments/`, `api-tokens/`.
- `inbox/` — notifications inbox.

## 2. Database schema (`supabase/migrations/`, 0001–0045, hand-applied)

Statuses modeled three ways across modules:
- Work module: a real `statuses` table, per-list, ordered, with a `category` enum (ClickUp-accurate).
- Most other modules: Postgres enums (property_status, onboarding_task_status, content_topic_stage, etc.).
- A few: free text (hr_issues.status, hr_candidates.stage).

Flexible metadata (jsonb) used heavily: `tasks.custom_fields`, `custom_field_defs.config`, `task_activity.from_value/to_value/metadata`, `onboarding_task_templates.checklist_items`, `content_seo_checks.checks`, `content_agent_messages.suggestion`.

### Work module (`0002_work_module.sql` + extensions)
- `spaces` — id, name, description, color, icon, `order`, `privacy` (text `team`|`private`, 0003), archived_at, created_by.
- `folders` — id, `space_id` FK, name, order, archived_at. (Folder level already exists.)
- `lists` — id, `space_id` (nullable since 0010), `folder_id` FK, `personal_owner_id` (0010), name, description, order, `type` (text `private`|`shared`|`public`, 0006), archived_at.
- `statuses` — id, `list_id` FK, name, color, `category` enum `task_status_category`(`todo`|`in_progress`|`done`|`closed`), order. Per-list, multiple statuses. `seed_default_statuses()` seeds To Do/In Progress/In Review/Done/Closed.
- `custom_field_defs` — id, `list_id` FK, name, `field_type` enum `custom_field_type` (text/number/currency/percent/select/multi_select/date/checkbox/url/email/phone/people/labels), `config` jsonb, order.
- `tasks` — id, `list_id` FK, `status_id` FK, `parent_id` (self-FK → subtasks), title, description, `priority` enum (`urgent`|`high`|`normal`|`low`|`none`), due_date, start_date, time_estimate (min), order, `custom_fields` jsonb (`{field_def_id: value}`), `assignee_ids` uuid[] (denormalized), `tags` text[], archived_at, completed_at, `recurrence_rule` jsonb + `recurrence_count` (0011).
- `task_assignees` — (task_id, profile_id) join, + `role` (`primary`|`secondary`) + `sort_order` (0006). Trigger syncs `tasks.assignee_ids`.
- `task_watchers` — (task_id, profile_id) (0006).
- `comments` — id, task_id, author_id, body.
- `checklists` + `checklist_items` (0009) — content, completed, assignee_id.
- `time_entries` (0009) — started_at, ended_at, duration_ms.
- `task_activity` (0009) — action, from/to values, jsonb metadata; auto-logged on status change; drives `completed_at` sync.
- `task_attachments` (0009) — file_name, storage_path (bucket in `supabase/storage/task-attachments-bucket.sql`).
- `space_members` (0003) — (space_id, profile_id), role (`admin`|`member`|`viewer`).
- `list_members` (0006) — (list_id, profile_id), role (`owner`|`member`), `access_level` (`viewer`|`editor`|`admin`, 0023), color.
- Access-control functions (0023): `work_access_rank(level)`, `user_has_list_access(user, list, min_level)` — list grant → inherits from space grant → falls back to list type + space privacy; super_admin bypass.

### Other module tables
- Properties: `properties`, `property_vendors` (0004); enums property_status/tier/priority/sales_status. `properties.external_id` stores original ClickUp task ID.
- Onboarding: `onboarding_projects`, `onboarding_tasks` (recursive `parent_task_id`, `department` enum, `status` enum), `onboarding_checklist_items`, `onboarding_task_templates` (0015). Work-order costs in 0044.
- HR: `hr_admins`, `hr_employees`, `hr_performance_reviews`, `hr_issues`, `hr_roles`, `hr_candidates`, `hr_docs` (0014); `departments`, `hr_access_grants` (0016); `hr_module_grants` (0032); surveys `hr_surveys`/`hr_survey_questions`/`hr_survey_responses`/`hr_survey_answers` (0020); compensation (0041–0043).
- Content Studio: `content_spaces`, `content_topics`, `content_articles`, `content_article_versions`, `content_research_sources`, `content_seo_checks`, `content_geo_checks`, `content_agent_messages`, `content_publish_jobs` (0019).
- Scorecard: `scorecard_months`, `scorecard_sections`, `scorecard_rows` (0012).
- Lost items: `lost_items`, `lost_item_events` (0024/0025).
- Sales: `sales_pitches` (0018).
- Board: `board_settings`, `board_admins`, `board_announcements` (0013).
- PAT/API: `personal_access_tokens`, `api_access_logs` (0028); MCP OAuth (0038); external invites (0039).

## 3. `/work` vs ClickUp parity

Already present: Space → Folder (optional) → List → Task → Subtask; per-list ordered statuses w/ categories; per-list custom fields (13 types) + per-task jsonb values; multi-assignee w/ primary/secondary; tags (free text[] on task); checklists; comments; time tracking; activity log; attachments; watchers; recurrence; priorities; start/due dates; time estimates. `0009_clickup_parity.sql` literally named for this.

Gaps vs ClickUp:
- Tags: free-text array only — no tag registry (no per-space tag definitions/colors).
- No dependencies/relationships between tasks (blocking/waiting-on/links).
- No sprints, goals, custom task types.
- Views: List view fully built (`list-view-table.tsx`); global cross-list view (`global-tasks-view.tsx`, List/Board/Calendar) but Board/Calendar scaffold-level; no per-list saved-views/view-config table.
- Custom fields list-scoped only (ClickUp also has folder/space/workspace-level fields).
- Statuses list-scoped only (ClickUp has folder/space status templates).
- No tasks-in-multiple-lists (single `list_id`).

Components: `components/work/` — `work-sidebar.tsx` (space/folder/list tree), `list-view-table.tsx` (47KB), `task-detail-drawer.tsx` (71KB), `custom-field-cell.tsx`, `custom-fields-manager-dialog.tsx`, `status-manager-dialog.tsx`, `space-settings.tsx`, `list-settings-panel.tsx`, `global-tasks-view.tsx` (44KB), `status-pill.tsx`, `list-type-icon.tsx`.

## 4. Auth & users

- Google OAuth via Supabase (restricted to @havenvacationrentals.com). Callback `/auth/callback`; session refreshed in `middleware.ts`.
- `profiles` table (0001): id (=auth.users.id), email, full_name, avatar_url, `role` enum `haven_user_role` (`user`|`admin`|`super_admin`, 0016). Auto-provisioned via `handle_new_user()` trigger; `getPermissions()` in `lib/auth/permissions.ts` self-heals missing profiles and force-promotes owner emails to super_admin.
- Permission model (`lib/auth/permissions.ts`): three global roles. `canAccessScorecard`/`canAccessAgentChat`/`canAccessSales` require admin+; `canAccessHrModule` requires HR grant; `canManageUsers` requires super_admin. Work/Properties/Onboarding open to any signed-in user. Guards: `requireSignedIn`, `requireAdminOrAbove`, `requireSuperAdmin`, `requireHrAccess`, `requireHrModule`, `requireSurveyAccess`.
- Module gating is server-side, not primarily RLS (RLS mostly coarse; Content Studio the exception with real role-checking RLS).
- Fine-grained per-module access (analog of ClickUp per-space permissions):
  - Work: `space_members` (admin/member/viewer) + `list_members` (viewer/editor/admin) w/ inheritance via `user_has_list_access()`; `getSpaceTree()` filters private spaces/lists per membership.
  - HR: `hr_access_grants` (scope all/department/employee/survey) + `hr_module_grants`; RPCs `user_has_hr_access_to_employee`, `user_has_any_hr_access`, `user_has_hr_module_access`.
- Sidebar visibility computed in `app/(app)/layout.tsx`, passed to `components/shell/sidebar.tsx`.

## 5. Existing overlaps (migration targets)

| ClickUp area | HavenOS module | Route | Tables / files |
|---|---|---|---|
| Property Detail Master | Properties | `/properties` | `properties`, `property_vendors`; `lib/properties/`, `components/properties/`; `external_id` = ClickUp task ID |
| Property onboarding | Onboarding | `/onboarding` | `onboarding_projects/tasks/checklist_items/task_templates`; `lib/onboarding/` |
| HR directory/surveys/hiring | HR | `/hr` | `hr_*`, `departments`, grants; `lib/hr/` |
| Knowledge base | Knowledge (static) | `/knowledge` | No DB table — hardcoded `lib/knowledge/data.ts`; DB-backed KB would be net-new |
| Scorecard/KPIs | Scorecard | `/scorecard` | `scorecard_months/sections/rows` |
| Generic task lists / PM | Work | `/work` | full stack above — primary replication target |
| Content/paid-ads pipeline | Content Studio | `/content` | `content_*` |

## 6. Property Detail Master CSV (repo root)

Prior ClickUp export. System columns: Task Type, Task ID, Task Name, Status, Task Content, Assignee, Priority, Latest Comment, Comment Count, Assigned Comment Count, Due/Start/Created/Updated/Closed/Done dates, Created By, Space, Folder, List, Subtask IDs/URLs, tags, Lists, Sprints, Linked Tasks, Linked Docs, Time Logged (+rolled up), Time Estimate (+rolled up), Time In Status, Points Estimate (+rolled up).

Custom fields (name + type): Account Manager (drop down), Address (short text), Address for Map (location), Airbnb Account (labels + drop down), Bedroom Count (number), Breezeway ID (short text), Cancellation Policy (drop down), Cleaner Pay (currency), Cleaning Fee (currency), Cleaning Vendor (list relationship), Currently Hosting (checkbox), Fireplace (text), Full/Double Beds (number), Gas Company (drop down), HOA/Community (list relationship), Hostaway ID (short text), Indoor Pool/Hot Tub (number), Key Box Location/Number (short text), King Beds (number), Kitchen/Kitchenette (number), Lawn Care (drop down), Listing Link (url), Lockbox (short text), Locks + Codes (short text), Master Code (short text), Number of Full Bathrooms (number), Number of Guest (Extra Guest Fee) (short text), Number of Half Bathrooms (number), OFFBOARDING DATE (date), Parking/Driveway (text), Pay date (short text), Pest Control (list relationship + short text), Platform Links (short text), Pool Vendor (short text + list relationship), Property Sales Status (labels), Property Tier (labels), Queen Beds (number), Region (labels), Revenue Manager (drop down), Thermostat (drop down), Twin Beds (number), Update guest count (text), Water source (short text), Wifi Log In (short text).

Sample data row confirms Status free text (e.g. `onboarding`) and Task ID format `86e0vdc19` matching `properties.external_id`.

## 7. Conventions for new modules

- UI: `components/ui/` (Button, Card, Badge, Checkbox, Dialog, DropdownMenu, Input, Popover, ScrollArea, Tabs, Tooltip). Shell: `components/shell/` (sidebar, topbar, command-palette, notification-bell, haven-assistant, theme). Module components in `components/<module>/`.
- Design tokens: `tailwind.config.ts` (haven-* palette + semantic aliases, fontFamily, borderRadius.pill/card, shadows) + `app/globals.css` (semantic CSS vars as R G B triples: --background, --surface, --surface-alt, --foreground, --accent, --accent-soft, --border, --ring; .dark overrides). Rule: use semantic classes (bg-accent, text-foreground, border-border, bg-surface-alt) — never hardcode grays. Headings Futura PT (`heading`), body Raleway (`sans`). No emojis.
- Nav: hardcoded in `components/shell/sidebar.tsx` in `buildSections({canScorecard, canAgents, canHr, canSales})`. New module = NavItem there; visibility flags from `app/(app)/layout.tsx` via `lib/auth/permissions.ts`. Module sub-nav = own sidebar component rendered by module layout (pattern: `components/work/work-sidebar.tsx`). Also register in `components/shell/command-palette.tsx`.
- API: handlers in `app/api/`. Legacy shared-key (`/api/lost-items`, header x-haven-api-key); modern `/api/v1/*` PAT-scoped REST (`hvn_pat_…`, tables `personal_access_tokens`/`api_access_logs`, scopes like `tasks:read`; helpers `lib/api-tokens/`). Public unauth posts under `/api/public/*` (honeypot + rate-limit `lib/rate-limit.ts`). MCP server at `/api/mcp` + OAuth `/api/mcp/oauth/*`. Existing `/api/v1/work/spaces`, `/api/v1/work/lists`, `/api/v1/work/lists/[id]/tasks`, `/api/v1/tasks/[id]` are templates.
- Server patterns: async server components fetch in parallel → hand to `"use client"` view (see `work/list/[listId]/page.tsx`). Mutations = `"use server"` actions in `lib/<module>/actions.ts` + `revalidatePath`. Types hand-written in `lib/<module>/types.ts`. Strict TS, no `any`.
- Migrations: sequential `00XX_*.sql` (latest 0045), idempotent (`if not exists` / duplicate_object guards). Enable RLS but gate in server actions (Content Studio exception). `tg_set_updated_at()` trigger pattern. New module = migration + `lib/<module>/{types,actions}.ts` + `components/<module>/` + NavItem + permission helper.

## Bottom line

`/work` is a near-complete ClickUp replica already. Replication = mostly reuse `/work` tables and fill gaps: tags registry, task dependencies/links, space/folder-level status & field templates, richer saved views. Property Detail Master → existing `properties` table. Per-space permissions → extend `space_members`/`list_members` + `user_has_list_access`.
