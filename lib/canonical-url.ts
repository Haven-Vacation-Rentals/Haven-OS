/**
 * Canonical base URL for the Haven OS deployment.
 *
 * Single source of truth for absolute URLs we generate (OAuth redirect,
 * shareable pitch/survey/careers links, etc.). Goal: production users
 * stay on the custom domain (e.g. https://www.havenvros.com), not the
 * raw Vercel deployment URL.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL — explicit canonical domain set by ops.
 *   2. Legacy NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_PITCH_BASE_URL — kept
 *      so older configs keep working until migrated.
 *   3. On a Vercel preview build, fall back to https://$VERCEL_URL so
 *      branch deploys redirect to themselves instead of prod.
 *   4. Client-side: window.location.origin.
 *   5. Last resort: http://localhost:3000.
 *
 * NOTE: do NOT prefer VERCEL_URL in production. That's exactly what
 * was sending users back to haven-os-five.vercel.app after login.
 */

const TRAILING_SLASH = /\/+$/;

function clean(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Allow operators to set either "havenvros.com" or "https://...".
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProto.replace(TRAILING_SLASH, "");
}

/**
 * Server- or client-safe canonical base. Returns e.g.
 * "https://www.havenvros.com" with no trailing slash.
 */
export function canonicalBaseUrl(): string {
  const explicit =
    clean(process.env.NEXT_PUBLIC_APP_URL) ||
    clean(process.env.NEXT_PUBLIC_SITE_URL) ||
    clean(process.env.NEXT_PUBLIC_PITCH_BASE_URL);
  if (explicit) return explicit;

  // Preview deploys: fall back to the deploy's own URL so each preview
  // is self-contained. Production must have NEXT_PUBLIC_APP_URL set —
  // we intentionally do NOT use VERCEL_URL on production here.
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelEnv === "preview" && vercelUrl) {
    return `https://${vercelUrl}`;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(TRAILING_SLASH, "");
  }

  // Final dev fallback. In production this should never be hit because
  // NEXT_PUBLIC_APP_URL is required.
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

/** Build a full canonical URL for a relative path ("/pitch/abc"). */
export function canonicalUrl(path: string): string {
  const base = canonicalBaseUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
