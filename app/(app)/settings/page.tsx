import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/user";
import { isConfigured as isHostawayConfigured } from "@/lib/hostaway/client";
import { HostawayIntegrationCard } from "@/components/settings/hostaway-integration-card";
import { BoardSettingsCard } from "@/components/settings/board-settings-card";
import { HrAdminSettingsCard } from "@/components/settings/hr-admin-settings-card";
import { createClient } from "@/lib/supabase/server";
import { BOARD_KEYS } from "@/lib/board/types";
import { isAdmin, listAdmins } from "@/lib/board/actions";
import { isHrAdmin, listHrAdmins } from "@/lib/hr/actions";
import { getPermissions } from "@/lib/auth/permissions";
import Link from "next/link";
import { Users, Building2, ChevronRight, ShieldCheck, KeyRound } from "lucide-react";
import type { DbBoardSetting } from "@/lib/board/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — Haven OS",
};

async function loadBoardSettings(): Promise<{
  loomUrl: string;
  loomTitle: string;
  admins: string[];
}> {
  const supabase = await createClient();
  if (!supabase) return { loomUrl: "", loomTitle: "", admins: [] };
  const [settingsRes, admins] = await Promise.all([
    supabase.from("board_settings").select("*"),
    listAdmins(),
  ]);
  const settings = (settingsRes.data ?? []) as DbBoardSetting[];
  const loomUrl = settings.find((s) => s.key === BOARD_KEYS.LOOM_URL)?.value ?? "";
  const loomTitle = settings.find((s) => s.key === BOARD_KEYS.LOOM_TITLE)?.value ?? "";
  return { loomUrl, loomTitle, admins };
}

export default async function SettingsPage() {
  const user = await requireUser();
  const hostawayConfigured = isHostawayConfigured();
  const [userIsAdmin, userIsHrAdmin, perm, { loomUrl, loomTitle, admins }] =
    await Promise.all([
      isAdmin(user.email),
      isHrAdmin(user.email),
      getPermissions(),
      loadBoardSettings(),
    ]);
  const hrAdmins = userIsHrAdmin ? await listHrAdmins() : [];

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <header>
        <h1 className="font-heading text-display-3 font-bold">Settings</h1>
        <p className="text-[13px] text-muted-foreground">
          Manage your account and workspace preferences.
        </p>
      </header>

      {/* Permissions (super admins only) */}
      {perm.is_super_admin && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            Permissions
          </h2>
          <section className="rounded-card border border-border bg-surface shadow-card">
            <Link
              href={"/settings/users" as never}
              className="flex items-center gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-surface-alt/60"
            >
              <div className="rounded-md bg-surface-alt p-2">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="flex-1">
                <div className="font-heading text-[14px] font-bold">
                  Users &amp; Permissions
                </div>
                <div className="text-[12px] text-muted-foreground">
                  Manage roles (User / Admin / Super Admin) and grant HR access
                  by department or individual employee.
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href={"/settings/departments" as never}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-alt/60"
            >
              <div className="rounded-md bg-surface-alt p-2">
                <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="flex-1">
                <div className="font-heading text-[14px] font-bold">
                  Departments
                </div>
                <div className="text-[12px] text-muted-foreground">
                  Add or rename departments used to tag employees and scope HR
                  access.
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </section>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            You&apos;re signed in as <strong>Super Admin</strong>.
          </div>
        </div>
      )}

      {/* The Board (admins only) */}
      {userIsAdmin && (
        <BoardSettingsCard
          initialLoomUrl={loomUrl}
          initialLoomTitle={loomTitle}
          initialAdmins={admins}
          currentUserEmail={user.email}
        />
      )}

      {/* HR (HR admins only) */}
      {userIsHrAdmin && (
        <HrAdminSettingsCard
          initialAdmins={hrAdmins}
          currentUserEmail={user.email}
        />
      )}

      {/* Developer */}
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
          Developer
        </h2>
        <section className="rounded-card border border-border bg-surface shadow-card">
          <Link
            href={"/settings/api-tokens" as never}
            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-alt/60"
          >
            <div className="rounded-md bg-surface-alt p-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex-1">
              <div className="font-heading text-[14px] font-bold">
                Personal Access Tokens &amp; Claude Connector
              </div>
              <div className="text-[12px] text-muted-foreground">
                Create bearer tokens for external agents, or add Haven OS as a
                custom Claude MCP connector (OAuth + PKCE).
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      </div>

      {/* Integrations */}
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
          Integrations
        </h2>
        <HostawayIntegrationCard configured={hostawayConfigured} />
      </div>

      {/* Account section */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-4 font-heading text-[15px] font-bold">Account</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-[13px]">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{user.name}</dd>

          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{user.email}</dd>

          <dt className="text-muted-foreground">User ID</dt>
          <dd className="font-mono text-[12px] text-foreground/70">{user.id}</dd>
        </dl>
      </section>

      {/* Workspace placeholder */}
      <section className="rounded-card border border-dashed border-border bg-surface-alt/40 p-5">
        <h2 className="mb-1 font-heading text-[15px] font-bold">Workspace</h2>
        <p className="text-[13px] text-muted-foreground">
          Team members, statuses, and custom fields are managed per list from
          the List Settings panel. Workspace-wide controls land here as they
          ship.
        </p>
      </section>
    </div>
  );
}
