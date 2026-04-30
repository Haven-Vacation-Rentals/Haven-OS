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
--
-- Note on Supabase SQL Editor compatibility:
--   The Supabase SQL Editor wraps each script in a single transaction.
--   PostgreSQL forbids using a newly-added enum value in the SAME
--   transaction that added it (error 55P04 "unsafe use of new value"). To
--   stay safe, this migration converts hr_access_grants.scope from the
--   hr_grant_scope enum to a plain text column with a CHECK constraint
--   that enumerates the allowed values. Existing rows ('all', 'department',
--   'employee') are preserved verbatim by the implicit enum-to-text cast.
--   The hr_grant_scope enum type is kept around (still referenced only by
--   migration history) to avoid breaking any rollback tooling.

-- 2a. Add the new survey_id column up front so the new CHECK constraint can reference it.
alter table public.hr_access_grants
  add column if not exists survey_id uuid references public.hr_surveys (id) on delete cascade;

-- 2b. Drop the original CHECK constraint (auto-named in 0016 via inline `check (...)`).
--     The constraint name is deterministic because Postgres assigns
--     <table>_check for the first unnamed table-level CHECK.
alter table public.hr_access_grants
  drop constraint if exists hr_access_grants_check;

-- Defensive: also drop the named variant in case the migration is being
-- re-run after a partial failure on a database that already renamed it.
alter table public.hr_access_grants
  drop constraint if exists hr_access_grants_scope_target_check;

-- 2c. Convert scope from enum to text. The USING clause preserves all
--     existing values ('all', 'department', 'employee') as their text
--     representation. This sidesteps the 55P04 problem entirely because
--     after this point the column is a free-form text column and we can
--     reference any string literal — including 'survey' — in the same
--     transaction.
do $$ begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'hr_access_grants'
      and column_name  = 'scope'
      and udt_name     = 'hr_grant_scope'
  ) then
    alter table public.hr_access_grants
      alter column scope type text using scope::text;
  end if;
end $$;

-- 2d. Add a CHECK constraint that pins scope to the allowed values. This
--     replaces the type-level guarantee that the enum used to provide.
alter table public.hr_access_grants
  drop constraint if exists hr_access_grants_scope_allowed_check;

alter table public.hr_access_grants
  add constraint hr_access_grants_scope_allowed_check
    check (scope in ('all', 'department', 'employee', 'survey'));

-- 2e. Re-add the scope/target shape check, now including the 'survey' branch.
alter table public.hr_access_grants
  add constraint hr_access_grants_scope_target_check check (
    (scope = 'all'        and department_id is null and employee_id is null and survey_id is null) or
    (scope = 'department' and department_id is not null and employee_id is null and survey_id is null) or
    (scope = 'employee'   and employee_id is not null   and department_id is null and survey_id is null) or
    (scope = 'survey'     and survey_id is not null     and department_id is null and employee_id is null)
  );

-- 2f. Replace the unique constraint to cover survey_id too.
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
