BEGIN;

ALTER TABLE ps_navigation_access_policy
  DROP CONSTRAINT IF EXISTS ps_navigation_access_policy_mode_chk;

ALTER TABLE ps_navigation_access_policy
  ADD CONSTRAINT ps_navigation_access_policy_mode_chk
  CHECK (access_mode IN ('inherit', 'all_authenticated', 'root_only', 'selected_only', 'everyone_except'));

COMMIT;
