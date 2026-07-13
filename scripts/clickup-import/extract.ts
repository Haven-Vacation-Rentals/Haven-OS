/**
 * ClickUp → HavenOS importer — Stage 1: EXTRACT.
 *
 * Pulls the ClickUp workspace (team 30988835) via the REST API v2 into a
 * local JSON snapshot under scripts/clickup-import/snapshot/ (gitignored).
 *
 * Usage:
 *   npx tsx scripts/clickup-import/extract.ts [flags]
 *
 * Flags:
 *   --space <id>   only extract lists in this ClickUp space id
 *   --list <id>    only extract this ClickUp list id (bypasses the SKIP verdict)
 *   --force        re-extract lists whose snapshot file already exists
 *   --since <ISO>  delta sync: only fetch tasks updated after this date
 *                  (passes date_updated_gt; merges into existing snapshots)
 *
 * Resumable: each list is written to snapshot/lists/<id>.json when complete;
 * on rerun, lists whose file already exists are skipped unless --force /
 * --since. Progress is also mirrored to snapshot/checkpoint.json.
 *
 * Rate limiting: token-bucket throttle at CLICKUP_RPM (default 80/min,
 * ClickUp's cap is 100/min) with Retry-After-honoring 429 backoff.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { ClickUpClient } from "./clickup-client";
import { getClickUpToken, loadRepoEnv, runMain, SNAPSHOT_DIR } from "./env";
import {
  CLICKUP_TEAM_ID,
  IMPORT_CONFIG,
  isListIncluded,
  listScope,
  spaceScope,
} from "./scope";
import type {
  CheckpointFile,
  ClickUpComment,
  ClickUpFolder,
  ClickUpList,
  ClickUpSpace,
  ClickUpTag,
  ClickUpTask,
  ClickUpTimeEntry,
  HierarchySnapshot,
  ListSnapshot,
  TeamSnapshot,
  TimeEntriesSnapshot,
} from "./snapshot-types";

const LISTS_DIR = join(SNAPSHOT_DIR, "lists");
const HIERARCHY_FILE = join(SNAPSHOT_DIR, "hierarchy.json");
const TEAM_FILE = join(SNAPSHOT_DIR, "team.json");
const TIME_ENTRIES_FILE = join(SNAPSHOT_DIR, "time-entries.json");
const CHECKPOINT_FILE = join(SNAPSHOT_DIR, "checkpoint.json");

interface ExtractArgs {
  space?: string;
  list?: string;
  force: boolean;
  sinceMs: number | null;
}

function parseExtractArgs(): ExtractArgs {
  const { values } = parseArgs({
    options: {
      space: { type: "string" },
      list: { type: "string" },
      force: { type: "boolean", default: false },
      since: { type: "string" },
    },
  });
  let sinceMs: number | null = null;
  if (values.since !== undefined) {
    const parsed = Date.parse(values.since);
    if (Number.isNaN(parsed)) {
      throw new Error(`--since must be an ISO date, got: ${values.since}`);
    }
    sinceMs = parsed;
  }
  return {
    space: values.space,
    list: values.list,
    force: values.force ?? false,
    sinceMs,
  };
}

function writeJsonAtomic(path: string, data: unknown): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, path);
}

function readJsonIfExists<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function updateCheckpoint(mutate: (cp: CheckpointFile) => void): void {
  const now = new Date().toISOString();
  const cp = readJsonIfExists<CheckpointFile>(CHECKPOINT_FILE) ?? {
    startedAt: now,
    updatedAt: now,
    completedListIds: [],
  };
  mutate(cp);
  cp.updatedAt = now;
  writeJsonAtomic(CHECKPOINT_FILE, cp);
}

/** A list plus where it sits in the hierarchy. */
interface ListRef {
  list: ClickUpList;
  spaceId: string;
  folderId: string | null;
}

async function extractHierarchy(client: ClickUpClient): Promise<HierarchySnapshot> {
  console.log("Fetching workspace hierarchy (spaces, folders, lists, tags)…");
  const spacesById = new Map<string, ClickUpSpace>();
  for (const archived of [false, true]) {
    for (const space of await client.getSpaces(CLICKUP_TEAM_ID, archived)) {
      const existing = spacesById.get(space.id);
      spacesById.set(space.id, { ...existing, ...space, archived: space.archived ?? archived });
    }
  }
  const spaces = [...spacesById.values()];

  const foldersBySpaceId: Record<string, ClickUpFolder[]> = {};
  const folderlessListsBySpaceId: Record<string, ClickUpList[]> = {};
  const tagsBySpaceId: Record<string, ClickUpTag[]> = {};

  for (const space of spaces) {
    const folders = new Map<string, ClickUpFolder>();
    const lists = new Map<string, ClickUpList>();
    for (const archived of [false, true]) {
      for (const folder of await client.getFolders(space.id, archived)) {
        folders.set(folder.id, folder);
      }
      for (const list of await client.getFolderlessLists(space.id, archived)) {
        lists.set(list.id, list);
      }
    }
    foldersBySpaceId[space.id] = [...folders.values()];
    folderlessListsBySpaceId[space.id] = [...lists.values()];
    try {
      tagsBySpaceId[space.id] = await client.getSpaceTags(space.id);
    } catch (err) {
      console.warn(
        `  could not fetch tags for space ${space.id} (${space.name}): ${err instanceof Error ? err.message : String(err)}`,
      );
      tagsBySpaceId[space.id] = [];
    }
    console.log(
      `  space ${space.name} (${space.id}): ${foldersBySpaceId[space.id].length} folders, ${folderlessListsBySpaceId[space.id].length} folderless lists`,
    );
  }

  const snapshot: HierarchySnapshot = {
    extractedAt: new Date().toISOString(),
    teamId: CLICKUP_TEAM_ID,
    spaces,
    foldersBySpaceId,
    folderlessListsBySpaceId,
    tagsBySpaceId,
  };
  writeJsonAtomic(HIERARCHY_FILE, snapshot);
  return snapshot;
}

function collectListRefs(hierarchy: HierarchySnapshot): ListRef[] {
  const refs: ListRef[] = [];
  const seen = new Set<string>();
  for (const space of hierarchy.spaces) {
    for (const folder of hierarchy.foldersBySpaceId[space.id] ?? []) {
      for (const list of folder.lists ?? []) {
        if (seen.has(list.id)) continue;
        seen.add(list.id);
        refs.push({ list, spaceId: space.id, folderId: folder.id });
      }
    }
    for (const list of hierarchy.folderlessListsBySpaceId[space.id] ?? []) {
      if (seen.has(list.id)) continue;
      seen.add(list.id);
      refs.push({ list, spaceId: space.id, folderId: list.folder?.hidden === false ? (list.folder?.id ?? null) : null });
    }
  }
  return refs;
}

async function extractList(
  client: ClickUpClient,
  ref: ListRef,
  args: ExtractArgs,
): Promise<void> {
  const filePath = join(LISTS_DIR, `${ref.list.id}.json`);
  const previous = args.sinceMs !== null ? readJsonIfExists<ListSnapshot>(filePath) : null;

  const listDetail = await client.getList(ref.list.id);
  const fields = await client.getListFields(ref.list.id);

  // Page through the tasks (include_closed + subtasks; date_updated_gt for delta).
  const baseTasks: ClickUpTask[] = [];
  for (let page = 0; page < 500; page++) {
    const res = await client.getListTasksPage(ref.list.id, page, args.sinceMs ?? undefined);
    baseTasks.push(...res.tasks);
    if (res.tasks.length === 0 || res.last_page === true) break;
  }

  // Task detail (attachments, checklists, dependencies live here) + comments.
  const tasks: ClickUpTask[] = [];
  const commentsByTaskId: Record<string, ClickUpComment[]> = {};
  let done = 0;
  for (const baseTask of baseTasks) {
    let detail: ClickUpTask;
    try {
      detail = await client.getTask(baseTask.id);
    } catch (err) {
      console.warn(
        `    task ${baseTask.id} detail failed (${err instanceof Error ? err.message : String(err)}); keeping list-level data`,
      );
      detail = baseTask;
    }
    // Keep list/folder placement from the list fetch when detail omits it.
    tasks.push({ ...baseTask, ...detail, list: detail.list ?? baseTask.list });
    try {
      commentsByTaskId[baseTask.id] = await client.getAllTaskComments(baseTask.id);
    } catch (err) {
      console.warn(
        `    task ${baseTask.id} comments failed (${err instanceof Error ? err.message : String(err)})`,
      );
      commentsByTaskId[baseTask.id] = [];
    }
    done++;
    if (done % 50 === 0) console.log(`    …${done}/${baseTasks.length} tasks`);
  }

  // Delta merge: overlay updated tasks/comments onto the previous snapshot.
  let mergedTasks = tasks;
  let mergedComments = commentsByTaskId;
  if (previous) {
    const byId = new Map<string, ClickUpTask>(previous.tasks.map((t) => [t.id, t]));
    for (const task of tasks) byId.set(task.id, task);
    mergedTasks = [...byId.values()];
    mergedComments = { ...previous.commentsByTaskId, ...commentsByTaskId };
  }

  const snapshot: ListSnapshot = {
    extractedAt: new Date().toISOString(),
    sinceMs: args.sinceMs,
    list: listDetail,
    spaceId: ref.spaceId,
    folderId: ref.folderId,
    fields,
    tasks: mergedTasks,
    commentsByTaskId: mergedComments,
  };
  writeJsonAtomic(filePath, snapshot);
  updateCheckpoint((cp) => {
    if (!cp.completedListIds.includes(ref.list.id)) cp.completedListIds.push(ref.list.id);
  });
  console.log(
    `  ✓ ${ref.list.name} (${ref.list.id}): ${mergedTasks.length} tasks${previous ? ` (${tasks.length} updated since delta cutoff)` : ""}`,
  );
}

async function extractTimeEntries(
  client: ClickUpClient,
  team: TeamSnapshot,
  args: ExtractArgs,
): Promise<void> {
  if (existsSync(TIME_ENTRIES_FILE) && !args.force && args.sinceMs === null) {
    console.log("Time entries snapshot exists — skipping (use --force to refetch).");
    return;
  }
  const assigneeIds = team.team.members.map((m) => m.user.id);
  if (assigneeIds.length === 0) {
    console.warn("No members found — skipping time entries.");
    return;
  }
  const startMs = args.sinceMs ?? Date.parse(IMPORT_CONFIG.timeEntriesStart);
  const endMs = Date.now();
  const windowMs = 90 * 24 * 60 * 60 * 1000; // 90-day windows
  const previous = readJsonIfExists<TimeEntriesSnapshot>(TIME_ENTRIES_FILE);
  const byId = new Map<string, ClickUpTimeEntry>(
    (previous?.entries ?? []).map((e) => [e.id, e]),
  );
  console.log(
    `Fetching time entries ${new Date(startMs).toISOString().slice(0, 10)} → now for ${assigneeIds.length} members…`,
  );
  for (let windowStart = startMs; windowStart < endMs; windowStart += windowMs) {
    const windowEnd = Math.min(windowStart + windowMs, endMs);
    const entries = await client.getTimeEntries(
      CLICKUP_TEAM_ID,
      windowStart,
      windowEnd,
      assigneeIds,
    );
    for (const entry of entries) byId.set(entry.id, entry);
  }
  const snapshot: TimeEntriesSnapshot = {
    extractedAt: new Date().toISOString(),
    entries: [...byId.values()],
  };
  writeJsonAtomic(TIME_ENTRIES_FILE, snapshot);
  console.log(`  ✓ ${snapshot.entries.length} time entries`);
}

async function main(): Promise<void> {
  loadRepoEnv();
  const args = parseExtractArgs();
  const token = getClickUpToken();
  const rpm = Number(process.env.CLICKUP_RPM ?? "80");
  const client = new ClickUpClient({
    token,
    requestsPerMinute: Number.isFinite(rpm) && rpm > 0 ? Math.min(rpm, 100) : 80,
  });

  mkdirSync(LISTS_DIR, { recursive: true });
  const startedAt = Date.now();
  updateCheckpoint((cp) => {
    cp.lastArgs = { ...args, startedAt: new Date().toISOString() };
  });

  // Team (members come from workspace seats — GET /team).
  console.log("Fetching team + members…");
  const teams = await client.getTeams();
  const team = teams.find((t) => t.id === CLICKUP_TEAM_ID);
  if (!team) {
    throw new Error(
      `Team ${CLICKUP_TEAM_ID} not found for this token (teams visible: ${teams.map((t) => t.id).join(", ") || "none"}).`,
    );
  }
  const teamSnapshot: TeamSnapshot = { extractedAt: new Date().toISOString(), team };
  writeJsonAtomic(TEAM_FILE, teamSnapshot);
  console.log(`  ✓ ${team.name}: ${team.members.length} members`);

  // Hierarchy (always refreshed — it is cheap relative to task extraction).
  const hierarchy = await extractHierarchy(client);

  // Decide which lists to extract.
  const allRefs = collectListRefs(hierarchy);
  const selected: ListRef[] = [];
  let skippedByScope = 0;
  for (const ref of allRefs) {
    if (args.list !== undefined) {
      if (ref.list.id === args.list) selected.push(ref); // explicit --list bypasses SKIP
      continue;
    }
    if (args.space !== undefined && ref.spaceId !== args.space) continue;
    if (!isListIncluded(ref.list.id)) {
      skippedByScope++;
      continue;
    }
    if (listScope(ref.list.id) === undefined) {
      console.warn(
        `  note: list ${ref.list.id} (${ref.list.name}) in space ${spaceScope(ref.spaceId)?.name ?? ref.spaceId} is not in scope.ts — including it; add a verdict.`,
      );
    }
    selected.push(ref);
  }
  if (args.list !== undefined && selected.length === 0) {
    throw new Error(`--list ${args.list} not found in the workspace hierarchy.`);
  }
  console.log(
    `\nExtracting ${selected.length} lists (${skippedByScope} excluded by SKIP verdict).`,
  );

  let extracted = 0;
  let skippedExisting = 0;
  for (const ref of selected) {
    const filePath = join(LISTS_DIR, `${ref.list.id}.json`);
    if (existsSync(filePath) && !args.force && args.sinceMs === null) {
      skippedExisting++;
      continue;
    }
    console.log(`\n[${extracted + skippedExisting + 1}/${selected.length}] ${ref.list.name} (${ref.list.id})`);
    await extractList(client, ref, args);
    extracted++;
  }

  await extractTimeEntries(client, teamSnapshot, args);

  const minutes = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(
    `\nDone. Extracted ${extracted} lists (${skippedExisting} already snapshotted — use --force to refresh), ` +
      `${client.requestCount} API requests, ${minutes} min.\nSnapshot: ${SNAPSHOT_DIR}`,
  );
}

runMain(main);
