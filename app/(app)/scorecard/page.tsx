import type { ReactNode } from "react";
import { Target, AlertTriangle } from "lucide-react";
import { NorthstarScorecard } from "@/components/scorecard/northstar-scorecard";
import {
  getActiveMonth,
  getMonth,
  listMonths,
  seedActiveMonth,
} from "@/lib/scorecard/actions";

export const metadata = { title: "Northstar Scorecard · Haven OS" };
export const dynamic = "force-dynamic";

export default async function ScorecardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m: monthId } = await searchParams;

  try {
    // Load the requested month (or the active one), plus the full month list
    const [requestedMonth, allMonths] = await Promise.all([
      monthId ? getMonth(monthId) : getActiveMonth(),
      listMonths(),
    ]);

    // First-ever load: no active month exists yet — seed from template data
    let month = requestedMonth;
    if (!month && !monthId) {
      month = await seedActiveMonth();
      const refreshed = await listMonths();
      return (
        <PageShell>
          <NorthstarScorecard initialMonth={month} initialAllMonths={refreshed} />
        </PageShell>
      );
    }

    if (!month) {
      return (
        <PageShell>
          <p className="text-muted-foreground text-sm">Month not found.</p>
        </PageShell>
      );
    }

    return (
      <PageShell>
        <NorthstarScorecard initialMonth={month} initialAllMonths={allMonths} />
      </PageShell>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isMigration = msg.includes("relation") || msg.includes("does not exist");
    return (
      <PageShell>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {isMigration ? "Database migration needed" : "Scorecard unavailable"}
              </p>
              <p className="text-[13px] text-amber-700 dark:text-amber-400">
                {isMigration
                  ? "Run migration 0012_scorecard.sql in your Supabase project to enable the scorecard."
                  : msg}
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-alt text-foreground/60">
          <Target className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-display-2 font-bold tracking-tight">
            Northstar Scorecard
          </h1>
          <p className="text-sm text-muted-foreground">
            Weekly KPI tracking across all departments
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
