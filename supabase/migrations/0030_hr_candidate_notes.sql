-- Haven OS — HR Hiring: candidate notes/comments
-- Adds a chronological notes/comments thread on each candidate.
-- The pre-existing `hr_candidates.notes` text column is a single shared
-- scratchpad. This table stores discrete, authored notes added by HR
-- after a candidate applies, with author + timestamp.
-- Run AFTER 0014_hr.sql.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.hr_candidate_notes (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.hr_candidates(id) on delete cascade,
  author_id     uuid references auth.users(id) on delete set null,
  author_email  text,
  author_name   text,
  body          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_candidate_notes_candidate_idx
  on public.hr_candidate_notes(candidate_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuse the HR helper from 0014_hr.sql)
-- ---------------------------------------------------------------------------

drop trigger if exists set_updated_at on public.hr_candidate_notes;
create trigger set_updated_at
  before update on public.hr_candidate_notes
  for each row execute function public.tg_hr_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — match the rest of HR: authenticated read/write, action guards in
-- server code (requireHrAdmin) do the real gating.
-- ---------------------------------------------------------------------------

alter table public.hr_candidate_notes enable row level security;

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'hr_candidate_notes'
  loop
    execute format('drop policy %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end;
$$;

create policy "auth_read"  on public.hr_candidate_notes for select to authenticated using (true);
create policy "auth_write" on public.hr_candidate_notes for all    to authenticated using (true) with check (true);
