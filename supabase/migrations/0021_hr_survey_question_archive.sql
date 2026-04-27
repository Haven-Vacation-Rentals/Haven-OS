-- 0021_hr_survey_question_archive.sql
-- Soft-archive support for hr_survey_questions so HR can edit live surveys
-- without losing historical answers. The public form and the answer
-- aggregation now hide archived questions, but existing
-- hr_survey_answers rows are preserved.

alter table public.hr_survey_questions
  add column if not exists archived_at timestamptz;

create index if not exists hr_survey_questions_active_idx
  on public.hr_survey_questions(survey_id, position)
  where archived_at is null;

-- Restrict the public read policy so anon visitors only see live questions.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hr_survey_questions'
      and policyname = 'public_active_question_read'
  ) then
    drop policy "public_active_question_read" on public.hr_survey_questions;
  end if;
end;
$$;

create policy "public_active_question_read" on public.hr_survey_questions
  for select to anon using (
    archived_at is null
    and exists (
      select 1 from public.hr_surveys s
      where s.id = hr_survey_questions.survey_id
        and s.status = 'active'
    )
  );
