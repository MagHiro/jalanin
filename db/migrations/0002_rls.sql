-- Row Level Security (0002). Supabase Auth JWTs carry auth.uid().
-- NOTE: the privileged Drizzle server client (service-role / direct
-- DATABASE_URL) bypasses RLS by design. RLS is the second layer for
-- user-scoped Supabase clients; the first layer is explicit server-side
-- authorization in src/lib/auth/require.ts, enforced on every mutation.

-- Helper: single admin role (D19).
-- Local plain-PostgreSQL parity: hosted Supabase provides auth.uid(); a local
-- Docker database does not. Create a stub ONLY when the real one is absent
-- (the IF guard never touches hosted Supabase). The stub returns NULL, so
-- local direct-client access is denied by default; the privileged server
-- client bypasses RLS and enforces authorization in application code.
DO $stub$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE FUNCTION auth.uid() RETURNS UUID
    LANGUAGE sql STABLE AS $fn$ SELECT NULL::UUID $fn$;
  END IF;
END
$stub$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND active IS TRUE
  );
$$;

-- ---------------------------------------------------------------- internships
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY internships_public_read ON internships
  FOR SELECT USING (publication_status = 'Published');

CREATE POLICY internships_admin_all ON internships
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_public_read ON categories
  FOR SELECT USING (active IS TRUE OR is_admin());

CREATE POLICY categories_admin_all ON categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_owner_read ON profiles
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY profiles_owner_write ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_owner_update ON profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------- applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Students read only their own rows.
CREATE POLICY applications_student_read ON applications
  FOR SELECT USING (applicant_user_id = auth.uid() OR is_admin());

-- Students insert only their own draft rows.
CREATE POLICY applications_student_insert ON applications
  FOR INSERT WITH CHECK (applicant_user_id = auth.uid() AND is_draft IS TRUE);

-- Students update own rows only while New/In Review and not re-review locked.
-- The full edit-lock state machine (D14: Quotation Sent+ hard lock) is
-- enforced server-side in src/features/applications/service.ts; this policy
-- is the database backstop for direct Supabase-client writes.
CREATE POLICY applications_student_update ON applications
  FOR UPDATE USING (
    applicant_user_id = auth.uid()
    AND is_draft IS TRUE
  ) WITH CHECK (
    applicant_user_id = auth.uid()
  );

CREATE POLICY applications_student_update_submitted ON applications
  FOR UPDATE USING (
    applicant_user_id = auth.uid()
    AND is_draft IS FALSE
    AND lifecycle_status IN ('New', 'In Review')
  ) WITH CHECK (
    applicant_user_id = auth.uid()
    AND is_draft IS FALSE
    AND lifecycle_status IN ('New', 'In Review')
  );

CREATE POLICY applications_admin_all ON applications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------- revisions
ALTER TABLE application_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY revisions_owner_read ON application_revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_revisions.application_id
        AND (a.applicant_user_id = auth.uid() OR is_admin())
    )
  );

-- No direct student/admin writes: server inserts revision rows transactionally.
-- Admins read via the same owner policy through is_admin().

-- ---------------------------------------------------------------- documents
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Students may read metadata of their own documents; download authorization
-- (signed URLs) is server-side. Direct download denied by default (B05).
CREATE POLICY documents_owner_read ON application_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_documents.application_id
        AND (a.applicant_user_id = auth.uid() OR is_admin())
    )
  );

-- ---------------------------------------------------------------- status events
ALTER TABLE application_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY status_events_read ON application_status_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_status_events.application_id
        AND (a.applicant_user_id = auth.uid() OR is_admin())
    )
  );

-- ---------------------------------------------------------------- quotations
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Student dashboard shows quotation *status* only; amounts/terms arrive by
-- email (D03/D04). No student read access by default.
CREATE POLICY quotations_admin_all ON quotations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------- placements
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY placements_student_read ON placements
  FOR SELECT USING (student_user_id = auth.uid() OR is_admin());

CREATE POLICY placements_admin_all ON placements
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------- admin-only
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_notifications_admin ON admin_notifications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
-- No client access: dispatcher uses the privileged server client.

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_admin_read ON audit_events
  FOR SELECT USING (is_admin());

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_admin_read ON contact_submissions
  FOR SELECT USING (is_admin());
-- Public inserts go through the server route (Turnstile + rate limit), which
-- uses the privileged client. No direct anon INSERT grant.

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY consent_owner_read ON consent_records
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_versions_public_read ON policy_versions
  FOR SELECT USING (true);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- No client access: provisioning is server-side only (D19).

-- ---------------------------------------------------------------- storage
-- Private bucket `documents`. No public access. Server uploads/downloads with
-- the service-role client after authorization; admin CV downloads additionally
-- use short-lived signed URLs (see src/lib/storage/). Applied on Supabase
-- projects via storage API / dashboard; documented here for parity:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('documents', 'documents', false)
--   ON CONFLICT (id) DO NOTHING;
--
--   CREATE POLICY "service-role full access" ON storage.objects
--     FOR ALL USING (auth.role() = 'service_role')
--     WITH CHECK (auth.role() = 'service_role');
--
-- Local dev uses the filesystem backend (STORAGE_BACKEND=local); the
-- Supabase backend targets this bucket in staging/production.
