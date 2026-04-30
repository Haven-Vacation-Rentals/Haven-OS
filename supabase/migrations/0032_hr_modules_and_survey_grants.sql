-- 0032_hr_modules_and_survey_grants.sql
-- Haven OS — Granular HR access controls + survey response soft-delete.
--
-- Adds:
--   * Module-level HR access grants (People, Hiring, Surveys, Policies,
--     Procedures) so a user can be limited to a subset of HR sections.
--   * Per-survey grants on hr_access_grants so a user can see and manage
--     a single survey without seeing the rest of HR.
--   * Soft-delete column on hr_survey_responses so submissions can be
--     archived from the dashboard while preserving an audit trail.
--
-- Backwards compatibility:
--   * Existing scope='all'/'department'/'employee' grants stay as-is.
--   * Every existing grantee is auto-granted all five module rows so that
--     anyone with HR access today retains the same surface area after
--     this migration.
--   * The helper functions short-circuit on super_admin so the migration
--     is a no-op for them.

-- =============================================================================
-- 1. HR module enum + module grants table
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'hr_module') then
    create type public.hr_module as enum (
      'people',
      'hiring',
      'surveys',
      'policies',
      'procedures'
    );
  end if;
end $$;

create table if not exists public.hr_module_grants (
  id          uuid primary key default gen_random_uuid(),
  grantee_id  uuid not null references public.profiles (id) on delete cascade,
  module      public.hr_module not null,
  granted_by  uuid references public.profiles (id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),
  unique (grantee_id, module)
);

alter table public.hr_module_grants enable row level security;

drop policy if exists "auth_read" on public.hr_module_grants;
create policy "auth_read" on public.hr_module_grants
  for select to authenticated using (true);

drop policy if exists "auth_write" on public.hr_module_grants;
create policy "auth_write" on public.hr_module_grants
  for all to authenticated using (true) with check (true);

create index if not exists hr_module_grants_grantee_idx
  on public.hr_module_grants (grantee_id);

-- =============================================================================
-- 2. Extend hr_access_grants with 'survey' scope
-- =============================================================================

-- Recreate the scope enum with the new 'survey' value if it isn't already
-- there. Postgres only allows additive changes so use ALTER TYPE ADD VALUE.
do $$ begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'hr_grant_scope' and e.enumlabel = 'survey'
  ) then
    alter type public.hr_grant_scope add value 'survey';
  end if;
end $$;

alter table public.hr_access_grants
  add column if not exists survey_id uuid references public.hr_surveys (id) on delete cascade;

-- Drop and re-add the scope/target check constraint to include the new
-- 'survey' branch.
alter table public.hr_access_grants
  drop constraint if exists hr_access_grants_check;

alter table public.hr_access_grants
  add constraint hr_access_grants_scope_target_check check (
    (scope = 'all'        and department_id is null and employee_id is null and survey_id is null) or
    (scope = 'department' and department_id is not null and employee_id is null and survey_id is null) or
    (scope = 'employee'   and employee_id is not null   and department_id is null and survey_id is null) or
    (scope = 'survey'     and survey_id is not null     and department_id is null and employee_id is null)
  );

-- Replace the unique constraint to cover survey_id too.
alter table public.hr_access_grants
  drop constraint if exists hr_access_grants_grantee_id_scope_department_id_employee_id_key;

alter table public.hr_access_grants
  drop constraint if exists hr_access_grants_unique_scope_target;

alter table public.hr_access_grants
  add constraint hr_access_grants_unique_scope_target unique
    (grantee_id, scope, department_id, employee_id, survey_id);

create index if not exists hr_access_grants_survey_idx
  on public.hr_access_grants (survey_id);

-- =============================================================================
-- 3. Backfill module grants for existing HR users
-- =============================================================================
--
-- Anyone who currently has any hr_access_grants row — including the
-- legacy scope='all' / 'department' / 'employee' grants — keeps full
-- module access so this migration is non-breaking. New users created
-- after this migration must be granted modules explicitly.

insert into public.hr_module_grants (grantee_id, module)
select distinct g.grantee_id, m.module
from public.hr_access_grants g
cross join (values
  ('people'::public.hr_module),
  ('hiring'::public.hr_module),
  ('surveys'::public.hr_module),
  ('policies'::public.hr_module),
  ('procedures'::public.hr_module)
) as m(module)
on conflict (grantee_id, module) do nothing;

-- =============================================================================
-- 4. Soft-delete column on survey responses
-- =============================================================================

alter table public.hr_survey_responses
  add column if not exists deleted_at timestamptz;

alter table public.hr_survey_responses
  add column if not exists deleted_by uuid references public.profiles (id) on delete set null;

create index if not exists hr_survey_responses_active_idx
  on public.hr_survey_responses (survey_id, submitted_at desc)
  where deleted_at is null;

-- =============================================================================
-- 5. Helper functions
-- =============================================================================

-- Drop and recreate so signature/return updates apply cleanly.
drop function if exists public.user_has_hr_module_access(uuid, public.hr_module);

create or replace function public.user_has_hr_module_access(
  p_user_id uuid,
  p_module  public.hr_module
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.profiles
      where id = p_user_id and role = 'super_admin'
    )
    or exists (
      select 1 from public.hr_module_grants
      where grantee_id = p_user_id and module = p_module
    );
$$;

comment on function public.user_has_hr_module_access(uuid, public.hr_module) is
  'Returns true if the user has access to the given HR module (super_admin always passes).';

-- Survey access: super_admin, surveys-module grant, or specific survey grant.
drop function if exists public.user_has_hr_survey_access(uuid, uuid);

create or replace function public.user_has_hr_survey_access(
  p_user_id   uuid,
  p_survey_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.profiles
      where id = p_user_id and role = 'super_admin'
    )
    or exists (
      select 1 from public.hr_module_grants
      where grantee_id = p_user_id and module = 'surveys'
    )
    or exists (
      select 1 from public.hr_access_grants
      where grantee_id = p_user_id and scope = 'survey' and survey_id = p_survey_id
    );
$$;

comment on function public.user_has_hr_survey_access(uuid, uuid) is
  'Returns true if the given user can view/manage the given HR survey. Super admins always pass; otherwise requires module=surveys grant or scope=survey grant.';

-- Update the "any HR access?" helper so a survey-only grant still surfaces the HR sidebar.
create or replace function public.user_has_any_hr_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.profiles
      where id = p_user_id and role = 'super_admin'
    )
    or exists (
      select 1 from public.hr_access_grants
      where grantee_id = p_user_id
    )
    or exists (
      select 1 from public.hr_module_grants
      where grantee_id = p_user_id
    );
$$;
