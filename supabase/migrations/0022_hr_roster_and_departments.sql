-- Haven OS — HR roster + department reorganization (0022)
--
-- Goals:
--   1. Adopt the new four-department layout for the team:
--        Maintenance and Field Ops
--        Guest Experience
--        Owner Relations
--        General Operations
--      Old generic departments seeded by 0016 are archived (not deleted) so
--      any existing department_id references stay valid.
--   2. Seed the current employee roster (Maintenance, Guest Experience,
--      Owner Relations, General Operations) idempotently. Re-running the
--      migration must not duplicate rows.
--   3. Add a profile_id link on hr_employees so an HR person file can
--      optionally be tied back to a Haven OS user account.
--
-- Run AFTER 0021_hr_survey_question_archive.sql.

-- ---------------------------------------------------------------------------
-- 1. Schema additions
-- ---------------------------------------------------------------------------

alter table public.hr_employees
  add column if not exists profile_id uuid
    references public.profiles (id) on delete set null;

create index if not exists hr_employees_profile_id_idx
  on public.hr_employees (profile_id);

create index if not exists hr_employees_full_name_idx
  on public.hr_employees (lower(full_name));

-- ---------------------------------------------------------------------------
-- 2. Departments — archive legacy, upsert new ones
-- ---------------------------------------------------------------------------
-- 0016 seeded a long list of generic departments. The team has settled on
-- four canonical departments. Archive everything that isn't in the new list
-- so that:
--   * Existing access grants/employee links keep working
--   * Only the four canonical departments show up in active filters
-- Stable slugs let us re-run safely.

insert into public.departments (name, slug, sort_order, archived) values
  ('Maintenance and Field Ops', 'maintenance_field_ops', 10, false),
  ('Guest Experience',          'guest_experience',      20, false),
  ('Owner Relations',           'owner_relations',       30, false),
  ('General Operations',        'general_operations',    40, false)
on conflict (slug) do update set
  name       = excluded.name,
  sort_order = excluded.sort_order,
  archived   = false;

-- Archive all other (non-canonical) departments.
update public.departments
set archived = true
where slug not in (
  'maintenance_field_ops',
  'guest_experience',
  'owner_relations',
  'general_operations'
);

-- ---------------------------------------------------------------------------
-- 3. Roster seed
-- ---------------------------------------------------------------------------
-- Idempotency strategy: hr_employees doesn't have a unique key on full_name,
-- so we de-duplicate by (lower(full_name)) within a department-aware upsert.
-- We use a one-shot DO block so this is read/check/insert per row.

do $$
declare
  d_maintenance uuid;
  d_guest       uuid;
  d_owner       uuid;
  d_general     uuid;
  rec           record;
begin
  select id into d_maintenance from public.departments where slug = 'maintenance_field_ops';
  select id into d_guest       from public.departments where slug = 'guest_experience';
  select id into d_owner       from public.departments where slug = 'owner_relations';
  select id into d_general     from public.departments where slug = 'general_operations';

  for rec in
    select * from (values
      -- Maintenance and Field Ops
      ('Christian Martin',     'Maintenance Technician',  d_maintenance),
      ('Jon Stennes',          'Maintenance Technician',  d_maintenance),
      ('Cooper Collins',       'Maintenance Technician',  d_maintenance),
      ('Reed Ensminger',       'Maintenance Technician',  d_maintenance),
      ('Isaac Hurst',          'Maintenance Technician',  d_maintenance),
      ('Michael Martin',       'Maintenance Technician',  d_maintenance),
      ('Justus Sowell',        'Maintenance Technician',  d_maintenance),
      ('Nate Jones',           'Maintenance Technician',  d_maintenance),
      ('Bladen Keller',        'Maintenance Technician',  d_maintenance),
      ('Christian Daughters',  'Maintenance Technician',  d_maintenance),
      ('Lance Treece',         'Onboarding / Field Tech', d_maintenance),
      ('James Dones',          'Field Operations',        d_maintenance),

      -- Guest Experience
      ('Regine Ruales',          'Dispatcher',                  d_guest),
      ('Contesa Catuaan',        'Dispatcher / Tendwell Ops',   d_guest),
      ('Nina Ocampo',            'Dispatcher / Tendwell Ops',   d_guest),
      ('Christine Tupas',        'Guest Messaging',             d_guest),
      ('Irene Montojo',          'Guest Messaging',             d_guest),
      ('Kimberly Ibañez-Puntero','Guest Messaging',             d_guest),
      ('Czarina Guia',           'Guest Messaging',             d_guest),
      ('Dara Tejada',            'Guest Messaging',             d_guest),
      ('Kristine Joy Bugna',     'Guest Messaging',             d_guest),
      ('Renee Cofreros',         'Guest Messaging',             d_guest),
      ('Issa Diakite',           'Guest Messaging',             d_guest),
      ('Angeline Cortez',        'Guest Messaging',             d_guest),
      ('Noeline Ramos',          'Guest Messaging',             d_guest),
      ('Jonamel Leona',          'Guest Messaging',             d_guest),
      ('Pierce Reyes',           'Guest Messaging',             d_guest),
      ('Tanya Desalisa',         'Guest Messaging',             d_guest),
      ('Abigail Villapando',     'Guest Messaging',             d_guest),
      ('Camille Erese',          'Guest Messaging',             d_guest),
      ('Vanessa Savellano',      'Guest Messaging',             d_guest),

      -- Owner Relations
      ('Summer Mathews',         'Owner Relations Manager',     d_owner),
      ('Lily Bryant Macon',      'Owner Relations',             d_owner),
      ('Katie Work',             'Owner Relations',             d_owner),
      ('Regina Shrout',          'Owner Relations',             d_owner),
      ('Andy Price',             'Sales & Onboarding',          d_owner),
      ('Ailyn Regidor',          'Account Manager (AAM)',       d_owner),
      ('Berna Thea Cruz-Magat',  'Account Manager (AAM)',       d_owner),
      ('Yen Maghirang',          'Account Manager (AAM)',       d_owner),

      -- General Operations
      ('Jack Zoppa',             'CEO',                         d_general),
      ('Dylan Robinson',         'General Manager',             d_general),
      ('Jordan Lynde',           'Operations Leadership',       d_general),
      ('Mike Zaczyk',            'Operations Admin',            d_general),
      ('Dennis Rimshaw',         'Sales',                       d_general),
      ('Jonathan Francisco III', 'Operations Admin',            d_general),
      ('Kevin Ajit',             'Guest Messaging',             d_general),
      ('Ben Lynde',              'Tendwell Inspector',          d_general),
      ('Tiffany Kaye Marinduque','Operations Admin',            d_general),
      ('Justin Caperal',         'Onboarding',                  d_general),
      ('Blake Hunley',           'Sales',                       d_general)
    ) as t(full_name, role_title, department_id)
  loop
    -- If a row with this (case-insensitive) name already exists, update its
    -- title/department/active status; otherwise insert a fresh row.
    if exists (
      select 1 from public.hr_employees
      where lower(full_name) = lower(rec.full_name)
    ) then
      update public.hr_employees
      set role_title    = rec.role_title,
          department_id = rec.department_id,
          status        = case when status = 'terminated' then status else 'active' end
      where lower(full_name) = lower(rec.full_name);
    else
      insert into public.hr_employees (full_name, role_title, department_id, status)
      values (rec.full_name, rec.role_title, rec.department_id, 'active');
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Best-effort: link Jack's hr_employees row to his profile so the people
--    file shows the connected user account immediately.
-- ---------------------------------------------------------------------------

update public.hr_employees e
set profile_id = p.id
from public.profiles p
where e.profile_id is null
  and lower(e.full_name) = 'jack zoppa'
  and (lower(p.email) = 'jack@havenvacationrentals.com'
       or lower(p.email) = 'jack13zoppa@gmail.com');
