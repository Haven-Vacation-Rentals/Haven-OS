import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { canAccessAgentChat } from "@/lib/auth/permissions";
import { Bot, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * /agents — Managed Agents playground. Admin-only.
 */
export default async function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const ok = await canAccessAgentChat();
  if (!ok) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Admin only · Beta
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-soft">
            <Bot className="h-5 w-5 text-haven-coral-700" />
          </div>
          <div>
            <h1 className="font-heading text-display-2 font-bold tracking-tight">
              Agents
            </h1>
            <p className="text-sm text-muted-foreground">
              Run long-horizon tasks on a Claude Managed Agent.
            </p>
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
