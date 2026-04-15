import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Bucket = { label: string; count: number; tone: string };

export function ProfitDistribution({
  title,
  subtitle,
  buckets,
}: {
  title: string;
  subtitle?: string;
  buckets: Bucket[];
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline gap-2">
        <h3 className="font-heading text-base font-bold">{title}</h3>
        {subtitle ? (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3.5">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="font-medium text-foreground/80">{b.label}</span>
              <span className="font-heading font-bold text-foreground">
                {b.count}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
              <div
                className={cn("h-full rounded-full transition-all", b.tone)}
                style={{ width: `${Math.round((b.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

type StageRow = { label: string; count: number; dot: string };

export function PropertiesByStage({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: StageRow[];
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline gap-2">
        <h3 className="font-heading text-base font-bold">{title}</h3>
        {subtitle ? (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
      <ul className="flex flex-col">
        {rows.map((r, i) => (
          <li
            key={r.label}
            className={cn(
              "flex items-center justify-between py-2.5",
              i !== rows.length - 1 && "border-b border-border/60",
            )}
          >
            <span className="flex items-center gap-2.5 text-[14px]">
              <span className={cn("h-2 w-2 rounded-full", r.dot)} />
              {r.label}
            </span>
            <span className="font-heading text-[15px] font-bold text-foreground">
              {r.count}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
