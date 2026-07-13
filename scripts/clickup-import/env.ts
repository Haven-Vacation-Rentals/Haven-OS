/**
 * Env handling for the ClickUp import scripts.
 *
 * Loads the same env files the app uses (`.env.local`, then `.env` at the
 * repo root) into process.env without overriding variables that are already
 * exported, so `npx tsx scripts/clickup-import/extract.ts` works with the
 * developer's normal setup and no dotenv dependency.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const REPO_ROOT = resolve(__dirname, "..", "..");
export const IMPORT_DIR = resolve(__dirname);
export const SNAPSHOT_DIR = join(IMPORT_DIR, "snapshot");
export const REPORTS_DIR = join(IMPORT_DIR, "reports");

let loaded = false;

/** Minimal .env parser: KEY=VALUE lines, `#` comments, optional quotes. */
function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadRepoEnv(): void {
  if (loaded) return;
  loaded = true;
  for (const file of [".env.local", ".env"]) {
    const path = join(REPO_ROOT, file);
    if (!existsSync(path)) continue;
    const vars = parseEnvFile(readFileSync(path, "utf8"));
    for (const [key, value] of Object.entries(vars)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

/** Error type for missing-configuration failures (printed without a stack). */
export class MissingEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingEnvError";
  }
}

/** ClickUp API token (extract.ts). */
export function getClickUpToken(): string {
  loadRepoEnv();
  const token = process.env.CLICKUP_API_TOKEN?.trim();
  if (!token) {
    throw new MissingEnvError(
      "Missing env: CLICKUP_API_TOKEN is not set.\n" +
        "Set it in .env.local (repo root) or export it in your shell — this is a\n" +
        "personal ClickUp API token (ClickUp → Settings → Apps → API Token).",
    );
  }
  return token;
}

/**
 * Supabase URL + service-role key (load.ts / provision-users.ts).
 * Uses the same variable names as the app (.env.example /
 * lib/supabase/admin.ts): NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * SUPABASE_URL is accepted as a fallback for the URL.
 */
export function getSupabaseEnv(): { url: string; serviceRoleKey: string } {
  loadRepoEnv();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new MissingEnvError(
      `Missing env: ${missing.join(" and ")}.\n` +
        "These are the same variables the app uses (see .env.example). Set them in\n" +
        ".env.local at the repo root or export them in your shell, then re-run.",
    );
  }
  return { url, serviceRoleKey };
}

/**
 * Standard top-level error handler for the import scripts: configuration
 * errors print a clean message; unexpected errors keep their stack.
 */
export function runMain(main: () => Promise<void>): void {
  main().catch((err: unknown) => {
    if (err instanceof MissingEnvError) {
      console.error(`\n${err.message}\n`);
    } else if (err instanceof Error) {
      console.error(`\nError: ${err.message}\n`);
      if (err.stack) console.error(err.stack);
    } else {
      console.error("\nError:", err, "\n");
    }
    process.exitCode = 1;
  });
}
