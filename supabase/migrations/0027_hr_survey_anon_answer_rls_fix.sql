-- 0027_hr_survey_anon_answer_rls_fix.sql
-- Fix: anonymous public-form submissions fail at the answer-insert step.
--
-- Root cause:
-- The existing `public_answer_insert` policy on hr_survey_answers checked
-- the parent response via:
--
--   exists (
--     select 1 from public.hr_survey_responses r
--     join public.hr_surveys s on s.id = r.survey_id
--     where r.id = hr_survey_answers.response_id and s.status = 'active'
--   )
--
-- That EXISTS runs under the same anon role. anon has no SELECT policy on
-- hr_survey_responses (only authenticated does), so the subquery returns
-- zero rows, the WITH CHECK fails, and PostgREST returns the answer-insert
-- with a permission-denied error. The parent response row is created, then
-- the answer-insert is rejected, which surfaces in the UI as the friendly
-- "Something went wrong submitting your response. Please try again."
--
-- Fix: drop the response-keyed check and validate via the question's survey
-- instead. anon already has SELECT on hr_survey_questions and hr_surveys
-- (via the public_active_question_read / public_active_survey_read
-- policies), so the existence check can be evaluated under anon's RLS.
--
-- This is a strict tightening + correctness fix. Authenticated HR writes
-- are unaffected (auth_write policy applies first for them).
--
-- We also (idempotently) replace the public_response_insert policy to be
-- explicit: it always referenced hr_surveys, which anon can read, so it
-- was correct — we re-create it here only to keep the public set in one
-- place and survive any re-runs cleanly.
--
-- Tables touched: hr_survey_responses (policy), hr_survey_answers (policy).

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hr_survey_responses'
      and policyname = 'public_response_insert'
  ) then
    drop policy "public_response_insert" on public.hr_survey_responses;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hr_survey_answers'
      and policyname = 'public_answer_insert'
  ) then
    drop policy "public_answer_insert" on public.hr_survey_answers;
  end if;
end;
$$;

create policy "public_response_insert" on public.hr_survey_responses
  for insert to anon with check (
    exists (
      select 1 from public.hr_surveys s
      where s.id = hr_survey_responses.survey_id
        and s.status = 'active'
    )
  );

-- Validate via the question's parent survey instead of the parent response,
-- because anon cannot SELECT from hr_survey_responses (intentional — we
-- never want unauthenticated reads of submitted responses).
create policy "public_answer_insert" on public.hr_survey_answers
  for insert to anon with check (
    exists (
      select 1
      from public.hr_survey_questions q
      join public.hr_surveys s on s.id = q.survey_id
      where q.id = hr_survey_answers.question_id
        and s.status = 'active'
    )
  );
