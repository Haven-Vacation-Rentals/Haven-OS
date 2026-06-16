-- 0041_hr_sales_compensation.sql
-- Haven OS — HR sales compensation forms.
--
-- Adds a Compensation HR module with configurable public forms where sales
-- reps can log booked meetings and closed deals. HR can review submissions
-- and track the payout status from the private HR area.

alter type public.hr_module add value if not exists 'compensation';

create table if not exists public.hr_compensation_forms (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique,
  title                    text not null,
  description              text default '',
  status                   text not null default 'draft'
    check (status in ('draft', 'active', 'closed')),
  meeting_payout_amount    numeric(12,2) not null default 0,
  deal_commission_percent  numeric(6,3) not null default 0,
  created_by               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists hr_compensation_forms_status_idx
  on public.hr_compensation_forms (status, updated_at desc);

create table if not exists public.hr_compensation_submissions (
  id                uuid primary key default gen_random_uuid(),
  form_id           uuid not null references public.hr_compensation_forms (id) on delete cascade,
  submitted_at      timestamptz not null default now(),
  rep_name          text not null,
  rep_email         text,
  activity_type     text not null check (activity_type in ('booked_meeting', 'closed_deal')),
  account_name      text not null,
  contact_name      text,
  activity_date     date,
  meeting_datetime  timestamptz,
  deal_value        numeric(12,2),
  payout_amount     numeric(12,2) not null default 0,
  notes             text default '',
  status            text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'rejected')),
  reviewed_by       text,
  reviewed_at       timestamptz,
  user_agent        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists hr_compensation_submissions_form_idx
  on public.hr_compensation_submissions (form_id, submitted_at desc);

create index if not exists hr_compensation_submissions_status_idx
  on public.hr_compensation_submissions (status, submitted_at desc);

do $$
declare
  fn_exists boolean;
begin
  select exists(
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tg_hr_set_updated_at'
  ) into fn_exists;
  if not fn_exists then
    create function public.tg_hr_set_updated_at()
    returns trigger language plpgsql security definer
    set search_path = ''
    as $f$
    begin
      new.updated_at := now();
      return new;
    end;
    $f$;
  end if;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array['hr_compensation_forms', 'hr_compensation_submissions'])
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at
         before update on public.%I
         for each row execute function public.tg_hr_set_updated_at();', t);
  end loop;
end;
$$;

alter table public.hr_compensation_forms enable row level security;
alter table public.hr_compensation_submissions enable row level security;

drop policy if exists "auth_read" on public.hr_compensation_forms;
create policy "auth_read" on public.hr_compensation_forms
  for select to authenticated using (true);

drop policy if exists "auth_write" on public.hr_compensation_forms;
create policy "auth_write" on public.hr_compensation_forms
  for all to authenticated using (true) with check (true);

drop policy if exists "auth_read" on public.hr_compensation_submissions;
create policy "auth_read" on public.hr_compensation_submissions
  for select to authenticated using (true);

drop policy if exists "auth_write" on public.hr_compensation_submissions;
create policy "auth_write" on public.hr_compensation_submissions
  for all to authenticated using (true) with check (true);

drop policy if exists "public_active_compensation_form_read" on public.hr_compensation_forms;
create policy "public_active_compensation_form_read" on public.hr_compensation_forms
  for select to anon using (status = 'active');

drop policy if exists "public_compensation_submission_insert" on public.hr_compensation_submissions;
create policy "public_compensation_submission_insert" on public.hr_compensation_submissions
  for insert to anon with check (
    exists (
      select 1 from public.hr_compensation_forms f
      where f.id = hr_compensation_submissions.form_id
        and f.status = 'active'
    )
  );
