BEGIN;

CREATE TABLE IF NOT EXISTS ps_edit_presence (
  tenant_id BIGINT NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::bigint,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_key TEXT NOT NULL,
  parent_target_key TEXT,
  target_label TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_display_name TEXT,
  user_email TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ps_edit_presence_user_key PRIMARY KEY (tenant_id, user_id),
  CONSTRAINT ps_edit_presence_target_type_chk CHECK (btrim(target_type) <> ''),
  CONSTRAINT ps_edit_presence_target_key_chk CHECK (btrim(target_key) <> ''),
  CONSTRAINT ps_edit_presence_context_chk CHECK (jsonb_typeof(context) = 'object')
);

CREATE INDEX IF NOT EXISTS ix_ps_edit_presence_target
  ON ps_edit_presence(tenant_id, target_type, target_key, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS ix_ps_edit_presence_parent
  ON ps_edit_presence(tenant_id, parent_target_key, last_seen_at DESC)
  WHERE parent_target_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_ps_edit_presence_stale
  ON ps_edit_presence(last_seen_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ps_edit_presence_updated_at') THEN
    CREATE TRIGGER trg_ps_edit_presence_updated_at
      BEFORE UPDATE ON ps_edit_presence
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE ps_edit_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_edit_presence FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_ps_edit_presence_tenant ON ps_edit_presence;
CREATE POLICY p_ps_edit_presence_tenant ON ps_edit_presence
  USING (tenant_id = current_setting('app.tenant_id', true)::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::bigint);

COMMIT;
