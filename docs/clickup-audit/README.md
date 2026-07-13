# ClickUp → HavenOS Replication Audit

**Date:** 2026-07-13 · **Scope:** the entire Haven ClickUp workspace (22 spaces, ~170 lists), audited read-only via the ClickUp API, plus a map of the existing HavenOS codebase.

This directory is the source of truth for replicating ClickUp inside HavenOS. Per-space detail lives in the numbered files:

| File | Contents |
|---|---|
| `00-havenos-map.md` | HavenOS codebase map: modules, DB schema, `/work` ClickUp-parity analysis, conventions |
| `01-company-hub.md` | Company Hub (Property Detail Master, SOPs, Tickets, Passwords, Leadership Projects) |
| `02-eos-team-roles.md` | EOS (L10 meetings, Rocks, V/TO, org charts) + Haven Team Roles |
| `03-hr.md` | HR (hiring pipelines, employee lifecycle, forms, policies, surveys) |
| `04-guest-experience-cleaning.md` | Guest Experience (escalation, trackers, dispatch, vendors) + Haven Cleaning |
| `05-sales-revenue-marketing.md` | Sales (lead CRMs, content) + Revenue + Marketing |
| `06-finance-or-onboarding-maintenance.md` | Finance, Owner Relations, Onboarding Team, Maintenance, Exterior, Insurance |
| `07-tendwell-startups-private.md` | Tendwell Cleaning Co., Starting Up Start Ups, Dylan's Private |
| `08-ai-spaces-future.md` | AI Workflows, AI Knowledge Base, Stay Automated, Future Clickup Projects (test space) |

Sensitive content policy: credential lists (Passwords folder, My Passwords) are documented **structure-only** — no task names or values. Confidential leadership items, applicant/employee names, and personal to-do content are redacted from these committed files. Property door codes / wifi fields exist in the Property Detail Master schema and are flagged for restricted handling.

---

## TL;DR

1. **HavenOS `/work` is already a near-1:1 ClickUp clone.** Space → Folder → List → Task → Subtask, per-list ordered statuses, per-list custom fields (13 types), multi-assignee, comments, checklists, attachments, watchers, time tracking, recurrence, and per-space/per-list membership with access levels all exist (`00-havenos-map.md`). Replication is mostly **data migration + a short list of feature gaps**, not a new build.
2. **Only ~40 of ~170 lists are actually alive.** The rest are stale archives, dead relics, empty scaffolds, or 2021-era onboarding test data. Migrate the live systems fully, archive selected history read-only, skip the debris.
3. **The highest-value ClickUp assets are entity tables, not task lists**: Property Detail Master (~200 properties, ~48 fields), Vendor Contacts List, Cleaning Vendors, the two lead-pipeline CRMs, Revenue Strategy List (one record per property), HR Employee List, and the linen/fee/refund/claim trackers. Several map onto existing HavenOS modules rather than `/work`.

## Workspace inventory & migration triage

**Verdicts:** MIGRATE (live system, moves fully) · MERGE (folds into an existing HavenOS module) · ARCHIVE (import read-only history) · SKIP (dead/test/empty).

### Core operations

| Space | Live systems | Proposal |
|---|---|---|
| **Company Hub** | Property Detail Master (~200 props, ~48 fields, updated daily) → MERGE into `/properties`; Company SOP List (200+, Department + "SOP Strength" taxonomy) → MERGE into knowledge/procedures; Company Tickets (cross-dept router w/ Department automation) → MIGRATE; Property HOA/Community (registry, relation target of PDM) → MIGRATE; Skills/Agent Training Idea List + Trellis Implementation Plan (new, active AI lists) → MIGRATE. Passwords folder (8 credential lists) → MIGRATE into a **restricted vault** (see Security). Leadership Projects folder → SKIP (dead). Support Team folder → ARCHIVE (agendas stale). |
| **Guest Experience** | Escalation queue (100+, 58-option Issue taxonomy, 428-option property labels, Hostaway-email-fed) → MIGRATE; fee/refund trackers (Guest Relations Refund, Instacart, Pet Fee, Left Item, Other Cleaning Extra Charges) → MIGRATE (Left Item Tracker likely MERGE with existing `/operations/lost-items`); Invoice System (~73 open; statuses encode Dext/Divvy/bill.com routing; relations to Vendor Contacts) → MIGRATE; Vendor Contacts List (100+ vendors, 50-capability labels, COI attachments, ratings) → MIGRATE as vendor directory; Guest Comm + Dispatch task lists → MIGRATE. Lawncare, Vendor Survey, W9's 2023, Inventory Tracking, SuiteOp Reviews, Ed Zorn 1531 → SKIP. |
| **Haven Cleaning** | Cleaning Task List, Cleaning Vendors (lifecycle statuses incl. blacklist), Cleaning Invoice System, 📋Damaged Linen Form + Linen Count (identical 23-field form intake) → MIGRATE. Linen Inventory → ARCHIVE. Requests → SKIP (never used). |
| **Onboarding Team** | Onboarding Properties (master per-property pipeline, template subtasks, department push) → MERGE into `/onboarding`; Onboarding Task List, Listings \| Admin Tasks (20 person-named status buckets — needs remodel), Onboarding SOPs → MIGRATE/MERGE (SOPs → knowledge). Guest Transfer List → ARCHIVE. |
| **Owner Relations** | Offboarding Properties (template-driven, competitor/outcome labels) → MIGRATE (pairs with `/onboarding`); 📋 Reviews Less Than 5 Stars (daily form intake, star rating, issue taxonomy) → MERGE with existing `/operations/reviews`; OR Task List → MIGRATE. Pending Reviews, Weekly Inspection, Pool Cleaning Processing, OR Onboarding/Training, Project L.C, Owner Escalation → SKIP/ARCHIVE. |
| **Finance** | Damage Protection Fee Claims (adjudication pipeline, updated daily, form-fed) → MIGRATE (needs field dedupe); Finance Task List (recurring payroll/payout/tax ops) → MIGRATE. Safely Properties & Fees → ARCHIVE (fee data may merge into properties). Chargeback, Request to Pay Owner → SKIP. |
| **Maintenance / Exterior** | Entirely dead — work moved to Breezeway. Vendor Form / W9 lists contain sensitive tax/banking **field schemas** (W-9 collection since moved to Tax1099) → SKIP or restricted ARCHIVE. |
| **Insurance** | Clients + Cleaners COI expiration trackers (due date = expiry, automation flips active → expired; Cleaners lapsed since Apr 2025) → decision: rebuild as a proper renewals feature or drop. |

### GTM & revenue

| Space | Live systems | Proposal |
|---|---|---|
| **Sales** | DR Warm Lead Pipeline + JZ Cold Sales Pipeline (owner-lead CRMs, 100+ records each, updated this week; Lead Source/Owner Tier/Gross Rent/SA Signed fields; referral relation) → MIGRATE as a lead-CRM structure; Blog Projects (weekly SEO pipeline) + Content Calendar → MIGRATE or MERGE into `/content`. Agent CRM, Shut Down Scorecard, Nightly Rate → ARCHIVE. Lead Pipeline (GA), Referral List, Sales Task List, Call Log → SKIP. |
| **Revenue** | Revenue Strategy List (one task per managed property, statuses = MPI30 performance bands, rent-goal/AM/Airbnb-account fields) → MIGRATE, linked to `properties`; Revenue Task List → MIGRATE (strand the ~45 leftover 2024 bookkeeping tasks). |
| **Marketing** | Empty scaffold, zero tasks ever → SKIP. |

### People & leadership

| Space | Live systems | Proposal |
|---|---|---|
| **HR** | Employee Onboarding/Offboarding (template-automation checklists w/ progress rollup), HR Employee List, active hiring pipelines (e.g. Runner, Bookkeeper 2025/2026) → MERGE into `/hr` (candidates, employees, policies already exist there); Policies → MERGE; ~30 per-role form-fed hiring pipelines (two status-scheme generations; emoji interview scorecards) → import the schema once, ARCHIVE old pipelines; empty form shells (Payroll Requests, exit-interview 📋 Form, 📋 Dispatch Request Form) → rebuild as HavenOS forms if still wanted. Team Surveys → SKIP (exists in `/hr/surveys`). |
| **EOS** | Finance L10, Dylan/Jo/Christine L10, V/I Weekly Same Page (all active this week; **leadership-restricted content**) → MIGRATE into restricted spaces; Q1 2026 Rocks + 2022–2025 Rocks archives → MIGRATE current, ARCHIVE history; Company Issues List → ARCHIVE. The three "Q2/Q3/Q4 Rocks 2025" lists inside the 2026 folder are December-2025 template clones → SKIP. V/TO + accountability/org charts are **whiteboards with empty shell lists** — model as documents/org-chart data, not tasks. |
| **Haven Team Roles** | Dead since 2023, but Job Descriptions list = complete role-profile templates (duties, % breakout, success criteria) → import content into `/hr` roles; org-chart lists → SKIP (whiteboards). |
| **Dylan's Private** | Dylan's To Do List (100+ open, active today, priority-driven personal GTD) → MIGRATE to a private personal list (My Tasks supports this); My Passwords → restricted vault (recommend a real secrets manager instead). |

### Side ventures & experiments

| Space | Live systems | Proposal |
|---|---|---|
| **Tendwell Cleaning Co.** | Invoicing + History (active email-ingested billing inbox — contains untriaged spam and apparent phishing "overdue invoice" emails; rebuild as ingest + structured invoice records, do **not** replicate 1:1); Property List Tendwell (per-property unit economics with Profit/Margin formula fields); Cleaner List (roster w/ rates, insurance, background checks) → MIGRATE into a restricted Tendwell space. Pipeline/EOS/SOP lists → ARCHIVE. |
| **Starting Up Start Ups** | Dead since mid-2025 → ARCHIVE launch checklist, fold Stillwater property into the Tendwell property list. |
| **Ai Workflows / AI KB / Stay Automated** | Mostly stale experiments; Automation Buildouts (Stay Automated client delivery pipeline) is the one active list → MIGRATE it; ARCHIVE Books Sheet Automation content as requirements history; SKIP the rest. |
| **Future Clickup Projects** | 2021–22 ClickUp onboarding test data → SKIP entirely (Dylan Ideas folder optionally archived as requirements history). |

## Feature gaps to build in `/work`

Ordered roughly by how much of the workspace depends on them:

1. **Relationship custom field** (`list_relationship`) — used pervasively as foreign keys: PDM ↔ HOA/Cleaning Vendors/Pest/Pool vendors, Invoice System ↔ Vendor Contacts, Tendwell Property ↔ Cleaner List, Reviews ↔ Properties. HavenOS `custom_field_type` has no relationship type today.
2. **Space/folder-level shared field definitions** — ClickUp shares field IDs across lists (Department 14-option set, 428-option property labels, folder-level fields). HavenOS fields are list-scoped only; migration needs space-scoped defs to avoid duplicating definitions per list.
3. **Automations engine** — status-change department routing (Company Tickets, Onboarding/Offboarding pushes), due-date rules (lead pipelines), status flips (Insurance active→expired), recurring tasks (already partially supported). Exact rules pending screenshots (API doesn't expose them).
4. **Forms** — many intake lists are ClickUp Forms (hiring applications, Damaged Linen, Linen Count, Reviews <5⭐, damage claims, vendor W-9, employee info). HavenOS has bespoke intake pages (lost-items, clean-transition); needs a generic form-builder → list pipeline or one intake page per surviving form.
5. **Email-to-list ingestion** — Escalation (Hostaway charge-fail emails), Tendwell Invoicing, Pool Cleaning reports. Decide replacement (forwarding address → `/api` ingest).
6. **Formula + rollup fields** — Tendwell Profit/Margin formulas, `automatic_progress` rollups on Rocks/L10/Onboarding.
7. **Tag registry** — tags are `text[]` today; ClickUp has per-space tag defs (lightly used: only a few lists use tags at all — low priority).
8. **Task dependencies/links** — exists in ClickUp, lightly used; low priority.
9. **Views** — Board/Calendar completion + per-list saved view configs (grouping/filters/columns pending screenshots).
10. **Field types**: emoji/star rating (vendor rating, interview scorecards), attachment-type custom field (COI PDFs), location field.
11. **Restricted lists + field-level masking** — Passwords vault; PDM access fields (Master Code, Locks + Codes, Lockbox, Key Box, Wifi Log In) should be visible only to authorized roles.

## Data hygiene at migration (fix, don't replicate)

- **Duplicate field definitions** everywhere (3× Platform on Pet Fee Tracker, 3× Incident Date on claims, 2× Pest Control / Pool Vendor / Airbnb Account on PDM, duplicated progress fields) — consolidate; per-list dedupe notes are in the space files.
- **Statuses used as categories, not workflow** (SOP departments, HR employment state, person-named buckets in Listings | Admin Tasks, quarterly archive buckets in Damaged Linen, vendor names, department routing) — convert to dropdown fields or list grouping where it improves the model; keep as statuses where the team actually works that way (accounting-route statuses in Invoice System).
- **Template debris & corrupted status sets** — the 2026 Rocks clones, "trey"/"lauren & jason" statuses on Executive Assistant, stray HR-template fields polluting Onboarding Properties, "Old Don't Use" fields on Dylan's list: skip.
- **Duplicate tasks** (Escalation auto-ingest, SOP/Skills/HOA lists, near-dupes in Dylan's list) — dedupe rules per list.
- **Spam/phishing in email-ingested lists** (Tendwell Invoicing) — filter on import.
- **Sensitive data placement** — door codes/wifi in plain PDM fields; vendor tax/banking fields; salary/scorecard fields in HR — all get restricted fields/roles in HavenOS.

## Users & permissions

- **56 ClickUp members** (full list retrievable via API; names + emails captured for import mapping). HavenOS auto-provisions `profiles` on Google OAuth (domain-restricted) with `user`/`admin`/`super_admin` roles; per-space access maps to existing `space_members` / `list_members` + `user_has_list_access()`.
- Import mapping: ClickUp assignee → HavenOS profile by email; unmatched → placeholder surfaced for manual mapping.
- Decisions needed: which members become HavenOS users (several non-domain accounts exist: a shared `clickuphaven` gmail, the Listingly agent bot, door-scale/personal emails); Google OAuth is domain-restricted, so non-domain people need domain accounts or an invite mechanism.
- **ClickUp ACLs are not exposed by the API** — per-space/folder/list sharing must come from screenshots. Defaults to apply regardless: Passwords vault, V/I + Dylan/Jo/Christine L10, HR, Finance, Tendwell, and PDM access-code fields all restricted.

## Migration plan (proposed phases)

1. **Phase 0 — inputs & decisions:** permission/automation/view/form screenshots; confirm SKIP list; decide history depth (comments/attachments/closed tasks); confirm user roster.
2. **Phase 1 — schema:** new migrations for the gap features needed by live systems (relationship fields, space-level field defs, forms, rating/attachment field types, restricted fields).
3. **Phase 2 — importer:** idempotent ClickUp-API → Supabase importer (spaces/folders/lists/statuses/field defs/tasks/subtasks/checklists, `external_id` on every row, re-runnable for delta sync during parallel-run).
4. **Phase 3 — module merges:** PDM → `properties` (external_id already aligned with the ClickUp task IDs; see the CSV export in repo root), Onboarding Properties → `/onboarding`, HR → `/hr`, SOPs + ClickUp Docs (27 docs) → a DB-backed knowledge base, Reviews/Left-Items → existing operations modules.
5. **Phase 4 — behavior:** rebuild automations + forms + email ingestion; finish Board/Calendar/saved views.
6. **Phase 5 — cutover:** parallel-run with delta sync, team validation per department, ClickUp to read-only, seat reduction.

## Open decisions (for Dylan)

1. Confirm the SKIP/ARCHIVE lists above (anything marked dead you still want?).
2. How much history: open tasks only, or closed tasks + comments + attachments too?
3. Insurance COI tracker: rebuild as a renewals feature, or drop?
4. Tendwell & Stay Automated: restricted spaces in HavenOS, or out of scope?
5. User roster: who gets a HavenOS account (and what happens to non-domain accounts)?
6. Passwords: vault module in HavenOS (per explicit request) — confirm who can access which vault list.
