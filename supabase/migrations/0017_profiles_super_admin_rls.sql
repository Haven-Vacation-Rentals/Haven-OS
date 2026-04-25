-- Haven OS — let super_admins read & update every profile.
--
-- The original 0001_init_profiles.sql only had self-read / self-update
-- policies. That meant the /settings/users page (super-admin only) was
-- silently filtered down to just the calling user's own row, so newly
-- invited users never appeared in the list.
--
-- We add additive policies: anyone whose own profile.role = 'super_admin'
-- can read and update every profiles row. The existing self-read /
-- self-update policies stay in place for regular users.
--
-- We must use a SECURITY DEFINER helper because a policy on profiles
-- that queries profiles directly would recurse via RLS.

-- ---------------------------------------------------------------------------
-- helper: is_super_admin(uid)
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'super_admin'
  );
$$;

comment on function public.is_super_admin(uuid) is
  'Returns true when the given user is a super admin. SECURITY DEFINER so RLS does not recurse.';

-- ---------------------------------------------------------------------------
-- super_admin SELECT
-- ---------------------------------------------------------------------------
drop policy if exists "profiles super_admin read" on public.profiles;
create policy "profiles super_admin read"
  on public.profiles for select
  using (public.is_super_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- super_admin UPDATE
-- ---------------------------------------------------------------------------
drop policy if exists "profiles super_admin update" on public.profiles;
create policy "profiles super_admin update"
  on public.profiles for update
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));
