-- Haven OS — HR candidate resume attachment fields + storage bucket
--
-- Adds columns to public.hr_candidates so candidates can have an uploaded
-- resume file (PDF/DOC/DOCX) tracked alongside (or instead of) the legacy
-- free-form resume_url field. resume_url is preserved for back-compat with
-- existing rows; new submissions populate the *_path / *_name / *_mime /
-- *_size columns.
--
-- A private Supabase Storage bucket "hr-resumes" is also provisioned with
-- file-size and mime-type guards. Public applicants upload via a server-side
-- API route that uses the service-role client; HR users open files via
-- short-lived signed URLs minted server-side. The bucket itself remains
-- private (no public bucket access).
--
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.hr_candidates
  add column if not exists resume_path text,
  add column if not exists resume_filename text,
  add column if not exists resume_mime text,
  add column if not exists resume_size bigint;

-- Helpful for HR detail loads / cleanup tooling. Tiny index, fine to skip if
-- the table grows huge — currently scoped to one role at a time.
create index if not exists hr_candidates_resume_path_idx
  on public.hr_candidates(resume_path)
  where resume_path is not null;

-- ---------------------------------------------------------------------------
-- Storage bucket: hr-resumes (private)
-- ---------------------------------------------------------------------------
-- 10 MB max per file. We restrict mime types to PDF/DOC/DOCX up front; the
-- API route also validates and the form is labelled accordingly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hr-resumes',
  'hr-resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      public            = excluded.public,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- RLS policies for storage.objects (hr-resumes bucket)
-- ---------------------------------------------------------------------------
-- Strategy: the public apply form uploads via a service-role API route, and
-- HR reads via signed URLs minted server-side. So storage.objects only needs
-- a permissive policy for authenticated HR users (mostly future-proofing —
-- service-role bypasses RLS anyway). No anon policies — anonymous uploads
-- happen exclusively through the server-side route, never directly.

drop policy if exists "hr-resumes read auth" on storage.objects;
create policy "hr-resumes read auth"
  on storage.objects for select
  using (
    bucket_id = 'hr-resumes'
    and auth.uid() is not null
  );

drop policy if exists "hr-resumes delete auth" on storage.objects;
create policy "hr-resumes delete auth"
  on storage.objects for delete
  using (
    bucket_id = 'hr-resumes'
    and auth.uid() is not null
  );
