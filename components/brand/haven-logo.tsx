import { cn } from "@/lib/utils";

/**
 * Monoline HAVEN logo mark — a tribute/recreation of the circle badge
 * from havenvacationrentals.com (A-frame cabin flanked by pines).
 *
 * We'll self-host the official PNG in /public later; for now this SVG
 * renders crisply at any size and inherits `currentColor` so it works
 * on light, dark, and coral surfaces.
 *
 * Props:
 *   size          — pixel size of the square badge
 *   withWordmark  — render the "HAVEN · VACATION RENTALS" arc text
 */
export function HavenLogo({
  size = 40,
  withWordmark = true,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-label="Haven"
      role="img"
    >
      <defs>
        <path
          id="haven-top-arc"
          d="M 22 60 A 38 38 0 0 1 98 60"
          fill="none"
        />
        <path
          id="haven-bottom-arc"
          d="M 22 60 A 38 38 0 0 0 98 60"
          fill="none"
        />
      </defs>

      {/* Outer ring */}
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Inner ring */}
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Side notches */}
      <circle cx="6" cy="60" r="2" fill="currentColor" />
      <circle cx="114" cy="60" r="2" fill="currentColor" />

      {/* A-frame cabin */}
      <g
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* roof */}
        <path d="M 60 44 L 46 72 L 74 72 Z" />
        {/* chimney */}
        <path d="M 65 48 L 65 42 L 69 42 L 69 54" />
        {/* door */}
        <path d="M 57 72 L 57 64 Q 60 61 63 64 L 63 72" />
        {/* path leading up */}
        <path d="M 54 80 L 60 72 M 66 80 L 60 72" opacity="0.6" />
        {/* ground line */}
        <path d="M 38 78 L 82 78" opacity="0.5" />
      </g>

      {/* Left pine */}
      <g
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      >
        <path d="M 36 72 L 42 56 L 48 72 Z" />
        <path d="M 38 66 L 42 60 L 46 66" />
        <path d="M 42 72 L 42 76" strokeLinecap="round" />
      </g>

      {/* Right pine */}
      <g
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      >
        <path d="M 72 72 L 78 56 L 84 72 Z" />
        <path d="M 74 66 L 78 60 L 82 66" />
        <path d="M 78 72 L 78 76" strokeLinecap="round" />
      </g>

      {/* Stars */}
      <g fill="currentColor">
        <circle cx="50" cy="42" r="0.8" />
        <circle cx="70" cy="38" r="0.8" />
        <circle cx="76" cy="46" r="0.8" />
        <circle cx="44" cy="50" r="0.8" />
      </g>

      {withWordmark && (
        <>
          <text
            fontFamily="futura-pt, Futura, sans-serif"
            fontWeight="700"
            fontSize="10"
            letterSpacing="3"
            fill="currentColor"
          >
            <textPath href="#haven-top-arc" startOffset="50%" textAnchor="middle">
              HAVEN
            </textPath>
          </text>
          <text
            fontFamily="futura-pt, Futura, sans-serif"
            fontWeight="500"
            fontSize="5"
            letterSpacing="2"
            fill="currentColor"
          >
            <textPath
              href="#haven-bottom-arc"
              startOffset="50%"
              textAnchor="middle"
            >
              VACATION RENTALS
            </textPath>
          </text>
        </>
      )}
    </svg>
  );
}

/**
 * Horizontal wordmark for the sidebar header — pairs the badge with
 * the brand name in Futura. "OS" gets the coral accent treatment so
 * the product identity reads at a glance.
 */
export function HavenWordmark({
  subtitle,
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground text-background">
        <HavenLogo size={28} withWordmark={false} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-heading text-base font-bold tracking-tight text-foreground">
          Haven <span className="text-accent">OS</span>
        </span>
        {subtitle ? (
          <span className="text-[11px] font-medium text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
