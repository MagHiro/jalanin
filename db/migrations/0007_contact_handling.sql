-- Contact enquiry handling state (A3): simple Open / Handled tracking.
-- New enquiries default to Open. History preserved; no data rewritten.
ALTER TABLE contact_submissions
  ADD COLUMN handling_status VARCHAR(20) NOT NULL DEFAULT 'Open'
    CHECK (handling_status IN ('Open', 'Handled')),
  ADD COLUMN handled_at TIMESTAMPTZ,
  ADD COLUMN handled_by UUID;
CREATE INDEX contact_handling_idx ON contact_submissions (handling_status, created_at);
