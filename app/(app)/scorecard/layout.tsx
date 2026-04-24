import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { canAccessScorecard } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

/**
 * /scorecard — Northstar Scorecard. Admin + Super Admin only.
 */
export default async function ScorecardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const ok = await canAccessScorecard();
  if (!ok) redirect("/dashboard");

  return <>{children}</>;
}
