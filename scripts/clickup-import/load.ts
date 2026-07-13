/**
 * ClickUp → HavenOS importer — Stage 2: LOAD.
 *
 * Reads the local snapshot produced by extract.ts and writes it into the
 * HavenOS Supabase project with the service-role key (same env names the app
 * uses: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *
 * Usage:
 *   npx tsx scripts/clickup-import/load.ts [flags]
 *
 * Flags:
 *   --space <id>         only load lists from this ClickUp space id
 *   --list <id>          only load this ClickUp list id (bypasses SKIP verdict)
 *   --dry-run            print planned writes; no database calls
 *   --skip-attachments   skip downloading/uploading file attachments
 *
 * Load order: profile mapping → spaces → folders → lists → statuses →
 * custom_field_defs → tasks (parents before children) → task_assignees →
 * space_tags → checklists → comments → task_dependencies → attachments →
 * time_entries.
 *
 * Idempotency: rows are keyed on clickup_id (migration 0046). Because the
 * unique indexes are partial, upserts are select-diff-insert/update (see
 * db.ts) rather than PostgREST onConflict.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  chunk,
  createServiceClient,
  mapConcurrent,
  selectAll,
  upsertByClickupId,
  type ClickUpKeyedRow,
} from "./db";
import { REPORTS_DIR, SNAPSHOT_DIR, runMain } from "./env";
import {
  IMPORT_CONFIG,
  IMPORT_FALLBACK_AUTHOR_EMAIL,
  isArchivedOnImport,
  isListIncluded,
  isRestrictedList,
  listScope,
} from "./scope";
import type {
  ClickUpField,
  ClickUpFieldOption,
  ClickUpTask,
  ClickUpTaskFieldValue,
  ClickUpUser,
  HierarchySnapshot,
  ListSnapshot,
  TeamSnapshot,
  TimeEntriesSnapshot,
  UnmappedUserRecord,
} from "./snapshot-types";

// --- CLI ------------------------------------------------------------------------

interface LoadArgs {
  space?: string;
  list?: string;
  dryRun: boolean;
  skipAttachments: boolean;
}

function parseLoadArgs(): LoadArgs {
  const { values } = parseArgs({
    options: {
      space: { type: "string" },
      list: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      "skip-attachments": { type: "boolean", default: false },
    },
  });
  return {
    space: values.space,
    list: values.list,
    dryRun: values["dry-run"] ?? false,
    skipAttachments: values["skip-attachments"] ?? false,
  };
}

// --- Snapshot loading -------------------------------------------------------------

function readJson<T>(path: string, what: string): T {
  if (!existsSync(path)) {
    throw new Error(
      `Snapshot file missing: ${path} (${what}). Run extract.ts first.`,
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

interface Snapshot {
  hierarchy: HierarchySnapshot;
  team: TeamSnapshot;
  lists: ListSnapshot[];
  timeEntries: TimeEntriesSnapshot | null;
}

function readSnapshot(args: LoadArgs): Snapshot {
  const hierarchy = readJson<HierarchySnapshot>(
    join(SNAPSHOT_DIR, "hierarchy.json"),
    "workspace hierarchy",
  );
  const team = readJson<TeamSnapshot>(join(SNAPSHOT_DIR, "team.json"), "team members");
  const listsDir = join(SNAPSHOT_DIR, "lists");
  const lists: ListSnapshot[] = [];
  if (existsSync(listsDir)) {
    for (const file of readdirSync(listsDir)) {
      if (!file.endsWith(".json")) continue;
      const snap = JSON.parse(readFileSync(join(listsDir, file), "utf8")) as ListSnapshot;
      const id = snap.list.id;
      if (args.list !== undefined) {
        if (id === args.list) lists.push(snap); // explicit --list bypasses SKIP
        continue;
      }
      if (args.space !== undefined && snap.spaceId !== args.space) continue;
      if (!isListIncluded(id)) continue;
      lists.push(snap);
    }
  }
  if (lists.length === 0) {
    throw new Error(
      "No list snapshots matched. Run extract.ts first (and check --space/--list filters).",
    );
  }
  const timeEntriesPath = join(SNAPSHOT_DIR, "time-entries.json");
  const timeEntries = existsSync(timeEntriesPath)
    ? (JSON.parse(readFileSync(timeEntriesPath, "utf8")) as TimeEntriesSnapshot)
    : null;
  return { hierarchy, team, lists, timeEntries };
}

// --- Write context ----------------------------------------------------------------

interface StageStats {
  planned: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
}

interface Ctx {
  client: SupabaseClient | null;
  dryRun: boolean;
  stats: Map<string, StageStats>;
  notes: string[];
}

function stat(ctx: Ctx, table: string): StageStats {
  let s = ctx.stats.get(table);
  if (!s) {
    s = { planned: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 0 };
    ctx.stats.set(table, s);
  }
  return s;
}

/** clickup_id-keyed upsert (or dry-run count). Returns clickup_id → uuid. */
async function writeRows(
  ctx: Ctx,
  table: string,
  rows: ClickUpKeyedRow[],
): Promise<Map<string, string>> {
  const s = stat(ctx, table);
  s.planned += rows.length;
  if (ctx.dryRun || rows.length === 0) {
    return new Map(rows.map((r) => [r.clickup_id, `dry-${table}-${r.clickup_id}`]));
  }
  if (!ctx.client) throw new Error("no client");
  const res = await upsertByClickupId(ctx.client, table, rows);
  s.inserted += res.inserted;
  s.updated += res.updated;
  s.unchanged += res.unchanged;
  return res.idByClickupId;
}

/** Constraint-keyed upsert for join tables without a clickup_id column. */
async function writeConflictRows(
  ctx: Ctx,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  ignoreDuplicates: boolean,
): Promise<void> {
  const s = stat(ctx, table);
  s.planned += rows.length;
  if (ctx.dryRun || rows.length === 0) return;
  if (!ctx.client) throw new Error("no client");
  for (const batch of chunk(rows, 400)) {
    const { error } = await ctx.client
      .from(table)
      .upsert(batch, { onConflict, ignoreDuplicates });
    if (error) throw new Error(`upsert ${table} failed: ${error.message}`);
  }
  s.inserted += rows.length; // insert-or-noop; exact split not reported by PostgREST
}

// --- User mapping -----------------------------------------------------------------

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  clickup_user_id: number | null;
}

interface UserMap {
  profileIdByClickUpId: Map<number, string>;
  infoByClickUpId: Map<number, { name: string | null; email: string | null }>;
  fallbackAuthorId: string;
}

async function buildUserMap(ctx: Ctx, snapshot: Snapshot): Promise<UserMap> {
  const infoByClickUpId = new Map<number, { name: string | null; email: string | null }>();
  for (const member of snapshot.team.team.members) {
    infoByClickUpId.set(member.user.id, {
      name: member.user.username ?? null,
      email: member.user.email ?? null,
    });
  }
  // provision-users.ts writes non-domain members here for import_meta fallback.
  const reportPath = join(REPORTS_DIR, "unmapped-users.json");
  if (existsSync(reportPath)) {
    const records = JSON.parse(readFileSync(reportPath, "utf8")) as UnmappedUserRecord[];
    for (const rec of records) {
      if (!infoByClickUpId.has(rec.clickup_user_id)) {
        infoByClickUpId.set(rec.clickup_user_id, { name: rec.name, email: rec.email });
      }
    }
  }

  const profileIdByClickUpId = new Map<number, string>();
  if (ctx.dryRun) {
    // No DB in dry-run: assume every member with an email will be mappable.
    for (const [cuId, info] of infoByClickUpId) {
      if (info.email) profileIdByClickUpId.set(cuId, `dry-profile-${cuId}`);
    }
    return { profileIdByClickUpId, infoByClickUpId, fallbackAuthorId: "dry-profile-fallback" };
  }

  if (!ctx.client) throw new Error("no client");
  const profiles = await selectAll<ProfileRow>(
    ctx.client,
    "profiles",
    "id,email,full_name,role,clickup_user_id",
  );
  const profileByEmail = new Map<string, ProfileRow>();
  for (const p of profiles) {
    if (p.email) profileByEmail.set(p.email.toLowerCase(), p);
    if (p.clickup_user_id !== null) {
      profileIdByClickUpId.set(p.clickup_user_id, p.id);
    }
  }
  for (const [cuId, info] of infoByClickUpId) {
    if (profileIdByClickUpId.has(cuId)) continue;
    const email = info.email?.toLowerCase();
    const profile = email ? profileByEmail.get(email) : undefined;
    if (profile) profileIdByClickUpId.set(cuId, profile.id);
  }

  const fallback = profileByEmail.get(IMPORT_FALLBACK_AUTHOR_EMAIL.toLowerCase());
  if (!fallback) {
    throw new Error(
      `No profile found for fallback author ${IMPORT_FALLBACK_AUTHOR_EMAIL}. ` +
        "Run provision-users.ts first.",
    );
  }
  const mapped = profileIdByClickUpId.size;
  console.log(
    `User mapping: ${mapped}/${infoByClickUpId.size} ClickUp members map to profiles ` +
      `(unmapped members fall back to import_meta).`,
  );
  return { profileIdByClickUpId, infoByClickUpId, fallbackAuthorId: fallback.id };
}

function mapUser(users: UserMap, user: ClickUpUser | null | undefined): string | null {
  if (!user) return null;
  return users.profileIdByClickUpId.get(user.id) ?? null;
}

function userInfo(
  users: UserMap,
  user: ClickUpUser | null | undefined,
): { name: string | null; email: string | null } | null {
  if (!user) return null;
  return (
    users.infoByClickUpId.get(user.id) ?? {
      name: user.username ?? null,
      email: user.email ?? null,
    }
  );
}

// --- Small converters ---------------------------------------------------------------

function msToIso(ms: string | number | null | undefined): string | null {
  if (ms === null || ms === undefined || ms === "") return null;
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n).toISOString();
}

function msToDate(ms: string | number | null | undefined): string | null {
  const iso = msToIso(ms);
  return iso ? iso.slice(0, 10) : null;
}

function toOrderInt(orderindex: string | number | null | undefined, fallback: number): number {
  const n = Number(orderindex);
  if (!Number.isFinite(n)) return fallback;
  // Clamp to int4 — ClickUp orderindexes can be very large decimals.
  return Math.min(Math.max(Math.round(n), -2147483648), 2147483647);
}

const PRIORITIES = new Set(["urgent", "high", "normal", "low"]);

function mapPriority(task: ClickUpTask): string {
  const p = task.priority?.priority?.toLowerCase();
  return p && PRIORITIES.has(p) ? p : "none";
}

/** ClickUp status.type → HavenOS task_status_category. */
function mapStatusCategory(type: string | undefined): string {
  switch (type) {
    case "open":
      return "todo";
    case "done":
      return "done";
    case "closed":
      return "closed";
    default:
      // "custom" statuses are workflow-ish middle states in this workspace.
      return "in_progress";
  }
}

/** ClickUp field type → HavenOS custom_field_type (0046 extended enum). */
function mapFieldType(type: string): string {
  switch (type) {
    case "text":
    case "short_text":
      return "text";
    case "number":
      return "number";
    case "currency":
      return "currency";
    case "drop_down":
      return "select";
    case "labels":
      return "labels";
    case "date":
      return "date";
    case "checkbox":
      return "checkbox";
    case "url":
      return "url";
    case "email":
      return "email";
    case "phone":
      return "phone";
    case "users":
      return "people";
    case "emoji":
      return "rating";
    case "attachment":
      return "attachment";
    case "location":
      return "location";
    case "formula":
      return "formula";
    case "automatic_progress":
    case "manual_progress":
      return "progress";
    case "list_relationship":
    case "tasks":
      return "relationship";
    default:
      return "text";
  }
}

interface NormalizedOption {
  value: string;
  label: string;
  color: string | null;
  clickup_option_id: string | null;
  orderindex: number;
}

function normalizeOptions(options: ClickUpFieldOption[] | undefined): NormalizedOption[] {
  return (options ?? []).map((opt, i) => {
    const label = opt.name ?? opt.label ?? String(opt.id ?? i);
    return {
      // HavenOS select cells match on `value`; keep it human-stable (the name).
      value: label,
      label,
      color: opt.color ?? null,
      clickup_option_id: opt.id ?? null,
      orderindex: toOrderInt(opt.orderindex, i),
    };
  });
}

function fieldConfig(field: ClickUpField): Record<string, unknown> {
  const config: Record<string, unknown> = {
    clickup_type: field.type,
  };
  const tc = field.type_config ?? {};
  if (field.type === "drop_down" || field.type === "labels") {
    config.options = normalizeOptions(tc.options);
  } else if (Object.keys(tc).length > 0) {
    config.clickup_type_config = tc;
  }
  return config;
}

/**
 * Coerce a ClickUp custom-field value per type. Returns undefined when the
 * value should not be stored.
 */
function coerceFieldValue(
  field: ClickUpTaskFieldValue,
  users: UserMap,
): unknown {
  const value = field.value;
  if (value === null || value === undefined || value === "") return undefined;
  const options = field.type_config?.options ?? [];

  const optionName = (v: unknown): string | null => {
    for (const opt of options) {
      const label = opt.name ?? opt.label ?? null;
      if (opt.id !== undefined && opt.id === v) return label;
      if (
        typeof v === "number" &&
        opt.orderindex !== undefined &&
        Number(opt.orderindex) === v
      ) {
        return label;
      }
    }
    return null;
  };

  switch (field.type) {
    case "drop_down": {
      // Value arrives as an option uuid or an orderindex.
      if (typeof value === "object") {
        const obj = value as { id?: unknown; name?: unknown };
        if (typeof obj.name === "string") return obj.name;
        return optionName(obj.id) ?? value;
      }
      return optionName(value) ?? (typeof value === "number" ? value : String(value));
    }
    case "labels": {
      if (!Array.isArray(value)) return value;
      return value.map((v) => {
        if (typeof v === "object" && v !== null) {
          const obj = v as { id?: unknown; label?: unknown; name?: unknown };
          if (typeof obj.label === "string") return obj.label;
          if (typeof obj.name === "string") return obj.name;
          return optionName(obj.id) ?? String(obj.id ?? "");
        }
        return optionName(v) ?? String(v);
      });
    }
    case "number":
    case "currency":
    case "emoji": {
      const n = Number(value);
      return Number.isFinite(n) ? n : value;
    }
    case "date":
      return msToIso(value as string | number) ?? value;
    case "checkbox":
      return value === true || value === "true" || value === 1 || value === "1";
    case "users": {
      if (!Array.isArray(value)) return value;
      return value.map((v) => {
        const user = v as ClickUpUser;
        const profileId = mapUser(users, user);
        if (profileId) return profileId;
        return { name: user.username ?? null, email: user.email ?? null };
      });
    }
    case "text":
    case "short_text":
    case "url":
    case "email":
    case "phone":
      return typeof value === "string" ? value : String(value);
    default:
      // location / attachment / list_relationship / tasks / formula /
      // progress — store the raw ClickUp value JSON (per spec).
      return value;
  }
}

// --- Field-def scope dedup -----------------------------------------------------------

interface FieldDefPlan {
  clickupKey: string; // custom_field_defs.clickup_id
  field: ClickUpField;
  /** exactly one of the two below */
  spaceCuId: string | null;
  listCuId: string | null;
  order: number;
}

interface FieldPlanResult {
  defs: FieldDefPlan[];
  /** `${listCuId}:${fieldId}` → clickupKey of the def to reference. */
  defKeyByListField: Map<string, string>;
}

/**
 * Scope dedup per migration 0046: when the SAME ClickUp field id appears on
 * multiple lists in one space, create ONE def anchored at space_id and
 * reference it from every list's tasks; otherwise anchor at the list.
 */
function planFieldDefs(lists: ListSnapshot[]): FieldPlanResult {
  interface Occurrence {
    field: ClickUpField;
    listCuIds: Set<string>;
  }
  // fieldId → spaceCuId → occurrence
  const bySpace = new Map<string, Map<string, Occurrence>>();
  for (const snap of lists) {
    for (const field of snap.fields) {
      let spaces = bySpace.get(field.id);
      if (!spaces) {
        spaces = new Map();
        bySpace.set(field.id, spaces);
      }
      let occ = spaces.get(snap.spaceId);
      if (!occ) {
        occ = { field, listCuIds: new Set() };
        spaces.set(snap.spaceId, occ);
      }
      occ.listCuIds.add(snap.list.id);
    }
  }

  const defs: FieldDefPlan[] = [];
  const defKeyByListField = new Map<string, string>();
  let order = 0;
  for (const [fieldId, spaces] of bySpace) {
    for (const [spaceCuId, occ] of spaces) {
      const shared = occ.listCuIds.size > 1;
      const clickupKey = shared
        ? `${fieldId}@space:${spaceCuId}`
        : `${fieldId}@list:${[...occ.listCuIds][0]}`;
      defs.push({
        clickupKey,
        field: occ.field,
        spaceCuId: shared ? spaceCuId : null,
        listCuId: shared ? null : [...occ.listCuIds][0],
        order: order++,
      });
      for (const listCuId of occ.listCuIds) {
        defKeyByListField.set(`${listCuId}:${fieldId}`, clickupKey);
      }
    }
  }
  return { defs, defKeyByListField };
}

// --- Main -------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseLoadArgs();

  // Validate env up front so misconfiguration fails fast with a clear message
  // (dry-run included — it plans against the same target project).
  const ctx: Ctx = {
    client: null,
    dryRun: args.dryRun,
    stats: new Map(),
    notes: [],
  };
  if (args.dryRun) {
    // Ensure env is present/valid, but make no DB calls.
    createServiceClient();
    console.log("DRY RUN — no database writes will be performed.\n");
  } else {
    ctx.client = createServiceClient();
  }

  const snapshot = readSnapshot(args);
  console.log(
    `Loading ${snapshot.lists.length} list snapshot(s)` +
      `${args.space ? ` (space ${args.space})` : ""}${args.list ? ` (list ${args.list})` : ""}…\n`,
  );

  const importTimestamp = new Date().toISOString();
  const users = await buildUserMap(ctx, snapshot);

  // ---- Spaces ----------------------------------------------------------------
  const spaceCuIds = [...new Set(snapshot.lists.map((l) => l.spaceId))];
  const spaceRows: ClickUpKeyedRow[] = [];
  for (const spaceCuId of spaceCuIds) {
    const space = snapshot.hierarchy.spaces.find((s) => s.id === spaceCuId);
    if (!space) {
      ctx.notes.push(`space ${spaceCuId} missing from hierarchy.json — skipped its lists`);
      continue;
    }
    spaceRows.push({
      clickup_id: space.id,
      name: space.name,
      color: space.color ?? "#FF564E",
      privacy: space.private ? "private" : "team",
      archived_at: space.archived ? importTimestamp : null,
    });
  }
  const spaceIdByCuId = await writeRows(ctx, "spaces", spaceRows);
  console.log(`spaces: ${spaceRows.length} planned`);

  // ---- Folders ---------------------------------------------------------------
  const folderCuIds = new Set(
    snapshot.lists.map((l) => l.folderId).filter((id): id is string => id !== null),
  );
  const folderRows: ClickUpKeyedRow[] = [];
  for (const spaceCuId of spaceCuIds) {
    for (const folder of snapshot.hierarchy.foldersBySpaceId[spaceCuId] ?? []) {
      if (!folderCuIds.has(folder.id)) continue;
      const spaceId = spaceIdByCuId.get(spaceCuId);
      if (!spaceId) continue;
      folderRows.push({
        clickup_id: folder.id,
        space_id: spaceId,
        name: folder.name,
        order: toOrderInt(folder.orderindex, 0),
        archived_at: folder.archived ? importTimestamp : null,
      });
    }
  }
  const folderIdByCuId = await writeRows(ctx, "folders", folderRows);
  console.log(`folders: ${folderRows.length} planned`);

  // ---- Lists -----------------------------------------------------------------
  const listRows: ClickUpKeyedRow[] = [];
  for (const snap of snapshot.lists) {
    const spaceId = spaceIdByCuId.get(snap.spaceId);
    if (!spaceId) continue;
    const archived =
      snap.list.archived === true || isArchivedOnImport(snap.list.id);
    listRows.push({
      clickup_id: snap.list.id,
      space_id: spaceId,
      folder_id: snap.folderId ? (folderIdByCuId.get(snap.folderId) ?? null) : null,
      name: snap.list.name,
      description: snap.list.content ?? null,
      order: toOrderInt(snap.list.orderindex, 0),
      type: isRestrictedList(snap.list.id) ? "private" : "shared",
      archived_at: archived ? importTimestamp : null,
    });
  }
  const listIdByCuId = await writeRows(ctx, "lists", listRows);
  console.log(`lists: ${listRows.length} planned`);

  // ---- Statuses ---------------------------------------------------------------
  const statusRows: ClickUpKeyedRow[] = [];
  /** lookup keys: raw ClickUp status id AND `name:<listCuId>:<lower name>` */
  const statusKeyAliases = new Map<string, string>(); // alias → clickup_id used in row
  for (const snap of snapshot.lists) {
    const listId = listIdByCuId.get(snap.list.id);
    if (!listId) continue;
    (snap.list.statuses ?? []).forEach((status, i) => {
      const clickupId = status.id ?? `status:${snap.list.id}:${status.status.toLowerCase()}`;
      statusRows.push({
        clickup_id: clickupId,
        list_id: listId,
        name: status.status,
        color: status.color ?? "#424242",
        category: mapStatusCategory(status.type),
        order: toOrderInt(status.orderindex, i),
      });
      if (status.id) statusKeyAliases.set(status.id, clickupId);
      statusKeyAliases.set(`name:${snap.list.id}:${status.status.toLowerCase()}`, clickupId);
    });
  }
  const statusIdByCuId = await writeRows(ctx, "statuses", statusRows);
  console.log(`statuses: ${statusRows.length} planned`);

  function resolveStatus(task: ClickUpTask, listCuId: string): string | null {
    const status = task.status;
    if (!status) return null;
    const byId = status.id ? statusKeyAliases.get(status.id) : undefined;
    const byName = statusKeyAliases.get(`name:${listCuId}:${status.status.toLowerCase()}`);
    const key = byId ?? byName;
    return key ? (statusIdByCuId.get(key) ?? null) : null;
  }

  // ---- Custom field defs --------------------------------------------------------
  const fieldPlan = planFieldDefs(snapshot.lists);
  const fieldDefRows: ClickUpKeyedRow[] = fieldPlan.defs.flatMap((plan) => {
    const spaceId = plan.spaceCuId ? spaceIdByCuId.get(plan.spaceCuId) : null;
    const listId = plan.listCuId ? listIdByCuId.get(plan.listCuId) : null;
    if (!spaceId && !listId) return [];
    return [
      {
        clickup_id: plan.clickupKey,
        list_id: listId ?? null,
        space_id: spaceId ?? null,
        folder_id: null,
        name: plan.field.name,
        field_type: mapFieldType(plan.field.type),
        config: fieldConfig(plan.field),
        order: plan.order,
      },
    ];
  });
  const defIdByKey = await writeRows(ctx, "custom_field_defs", fieldDefRows);
  const spaceScopedDefs = fieldDefRows.filter((r) => r.space_id !== null).length;
  console.log(
    `custom_field_defs: ${fieldDefRows.length} planned (${spaceScopedDefs} space-scoped after dedup)`,
  );

  // ---- Tasks ---------------------------------------------------------------------
  interface TaskEntry {
    task: ClickUpTask;
    listCuId: string;
  }
  const taskEntries = new Map<string, TaskEntry>();
  for (const snap of snapshot.lists) {
    for (const task of snap.tasks) {
      const home = task.list?.id;
      const existing = taskEntries.get(task.id);
      // Multi-homed tasks: prefer the copy from the task's home list.
      if (existing && home !== snap.list.id) continue;
      taskEntries.set(task.id, { task, listCuId: snap.list.id });
    }
  }

  // Depth-order parents before children.
  const depthCache = new Map<string, number>();
  function depthOf(taskId: string, guard = 0): number {
    if (guard > 50) return 50;
    const cached = depthCache.get(taskId);
    if (cached !== undefined) return cached;
    const entry = taskEntries.get(taskId);
    const parentId = entry?.task.parent ?? null;
    const depth =
      parentId && taskEntries.has(parentId) ? depthOf(parentId, guard + 1) + 1 : 0;
    depthCache.set(taskId, depth);
    return depth;
  }
  const byDepth = new Map<number, TaskEntry[]>();
  for (const [taskId, entry] of taskEntries) {
    const depth = depthOf(taskId);
    const bucket = byDepth.get(depth) ?? [];
    bucket.push(entry);
    byDepth.set(depth, bucket);
  }

  const taskIdByCuId = new Map<string, string>();
  const depths = [...byDepth.keys()].sort((a, b) => a - b);
  let orphanedParents = 0;
  for (const depth of depths) {
    const entries = byDepth.get(depth) ?? [];
    const rows: ClickUpKeyedRow[] = [];
    for (const { task, listCuId } of entries) {
      const listId = listIdByCuId.get(listCuId);
      if (!listId) continue;

      const importMeta: Record<string, unknown> = {};
      if (task.url) importMeta.clickup_url = task.url;
      const creatorId = mapUser(users, task.creator);
      if (!creatorId && task.creator) {
        const info = userInfo(users, task.creator);
        if (info?.name) importMeta.creator_name = info.name;
        if (info?.email) importMeta.creator_email = info.email;
      }
      const unmappedAssignees = (task.assignees ?? [])
        .filter((a) => !mapUser(users, a))
        .map((a) => userInfo(users, a))
        .filter((i): i is { name: string | null; email: string | null } => i !== null);
      if (unmappedAssignees.length > 0) importMeta.unmapped_assignees = unmappedAssignees;

      let parentId: string | null = null;
      if (task.parent) {
        parentId = taskIdByCuId.get(task.parent) ?? null;
        if (!parentId) {
          // Parent outside the snapshot (or import failed) — import as root.
          orphanedParents++;
          importMeta.orphaned_parent_clickup_id = task.parent;
        }
      }

      const statusType = task.status?.type;
      const completedAt =
        msToIso(task.date_done) ??
        (statusType === "closed" || statusType === "done" ? msToIso(task.date_closed) : null);
      const listArchived = isArchivedOnImport(listCuId);
      const closedArchived =
        IMPORT_CONFIG.archiveClosedTasks && statusType === "closed";
      const archivedAt =
        listArchived || closedArchived || task.archived === true
          ? (msToIso(task.date_closed) ??
            msToIso(task.date_done) ??
            msToIso(task.date_updated) ??
            importTimestamp)
          : null;

      // Custom field values keyed by HavenOS def uuid.
      const customFields: Record<string, unknown> = {};
      for (const fieldValue of task.custom_fields ?? []) {
        const defKey = fieldPlan.defKeyByListField.get(`${listCuId}:${fieldValue.id}`);
        if (!defKey) continue;
        const defId = defIdByKey.get(defKey);
        if (!defId) continue;
        const coerced = coerceFieldValue(fieldValue, users);
        if (coerced !== undefined) customFields[defId] = coerced;
      }

      rows.push({
        clickup_id: task.id,
        list_id: listId,
        status_id: resolveStatus(task, listCuId),
        parent_id: parentId,
        title: task.name,
        description:
          task.markdown_description ?? task.text_content ?? task.description ?? null,
        priority: mapPriority(task),
        due_date: msToDate(task.due_date),
        start_date: msToDate(task.start_date),
        time_estimate:
          typeof task.time_estimate === "number" && task.time_estimate > 0
            ? Math.round(task.time_estimate / 60000)
            : null,
        order: toOrderInt(task.orderindex, 0),
        custom_fields: customFields,
        tags: (task.tags ?? []).map((t) => t.name),
        archived_at: archivedAt,
        completed_at: completedAt,
        created_by: creatorId,
        created_at: msToIso(task.date_created) ?? importTimestamp,
        import_meta: Object.keys(importMeta).length > 0 ? importMeta : null,
      });
    }
    const ids = await writeRows(ctx, "tasks", rows);
    for (const [cuId, id] of ids) taskIdByCuId.set(cuId, id);
  }
  if (orphanedParents > 0) {
    ctx.notes.push(
      `${orphanedParents} task(s) reference a parent outside the snapshot — imported as root tasks (import_meta.orphaned_parent_clickup_id).`,
    );
  }
  console.log(`tasks: ${taskEntries.size} planned (max depth ${depths[depths.length - 1] ?? 0})`);

  // ---- Task assignees --------------------------------------------------------------
  const assigneeRows: Record<string, unknown>[] = [];
  for (const [taskCuId, { task }] of taskEntries) {
    const taskId = taskIdByCuId.get(taskCuId);
    if (!taskId) continue;
    const seen = new Set<string>();
    for (const assignee of task.assignees ?? []) {
      const profileId = mapUser(users, assignee);
      if (!profileId || seen.has(profileId)) continue;
      seen.add(profileId);
      assigneeRows.push({ task_id: taskId, profile_id: profileId });
    }
  }
  await writeConflictRows(ctx, "task_assignees", assigneeRows, "task_id,profile_id", true);
  console.log(`task_assignees: ${assigneeRows.length} planned`);

  // ---- Space tags -------------------------------------------------------------------
  const spaceTagRows: Record<string, unknown>[] = [];
  const tagSeen = new Set<string>();
  for (const spaceCuId of spaceCuIds) {
    const spaceId = spaceIdByCuId.get(spaceCuId);
    if (!spaceId) continue;
    for (const tag of snapshot.hierarchy.tagsBySpaceId[spaceCuId] ?? []) {
      const key = `${spaceId}:${tag.name}`;
      if (tagSeen.has(key)) continue;
      tagSeen.add(key);
      spaceTagRows.push({ space_id: spaceId, name: tag.name, color: tag.tag_bg ?? null });
    }
  }
  // Tags used on tasks but missing from the space registry.
  for (const snap of snapshot.lists) {
    const spaceId = spaceIdByCuId.get(snap.spaceId);
    if (!spaceId) continue;
    for (const task of snap.tasks) {
      for (const tag of task.tags ?? []) {
        const key = `${spaceId}:${tag.name}`;
        if (tagSeen.has(key)) continue;
        tagSeen.add(key);
        spaceTagRows.push({ space_id: spaceId, name: tag.name, color: tag.tag_bg ?? null });
      }
    }
  }
  await writeConflictRows(ctx, "space_tags", spaceTagRows, "space_id,name", true);
  console.log(`space_tags: ${spaceTagRows.length} planned`);

  // ---- Checklists + items -------------------------------------------------------------
  const checklistRows: ClickUpKeyedRow[] = [];
  const checklistItemsRaw: Array<{
    checklistCuId: string;
    row: ClickUpKeyedRow;
  }> = [];
  for (const [taskCuId, { task }] of taskEntries) {
    const taskId = taskIdByCuId.get(taskCuId);
    if (!taskId) continue;
    (task.checklists ?? []).forEach((checklist, ci) => {
      checklistRows.push({
        clickup_id: checklist.id,
        task_id: taskId,
        name: checklist.name || "Checklist",
        order: toOrderInt(checklist.orderindex, ci),
      });
      (checklist.items ?? []).forEach((item, ii) => {
        checklistItemsRaw.push({
          checklistCuId: checklist.id,
          row: {
            clickup_id: item.id,
            content: item.name,
            completed: item.resolved === true,
            assignee_id: mapUser(users, item.assignee),
            order: toOrderInt(item.orderindex, ii),
            created_at: msToIso(item.date_created) ?? importTimestamp,
          },
        });
      });
    });
  }
  const checklistIdByCuId = await writeRows(ctx, "checklists", checklistRows);
  const checklistItemRows: ClickUpKeyedRow[] = [];
  for (const { checklistCuId, row } of checklistItemsRaw) {
    const checklistId = checklistIdByCuId.get(checklistCuId);
    if (!checklistId) continue;
    checklistItemRows.push({ ...row, checklist_id: checklistId });
  }
  await writeRows(ctx, "checklist_items", checklistItemRows);
  console.log(
    `checklists: ${checklistRows.length} planned, checklist_items: ${checklistItemRows.length} planned`,
  );

  // ---- Comments ------------------------------------------------------------------------
  const commentRows: ClickUpKeyedRow[] = [];
  let emptyComments = 0;
  for (const snap of snapshot.lists) {
    for (const [taskCuId, comments] of Object.entries(snap.commentsByTaskId)) {
      const taskId = taskIdByCuId.get(taskCuId);
      if (!taskId) continue;
      for (const comment of comments) {
        let body = comment.comment_text ?? "";
        if (!body && Array.isArray(comment.comment)) {
          body = comment.comment
            .map((frag) =>
              typeof frag === "object" && frag !== null && "text" in frag
                ? String((frag as { text?: unknown }).text ?? "")
                : "",
            )
            .join("");
        }
        if (!body.trim()) {
          emptyComments++;
          continue;
        }
        const authorId = mapUser(users, comment.user);
        const importMeta: Record<string, unknown> = {};
        if (!authorId && comment.user) {
          const info = userInfo(users, comment.user);
          if (info?.name) importMeta.creator_name = info.name;
          if (info?.email) importMeta.creator_email = info.email;
        }
        commentRows.push({
          clickup_id: comment.id,
          task_id: taskId,
          author_id: authorId ?? users.fallbackAuthorId,
          body,
          created_at: msToIso(comment.date) ?? importTimestamp,
          import_meta: Object.keys(importMeta).length > 0 ? importMeta : null,
        });
      }
    }
  }
  await writeRows(ctx, "comments", commentRows);
  if (emptyComments > 0) {
    ctx.notes.push(`${emptyComments} comment(s) had no text (attachment-only) — skipped.`);
  }
  console.log(`comments: ${commentRows.length} planned`);

  // ---- Task dependencies ------------------------------------------------------------------
  // ClickUp dependency rows: {task_id, depends_on, type}. Type code 1 is
  // treated as waiting_on (task waits on depends_on), 0 as blocking; verify
  // against a live workspace sample before trusting direction-sensitive UI.
  const depRows: Record<string, unknown>[] = [];
  const depSeen = new Set<string>();
  const pushDep = (fromCu: string, toCu: string, type: string) => {
    const from = taskIdByCuId.get(fromCu);
    const to = taskIdByCuId.get(toCu);
    if (!from || !to || from === to) return;
    const key = `${from}:${to}:${type}`;
    if (depSeen.has(key)) return;
    depSeen.add(key);
    depRows.push({ task_id: from, depends_on_task_id: to, type });
  };
  for (const [, { task }] of taskEntries) {
    for (const dep of task.dependencies ?? []) {
      if (!dep.task_id || !dep.depends_on) continue;
      pushDep(dep.task_id, dep.depends_on, dep.type === 0 ? "blocking" : "waiting_on");
    }
    for (const link of task.linked_tasks ?? []) {
      if (!link.task_id || !link.link_id) continue;
      // Canonical ordering so the pair is only stored once.
      const [a, b] = [link.task_id, link.link_id].sort();
      pushDep(a, b, "linked");
    }
  }
  await writeConflictRows(
    ctx,
    "task_dependencies",
    depRows,
    "task_id,depends_on_task_id,type",
    true,
  );
  console.log(`task_dependencies: ${depRows.length} planned`);

  // ---- Attachments ---------------------------------------------------------------------
  if (args.skipAttachments) {
    console.log("attachments: skipped (--skip-attachments)");
  } else {
    interface AttachmentJob {
      taskCuId: string;
      taskId: string;
      attachment: NonNullable<ClickUpTask["attachments"]>[number];
    }
    const jobs: AttachmentJob[] = [];
    for (const [taskCuId, { task }] of taskEntries) {
      const taskId = taskIdByCuId.get(taskCuId);
      if (!taskId) continue;
      for (const attachment of task.attachments ?? []) {
        if (!attachment.url && !attachment.url_w_query) continue;
        jobs.push({ taskCuId, taskId, attachment });
      }
    }
    const s = stat(ctx, "task_attachments");
    s.planned += jobs.length;
    if (ctx.dryRun) {
      console.log(`task_attachments: ${jobs.length} planned (download + upload on real run)`);
    } else {
      if (!ctx.client) throw new Error("no client");
      const client = ctx.client;
      // Already-imported attachments are skipped (no re-download).
      const existingIds = new Set<string>();
      for (const ids of chunk(jobs.map((j) => j.attachment.id), 200)) {
        const { data, error } = await client
          .from("task_attachments")
          .select("clickup_id")
          .in("clickup_id", ids);
        if (error) throw new Error(`select task_attachments failed: ${error.message}`);
        for (const row of (data ?? []) as { clickup_id: string }[]) {
          existingIds.add(row.clickup_id);
        }
      }
      let failed = 0;
      await mapConcurrent(jobs, 4, async ({ taskCuId, taskId, attachment }) => {
        if (existingIds.has(attachment.id)) {
          s.unchanged++;
          return;
        }
        const url = attachment.url_w_query ?? attachment.url;
        if (!url) return;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`download HTTP ${res.status}`);
          const bytes = Buffer.from(await res.arrayBuffer());
          const fileName =
            (attachment.title && attachment.title.trim()) ||
            `${attachment.id}${attachment.extension ? `.${attachment.extension}` : ""}`;
          const safeName = fileName.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
          const storagePath = `clickup-import/${taskCuId}/${attachment.id}-${safeName}`;
          const contentType =
            attachment.mimetype ??
            res.headers.get("content-type") ??
            "application/octet-stream";
          const { error: uploadError } = await client.storage
            .from(IMPORT_CONFIG.attachmentsBucket)
            .upload(storagePath, bytes, { contentType, upsert: true });
          if (uploadError) throw new Error(`storage upload: ${uploadError.message}`);
          const { error: insertError } = await client.from("task_attachments").insert({
            clickup_id: attachment.id,
            task_id: taskId,
            uploader_id: mapUser(users, attachment.user),
            file_name: fileName,
            file_size: bytes.byteLength,
            mime_type: contentType,
            storage_path: storagePath,
            created_at: msToIso(attachment.date) ?? importTimestamp,
          });
          if (insertError) throw new Error(`insert: ${insertError.message}`);
          s.inserted++;
        } catch (err) {
          failed++;
          s.skipped++;
          console.warn(
            `  attachment ${attachment.id} on task ${taskCuId} failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      });
      if (failed > 0) {
        ctx.notes.push(`${failed} attachment(s) failed to transfer — see warnings above.`);
      }
      console.log(
        `task_attachments: ${s.inserted} uploaded, ${s.unchanged} already imported, ${s.skipped} failed`,
      );
    }
  }

  // ---- Time entries -----------------------------------------------------------------------
  const timeEntryRows: ClickUpKeyedRow[] = [];
  let timeEntriesSkipped = 0;
  for (const entry of snapshot.timeEntries?.entries ?? []) {
    const taskId = entry.task?.id ? taskIdByCuId.get(entry.task.id) : undefined;
    const userId = entry.user ? users.profileIdByClickUpId.get(entry.user.id) : undefined;
    const startedAt = msToIso(entry.start);
    if (!taskId || !userId || !startedAt) {
      timeEntriesSkipped++;
      continue;
    }
    const duration = Number(entry.duration);
    const running = Number.isFinite(duration) && duration < 0;
    timeEntryRows.push({
      clickup_id: entry.id,
      task_id: taskId,
      user_id: userId,
      description: entry.description?.trim() ? entry.description : null,
      started_at: startedAt,
      ended_at: running ? null : msToIso(entry.end),
      duration_ms: running || !Number.isFinite(duration) ? null : duration,
    });
  }
  await writeRows(ctx, "time_entries", timeEntryRows);
  if (timeEntriesSkipped > 0) {
    ctx.notes.push(
      `${timeEntriesSkipped} time entr(ies) skipped — task outside import scope, unmapped user, or missing start.`,
    );
  }
  console.log(`time_entries: ${timeEntryRows.length} planned`);

  // ---- Summary ------------------------------------------------------------------------------
  console.log(`\n${args.dryRun ? "DRY RUN summary" : "Load summary"}:`);
  for (const [table, s] of ctx.stats) {
    if (args.dryRun) {
      console.log(`  ${table.padEnd(20)} planned=${s.planned}`);
    } else {
      console.log(
        `  ${table.padEnd(20)} inserted=${s.inserted} updated=${s.updated} unchanged=${s.unchanged}${s.skipped ? ` failed=${s.skipped}` : ""}`,
      );
    }
  }
  for (const note of ctx.notes) console.log(`  note: ${note}`);
  if (args.dryRun) {
    console.log("\nNo database calls were made. Re-run without --dry-run to import.");
  }
}

runMain(main);
