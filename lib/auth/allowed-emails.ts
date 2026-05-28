/**
 * Haven OS — Haven domain detection.
 *
 * Centralizes "is this email a Haven employee email?" so the invite
 * flow and the auth callback agree on which addresses are admitted
 * by default and which need an external invite.
 *
 * Domains that should pass without an invite:
 *   - havenvacationrentals.com  (primary corp domain)
 *   - haven.com                 (legacy alias, kept defensively)
 *
 * Everything else is treated as external — the /auth/callback handler
 * requires an active row in `external_invites` for the address.
 */

const HAVEN_DOMAINS: ReadonlySet<string> = new Set([
  "havenvacationrentals.com",
  "haven.com",
]);

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function emailDomain(email: string | null | undefined): string {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf("@");
  if (at < 0) return "";
  return e.slice(at + 1);
}

export function isHavenDomainEmail(email: string | null | undefined): boolean {
  return HAVEN_DOMAINS.has(emailDomain(email));
}
