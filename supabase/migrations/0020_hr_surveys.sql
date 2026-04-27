-- 0020_hr_surveys.sql
-- Haven OS — HR Surveys.
--
-- HR can author flexible per-survey forms (any mix of question types) and
-- share a public landing page where the team submits responses. Responses
-- flow back into the HR space tied to that survey for tracking + summaries.
--
-- Tables:
--   hr_surveys             — survey shell (title, instructions, status, slug)
--   hr_survey_questions    — per-survey questions (typed, ordered, optional config)
--   hr_survey_responses    — one row per submission
--   hr_survey_answers      — one row per question per submission (flexible value cols)
--
-- RLS:
--   * Authenticated reads/writes are gated by server actions (requireHr).
--   * Anonymous SELECT on hr_surveys + hr_survey_questions is allowed for
--     status='active' rows so the public /survey/[slug] page can render.
--   * Anonymous INSERT into hr_survey_responses + hr_survey_answers is
--     allowed for active surveys (defence-in-depth in server action too).

-- =============================================================================
-- TABLES
-- =============================================================================

create table if not exists public.hr_surveys (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  description   text default '',
  instructions  text default '',
  status        text not null default 'draft',  -- draft | active | closed
  -- Audience / response settings
  anonymous_allowed   boolean not null default true,
  collect_name        boolean not null default true,
  collect_email       boolean not null default true,
  collect_department  boolean not null default true,
  audience            text default 'team',          -- free-form label, e.g. 'team', 'cleaners'
  -- Lifecycle
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  closes_at     timestamptz
);

create index if not exists hr_surveys_status_idx
  on public.hr_surveys(status, updated_at desc);

create table if not exists public.hr_survey_questions (
  id            uuid primary key default gen_random_uuid(),
  survey_id     uuid not null references public.hr_surveys(id) on delete cascade,
  position      integer not null default 0,
  question_type text not null,        -- short_text | long_text | single_choice | multi_choice | rating | yes_no
  prompt        text not null,
  help_text     text default '',
  required      boolean not null default false,
  config        jsonb not null default '{}'::jsonb,  -- { options:[...], scale_min, scale_max, scale_label_low, scale_label_high }
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_survey_questions_survey_idx
  on public.hr_survey_questions(survey_id, position);

create table if not exists public.hr_survey_responses (
  id              uuid primary key default gen_random_uuid(),
  survey_id       uuid not null references public.hr_surveys(id) on delete cascade,
  submitted_at    timestamptz not null default now(),
  respondent_name       text,
  respondent_email      text,
  respondent_department text,
  is_anonymous          boolean not null default false,
  user_agent      text,
  -- IP/etc deliberately omitted for privacy; can add later if needed
  created_at      timestamptz not null default now()
);

create index if not exists hr_survey_responses_survey_idx
  on public.hr_survey_responses(survey_id, submitted_at desc);

create table if not exists public.hr_survey_answers (
  id            uuid primary key default gen_random_uuid(),
  response_id   uuid not null references public.hr_survey_responses(id) on delete cascade,
  question_id   uuid not null references public.hr_survey_questions(id) on delete cascade,
  -- Flexible value storage. We use multiple typed columns rather than one
  -- jsonb so simple aggregates (avg rating, choice counts) are easy.
  value_text    text,                 -- short_text | long_text
  value_choice  text,                 -- single_choice value | yes_no ('yes'/'no')
  value_choices text[],               -- multi_choice values
  value_number  numeric,              -- rating
  created_at    timestamptz not null default now()
);

create index if not exists hr_survey_answers_response_idx
  on public.hr_survey_answers(response_id);
create index if not exists hr_survey_answers_question_idx
  on public.hr_survey_answers(question_id);

-- =============================================================================
-- updated_at triggers (reuse the HR helper if present, else define a fallback)
-- =============================================================================

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
    select unnest(array['hr_surveys', 'hr_survey_questions'])
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at
         before update on public.%I
         for each row execute function public.tg_hr_set_updated_at();', t);
  end loop;
end;
$$;

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================

alter table public.hr_surveys           enable row level security;
alter table public.hr_survey_questions  enable row level security;
alter table public.hr_survey_responses  enable row level security;
alter table public.hr_survey_answers    enable row level security;

-- Idempotent reset of policies
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'hr_surveys','hr_survey_questions','hr_survey_responses','hr_survey_answers'
      )
  loop
    execute format('drop policy %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end;
$$;

-- Authenticated read/write — actual gating is enforced in server actions
-- (requireHr / requireHrAccess). Mirrors the existing HR pattern.
create policy "auth_read"  on public.hr_surveys           for select to authenticated using (true);
create policy "auth_write" on public.hr_surveys           for all    to authenticated using (true) with check (true);

create policy "auth_read"  on public.hr_survey_questions  for select to authenticated using (true);
create policy "auth_write" on public.hr_survey_questions  for all    to authenticated using (true) with check (true);

create policy "auth_read"  on public.hr_survey_responses  for select to authenticated using (true);
create policy "auth_write" on public.hr_survey_responses  for all    to authenticated using (true) with check (true);

create policy "auth_read"  on public.hr_survey_answers    for select to authenticated using (true);
create policy "auth_write" on public.hr_survey_answers    for all    to authenticated using (true) with check (true);

-- Public landing page support:
-- 1) Anyone (anon) can SELECT active surveys + their questions.
create policy "public_active_survey_read" on public.hr_surveys
  for select to anon using (status = 'active');

create policy "public_active_question_read" on public.hr_survey_questions
  for select to anon using (
    exists (
      select 1 from public.hr_surveys s
      where s.id = hr_survey_questions.survey_id
        and s.status = 'active'
    )
  );

-- 2) Anyone (anon) can INSERT a response + answers, but only against an
-- active survey. (The server action also re-checks for defence-in-depth.)
create policy "public_response_insert" on public.hr_survey_responses
  for insert to anon with check (
    exists (
      select 1 from public.hr_surveys s
      where s.id = hr_survey_responses.survey_id
        and s.status = 'active'
    )
  );

create policy "public_answer_insert" on public.hr_survey_answers
  for insert to anon with check (
    exists (
      select 1
      from public.hr_survey_responses r
      join public.hr_surveys s on s.id = r.survey_id
      where r.id = hr_survey_answers.response_id
        and s.status = 'active'
    )
  );
