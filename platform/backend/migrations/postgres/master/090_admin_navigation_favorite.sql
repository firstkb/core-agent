CREATE TABLE IF NOT EXISTS admin_navigation_favorite (
  id BIGSERIAL PRIMARY KEY,
  guid UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  section_id BIGINT NOT NULL REFERENCES admin_module_section(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_navigation_favorite_guid_key UNIQUE (guid),
  CONSTRAINT admin_navigation_favorite_admin_section_key UNIQUE (admin_user_id, section_id)
);

CREATE INDEX IF NOT EXISTS ix_admin_navigation_favorite_user_created
  ON admin_navigation_favorite(admin_user_id, created_at DESC);
