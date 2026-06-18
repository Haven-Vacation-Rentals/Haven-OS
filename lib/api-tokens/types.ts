/**
 * Personal Access Token (PAT) types and the canonical scope catalog.
 *
 * Scopes are intentionally coarse — one per platform module. The
 * `platform:full` scope is the catch-all and satisfies any check.
 * Each scope is also a separate column-of-truth so a user can mint a
 * token that's narrower than their own permissions if they want.
 */

export type ApiScope =
  | "platform:full"
  | "me:read"
  | "tasks:read"
  | "tasks:write"
  | "work:read"
  | "work:write"
  | "lost-items:read"
  | "lost-items:write"
  | "operations:read"
  | "operations:write"
  | "properties:read"
  | "properties:write"
  | "content:read"
  | "content:write"
  | "hr:read";

export interface ApiScopeInfo {
  scope: ApiScope;
  label: string;
  description: string;
}

export const API_SCOPE_CATALOG: ApiScopeInfo[] = [
  {
    scope: "platform:full",
    label: "Full access",
    description:
      "Grants every available scope. The token still acts as the owner — it cannot do anything the owner couldn't do.",
  },
  {
    scope: "me:read",
    label: "Read profile",
    description: "Read the token owner's profile and active scopes.",
  },
  {
    scope: "tasks:read",
    label: "Read tasks",
    description: "Read the owner's tasks (My Tasks + work tasks they can see).",
  },
  {
    scope: "tasks:write",
    label: "Write tasks",
    description: "Create / update / complete tasks the owner has access to.",
  },
  {
    scope: "work:read",
    label: "Read workspaces",
    description: "List spaces, folders, and lists the owner can see.",
  },
  {
    scope: "work:write",
    label: "Write workspaces",
    description: "Create or rename spaces / lists the owner has admin on.",
  },
  {
    scope: "lost-items:read",
    label: "Read Lost Items",
    description: "List and view Lost Items cases.",
  },
  {
    scope: "lost-items:write",
    label: "Write Lost Items",
    description: "Create / update / comment / set status on Lost Items cases.",
  },
  {
    scope: "operations:read",
    label: "Read Operations Costs",
    description:
      "Read the Operations Costs dashboard — daily / historical work-order profit rollups.",
  },
  {
    scope: "operations:write",
    label: "Write Operations Costs",
    description:
      "Upload completed work orders (employee, charged, paid) to the Operations Costs dashboard.",
  },
  {
    scope: "properties:read",
    label: "Read properties",
    description: "List Haven properties.",
  },
  {
    scope: "properties:write",
    label: "Write properties",
    description: "Create or update properties (admin-only in app).",
  },
  {
    scope: "content:read",
    label: "Read Content Studio",
    description: "List spaces / topics / articles in Content Studio.",
  },
  {
    scope: "content:write",
    label: "Write Content Studio",
    description: "Create or update topics / articles.",
  },
  {
    scope: "hr:read",
    label: "Read HR (with grant)",
    description:
      "Read HR data — only honored if the owner already has HR access in the app.",
  },
];

export const ALL_SCOPES: ApiScope[] = API_SCOPE_CATALOG.map((s) => s.scope);

// ---------------------------------------------------------------------------
// DB row shape
// ---------------------------------------------------------------------------

export interface PersonalAccessTokenRow {
  id: string;
  profile_id: string;
  name: string;
  token_prefix: string;
  token_hash: string;
  scopes: ApiScope[];
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Public-safe shape — never includes token_hash. */
export type PersonalAccessTokenPublic = Omit<
  PersonalAccessTokenRow,
  "token_hash"
>;

export function toPublic(
  row: PersonalAccessTokenRow,
): PersonalAccessTokenPublic {
  // Strip token_hash defensively even if a caller passes a row with it.

  const { token_hash: _hash, ...rest } = row;
  void _hash;
  return rest;
}
