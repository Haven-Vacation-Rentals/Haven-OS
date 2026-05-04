-- Haven OS — HR Hiring: customizable application questions + Loom video link
-- Lets HR admins author per-role application questions and stores typed answers
-- on each candidate. Adds a `loom_url` column to hr_candidates so applicants
-- can submit a video intro alongside the application.
--
-- Mirrors the survey questions/answers pattern from 0020_hr_surveys.sql:
--   * hr_role_questions: typed/ordered questions, soft-archive support.
--   * hr_candidate_answers: one row per candidate per question, flexible value cols.
--
-- RLS:
--   * Authenticated reads/writes: gated by server actions (requireHrModule('hiring')).
--   * Anonymous SELECT on hr_role_questions where the parent role is open
--     (powers /careers/[slug] custom question rendering).
--   * Anonymous INSERT into hr_candidate_answers (powers public application form);
--     server action validates question belongs to an open role.
--   * loom_url column already public-insertable via the existing
--     "public_apply_insert" policy on hr_candidates.
--
-- Run AFTER 0030_hr_candidate_notes.sql.

-- =============================================================================
-- hr_candidates: optional Loom (or generic video) URL
-- =============================================================================

alter table public.hr_candidates
  add column if not exists loom_url text;

-- =============================================================================
-- hr_role_questions: per-role application questions (typed + ordered)
-- =============================================================================

create table if not exists public.hr_role_questions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references public.hr_roles(id) on delete cascade,
  position      integer not null default 0,
  question_type text not null,
    -- short_text | long_text | url | single_choice | multi_choice | rating | yes_no
  prompt        text not null,
  help_text     text default '',
  required      boolean not null default false,
  config        jsonb not null default '{}'::jsonb,
    -- { options:[...], scale_min, scale_max, scale_label_low, scale_label_high }
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_role_questions_role_idx
  on public.hr_role_questions(role_id, position);

create index if not exists hr_role_questions_active_idx
  on public.hr_role_questions(role_id, position)
  where archived_at is null;

-- =============================================================================
-- hr_candidate_answers: typed answers, one row per candidate per question
-- =============================================================================

create table if not exists public.hr_candidate_answers (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.hr_candidates(id) on delete cascade,
  question_id   uuid not null references public.hr_role_questions(id) on delete cascade,
  value_text    text,
  value_choice  text,
  value_choices text[],
  value_number  numeric,
  created_at    timestamptz not null default now(),
  unique (candidate_id, question_id)
);

create index if not exists hr_candidate_answers_candidate_idx
  on public.hr_candidate_answers(candidate_id);

create index if not exists hr_candidate_answers_question_idx
  on public.hr_candidate_answers(question_id);

-- =============================================================================
-- updated_at trigger (reuse the HR helper from 0014_hr.sql)
-- =============================================================================

drop trigger if exists set_updated_at on public.hr_role_questions;
create trigger set_updated_at
  before update on public.hr_role_questions
  for each row execute function public.tg_hr_set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.hr_role_questions    enable row level security;
alter table public.hr_candidate_answers enable row level security;

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('hr_role_questions', 'hr_candidate_answers')
  loop
    execute format('drop policy %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end;
$$;

-- Authenticated read/write — real gating in server actions (requireHrModule('hiring')).
create policy "auth_read"  on public.hr_role_questions    for select to authenticated using (true);
create policy "auth_write" on public.hr_role_questions    for all    to authenticated using (true) with check (true);

create policy "auth_read"  on public.hr_candidate_answers for select to authenticated using (true);
create policy "auth_write" on public.hr_candidate_answers for all    to authenticated using (true) with check (true);

-- Public read of active (non-archived) questions for open roles only —
-- this is what powers /careers/[slug] custom question rendering.
create policy "public_active_role_questions_read" on public.hr_role_questions
  for select to anon using (
    archived_at is null
    and exists (
      select 1 from public.hr_roles r
      where r.id = hr_role_questions.role_id
        and r.status = 'open'
    )
  );

-- Public insert of candidate answers — server action verifies the candidate
-- was just inserted for an open role, but this DB policy keeps the public
-- apply form working without auth.
create policy "public_candidate_answer_insert" on public.hr_candidate_answers
  for insert to anon with check (true);
