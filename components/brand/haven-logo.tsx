import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Real Haven Vacation Rentals logo — circle badge with A-frame cabin.
 * Sourced from havenvacationrentals.com/wp-content/uploads/2023/07/
 * Haven-Logo-Black-Transparent-4.png and self-hosted in /public/brand.
 *
 * Variants:
 *   "dark"  — black ink, for light backgrounds (default)
 *   "cream" — cream ink (#FAF8F3), for dark backgrounds
 */
export function HavenLogo({
  size = 96,
  variant = "dark",
  className,
}: {
  size?: number;
  variant?: "dark" | "cream";
  className?: string;
}) {
  const src =
    variant === "cream" ? "/brand/haven-logo-cream.png" : "/brand/haven-logo.png";
  return (
    <Image
      src={src}
      alt="Haven Vacation Rentals"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}

/**
 * Horizontal wordmark for the sidebar header — pairs the badge with
 * the brand name in Futura. "OS" gets the coral accent so the product
 * identity reads at a glance.
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
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground">
        <Image
          src="/brand/haven-logo-cream.png"
          alt="Haven"
          width={28}
          height={28}
          className="shrink-0"
        />
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
