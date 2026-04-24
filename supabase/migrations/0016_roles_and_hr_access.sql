-- Haven OS — Permissions system (0016)
--
-- Adds three-tier global roles (user / admin / super_admin) and
-- granular HR access grants scoped to departments or specific employees.
--
-- Run AFTER 0015_onboarding.sql.
--
-- Design:
--   * profiles.role enum column defaults to 'user'.
--   * Every email currently in hr_admins is promoted to super_admin.
--   * A locked-list `departments` table replaces free-text department.
--     hr_employees.department_id FK backfills the existing text column.
--   * hr_access_grants: per-user grants, scope = 'all' | 'department'
--     | 'employee'. Super admins bypass this entirely (they see everything).
--
-- Defence-in-depth: server actions enforce permissions today. RLS stays
-- authenticated-wide for now; a future migration will tighten it.

-- ---------------------------------------------------------------------------
-- 1. Global role enum on profiles
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (select 1 from pg_type where typname = 'haven_user_role') then
    create type public.haven_user_role as enum ('user', 'admin', 'super_admin');
  end if;
end $$;

alter table public.profiles
  add column if not exists role public.haven_user_role not null default 'user';

-- Backfill: every current hr_admins email → super_admin
update public.profiles p
set role = 'super_admin'
from public.hr_admins a
where lower(p.email) = lower(a.email)
  and p.role <> 'super_admin';

-- ---------------------------------------------------------------------------
-- 2. Departments (locked list)
-- ---------------------------------------------------------------------------

create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  sort_order  int not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.departments enable row level security;

drop policy if exists "auth_read" on public.departments;
create policy "auth_read" on public.departments
  for select to authenticated using (true);

drop policy if exists "auth_write" on public.departments;
create policy "auth_write" on public.departments
  for all to authenticated using (true) with check (true);

drop trigger if exists tg_departments_updated_at on public.departments;
create trigger tg_departments_updated_at
  before update on public.departments
  for each row execute function public.tg_set_updated_at();

-- Seed a reasonable default list.
insert into public.departments (name, slug, sort_order) values
  ('Operations',      'operations',      10),
  ('Cleaning',        'cleaning',        20),
  ('Maintenance',     'maintenance',     30),
  ('Guest Relations', 'guest_relations', 40),
  ('Revenue',         'revenue',         50),
  ('Sales',           'sales',           60),
  ('Finance',         'finance',         70),
  ('Onboarding',      'onboarding',      80),
  ('Leadership',      'leadership',      90),
  ('IT / Tech',       'it_tech',         100)
on conflict (slug) do nothing;

-- Link hr_employees to departments. Keep the existing text column around
-- for now (backfill reference); new writes should use department_id.
alter table public.hr_employees
  add column if not exists department_id uuid references public.departments (id) on delete set null;

-- Best-effort backfill of department_id from the existing free-text column.
-- Case-insensitive match on name.
update public.hr_employees e
set department_id = d.id
from public.departments d
where e.department_id is null
  and e.department is not null
  and lower(trim(e.department)) = lower(d.name);

create index if not exists hr_employees_department_id_idx
  on public.hr_employees (department_id);

-- ---------------------------------------------------------------------------
-- 3. HR access grants
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (select 1 from pg_type where typname = 'hr_grant_scope') then
    create type public.hr_grant_scope as enum ('all', 'department', 'employee');
  end if;
end $$;

create table if not exists public.hr_access_grants (
  id              uuid primary key default gen_random_uuid(),
  grantee_id      uuid not null references public.profiles (id) on delete cascade,
  scope           public.hr_grant_scope not null,
  department_id   uuid references public.departments (id) on delete cascade,
  employee_id     uuid references public.hr_employees (id) on delete cascade,
  granted_by      uuid references public.profiles (id) on delete set null,
  note            text,
  created_at      timestamptz not null default now(),
  -- exactly one target per scope type
  check (
    (scope = 'all'        and department_id is null and employee_id is null) or
    (scope = 'department' and department_id is not null and employee_id is null) or
    (scope = 'employee'   and employee_id is not null   and department_id is null)
  ),
  -- no duplicate grants
  unique (grantee_id, scope, department_id, employee_id)
);

alter table public.hr_access_grants enable row level security;

drop policy if exists "auth_read" on public.hr_access_grants;
create policy "auth_read" on public.hr_access_grants
  for select to authenticated using (true);

drop policy if exists "auth_write" on public.hr_access_grants;
create policy "auth_write" on public.hr_access_grants
  for all to authenticated using (true) with check (true);

create index if not exists hr_access_grants_grantee_idx
  on public.hr_access_grants (grantee_id);
create index if not exists hr_access_grants_dept_idx
  on public.hr_access_grants (department_id);
create index if not exists hr_access_grants_employee_idx
  on public.hr_access_grants (employee_id);

-- ---------------------------------------------------------------------------
-- 4. Helper SQL function for "can this user see this employee?"
-- ---------------------------------------------------------------------------
--
-- Returns true if:
--   * user is super_admin (sees everything), OR
--   * user has a 'all' grant, OR
--   * user has a 'department' grant matching the employee's department, OR
--   * user has an 'employee' grant matching the employee's id.
--
-- Note: per product decision, self-view is NOT automatic; users must be
-- granted access even to their own record.

create or replace function public.user_has_hr_access_to_employee(
  p_user_id uuid,
  p_employee_id uuid
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
      select 1 from public.hr_access_grants
      where grantee_id = p_user_id and scope = 'all'
    )
    or exists (
      select 1
      from public.hr_access_grants g
      join public.hr_employees e on e.department_id = g.department_id
      where g.grantee_id = p_user_id
        and g.scope = 'department'
        and e.id = p_employee_id
    )
    or exists (
      select 1 from public.hr_access_grants
      where grantee_id = p_user_id
        and scope = 'employee'
        and employee_id = p_employee_id
    );
$$;

comment on function public.user_has_hr_access_to_employee(uuid, uuid) is
  'Returns true if the given user can access the given HR employee record. Super admins always pass; otherwise requires matching grant.';

-- ---------------------------------------------------------------------------
-- 5. Helper: does user have ANY HR access? (used to decide whether to show
--    the HR section of the sidebar)
-- ---------------------------------------------------------------------------

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
    );
$$;

comment on function public.user_has_any_hr_access(uuid) is
  'Returns true if the user has any HR access at all (super_admin or any grant).';
