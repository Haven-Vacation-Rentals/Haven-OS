import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import {
  canAccessHrModule,
  userHrModules,
  visibleSurveyIds,
  visibleEmployeeIds,
} from "@/lib/auth/permissions";
import type { HrModule } from "@/lib/auth/hr-modules";
import {
  Users,
  Briefcase,
  FileText,
  ClipboardList,
  Lock,
  MessageSquare,
  DollarSign,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * /hr is gated to HR admins only. Anyone not on the whitelist is
 * bounced to /dashboard. Tabs shown match the modules the user has been
 * granted (super_admin sees everything).
 */
export default async function HrLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const ok = await canAccessHrModule();
  if (!ok) redirect("/dashboard");

  const [modules, surveyIds, employeeIds] = await Promise.all([
    userHrModules(),
    visibleSurveyIds(),
    visibleEmployeeIds(),
  ]);
  const moduleSet = new Set<HrModule>(modules);
  // Even without the people module, scoped employee grants let the user
  // see specific employee files; same for per-survey grants.
  const hasPeople =
    moduleSet.has("people") || (employeeIds !== null && employeeIds.length > 0);
  const hasHiring = moduleSet.has("hiring");
  const hasSurveys =
    moduleSet.has("surveys") || (surveyIds !== null && surveyIds.length > 0);
  const hasCompensation = moduleSet.has("compensation");
  const hasPolicies = moduleSet.has("policies");
  const hasProcedures = moduleSet.has("procedures");

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Private · HR access required
        </div>
        <h1 className="font-heading text-display-2 font-bold tracking-tight">
          HR
        </h1>
        <p className="text-sm text-muted-foreground">
          People, performance, hiring, policies & procedures.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-alt/50 p-1">
        {hasPeople && <HrTab href="/hr" label="People" icon={Users} />}
        {hasHiring && <HrTab href="/hr/hiring" label="Hiring" icon={Briefcase} />}
        {hasSurveys && (
          <HrTab href="/hr/surveys" label="Surveys" icon={MessageSquare} />
        )}
        {hasCompensation && (
          <HrTab
            href="/hr/compensation"
            label="Compensation"
            icon={DollarSign}
          />
        )}
        {hasPolicies && <HrTab href="/hr/policies" label="Policies" icon={FileText} />}
        {hasProcedures && (
          <HrTab href="/hr/procedures" label="Procedures" icon={ClipboardList} />
        )}
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
