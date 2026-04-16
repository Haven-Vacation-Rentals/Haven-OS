-- Haven OS — Space privacy & members
--
-- Adds per-space visibility control and a members join table.
-- Run AFTER 0002_work_module.sql.

-- Add privacy column to spaces
alter table public.spaces
  add column if not exists privacy text not null default 'team';
-- privacy values: 'team' (everyone sees it), 'private' (members only)

-- ---------------------------------------------------------------------------
-- SPACE MEMBERS
-- ---------------------------------------------------------------------------
create table if not exists public.space_members (
  space_id  uuid not null references public.spaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member',  -- 'admin' | 'member' | 'viewer'
  added_at  timestamptz not null default now(),
  primary key (space_id, profile_id)
);

alter table public.space_members enable row level security;
create policy "sm read all" on public.space_members for select using (true);
create policy "sm insert auth" on public.space_members for insert with check (auth.uid() is not null);
create policy "sm update auth" on public.space_members for update using (auth.uid() is not null);
create policy "sm delete auth" on public.space_members for delete using (auth.uid() is not null);

-- Auto-add the creator as admin when a space is created
create or replace function public.tg_auto_add_space_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.space_members (space_id, profile_id, role)
    values (new.id, new.created_by, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists space_auto_add_creator on public.spaces;
create trigger space_auto_add_creator
  after insert on public.spaces
  for each row execute function public.tg_auto_add_space_creator();
