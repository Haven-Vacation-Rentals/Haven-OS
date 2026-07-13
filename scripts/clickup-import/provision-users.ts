/**
 * ClickUp → HavenOS importer — user provisioning.
 *
 * Reads snapshot/team.json (the 56 workspace members) and, for each
 * @havenvacationrentals.com member without a profile, creates a Supabase
 * auth user via the admin API (email confirmed, full name in user_metadata —
 * the handle_new_user trigger creates the profile row). Then stamps
 * profiles.clickup_user_id and applies global roles per the locked
 * decisions: Dylan, Jack, Jo, Jonathan F → admin (never downgrading an
 * existing super_admin); everyone else 'user'.
 *
 * Non-domain emails (shared gmail, bots, personal addresses) are NOT given
 * auth users — they are logged to reports/unmapped-users.json for a manual
 * decision; load.ts uses that map for import_meta fallback attribution.
 *
 * Usage:
 *   npx tsx scripts/clickup-import/provision-users.ts [--dry-run]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createServiceClient, selectAll } from "./db";
import { REPORTS_DIR, SNAPSHOT_DIR, runMain } from "./env";
import { ADMIN_EMAILS, HAVEN_EMAIL_DOMAIN } from "./scope";
import type { TeamSnapshot, UnmappedUserRecord } from "./snapshot-types";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  clickup_user_id: number | null;
}

async function listAllAuthUsers(client: SupabaseClient): Promise<Map<string, User>> {
  const byEmail = new Map<string, User>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.admin.listUsers failed: ${error.message}`);
    for (const user of data.users) {
      if (user.email) byEmail.set(user.email.toLowerCase(), user);
    }
    if (data.users.length < 1000) break;
  }
  return byEmail;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { "dry-run": { type: "boolean", default: false } },
  });
  const dryRun = values["dry-run"] ?? false;

  const client = createServiceClient();

  const teamPath = join(SNAPSHOT_DIR, "team.json");
  if (!existsSync(teamPath)) {
    throw new Error(`Snapshot file missing: ${teamPath}. Run extract.ts first.`);
  }
  const team = JSON.parse(readFileSync(teamPath, "utf8")) as TeamSnapshot;
  const members = team.team.members;
  console.log(
    `${members.length} ClickUp members in team ${team.team.id} (${team.team.name}).` +
      `${dryRun ? " DRY RUN — no writes." : ""}\n`,
  );

  const profiles = await selectAll<ProfileRow>(
    client,
    "profiles",
    "id,email,full_name,role,clickup_user_id",
  );
  const profileByEmail = new Map<string, ProfileRow>();
  for (const p of profiles) {
    if (p.email) profileByEmail.set(p.email.toLowerCase(), p);
  }
  const authUsersByEmail = await listAllAuthUsers(client);

  const unmapped: UnmappedUserRecord[] = [];
  let created = 0;
  let existing = 0;
  let adminsSet = 0;

  for (const member of members) {
    const { id: clickupUserId, username, email: rawEmail } = member.user;
    const email = rawEmail?.trim().toLowerCase() ?? null;
    const label = `${username ?? "(no name)"} <${email ?? "no email"}> [${clickupUserId}]`;

    if (!email || !email.endsWith(`@${HAVEN_EMAIL_DOMAIN}`)) {
      unmapped.push({
        clickup_user_id: clickupUserId,
        name: username ?? null,
        email,
        reason: email
          ? `non-@${HAVEN_EMAIL_DOMAIN} email — needs a domain account or invite (Google OAuth is domain-restricted)`
          : "no email on ClickUp seat",
      });
      console.log(`  SKIP (non-domain): ${label}`);
      continue;
    }

    let profile = profileByEmail.get(email) ?? null;

    if (!profile) {
      const authUser = authUsersByEmail.get(email) ?? null;
      if (!authUser) {
        console.log(`  CREATE auth user: ${label}`);
        if (!dryRun) {
          const { data, error } = await client.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: username ?? email },
          });
          if (error || !data.user) {
            console.warn(`    createUser failed for ${email}: ${error?.message ?? "no user"}`);
            unmapped.push({
              clickup_user_id: clickupUserId,
              name: username ?? null,
              email,
              reason: `auth.admin.createUser failed: ${error?.message ?? "unknown"}`,
            });
            continue;
          }
          // handle_new_user creates the profile; fetch it (retry briefly).
          for (let attempt = 0; attempt < 5 && !profile; attempt++) {
            const { data: rows, error: selErr } = await client
              .from("profiles")
              .select("id,email,full_name,role,clickup_user_id")
              .eq("id", data.user.id)
              .limit(1);
            if (selErr) throw new Error(`select profile failed: ${selErr.message}`);
            profile = ((rows ?? []) as ProfileRow[])[0] ?? null;
            if (!profile) await new Promise((r) => global.setTimeout(r, 500));
          }
          if (!profile) {
            // Trigger did not fire (0033 backfill covers this case) — insert directly.
            const { data: inserted, error: insErr } = await client
              .from("profiles")
              .insert({
                id: data.user.id,
                email,
                full_name: username ?? email,
                role: "user",
              })
              .select("id,email,full_name,role,clickup_user_id");
            if (insErr) throw new Error(`insert profile failed for ${email}: ${insErr.message}`);
            profile = ((inserted ?? []) as ProfileRow[])[0] ?? null;
          }
        }
        created++;
      } else {
        // Auth user exists but the profile row is missing — backfill it.
        console.log(`  BACKFILL profile for existing auth user: ${label}`);
        if (!dryRun) {
          const { data: inserted, error: insErr } = await client
            .from("profiles")
            .insert({
              id: authUser.id,
              email,
              full_name: username ?? email,
              role: "user",
            })
            .select("id,email,full_name,role,clickup_user_id");
          if (insErr) throw new Error(`insert profile failed for ${email}: ${insErr.message}`);
          profile = ((inserted ?? []) as ProfileRow[])[0] ?? null;
        }
        created++;
      }
    } else {
      existing++;
    }

    // Role + clickup_user_id.
    const wantAdmin = ADMIN_EMAILS.has(email);
    const currentRole = profile?.role ?? "user";
    let nextRole: string | null = null;
    if (wantAdmin && currentRole !== "super_admin" && currentRole !== "admin") {
      nextRole = "admin"; // never downgrade super_admin
    } else if (!wantAdmin && !profile) {
      nextRole = "user"; // new non-admin accounts
    }
    if (wantAdmin) adminsSet++;

    const updates: Record<string, unknown> = {};
    if (profile?.clickup_user_id !== clickupUserId) updates.clickup_user_id = clickupUserId;
    if (nextRole && profile?.role !== nextRole) updates.role = nextRole;
    if (Object.keys(updates).length > 0) {
      const roleNote = updates.role ? ` role→${String(updates.role)}` : "";
      console.log(`  UPDATE profile: ${label}${roleNote}`);
      if (!dryRun && profile) {
        const { error } = await client.from("profiles").update(updates).eq("id", profile.id);
        if (error) throw new Error(`update profile failed for ${email}: ${error.message}`);
      }
    }
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, "unmapped-users.json");
  writeFileSync(reportPath, JSON.stringify(unmapped, null, 2));

  console.log(
    `\nDone. created/backfilled=${created} existing=${existing} ` +
      `non-domain/skipped=${unmapped.length} admin-emails-seen=${adminsSet}${dryRun ? " (dry run)" : ""}`,
  );
  console.log(
    `Non-domain members written to ${reportPath} for manual decision; load.ts uses it for import_meta fallback.`,
  );
}

runMain(main);
