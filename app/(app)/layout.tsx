export const dynamic = "force-dynamic";

import { AppShell } from "@/components/shell/app-shell";
import { CommandPalette } from "@/components/shell/command-palette";
import { requireUser } from "@/lib/auth/user";
import { Toaster } from "sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <>
      <AppShell user={user}>{children}</AppShell>
      <CommandPalette />
      <Toaster richColors position="bottom-right" />
    </>
  );
}
