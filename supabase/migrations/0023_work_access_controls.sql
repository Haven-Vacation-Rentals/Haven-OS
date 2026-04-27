-- Haven OS — Work module access controls (per-space, per-list grants)
--
-- Background
-- ----------
-- 0002 introduced spaces / folders / lists / list_members. 0003 added
-- private spaces with space_members. Until now access was a coarse
-- mix of:
--   * spaces.privacy = 'team' | 'private'        (visibility)
--   * lists.type     = 'private' | 'shared' | 'public'
--   * list_members   (only checked when list.type='private')
--
-- This migration formalises per-space and per-list access controls so
-- a space or list can grant individual users a specific level of access
-- (viewer / editor / admin), with list-level grants extending or
-- overriding what the parent space allows.
--
-- Data model
-- ----------
-- 1. `space_members.role` already supports 'admin'|'member'|'viewer'.
--    We keep it as the per-space access level. Existing rows are
--    treated as 'editor' equivalents (member==editor for permission
--    purposes — both can edit lists/tasks; viewer is read-only).
--
-- 2. `list_members.access_level` (NEW) — granular access on a list.
--    'viewer'  → read-only
--    'editor'  → read+write tasks, statuses, fields
--    'admin'   → full control incl. members + delete
--    Backfilled from list_members.role:
--        owner  → admin
--        member → editor
--    The legacy `role` column stays so the existing "list color"
--    feature keeps working (assignee chip color is keyed off the
--    list_members row).
--
-- 3. Inheritance — a list's effective access is:
--    (a) explicit list_members row, else
--    (b) parent space_members row (if list belongs to a space), else
--    (c) public visibility for shared/public list types, else
--    (d) no access.
--    Super admins bypass everything.
--    Enforcement happens in lib/work/actions.ts.
--
-- Run AFTER 0022_hr_roster_and_departments.sql.

-- ---------------------------------------------------------------------------
-- 1. list_members.access_level
-- ---------------------------------------------------------------------------

alter table public.list_members
  add column if not exists access_level text not null default 'editor';

-- Constrain values. Drop+recreate so re-running the migration is safe.
alter table public.list_members
  drop constraint if exists list_members_access_level_chk;

alter table public.list_members
  add constraint list_members_access_level_chk
    check (access_level in ('viewer', 'editor', 'admin'));

-- Backfill from existing role column:
--   owner  -> admin
--   member -> editor (default already)
update public.list_members
set    access_level = 'admin'
where  role = 'owner'
  and  access_level = 'editor';

-- ---------------------------------------------------------------------------
-- 2. space_members — make sure the role column has a CHECK constraint we
--    can rely on. (0003 created it without one.)
-- ---------------------------------------------------------------------------

alter table public.space_members
  drop constraint if exists space_members_role_chk;

alter table public.space_members
  add constraint space_members_role_chk
    check (role in ('admin', 'member', 'viewer'));

-- ---------------------------------------------------------------------------
-- 3. Helpful indexes — per-user lookups for the new "what can I see" checks
-- ---------------------------------------------------------------------------

create index if not exists list_members_profile_id_idx
  on public.list_members (profile_id);

create index if not exists space_members_profile_id_idx
  on public.space_members (profile_id);

-- ---------------------------------------------------------------------------
-- 4. Convenience function — does (user, list) have at least the given
--    access level? Considers list-level grant first, then inherits from
--    space-level grant. Returns true for super_admins.
--
-- Use the text comparison (admin > editor > viewer) via a tiny ranking.
-- ---------------------------------------------------------------------------

create or replace function public.work_access_rank(level text)
returns int
language sql
immutable
as $$
  select case lower(coalesce(level, ''))
    when 'admin'  then 3
    when 'editor' then 2
    when 'member' then 2  -- space_members "member" maps to editor
    when 'viewer' then 1
    else 0
  end;
$$;

create or replace function public.user_has_list_access(
  p_user_id uuid,
  p_list_id uuid,
  p_min_level text default 'viewer'
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_space_id uuid;
  v_list_type text;
  v_personal_owner uuid;
  v_required int := work_access_rank(p_min_level);
  v_have int := 0;
begin
  if p_user_id is null then
    return false;
  end if;

  -- super_admin bypass
  select role into v_role from public.profiles where id = p_user_id;
  if v_role = 'super_admin' then
    return true;
  end if;

  select space_id, type, personal_owner_id
    into v_space_id, v_list_type, v_personal_owner
  from public.lists where id = p_list_id;
  if not found then
    return false;
  end if;

  -- personal lists: only the owner
  if v_personal_owner is not null then
    return v_personal_owner = p_user_id;
  end if;

  -- explicit list grant?
  select work_access_rank(access_level) into v_have
  from public.list_members
  where list_id = p_list_id and profile_id = p_user_id
  limit 1;
  if v_have >= v_required then return true; end if;

  -- inherit from space grant?
  if v_space_id is not null then
    select work_access_rank(role) into v_have
    from public.space_members
    where space_id = v_space_id and profile_id = p_user_id
    limit 1;
    if v_have >= v_required then return true; end if;
  end if;

  -- list type fallback (no grant, but list is shared/public and space
  -- is team-visible)
  if v_list_type in ('shared', 'public') then
    if v_space_id is null then
      return v_required <= 2; -- editor+
    end if;
    declare
      v_privacy text;
    begin
      select privacy into v_privacy from public.spaces where id = v_space_id;
      if v_privacy = 'team' then
        return v_required <= 2; -- team can read/edit shared lists
      end if;
    end;
  end if;

  return false;
end;
$$;

grant execute on function public.user_has_list_access(uuid, uuid, text) to authenticated;
