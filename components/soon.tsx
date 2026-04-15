import { Sparkles, type LucideIcon } from "lucide-react";
import { TopographicBg } from "@/components/brand/topographic-bg";
import { Badge } from "@/components/ui/badge";

/**
 * "Coming soon" module landing page. Used for every sidebar entry that
 * is stubbed while we land the first module. Shows what's planned and
 * invites the user to poke at it.
 */
export function SoonPage({
  icon: Icon,
  title,
  eyebrow,
  description,
  bullets,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  eyebrow: string;
  description: string;
  bullets: string[];
  phase: string;
}) {
  return (
    <div className="relative mx-auto flex max-w-3xl flex-col items-center overflow-hidden rounded-card border border-border bg-surface px-6 py-16 text-center shadow-card text-foreground">
      <TopographicBg className="text-foreground" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
          <Icon className="h-5 w-5" />
        </span>

        <Badge tone="coral" dot>
          {phase}
        </Badge>

        <div className="haven-eyebrow">{eyebrow}</div>
        <h1 className="font-heading text-display-2 font-bold tracking-tight">
          {title}
        </h1>
        <p className="max-w-lg text-[15px] text-muted-foreground">{description}</p>

        <ul className="mt-2 grid max-w-md grid-cols-1 gap-2 text-left sm:grid-cols-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded-md border border-border bg-surface/80 px-3 py-2 text-[13px] text-foreground/80 backdrop-blur"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
