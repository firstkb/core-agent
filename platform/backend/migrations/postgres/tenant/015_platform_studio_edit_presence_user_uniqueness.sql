BEGIN;

WITH ranked_presence AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, user_id
      ORDER BY last_seen_at DESC, updated_at DESC, created_at DESC
    ) AS row_rank
  FROM ps_edit_presence
)
DELETE FROM ps_edit_presence AS presence
USING ranked_presence
WHERE presence.ctid = ranked_presence.ctid
  AND ranked_presence.row_rank > 1;

ALTER TABLE ps_edit_presence
  DROP CONSTRAINT IF EXISTS ps_edit_presence_user_client_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'ps_edit_presence'::regclass
      AND conname = 'ps_edit_presence_user_key'
  ) THEN
    ALTER TABLE ps_edit_presence
      ADD CONSTRAINT ps_edit_presence_user_key PRIMARY KEY (tenant_id, user_id);
  END IF;
END $$;

COMMIT;
