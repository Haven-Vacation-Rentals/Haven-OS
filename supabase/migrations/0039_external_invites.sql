-- Haven OS — External user invites.
--
-- Lets super admins invite a specific non-Haven email to sign in with
-- Google. The default Haven domain restriction (Google OAuth consent
-- screen / Workspace allowlist) still blocks every other non-Haven
-- account; this table is the *allowlist* used by the /auth/callback
-- handler to admit an exact email match that has an active invite.
--
-- Security model:
--   - Invitations are scoped to a single normalized email (lowercased,
--     trimmed). They do NOT contain a token that grants access on its
--     own. The token only ties an inbound /accept-invite link to the
--     invite row; the actual gate is "did the Google email match an
--     active invite at callback time?".
--   - Invites can be revoked or expire. The callback rejects accepted/
--     revoked/expired invites the same way it rejects unknown emails.
--   - Domain restriction stays the default: anyone not on a Haven
--     domain and not on the allowlist is signed out and redirected to
--     /login with a friendly error.
--
-- RLS:
--   - Super admins can read/write every invite via the SSR client.
--   - Regular users get zero access; the service-role admin client
--     (used by /auth/callback) bypasses RLS for the email lookup.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- external_invites
-- ---------------------------------------------------------------------------
create table if not exists public.external_invites (
  id uuid primary key default gen_random_uuid(),

  -- Normalized invited email (lowercased, trimmed). Unique per *active*
  -- (status IN ('pending','accepted')) row — see partial unique index
  -- below. We allow re-inviting after a revoke without losing history.
  email text not null,

  -- Optional display hints for the admin UI / new profile.
  full_name text,

  -- Role to apply to the new profile on first login. Defaults to 'user'.
  -- We avoid a CHECK against an enum to stay loose-coupled with the
  -- existing role string column on profiles.
  role text not null default 'user',

  -- Random opaque token used as a query-string handle on the invite
  -- link. It is NOT a credential; the callback always re-checks that
  -- the Google session's email matches an active invite.
  token text not null unique default encode(gen_random_bytes(24), 'hex'),

  -- Lifecycle.
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,

  -- Audit: who created/revoked the invite, and which auth.users row
  -- it eventually attached to.
  invited_by uuid references public.profiles (id) on delete set null,
  revoked_by uuid references public.profiles (id) on delete set null,
  accepted_user_id uuid references auth.users (id) on delete set null,

  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent two *active* invites for the same email; allow re-inviting
-- after a previous invite is revoked or expired.
create unique index if not exists external_invites_active_email_idx
  on public.external_invites (lower(email))
  where status in ('pending', 'accepted');

create index if not exists external_invites_email_idx
  on public.external_invites (lower(email));
create index if not exists external_invites_status_idx
  on public.external_invites (status);
create index if not exists external_invites_token_idx
  on public.external_invites (token);

drop trigger if exists trg_external_invites_set_updated_at on public.external_invites;
create trigger trg_external_invites_set_updated_at
  before update on public.external_invites
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.external_invites enable row level security;

drop policy if exists "external_invites super_admin all" on public.external_invites;
create policy "external_invites super_admin all"
  on public.external_invites
  for all
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- No self-read policy: regular users never see invites. The /auth/callback
-- handler uses the service-role admin client to look up the invite by
-- email, which bypasses RLS by design.

-- ---------------------------------------------------------------------------
-- Helper: is_email_allowlisted(text)
-- ---------------------------------------------------------------------------
-- Returns true if the given email (case-insensitive) has a pending
-- invite that hasn't expired. Used by the callback path (via the
-- admin client) to decide whether to admit a non-Haven Google sign-in.
create or replace function public.is_email_allowlisted(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.external_invites
    where lower(email) = lower(p_email)
      and status = 'pending'
      and (expires_at is null or expires_at > now())
  );
$$;

comment on function public.is_email_allowlisted(text) is
  'True when an active, unexpired external invite exists for the given email.';

comment on table public.external_invites is
  'Allowlist of specific non-Haven emails that may sign in with Google. Invitation alone is not a credential — the /auth/callback handler requires the Google session email to match an active row.';
