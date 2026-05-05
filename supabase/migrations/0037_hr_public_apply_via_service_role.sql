-- Haven OS — Lock down public apply path: route writes through service role.
--
-- Background: prior to this migration anon could INSERT directly into
-- hr_candidates (and hr_candidate_answers) so the public /careers/[slug]
-- form could submit without auth. That worked but had two problems:
--
--   1) Anyone could spray rows at hr_candidates straight from anon — the
--      server action couldn't really validate beyond what RLS allowed.
--   2) Subtle RLS drift (e.g. a later migration redefining policies on the
--      table without re-issuing `public_apply_insert`) silently broke the
--      apply form with a "new row violates row-level security policy"
--      error visible only at submit time.
--
-- Fix: public submissions now hit POST /api/public/career-apply, a server
-- route that uses the service-role client (which bypasses RLS) and
-- validates the role is open + custom-question shape before inserting.
-- This migration removes the anon INSERT policies on hr_candidates and
-- hr_candidate_answers — the only path into those tables is now either
-- authenticated HR (existing auth_write policies) or server-side service
-- role (bypasses RLS).
--
-- Anonymous SELECT on hr_roles (status='open') and hr_role_questions
-- (active, parent role open) is unchanged — those are needed to render
-- the public landing page.
--
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- hr_candidates: drop anon INSERT
-- ---------------------------------------------------------------------------
drop policy if exists "public_apply_insert" on public.hr_candidates;

-- ---------------------------------------------------------------------------
-- hr_candidate_answers: drop anon INSERT
-- ---------------------------------------------------------------------------
drop policy if exists "public_candidate_answer_insert"
  on public.hr_candidate_answers;

-- ---------------------------------------------------------------------------
-- Sanity: keep RLS enabled on both tables (no-op if already enabled).
-- Without an anon policy, anon writes are denied; authenticated writes
-- continue to use the existing "auth_write" policies; service-role bypasses
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.hr_candidates         enable row level security;
alter table public.hr_candidate_answers  enable row level security;
