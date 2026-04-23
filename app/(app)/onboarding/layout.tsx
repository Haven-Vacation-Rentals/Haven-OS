import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { isOnboardingAdmin } from "@/lib/onboarding/actions";
import { ClipboardList, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * /onboarding is gated to admins only (reuses HR admin whitelist).
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const ok = await isOnboardingAdmin(user.email);
  if (!ok) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Admin only
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-soft">
            <ClipboardList className="h-5 w-5 text-haven-coral-700" />
          </div>
          <div>
            <h1 className="font-heading text-display-2 font-bold tracking-tight">
              Onboarding
            </h1>
            <p className="text-sm text-muted-foreground">
              Property onboarding projects, key dates, and task tracking.
            </p>
          </div>
          <div className="ml-auto">
            <Link
              href={"/onboarding/new" as never}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95"
            >
              <span className="text-base leading-none">+</span>
              New Project
            </Link>
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
