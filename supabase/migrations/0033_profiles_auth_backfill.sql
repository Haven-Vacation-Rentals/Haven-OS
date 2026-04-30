-- 0033_profiles_auth_backfill.sql
-- Haven OS — Backfill missing profiles for existing auth.users.
--
-- Why:
--   The /settings/users list reads from public.profiles, not auth.users.
--   If a user signed in via Google before the on_auth_user_created
--   trigger existed (or the trigger errored for any reason), they exist
--   in auth.users with no profiles row, and they vanish from the list.
--
-- This migration:
--   1. Re-asserts handle_new_user() and the on_auth_user_created trigger
--      so they exist in every environment (idempotent — safe to re-run).
--   2. Backfills profiles for every auth.users row that doesn't already
--      have one. Uses coalesce so a missing email or name doesn't break.
--
-- Safe to run in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Re-assert handle_new_user() trigger (idempotent)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Backfill missing profiles for existing auth.users
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, avatar_url)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name'
  ),
  coalesce(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  )
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;
