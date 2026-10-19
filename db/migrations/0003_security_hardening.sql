-- Defense in depth: students use validated server handlers for mutations.
-- Direct Supabase REST writes previously allowed changing lifecycle/review
-- metadata while remaining in an RLS-permitted status (privilege escalation).
-- Leave students read access to their own records, but deny direct writes.
DROP POLICY IF EXISTS applications_student_insert ON applications;
DROP POLICY IF EXISTS applications_student_update ON applications;
DROP POLICY IF EXISTS applications_student_update_submitted ON applications;
DROP POLICY IF EXISTS profiles_owner_write ON profiles;
DROP POLICY IF EXISTS profiles_owner_update ON profiles;

-- Prevent SECURITY DEFINER function lookup through attacker-controlled schemas.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $jalanin_fn$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND active IS TRUE
  );
$jalanin_fn$;

-- A CV is a single active attachment per application. The server atomically
-- swaps the metadata and queues re-review before deleting the old object.
CREATE UNIQUE INDEX IF NOT EXISTS application_documents_one_cv_uq
ON application_documents (application_id) WHERE document_type = 'cv';

-- Revision metadata must never report reviewing a future revision.
ALTER TABLE applications
  ADD CONSTRAINT application_reviewed_revision_ck
  CHECK (reviewed_revision <= revision);
