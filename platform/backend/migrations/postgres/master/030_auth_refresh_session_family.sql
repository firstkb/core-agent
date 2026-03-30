ALTER TABLE auth_refresh_token
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS surface text,
  ADD COLUMN IF NOT EXISTS token_family_id uuid,
  ADD COLUMN IF NOT EXISTS rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text;

UPDATE auth_refresh_token
SET
  session_id = COALESCE(session_id, id),
  surface = COALESCE(surface, CASE WHEN tenant_id = 0 THEN 'admin' ELSE 'tenant' END),
  token_family_id = COALESCE(token_family_id, id),
  updated_at = COALESCE(updated_at, created_at)
WHERE
  session_id IS NULL
  OR surface IS NULL
  OR token_family_id IS NULL
  OR updated_at IS NULL;

ALTER TABLE auth_refresh_token
  ALTER COLUMN session_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN session_id SET NOT NULL,
  ALTER COLUMN surface SET DEFAULT 'unknown',
  ALTER COLUMN surface SET NOT NULL,
  ALTER COLUMN token_family_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN token_family_id SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS ix_refresh_token_session_id
  ON auth_refresh_token (session_id);
CREATE INDEX IF NOT EXISTS ix_refresh_token_family_created
  ON auth_refresh_token (token_family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_refresh_token_active_user
  ON auth_refresh_token (tenant_id, user_id, created_at DESC)
  WHERE revoked_at IS NULL;
