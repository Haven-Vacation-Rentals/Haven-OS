import { Target } from "lucide-react";
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
}

function PageShell({ children }: { children: React.ReactNode }) {
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
