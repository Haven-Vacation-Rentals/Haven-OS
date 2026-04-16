-- Haven OS — initial schema
--
-- Creates a `profiles` row for every Supabase auth user, with RLS so
-- a user can read/update only their own profile. This is the bare
-- minimum we need for the app shell; the Work module schema lands in
-- its own migration.
--
-- Run order:
--   1. Paste into Supabase SQL Editor (or use `supabase db push` once
--      the local CLI is configured).
--   2. Enable Google OAuth: Auth → Providers → Google, paste your
--      OAuth client id + secret, set the authorized redirect URI to
--      https://<your-project>.supabase.co/auth/v1/callback
--   3. In Auth → URL Configuration, add your app URLs to "Redirect
--      URLs": http://localhost:3000/auth/callback and the Vercel URL.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Self-read
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

-- Self-update (no insert/delete from clients)
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row on user signup.
-- Runs as SECURITY DEFINER so the trigger can write to public.profiles
-- even though the auth.users insert happens with supabase_auth_admin.
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
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
