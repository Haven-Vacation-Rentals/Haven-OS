export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { requireUser } from "@/lib/auth/user";
import {
  canAccessScorecard,
  canAccessAgentChat,
  canAccessHrModule,
  canAccessSales,
} from "@/lib/auth/permissions";
import { Toaster } from "sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [canScorecard, canAgents, canHr, canSales] = await Promise.all([
    canAccessScorecard(),
    canAccessAgentChat(),
    canAccessHrModule(),
    canAccessSales(),
  ]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        user={user}
        canScorecard={canScorecard}
        canAgents={canAgents}
        canHr={canHr}
        canSales={canSales}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
      <CommandPalette />
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
