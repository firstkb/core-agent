CREATE TABLE IF NOT EXISTS admin_module (
  id          BIGSERIAL PRIMARY KEY,
  guid        UUID NOT NULL DEFAULT gen_random_uuid(),
  module_key  TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 100,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_module_guid_key UNIQUE (guid),
  CONSTRAINT admin_module_module_key_key UNIQUE (module_key),
  CONSTRAINT admin_module_module_key_chk CHECK (module_key = lower(btrim(module_key)) AND module_key <> ''),
  CONSTRAINT admin_module_title_chk CHECK (btrim(title) <> ''),
  CONSTRAINT admin_module_status_chk CHECK (status IN ('active', 'planned', 'archived'))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_admin_module_updated_at') THEN
    CREATE TRIGGER trg_admin_module_updated_at
      BEFORE UPDATE ON admin_module
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_admin_module_status_sort
  ON admin_module(status, sort_order, title);

CREATE TABLE IF NOT EXISTS admin_module_section (
  id          BIGSERIAL PRIMARY KEY,
  guid        UUID NOT NULL DEFAULT gen_random_uuid(),
  module_id   BIGINT NOT NULL REFERENCES admin_module(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  route_path  TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 100,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_module_section_guid_key UNIQUE (guid),
  CONSTRAINT admin_module_section_module_key_key UNIQUE (module_id, section_key),
  CONSTRAINT admin_module_section_key_chk CHECK (section_key = lower(btrim(section_key)) AND section_key <> ''),
  CONSTRAINT admin_module_section_title_chk CHECK (btrim(title) <> ''),
  CONSTRAINT admin_module_section_status_chk CHECK (status IN ('active', 'planned', 'archived'))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_admin_module_section_updated_at') THEN
    CREATE TRIGGER trg_admin_module_section_updated_at
      BEFORE UPDATE ON admin_module_section
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_admin_module_section_module_sort
  ON admin_module_section(module_id, sort_order, title);

CREATE TABLE IF NOT EXISTS admin_collection_favorite (
  id            BIGSERIAL PRIMARY KEY,
  guid          UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  surface_id    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_collection_favorite_guid_key UNIQUE (guid),
  CONSTRAINT admin_collection_favorite_admin_surface_key UNIQUE (admin_user_id, surface_id),
  CONSTRAINT admin_collection_favorite_surface_chk CHECK (btrim(surface_id) <> '')
);

CREATE INDEX IF NOT EXISTS ix_admin_collection_favorite_surface
  ON admin_collection_favorite(surface_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_collection_saved_filter (
  id            BIGSERIAL PRIMARY KEY,
  guid          UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  surface_id    TEXT NOT NULL,
  label         TEXT NOT NULL,
  quick_filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_collection_saved_filter_guid_key UNIQUE (guid),
  CONSTRAINT admin_collection_saved_filter_surface_chk CHECK (btrim(surface_id) <> ''),
  CONSTRAINT admin_collection_saved_filter_label_chk CHECK (btrim(label) <> ''),
  CONSTRAINT admin_collection_saved_filter_quick_filters_chk CHECK (jsonb_typeof(quick_filters) = 'array')
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_admin_collection_saved_filter_updated_at') THEN
    CREATE TRIGGER trg_admin_collection_saved_filter_updated_at
      BEFORE UPDATE ON admin_collection_saved_filter
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_admin_collection_saved_filter_user_surface
  ON admin_collection_saved_filter(admin_user_id, surface_id, created_at DESC);

INSERT INTO admin_module (module_key, title, description, icon, sort_order, status)
VALUES
  ('module_registry', 'Module registry', 'Root-only registry of admin modules and their sections.', 'layers', 100, 'active'),
  ('tenant', 'Tenant', 'Tenant control-plane management and onboarding.', 'building', 200, 'active'),
  ('users', 'Users', 'Platform admin user directory and future section grants.', 'users', 300, 'planned')
ON CONFLICT (module_key) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status,
    updated_at = now();

INSERT INTO admin_module_section (module_id, section_key, title, description, route_path, sort_order, status)
SELECT m.id, seed.section_key, seed.title, seed.description, seed.route_path, seed.sort_order, seed.status
FROM (
  VALUES
    ('module_registry', 'modules_list', 'List of modules', 'Registry list for admin modules and sections.', '/modules/list', 100, 'active'),
    ('tenant', 'list_of_tenants', 'List of tenants', 'Tenant inventory and registry operations.', '/admin/tenants', 100, 'active'),
    ('tenant', 'onboarding', 'Onboarding', 'Tenant provisioning and onboarding flow.', '/admin/tenants/onboarding', 200, 'active'),
    ('users', 'list_of_users', 'List of users', 'Admin user directory and future access assignment.', '/admin/users', 100, 'planned')
) AS seed(module_key, section_key, title, description, route_path, sort_order, status)
JOIN admin_module m ON m.module_key = seed.module_key
ON CONFLICT (module_id, section_key) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    route_path = EXCLUDED.route_path,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status,
    updated_at = now();
