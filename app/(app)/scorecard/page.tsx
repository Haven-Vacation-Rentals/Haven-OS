import { Target } from "lucide-react";
import { NorthstarScorecard } from "@/components/scorecard/northstar-scorecard";
import { SCORECARD_DATA } from "@/lib/scorecard/data";

export const metadata = { title: "Northstar Scorecard · Haven OS" };

export default function ScorecardPage() {
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
            Weekly KPI tracking across all departments · click a section to collapse
          </p>
        </div>
      </div>

      <NorthstarScorecard config={SCORECARD_DATA} />
    </div>
  );
}
