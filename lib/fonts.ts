/**
 * Haven body/UI typography.
 *
 * We previously loaded Raleway via `next/font/google`, but the build-time
 * fetch to fonts.googleapis.com is unreliable in sandboxed/offline build
 * environments and would break `next build`. To keep deploys deterministic
 * and remove the external network dependency, we now resolve the
 * `--font-raleway` CSS variable to a system/web-safe sans-serif stack.
 *
 * The exported object preserves the shape consumed elsewhere
 * (`raleway.variable` is applied to <html> in app/layout.tsx and
 * `var(--font-raleway)` is referenced from globals.css and tailwind.config.ts),
 * so callers do not need to change.
 *
 * Futura PT continues to be loaded via the Adobe Typekit <link> in
 * app/layout.tsx for headings.
 */

const FONT_RALEWAY_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

export const raleway = {
  variable: "haven-font-raleway",
  className: "haven-font-raleway",
  style: { fontFamily: FONT_RALEWAY_STACK },
} as const;
