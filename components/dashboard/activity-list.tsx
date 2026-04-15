import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ActivityRow = {
  title: string;
  subtitle: string;
  meta: string;
};

export function ActivityList({
  title,
  subtitle,
  rows,
  count,
  viewAllHref,
  statusFor,
}: {
  title: string;
  subtitle?: string;
  rows: ActivityRow[];
  count?: number | string;
  viewAllHref?: string;
  statusFor?: (row: ActivityRow) => { label: string; tone: "success" | "warn" | "danger" | "neutral" };
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-4 flex items-baseline gap-2">
        <h3 className="flex items-center gap-2 font-heading text-base font-bold">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          {title}
          {subtitle ? (
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </h3>
        {count !== undefined ? (
          <span className="ml-auto font-heading text-lg font-bold text-foreground">
            {count}
          </span>
        ) : null}
      </div>

      <ul className="flex flex-col overflow-hidden">
        {rows.map((r, i) => {
          const status = statusFor?.(r);
          return (
            <li
              key={i}
              className={cn(
                "flex items-center justify-between gap-4 py-2.5",
                i !== rows.length - 1 && "border-b border-border/50",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-foreground">
                  {r.title}
                </div>
                <div className="truncate text-[12px] text-muted-foreground">
                  {r.subtitle}
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                {status ? (
                  <Badge tone={status.tone}>{status.label}</Badge>
                ) : null}
                <span className="w-20 text-right text-[12px] text-muted-foreground">
                  {r.meta}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {viewAllHref ? (
        <a
          href={viewAllHref}
          className="mt-3 inline-flex items-center gap-1 self-start text-[13px] font-semibold text-accent hover:underline"
        >
          View all →
        </a>
      ) : null}
    </Card>
  );
}
