# ClickUp → HavenOS importer

Two-stage, checkpointed, idempotent importer that replicates the Haven
ClickUp workspace (team `30988835`) into the HavenOS `/work` module, per the
audit in `docs/clickup-audit/` and the import-prep schema in
`supabase/migrations/0046_clickup_import_prep.sql`.

## Files

| File | Purpose |
|---|---|
| `scope.ts` | The migration triage: every list id with a MIGRATE / MERGE / ARCHIVE / SKIP verdict (from the audit README + docs 01–08), `RESTRICTED_LIST_IDS`, admin emails, import constants |
| `extract.ts` | Stage 1 — pull the workspace from the ClickUp REST API v2 into `snapshot/` (gitignored) |
| `provision-users.ts` | Create Supabase auth users for the 56 ClickUp members, stamp `profiles.clickup_user_id`, apply roles |
| `load.ts` | Stage 2 — upsert the snapshot into Supabase (service role) |
| `clickup-client.ts` | Throttled ClickUp API client (token bucket + 429/Retry-After backoff) |
| `snapshot-types.ts` | ClickUp API + snapshot file types |
| `db.ts` | Service-role client + clickup_id upsert helpers |
| `env.ts` | Loads `.env.local`/`.env` from the repo root; env validation |

## Env vars

Same names the app already uses (see `.env.example`); put them in
`.env.local` at the repo root or export them:

| Var | Used by |
|---|---|
| `CLICKUP_API_TOKEN` | `extract.ts` — personal ClickUp API token |
| `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) | `load.ts`, `provision-users.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `load.ts`, `provision-users.ts` |
| `CLICKUP_RPM` (optional) | `extract.ts` — throttle, default 80/min (ClickUp cap 100) |

No secrets are stored in code or in git; `snapshot/` and `reports/` are
gitignored (they contain member emails, task content and — for the
passwords-vault lists — credentials).

## Run order

Apply migration `0046_clickup_import_prep.sql` (and the
`supabase/storage/task-attachments-bucket.sql` bucket) first, then:

```bash
# 1. Extract the workspace into snapshot/ (resumable; hours due to rate limits)
npx tsx scripts/clickup-import/extract.ts

# 2. Provision the 56 members as HavenOS users (idempotent)
npx tsx scripts/clickup-import/provision-users.ts            # add --dry-run to preview

# 3. Load the snapshot into Supabase (idempotent)
npx tsx scripts/clickup-import/load.ts --dry-run             # preview planned writes
npx tsx scripts/clickup-import/load.ts                       # real import
npx tsx scripts/clickup-import/load.ts --skip-attachments    # faster; attachments later
```

### Useful flags

- `extract.ts --space <id>` / `--list <id>` — limit scope (`--list` bypasses
  the SKIP verdict); `--force` — re-extract lists whose snapshot exists.
- `load.ts --space <id>` / `--list <id>` / `--dry-run` / `--skip-attachments`.

### Checkpointing / resume

Extraction writes one file per list (`snapshot/lists/<id>.json`) when that
list completes; a rerun skips lists whose file exists (plus
`snapshot/checkpoint.json` mirrors progress). Kill it and rerun any time.

### Delta sync (parallel-run)

```bash
npx tsx scripts/clickup-import/extract.ts --since 2026-07-14T00:00:00Z
npx tsx scripts/clickup-import/load.ts
```

`--since` passes `date_updated_gt` to the task fetch and merges updated
tasks/comments into the existing snapshot files; `load.ts` then re-upserts —
rows are keyed on `clickup_id`, and unchanged rows are skipped.

## How the scope triage works

- **SKIP** lists are excluded from extract and load entirely (dead / test /
  empty / template debris).
- **ARCHIVE** lists import read-only: the list and all its tasks get
  `archived_at`.
- **MERGE** lists (PDM → properties, SOPs → knowledge, HR, Onboarding
  Properties, Reviews, Left Items, Stillwater) are still imported into
  `/work` in this phase; `mergeTarget` in `scope.ts` flags them so Phase 3
  can move them. This importer writes nothing to `properties`/`hr_*`/… tables.
- **RESTRICTED_LIST_IDS** (the 7 Passwords-folder lists + My Passwords) are
  imported like other lists — credential values live in task custom fields —
  but **Phase 3 must gate access to them before launch**. As a stopgap they
  (and other sensitive lists flagged `restricted` in scope.ts: hiring/HR,
  leadership L10s, Tendwell, Dylan's private lists) are created with
  `lists.type = 'private'`.

## Import mapping notes

- **Users:** ClickUp member → profile by `clickup_user_id`, then by email.
  Unmappable creators/assignees/authors land in `import_meta`
  (`creator_name` / `creator_email`); comments from unmapped authors are
  attributed to `IMPORT_FALLBACK_AUTHOR_EMAIL` (Dylan) with the real author
  in `import_meta`. Non-domain members are reported to
  `reports/unmapped-users.json` for a manual decision.
- **Tasks:** `created_at` preserved from `date_created`; `completed_at` from
  `date_done`/`date_closed`; closed-status tasks also get `archived_at`
  (config `archiveClosedTasks`). Parents import before children; multi-homed
  tasks are imported once, in their home list.
- **Custom fields:** per migration 0046 scope dedup — a ClickUp field id
  appearing on multiple lists of one space becomes ONE space-scoped def; the
  def's `clickup_id` is `<fieldId>@space:<spaceId>` or
  `<fieldId>@list:<listId>` (deterministic + unique across spaces that share
  workspace-level fields). Value coercion: dropdown uuid/orderindex → option
  name, labels → name array, currency/number → number, date ms → ISO,
  checkbox → boolean, users → profile uuids;
  location/attachment/relationship/formula/progress keep the raw ClickUp
  value JSON.
- **Statuses:** ClickUp `open/custom/done/closed` → `todo/in_progress/done/
  closed` categories ("custom" ≈ in-progress is an approximation — many
  ClickUp statuses here are category buckets, flagged in the audit).
- **Dependencies:** ClickUp dependency `type` codes are mapped
  1 → `waiting_on`, 0 → `blocking`, `linked_tasks` → `linked`. The numeric
  codes are not officially documented — verify direction against a live
  sample before building direction-sensitive UI.
- **Attachments:** downloaded from ClickUp and uploaded to the
  `task-attachments` bucket under `clickup-import/<taskId>/…`. Files over the
  bucket's 10 MB limit fail and are logged (re-run after raising the limit if
  needed).
- **Upsert mechanics:** the 0046 unique indexes on `clickup_id` are partial
  (`where clickup_id is not null`), which PostgREST's `on_conflict` cannot
  target — so `db.ts` implements upsert as select-diff-insert/update on
  `clickup_id`. Same idempotent semantics.

## Intentionally NOT handled yet

- **Views** (Board/Calendar configs, saved views) — pending screenshots.
- **Forms** (hiring applications, Damaged Linen, Reviews <5⭐, claims) — the
  form-fed *data* imports as tasks; the intake forms themselves are a Phase 4
  rebuild.
- **Email ingestion** (Escalation charge-fail emails, Tendwell Invoicing,
  pool reports) — historical emails import as tasks; the ingestion pipeline
  is Phase 4.
- **Automations engine + task templates** — `automation_rules` /
  `task_templates` tables exist (0046) but are seeded in a later phase from
  `docs/clickup-audit/09-automations-and-templates.md`.
- **ClickUp Docs** (27 docs incl. AI Knowledge Base) and **whiteboards**
  (org charts, V/TO) — different artifacts, out of task-import scope.
- **Watchers, recurrence rules, ACLs** — not exposed usefully by the ClickUp
  API (recurrence/ACLs) or deferred (watchers).
- **Module merges** — MERGE lists stay in `/work` until Phase 3.
- **Data hygiene** (duplicate field defs on PDM/claims/trackers, duplicate
  tasks, spam in Tendwell Invoicing) — imported as-is; consolidation is a
  separate cleanup pass so the import stays a faithful, re-runnable mirror.
