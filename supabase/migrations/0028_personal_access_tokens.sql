-- Haven OS — Personal Access Tokens (PATs) + lightweight API audit log.
--
-- Adds a per-user token system used to authenticate external agents and
-- scripts against the public /api/v1 surface. Tokens are stored *hashed*
-- only — the raw secret is shown to the user exactly once at creation
-- time and never persisted in plaintext.
--
-- Rationale:
--   The pre-existing HAVEN_LOST_ITEMS_API_KEY is a single shared secret
--   that maps to no user — fine for the lost-items intake form, but
--   doesn't compose with the rest of the platform (no audit trail,
--   no per-actor permission scoping, no revocation per agent). PATs
--   replace that pattern for everything else: each token belongs to a
--   real Haven user and carries that user's permissions plus a chosen
--   set of scopes.
--
-- Tables:
--   - personal_access_tokens — token metadata + sha256(token) hash.
--   - api_access_logs        — per-request audit trail (best-effort).
--
-- RLS:
--   - A user can read/insert/update/delete only their own tokens.
--   - Super admins can read & revoke (UPDATE) every token.
--   - Hash and salt columns can be selected via RLS but the app layer
--     never SELECTs token_hash from the SSR client — only the service
--     role uses it for verification.

-- ---------------------------------------------------------------------------
-- personal_access_tokens
-- ---------------------------------------------------------------------------
create table if not exists public.personal_access_tokens (
  id uuid primary key default gen_random_uuid(),

  -- Owner. profile_id is the same uuid as auth.users.id (profiles.id is
  -- a 1:1 fk on auth.users).
  profile_id uuid not null references public.profiles (id) on delete cascade,

  -- Human-friendly label ("zapier", "lost-items-bot").
  name text not null,

  -- The visible prefix of the raw token, e.g. 'hvn_pat_3f9c'. Used to
  -- show the user which token is which without exposing the secret.
  token_prefix text not null,

  -- sha256(raw_token) hex-encoded. Verification: hash incoming bearer,
  -- compare to this column.
  token_hash text not null unique,

  -- Authorization scopes. 'platform:full' is the catch-all that
  -- satisfies any scope check; granular scopes (e.g. 'work:read',
  -- 'lost-items:write') let the user lock a token down further.
  scopes text[] not null default array['platform:full']::text[],

  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,

  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_access_tokens_profile_idx
  on public.personal_access_tokens (profile_id);
create index if not exists personal_access_tokens_hash_idx
  on public.personal_access_tokens (token_hash);

drop trigger if exists trg_pat_set_updated_at on public.personal_access_tokens;
create trigger trg_pat_set_updated_at
  before update on public.personal_access_tokens
  for each row execute function public.tg_set_updated_at();

alter table public.personal_access_tokens enable row level security;

-- Self-manage
drop policy if exists "pat self read"   on public.personal_access_tokens;
drop policy if exists "pat self insert" on public.personal_access_tokens;
drop policy if exists "pat self update" on public.personal_access_tokens;
drop policy if exists "pat self delete" on public.personal_access_tokens;

create policy "pat self read"
  on public.personal_access_tokens for select
  using (auth.uid() = profile_id);

create policy "pat self insert"
  on public.personal_access_tokens for insert
  with check (auth.uid() = profile_id);

create policy "pat self update"
  on public.personal_access_tokens for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "pat self delete"
  on public.personal_access_tokens for delete
  using (auth.uid() = profile_id);

-- Super-admin oversight (read + revoke any token)
drop policy if exists "pat super_admin read"   on public.personal_access_tokens;
drop policy if exists "pat super_admin update" on public.personal_access_tokens;

create policy "pat super_admin read"
  on public.personal_access_tokens for select
  using (public.is_super_admin(auth.uid()));

create policy "pat super_admin update"
  on public.personal_access_tokens for update
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

comment on table public.personal_access_tokens is
  'Per-user API tokens for /api/v1. Stored hashed only. Raw value is shown once at creation.';

-- ---------------------------------------------------------------------------
-- api_access_logs (lightweight audit)
-- ---------------------------------------------------------------------------
create table if not exists public.api_access_logs (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references public.personal_access_tokens (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,

  method text not null,
  path text not null,
  status_code integer not null,

  user_agent text,
  ip_hash text, -- sha256(client ip), never the raw IP

  created_at timestamptz not null default now()
);

create index if not exists api_access_logs_token_idx
  on public.api_access_logs (token_id, created_at desc);
create index if not exists api_access_logs_profile_idx
  on public.api_access_logs (profile_id, created_at desc);

alter table public.api_access_logs enable row level security;

-- Owners see their own logs; super_admins see everything. Inserts are
-- service-role only (the API helper writes them).
drop policy if exists "api_logs self read"        on public.api_access_logs;
drop policy if exists "api_logs super_admin read" on public.api_access_logs;

create policy "api_logs self read"
  on public.api_access_logs for select
  using (auth.uid() = profile_id);

create policy "api_logs super_admin read"
  on public.api_access_logs for select
  using (public.is_super_admin(auth.uid()));

comment on table public.api_access_logs is
  'Best-effort audit log for /api/v1 requests authenticated by a personal access token.';
