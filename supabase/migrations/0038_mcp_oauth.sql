-- Haven OS — OAuth 2.0 + PKCE support for the MCP endpoint.
--
-- Adds the storage required for Claude (claude.ai / Claude mobile) to
-- act as a "custom connector" against `/api/mcp` without a pre-issued
-- Personal Access Token. The PAT path (0028) keeps working untouched;
-- this migration only adds *additional* token kinds the same endpoint
-- can accept.
--
-- Flow (RFC 8252 + RFC 7636 PKCE, public clients only):
--
--   1. Claude calls POST /api/mcp/oauth/register (dynamic client
--      registration, RFC 7591). We mint a client_id; no secret.
--   2. Claude redirects the user to /api/mcp/oauth/authorize?…
--      with code_challenge + S256. We bounce them through
--      /mcp/consent (login-gated) for explicit approval of scopes.
--   3. We redirect back to Claude's registered redirect_uri with a
--      single-use authorization code (5 min TTL).
--   4. Claude POSTs the code to /api/mcp/oauth/token, supplying its
--      code_verifier. We hand back an access token (1h) + refresh
--      token (30d, rotated on each refresh).
--   5. /api/mcp accepts the access token alongside the existing PAT
--      bearer format. Audit logs continue to land in api_access_logs.
--
-- Tokens and codes are stored hashed (sha256) — never plaintext.
--
-- Tables added:
--   - mcp_oauth_clients          dynamically-registered Claude clients
--   - mcp_oauth_authorization_codes  short-lived PKCE codes
--   - mcp_oauth_tokens           access + refresh tokens (sibling rows)
--
-- RLS: locked down. App access is service-role only (the OAuth and MCP
-- endpoints use the admin client). End users can read/revoke their
-- own tokens through a row policy for the settings UI.

-- ---------------------------------------------------------------------------
-- mcp_oauth_clients
-- ---------------------------------------------------------------------------
create table if not exists public.mcp_oauth_clients (
  id uuid primary key default gen_random_uuid(),

  -- Public client identifier handed back to Claude during registration.
  -- Format: hvn_mcp_client_<base64url(16 bytes)>.
  client_id text not null unique,

  -- Human label from the registration request (e.g. "Claude").
  client_name text,

  -- Allowed redirect URIs (exact match). RFC 7591 — clients must list
  -- every URI they intend to use up front.
  redirect_uris text[] not null default array[]::text[],

  -- Space-separated list of scopes the client is allowed to request.
  -- We bind this to the canonical Haven OS scope catalog at issue time.
  scopes text[] not null default array[]::text[],

  -- "none" → public client (PKCE-only). We do not issue secrets.
  token_endpoint_auth_method text not null default 'none',

  -- Bookkeeping
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists mcp_oauth_clients_client_id_idx
  on public.mcp_oauth_clients (client_id);

drop trigger if exists trg_mcp_oauth_clients_updated_at on public.mcp_oauth_clients;
create trigger trg_mcp_oauth_clients_updated_at
  before update on public.mcp_oauth_clients
  for each row execute function public.tg_set_updated_at();

alter table public.mcp_oauth_clients enable row level security;

-- No end-user access. Service role only. (Admins may read via the
-- super_admin policy below for diagnostics.)
drop policy if exists "mcp_clients super_admin read" on public.mcp_oauth_clients;
create policy "mcp_clients super_admin read"
  on public.mcp_oauth_clients for select
  using (public.is_super_admin(auth.uid()));

comment on table public.mcp_oauth_clients is
  'Dynamically-registered OAuth clients for the Haven OS MCP endpoint. Public clients only (PKCE).';

-- ---------------------------------------------------------------------------
-- mcp_oauth_authorization_codes
-- ---------------------------------------------------------------------------
create table if not exists public.mcp_oauth_authorization_codes (
  id uuid primary key default gen_random_uuid(),

  -- sha256(raw_code), hex. The raw code is shown to Claude exactly once
  -- via the redirect URL and is single-use.
  code_hash text not null unique,

  client_id text not null
    references public.mcp_oauth_clients (client_id) on delete cascade,

  -- The signed-in user who granted consent.
  profile_id uuid not null references public.profiles (id) on delete cascade,

  -- Approved scopes (subset of client's allowed scopes).
  scopes text[] not null default array[]::text[],

  -- The redirect URI the client supplied at /authorize. Must match
  -- exactly at /token time.
  redirect_uri text not null,

  -- PKCE — only S256 is accepted at issue time.
  code_challenge text not null,
  code_challenge_method text not null default 'S256',

  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mcp_oauth_codes_client_idx
  on public.mcp_oauth_authorization_codes (client_id);
create index if not exists mcp_oauth_codes_expires_idx
  on public.mcp_oauth_authorization_codes (expires_at);

alter table public.mcp_oauth_authorization_codes enable row level security;

-- Service-role only. End users never touch this directly.
drop policy if exists "mcp_codes super_admin read" on public.mcp_oauth_authorization_codes;
create policy "mcp_codes super_admin read"
  on public.mcp_oauth_authorization_codes for select
  using (public.is_super_admin(auth.uid()));

comment on table public.mcp_oauth_authorization_codes is
  'Short-lived PKCE authorization codes for the MCP OAuth flow. Hashed and single-use.';

-- ---------------------------------------------------------------------------
-- mcp_oauth_tokens
--
-- One row per issued access OR refresh token. We deliberately store
-- access and refresh tokens in the same shape (and link them via
-- access_token_id) so revoking a refresh token also revokes its
-- siblings.
-- ---------------------------------------------------------------------------
create table if not exists public.mcp_oauth_tokens (
  id uuid primary key default gen_random_uuid(),

  -- 'access' or 'refresh'.
  token_type text not null check (token_type in ('access', 'refresh')),

  -- sha256(raw_token), hex. Raw token is shown to Claude once.
  token_hash text not null unique,

  client_id text not null
    references public.mcp_oauth_clients (client_id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,

  scopes text[] not null default array[]::text[],

  -- For refresh tokens: link to the access token issued alongside.
  -- For access tokens: link to the refresh token issued alongside
  -- (nullable — e.g. when refresh is not in scope).
  paired_token_id uuid references public.mcp_oauth_tokens (id) on delete set null,

  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mcp_oauth_tokens_hash_idx
  on public.mcp_oauth_tokens (token_hash);
create index if not exists mcp_oauth_tokens_profile_idx
  on public.mcp_oauth_tokens (profile_id);
create index if not exists mcp_oauth_tokens_client_idx
  on public.mcp_oauth_tokens (client_id);
create index if not exists mcp_oauth_tokens_expires_idx
  on public.mcp_oauth_tokens (expires_at);

alter table public.mcp_oauth_tokens enable row level security;

-- Owner can read & revoke their own MCP tokens (settings UI). They can
-- never SELECT the hash via SSR because the SSR client never selects
-- that column, but RLS still gates the row.
drop policy if exists "mcp_tokens self read"   on public.mcp_oauth_tokens;
drop policy if exists "mcp_tokens self update" on public.mcp_oauth_tokens;
drop policy if exists "mcp_tokens super_admin read"   on public.mcp_oauth_tokens;
drop policy if exists "mcp_tokens super_admin update" on public.mcp_oauth_tokens;

create policy "mcp_tokens self read"
  on public.mcp_oauth_tokens for select
  using (auth.uid() = profile_id);

create policy "mcp_tokens self update"
  on public.mcp_oauth_tokens for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "mcp_tokens super_admin read"
  on public.mcp_oauth_tokens for select
  using (public.is_super_admin(auth.uid()));

create policy "mcp_tokens super_admin update"
  on public.mcp_oauth_tokens for update
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

comment on table public.mcp_oauth_tokens is
  'Access + refresh tokens for the MCP OAuth flow. Stored hashed only. Access TTL 1h, refresh TTL 30d (rotated).';
