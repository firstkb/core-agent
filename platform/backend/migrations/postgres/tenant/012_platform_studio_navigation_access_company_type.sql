BEGIN;

ALTER TABLE ps_navigation_access_subject
  DROP CONSTRAINT IF EXISTS ps_navigation_access_subject_subject_type_chk;

ALTER TABLE ps_navigation_access_subject
  ADD CONSTRAINT ps_navigation_access_subject_subject_type_chk
  CHECK (subject_type IN ('user', 'company', 'company_type', 'jobtype'));

COMMIT;
