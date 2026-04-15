import { cn } from "@/lib/utils";

/**
 * Topographic-line backdrop, evoking the Smoky Mountains. Used behind
 * empty states and the login hero. Pure SVG, decorative, no deps.
 */
export function TopographicBg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid slice"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full opacity-50",
        className,
      )}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="topo-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.18"
      >
        <path d="M -20 240 Q 120 180 260 220 T 540 210 T 820 230" />
        <path d="M -20 260 Q 140 210 290 240 T 580 230 T 820 250" />
        <path d="M -20 280 Q 160 240 320 260 T 620 250 T 820 270" />
        <path d="M -20 300 Q 180 270 350 280 T 660 270 T 820 290" />
        <path d="M -20 320 Q 200 300 380 300 T 700 290 T 820 310" />
        <path d="M -20 340 Q 220 330 410 320 T 740 310 T 820 330" />
      </g>
      <rect
        x="0"
        y="0"
        width="800"
        height="400"
        fill="url(#topo-fade)"
        opacity="0.25"
      />
    </svg>
  );
}
