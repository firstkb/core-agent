CREATE TABLE IF NOT EXISTS admin_section_grant (
  id            BIGSERIAL PRIMARY KEY,
  guid          UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  section_id     BIGINT NOT NULL REFERENCES admin_module_section(id) ON DELETE CASCADE,
  access_mode    TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_section_grant_guid_key UNIQUE (guid),
  CONSTRAINT admin_section_grant_user_section_key UNIQUE (admin_user_id, section_id),
  CONSTRAINT admin_section_grant_access_mode_chk CHECK (access_mode IN ('read', 'write'))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_admin_section_grant_updated_at') THEN
    CREATE TRIGGER trg_admin_section_grant_updated_at
      BEFORE UPDATE ON admin_section_grant
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_admin_section_grant_section
  ON admin_section_grant(section_id, access_mode, updated_at DESC);

CREATE INDEX IF NOT EXISTS ix_admin_section_grant_user
  ON admin_section_grant(admin_user_id, updated_at DESC);
