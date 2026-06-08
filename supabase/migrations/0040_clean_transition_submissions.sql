-- Haven OS — Clean transition property submissions
--
-- Captures new-property cleaning transition requests with old/new pricing
-- and a lightweight approval workflow.

do $$ begin
  create type clean_transition_status as enum ('pending', 'needs_info', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create or replace function public.is_admin_or_above(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role in ('admin', 'super_admin')
  );
$$;

create table if not exists public.clean_transition_submissions (
  id uuid primary key default gen_random_uuid(),

  property_name text not null,
  address text,
  owner_name text,
  submitted_by_name text,
  cleaning_contact text,
  transition_date date,

  old_price numeric(10,2) not null check (old_price >= 0),
  new_price numeric(10,2) not null check (new_price >= 0),
  price_delta numeric(10,2) generated always as (new_price - old_price) stored,
  price_delta_pct numeric(8,2) generated always as (
    case
      when old_price = 0 then null
      else round(((new_price - old_price) / old_price) * 100, 2)
    end
  ) stored,

  notes text,
  status clean_transition_status not null default 'pending',
  review_note text,

  submitted_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clean_transition_submissions_status_idx
  on public.clean_transition_submissions(status);
create index if not exists clean_transition_submissions_created_at_idx
  on public.clean_transition_submissions(created_at desc);
create index if not exists clean_transition_submissions_transition_date_idx
  on public.clean_transition_submissions(transition_date);

drop trigger if exists trg_clean_transition_submissions_set_updated_at
  on public.clean_transition_submissions;
create trigger trg_clean_transition_submissions_set_updated_at
  before update on public.clean_transition_submissions
  for each row execute function public.tg_set_updated_at();

alter table public.clean_transition_submissions enable row level security;

drop policy if exists "clean transitions read signed in"
  on public.clean_transition_submissions;
create policy "clean transitions read signed in"
  on public.clean_transition_submissions
  for select
  using (auth.uid() is not null);

drop policy if exists "clean transitions insert signed in"
  on public.clean_transition_submissions;
create policy "clean transitions insert signed in"
  on public.clean_transition_submissions
  for insert
  with check (auth.uid() is not null and submitted_by = auth.uid());

drop policy if exists "clean transitions update admin"
  on public.clean_transition_submissions;
create policy "clean transitions update admin"
  on public.clean_transition_submissions
  for update
  using (public.is_admin_or_above(auth.uid()))
  with check (public.is_admin_or_above(auth.uid()));

comment on table public.clean_transition_submissions is
  'New-property cleaning transition submissions with old/new price approval status.';
