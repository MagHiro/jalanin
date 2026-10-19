-- Deterministic development seed (dev/test only — never production).
-- 4 categories, 6 published + 1 draft internships across SG/MY/TH.
-- No personal data. Idempotent via slug/category upserts.
INSERT INTO categories (slug, name, active) VALUES
  ('hospitality', 'Hospitality', TRUE),
  ('technology', 'Technology', TRUE),
  ('business', 'Business', TRUE),
  ('creative', 'Creative & Media', TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, active = TRUE;

WITH c AS (
  SELECT slug, id FROM categories
)
INSERT INTO internships
  (slug, title, city, country_code, category_id, start_date, end_date,
   description, responsibilities, requirements, publication_status, featured,
   application_deadline, published_at)
VALUES
  ('hotel-operations-singapore', 'Hotel Operations Intern', 'Singapore', 'SG',
   (SELECT id FROM c WHERE slug = 'hospitality'),
   '2026-11-01', '2027-04-30',
   'Hands-on hotel operations placement across front office and guest services in Singapore.',
   'Assist front-office operations, support guest check-in, coordinate with housekeeping.',
   'Enrolled university student; good English communication; available for 6 months.',
   'Published', TRUE, NULL, now()),
  ('software-engineering-kuala-lumpur', 'Software Engineering Intern', 'Kuala Lumpur', 'MY',
   (SELECT id FROM c WHERE slug = 'technology'),
   '2026-12-01', '2027-05-31',
   'Software engineering placement with a Kuala Lumpur product team.',
   'Ship features with mentorship, write tests, participate in code review.',
   'Studying computer science or equivalent; familiarity with TypeScript.',
   'Published', TRUE, NULL, now()),
  ('marketing-bangkok', 'Marketing Intern', 'Bangkok', 'TH',
   (SELECT id FROM c WHERE slug = 'business'),
   '2027-01-15', '2027-07-15',
   'Marketing placement supporting campaigns across Southeast Asia.',
   'Draft campaign copy, analyse engagement, support event coordination.',
   'Strong written English; interest in hospitality and travel.',
   'Published', FALSE, NULL, now()),
  ('f-and-b-singapore', 'Food & Beverage Intern', 'Singapore', 'SG',
   (SELECT id FROM c WHERE slug = 'hospitality'),
   '2026-10-01', '2027-03-31',
   'Food and beverage service placement in a Singapore hotel restaurant.',
   'Serve guests, support banquet setup, follow hygiene standards.',
   'Customer-service attitude; able to stand for long shifts.',
   'Published', FALSE, NULL, now()),
  ('ui-design-remote-sg', 'UI Design Intern', 'Singapore', 'SG',
   (SELECT id FROM c WHERE slug = 'creative'),
   '2027-02-01', '2027-07-31',
   'Product design placement with a Singapore startup team.',
   'Produce wireframes, iterate on feedback, maintain a component library.',
   'Portfolio with UI work; familiarity with Figma.',
   'Published', FALSE, NULL, now()),
  ('finance-penang', 'Finance Intern', 'Penang', 'MY',
   (SELECT id FROM c WHERE slug = 'business'),
   '2027-03-01', '2027-08-31',
   'Finance placement supporting reporting and analysis.',
   'Assist month-end reporting, reconcile accounts, build spreadsheets.',
   'Studying accounting, finance, or business; spreadsheet skills.',
   'Published', FALSE, NULL, now()),
  ('draft-culinary-phuket', 'Culinary Intern (Draft)', 'Phuket', 'TH',
   (SELECT id FROM c WHERE slug = 'hospitality'),
   '2027-04-01', '2027-09-30',
   'Draft listing used to verify unpublished records stay private.',
   'TBD', 'TBD',
   'Draft', FALSE, NULL, NULL)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  publication_status = EXCLUDED.publication_status,
  featured = EXCLUDED.featured,
  updated_at = now();
