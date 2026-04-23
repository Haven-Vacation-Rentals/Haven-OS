import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { isHrAdmin } from "@/lib/hr/actions";
import { Users, Briefcase, FileText, ClipboardList, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * /hr is gated to HR admins only. Anyone not on the whitelist is
 * bounced to /dashboard.
 */
export default async function HrLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const ok = await isHrAdmin(user.email);
  if (!ok) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Private · HR admins only
        </div>
        <h1 className="font-heading text-display-2 font-bold tracking-tight">
          HR
        </h1>
        <p className="text-sm text-muted-foreground">
          People, performance, hiring, policies & procedures.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-alt/50 p-1">
        <HrTab href="/hr" label="People" icon={Users} />
        <HrTab href="/hr/hiring" label="Hiring" icon={Briefcase} />
        <HrTab href="/hr/policies" label="Policies" icon={FileText} />
        <HrTab href="/hr/procedures" label="Procedures" icon={ClipboardList} />
      </nav>

      <div>{children}</div>
    </div>
  );
}

function HrTab({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href as never}
      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
