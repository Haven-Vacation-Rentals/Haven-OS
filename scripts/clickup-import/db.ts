/**
 * Supabase helpers shared by load.ts and provision-users.ts.
 *
 * Idempotency note: migration 0046 keys every imported row on a PARTIAL
 * unique index (`… where clickup_id is not null`). PostgREST's
 * `on_conflict=clickup_id` cannot target a partial index (Postgres only
 * infers it with a WHERE clause PostgREST does not emit), so upserts here
 * are implemented as select-diff-insert/update on clickup_id instead of a
 * literal `.upsert(…, { onConflict: "clickup_id" })`. Same semantics,
 * re-runnable, and unchanged rows are skipped on reruns.
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

export function createServiceClient(): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function mapConcurrent<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

/** JSON stringify with recursively sorted object keys (stable comparisons). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`)
    .join(",")}}`;
}

function looksLikeDateKey(key: string): boolean {
  return key.endsWith("_at") || key.endsWith("_date") || key === "due_date" || key === "start_date";
}

/** Loose equality that tolerates Postgres timestamp formatting differences. */
function valuesEqual(key: string, a: unknown, b: unknown): boolean {
  const av = a ?? null;
  const bv = b ?? null;
  if (av === null && bv === null) return true;
  if (typeof av === "string" && typeof bv === "string" && looksLikeDateKey(key)) {
    const at = Date.parse(av);
    const bt = Date.parse(bv);
    if (!Number.isNaN(at) && !Number.isNaN(bt)) return at === bt;
  }
  return stableStringify(av) === stableStringify(bv);
}

export type ClickUpKeyedRow = Record<string, unknown> & { clickup_id: string };

export interface UpsertStats {
  inserted: number;
  updated: number;
  unchanged: number;
}

export interface UpsertResult extends UpsertStats {
  /** clickup_id → HavenOS uuid for every row passed in. */
  idByClickupId: Map<string, string>;
}

interface ExistingRow extends Record<string, unknown> {
  id: string;
  clickup_id: string;
}

/**
 * Idempotent write keyed on clickup_id (see module docblock). Inserts new
 * rows in batches, updates rows whose payload changed, skips the rest.
 */
export async function upsertByClickupId(
  client: SupabaseClient,
  table: string,
  rows: readonly ClickUpKeyedRow[],
): Promise<UpsertResult> {
  const result: UpsertResult = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    idByClickupId: new Map<string, string>(),
  };
  if (rows.length === 0) return result;

  // Last write wins for duplicate clickup_ids within one batch.
  const byClickupId = new Map<string, ClickUpKeyedRow>();
  for (const row of rows) byClickupId.set(row.clickup_id, row);
  const uniqueRows = [...byClickupId.values()];

  const columns = new Set<string>();
  for (const row of uniqueRows) {
    for (const key of Object.keys(row)) columns.add(key);
  }
  const selectCols = ["id", ...[...columns].filter((c) => c !== "id")].join(",");

  // 1. Fetch existing rows for these clickup_ids.
  const existing = new Map<string, ExistingRow>();
  for (const ids of chunk([...byClickupId.keys()], 200)) {
    const { data, error } = await client
      .from(table)
      .select(selectCols)
      .in("clickup_id", ids);
    if (error) {
      throw new Error(`select ${table} failed: ${error.message}`);
    }
    for (const row of (data ?? []) as unknown as ExistingRow[]) {
      existing.set(row.clickup_id, row);
    }
  }

  // 2. Partition into inserts / updates / unchanged.
  const toInsert: ClickUpKeyedRow[] = [];
  const toUpdate: Array<{ id: string; payload: ClickUpKeyedRow }> = [];
  for (const row of uniqueRows) {
    const current = existing.get(row.clickup_id);
    if (!current) {
      toInsert.push(row);
      continue;
    }
    result.idByClickupId.set(row.clickup_id, current.id);
    const changed = Object.entries(row).some(
      ([key, value]) => !valuesEqual(key, value, current[key]),
    );
    if (changed) toUpdate.push({ id: current.id, payload: row });
    else result.unchanged++;
  }

  // 3. Batched inserts (returning ids).
  for (const batch of chunk(toInsert, 400)) {
    const { data, error } = await client
      .from(table)
      .insert(batch)
      .select("id,clickup_id");
    if (error) {
      throw new Error(`insert into ${table} failed: ${error.message}`);
    }
    for (const row of (data ?? []) as unknown as ExistingRow[]) {
      result.idByClickupId.set(row.clickup_id, row.id);
    }
    result.inserted += batch.length;
  }

  // 4. Per-row updates for changed rows (bounded concurrency).
  await mapConcurrent(toUpdate, 8, async ({ id, payload }) => {
    const { error } = await client.from(table).update(payload).eq("id", id);
    if (error) {
      throw new Error(`update ${table} ${id} failed: ${error.message}`);
    }
  });
  result.updated = toUpdate.length;

  return result;
}

/** Paginated select of a whole table (used for profiles). */
export async function selectAll<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
): Promise<T[]> {
  const pageSize = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`select ${table} failed: ${error.message}`);
    const rows = (data ?? []) as unknown as T[];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}
