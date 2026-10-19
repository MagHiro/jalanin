-- Standalone PostgreSQL (0005): retire Supabase RLS.
--
-- Authorization is enforced exclusively in application code
-- (src/lib/auth/require.ts + ownership checks on every query). The
-- privileged server client connects as the table owner, which bypasses RLS
-- by design, so these policies were a second layer for Supabase-hosted
-- JWT clients that no longer exist. Keeping them would leave
-- auth.uid()-dependent behavior in a database that has no Supabase Auth.
--
-- Safe on both fresh standalone databases and the hosted Supabase source:
-- every statement is conditional and never touches the `auth` schema itself.

-- Drop every policy this project created (0002 + 0003 adjustments).
DO $drop_policies$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN (
        'internships_public_read', 'internships_admin_all',
        'categories_public_read', 'categories_admin_all',
        'profiles_owner_read',
        'applications_student_read', 'applications_admin_all',
        'revisions_owner_read',
        'documents_owner_read',
        'status_events_read',
        'quotations_admin_all',
        'placements_student_read', 'placements_admin_all',
        'admin_notifications_admin',
        'audit_admin_read',
        'contact_admin_read',
        'consent_owner_read',
        'policy_versions_public_read'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$drop_policies$;

-- Drop the helper introduced in 0002/0003 (owned by this project).
DROP FUNCTION IF EXISTS public.is_admin();

-- Disable RLS on application tables: with no policies left, enabled RLS
-- would deny even the table owner on some PostgreSQL paths; explicit
-- application-level authorization is the single enforcement point.
DO $disable_rls$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'admin_users', 'categories', 'internships', 'applications',
    'application_revisions', 'application_documents',
    'application_status_events', 'quotations', 'placements',
    'admin_notifications', 'notification_outbox', 'audit_events',
    'contact_submissions', 'consent_records', 'policy_versions',
    'analytics_events', 'request_rate_limits'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END
$disable_rls$;

-- Remove the local-only auth.uid() stub created by 0002, but ONLY when it is
-- byte-identical to our stub. On hosted Supabase the real auth.uid() has
-- different source text, so this never touches managed Auth.
DO $drop_stub$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
      AND p.prosrc = ' SELECT NULL::UUID '
  ) THEN
    DROP FUNCTION auth.uid();
  END IF;
END
$drop_stub$;
