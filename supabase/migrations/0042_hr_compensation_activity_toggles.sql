-- 0042_hr_compensation_activity_toggles.sql
-- Allow each sales compensation form to accept booked meetings, closed deals,
-- or both.

alter table public.hr_compensation_forms
  add column if not exists allow_booked_meetings boolean not null default true,
  add column if not exists allow_closed_deals boolean not null default true;
