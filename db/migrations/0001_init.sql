-- Jalanin Internship Platform — initial schema (0001).
-- Applies to local Docker PostgreSQL and hosted Supabase PostgreSQL.
-- RLS policies live in 0002_rls.sql. Storage bucket policy documented there.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Minimal student directory. Sensitive per-application data stays on the
-- application snapshot row, never here.
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single admin role (D19). Provisioned via privileged script/SQL only.
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX categories_active_idx ON categories (active);

CREATE TABLE internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  city VARCHAR(120) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  category_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  requirements TEXT NOT NULL,
  publication_status VARCHAR(20) NOT NULL DEFAULT 'Draft'
    CHECK (publication_status IN ('Draft', 'Published', 'Unpublished')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  -- Optional deadline, informational only (B04 pending): never auto-toggles
  -- publication and never blocks submissions until a decision is approved.
  application_deadline TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT internships_dates_ck CHECK (start_date <= end_date)
);
CREATE INDEX internships_pub_idx ON internships (publication_status);
CREATE INDEX internships_country_idx ON internships (country_code);
CREATE INDEX internships_category_idx ON internships (category_id);
CREATE INDEX internships_start_idx ON internships (start_date);
CREATE INDEX internships_search_trgm_idx ON internships
  USING gin ((title || ' ' || city) gin_trgm_ops);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES internships (id) ON DELETE RESTRICT,
  applicant_user_id UUID NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(320) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  university VARCHAR(200) NOT NULL,
  course VARCHAR(200) NOT NULL,
  graduation_year INTEGER NOT NULL CHECK (graduation_year BETWEEN 1950 AND 2100),
  preferred_start DATE NOT NULL,
  preferred_end DATE NOT NULL,
  additional_information TEXT,
  lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'New'
    CHECK (lifecycle_status IN ('New', 'In Review', 'Quotation Sent', 'Accepted', 'Rejected', 'Completed')),
  is_draft BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_at TIMESTAMPTZ,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  reviewed_revision INTEGER NOT NULL DEFAULT 1 CHECK (reviewed_revision >= 1),
  needs_re_review BOOLEAN NOT NULL DEFAULT FALSE,
  reopened_by UUID,
  reopened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT applications_pref_dates_ck CHECK (preferred_start <= preferred_end),
  -- D05/D09: one application per student per internship (drafts included).
  CONSTRAINT applications_student_internship_uq UNIQUE (applicant_user_id, internship_id)
);
CREATE INDEX applications_applicant_idx ON applications (applicant_user_id);
CREATE INDEX applications_internship_idx ON applications (internship_id);
CREATE INDEX applications_status_idx ON applications (lifecycle_status);
CREATE INDEX applications_submitted_idx ON applications (submitted_at);

-- Append-only per-revision audit of student edits (D10). Secrets excluded.
CREATE TABLE application_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision >= 2),
  changed_fields TEXT[] NOT NULL,
  old_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  edited_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT application_revisions_app_rev_uq UNIQUE (application_id, revision)
);
CREATE INDEX application_revisions_app_idx ON application_revisions (application_id);

-- Document metadata only; bytes live in the private storage bucket.
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL DEFAULT 'cv' CHECK (document_type IN ('cv')),
  storage_path TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(127) NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX application_documents_app_idx ON application_documents (application_id);

-- Append-only status transition log.
CREATE TABLE application_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  actor_user_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX status_events_app_time_idx ON application_status_events (application_id, created_at);

-- Money in integer minor units (cents). SGD enforced. No floats. No expiry
-- enforcement (B01): expires_at reserved NULL for a future approved policy.
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'SGD' CHECK (currency = 'SGD'),
  notes_student TEXT NOT NULL,
  notes_internal TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  expires_at TIMESTAMPTZ,
  CONSTRAINT quotations_app_revision_uq UNIQUE (application_id, revision)
);
CREATE INDEX quotations_app_idx ON quotations (application_id);

-- Admin-owned placements (D11/D17). No auto-creation, no auto-completion sync.
CREATE TABLE placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL,
  application_id UUID REFERENCES applications (id) ON DELETE SET NULL,
  organization VARCHAR(200) NOT NULL,
  role VARCHAR(200) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  start_date DATE,
  end_date DATE,
  placement_status VARCHAR(20) NOT NULL DEFAULT 'Preparing'
    CHECK (placement_status IN ('Preparing', 'Confirmed', 'Active', 'Completed', 'Cancelled')),
  notes TEXT,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX placements_student_idx ON placements (student_user_id);

-- Durable admin alerts (D08). Unread counts derive from this table.
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications (id) ON DELETE CASCADE,
  event_key TEXT NOT NULL UNIQUE,
  event_type VARCHAR(40) NOT NULL
    CHECK (event_type IN ('new_application', 'revision_re_review')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX admin_notifications_read_idx ON admin_notifications (is_read, created_at);

-- Idempotent email outbox. event_key UNIQUE gives exactly-once enqueue.
CREATE TABLE notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  recipient VARCHAR(320) NOT NULL,
  template_key VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error TEXT,
  provider_message_id TEXT
);
CREATE INDEX outbox_status_next_idx ON notification_outbox (status, next_attempt_at);

-- Sanitized append-only audit trail. Never credentials/CV bytes/tokens.
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  entity_type VARCHAR(60) NOT NULL,
  entity_id TEXT NOT NULL,
  action VARCHAR(80) NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_events (entity_type, entity_id);

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  origin VARCHAR(40) NOT NULL DEFAULT 'contact-form',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX contact_created_idx ON contact_submissions (created_at);

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  application_id UUID REFERENCES applications (id) ON DELETE SET NULL,
  policy_type VARCHAR(20) NOT NULL,
  policy_version VARCHAR(20) NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE policy_versions (
  policy_type VARCHAR(20) NOT NULL,
  version VARCHAR(20) NOT NULL,
  content_hash VARCHAR(128) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (policy_type, version)
);

-- Current legal copy is DRAFT (B07 blocker). Version bumped when approved.
INSERT INTO policy_versions (policy_type, version, content_hash)
VALUES ('privacy', 'draft-0.1', 'pending-legal-approval'),
       ('terms', 'draft-0.1', 'pending-legal-approval');
