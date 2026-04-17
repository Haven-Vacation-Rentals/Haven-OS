-- 0010_personal_lists.sql
-- Support personal (user-owned) lists for "My Tasks" without requiring a space.
-- space_id becomes nullable; personal_owner_id references the owning user.

alter table public.lists
  alter column space_id drop not null;

alter table public.lists
  add column if not exists personal_owner_id uuid references public.profiles(id) on delete cascade;

-- One personal list per user (nullable elsewhere)
create unique index if not exists lists_personal_owner_unique
  on public.lists (personal_owner_id)
  where personal_owner_id is not null;

-- Enforce: a list must be anchored to either a space or a personal owner.
alter table public.lists
  drop constraint if exists lists_space_or_owner_chk;
alter table public.lists
  add constraint lists_space_or_owner_chk
  check (space_id is not null or personal_owner_id is not null);

-- Index for fast lookup by personal owner
create index if not exists lists_personal_owner_idx
  on public.lists (personal_owner_id)
  where personal_owner_id is not null;
