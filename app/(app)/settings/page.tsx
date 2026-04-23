import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/user";
import { isConfigured as isHostawayConfigured } from "@/lib/hostaway/client";
import { HostawayIntegrationCard } from "@/components/settings/hostaway-integration-card";
import { BoardSettingsCard } from "@/components/settings/board-settings-card";
import { createClient } from "@/lib/supabase/server";
import { BOARD_KEYS } from "@/lib/board/types";
import { isAdmin, listAdmins } from "@/lib/board/actions";
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
  const userIsAdmin = await isAdmin(user.email);
  const { loomUrl, loomTitle, admins } = await loadBoardSettings();

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <header>
        <h1 className="font-heading text-display-3 font-bold">Settings</h1>
        <p className="text-[13px] text-muted-foreground">
          Manage your account and workspace preferences.
        </p>
      </header>

      {/* The Board (admins only) */}
      {userIsAdmin && (
        <BoardSettingsCard
          initialLoomUrl={loomUrl}
          initialLoomTitle={loomTitle}
          initialAdmins={admins}
          currentUserEmail={user.email}
        />
      )}

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
