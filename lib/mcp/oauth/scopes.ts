/**
 * Scope catalog exposed via the MCP OAuth surface.
 *
 * This is a *subset* of the canonical PAT scope catalog
 * (lib/api-tokens/types.ts) — the only scopes Claude as a custom
 * connector should be allowed to request. We deliberately omit
 * `platform:full`, `hr:read`, and the workspace/properties write
 * scopes so a connector token can never elevate beyond what the user
 * agreed to at consent time.
 *
 * When the access token is presented to /api/mcp it is mapped back
 * onto the same ApiAuthContext.scopes the PAT path uses, so the MCP
 * scope gates in lib/mcp/server.ts work unchanged.
 */

import type { ApiScope } from "@/lib/api-tokens/types";

export const MCP_OAUTH_SCOPES: ApiScope[] = [
  "me:read",
  "tasks:read",
  "tasks:write",
  "lost-items:read",
  "lost-items:write",
  "operations:read",
  "operations:write",
  "content:read",
  "content:write",
];

export const MCP_OAUTH_SCOPE_SET = new Set<string>(MCP_OAUTH_SCOPES);

export const MCP_OAUTH_SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  "me:read": "Read your Haven OS profile and active scopes.",
  "tasks:read": "Read your tasks and the team tasks you can see.",
  "tasks:write": "Create, update, and complete tasks on your behalf.",
  "lost-items:read": "View Lost Items cases.",
  "lost-items:write": "Create and update Lost Items cases.",
  "operations:read":
    "View the Operations Costs dashboard (work-order profit rollups).",
  "operations:write":
    "Upload completed work orders (employee, charged, paid) to Operations Costs.",
  "content:read": "Read Paid Advertising spaces and ad cards.",
  "content:write": "Create and update Paid Advertising ad cards.",
  // The remaining ApiScope keys are not exposed via OAuth, but we
  // declare them here so the Record type stays exhaustive.
  "platform:full": "",
  "work:read": "",
  "work:write": "",
  "properties:read": "",
  "properties:write": "",
  "hr:read": "",
};

/**
 * Parse a space-separated scope string against the OAuth catalog.
 * Unknown scopes are silently dropped (RFC 6749 §3.3 — the server
 * may issue a narrower set than requested). Empty / missing input
 * defaults to the read-only baseline.
 */
export function parseScopeParam(raw: string | null | undefined): ApiScope[] {
  if (!raw) return defaultScopes();
  const requested = raw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const accepted = requested.filter((s): s is ApiScope =>
    MCP_OAUTH_SCOPE_SET.has(s),
  );
  if (accepted.length === 0) return defaultScopes();
  return accepted;
}

function defaultScopes(): ApiScope[] {
  return ["me:read", "tasks:read", "lost-items:read", "content:read"];
}
