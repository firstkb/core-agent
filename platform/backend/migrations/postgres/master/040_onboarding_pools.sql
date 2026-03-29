BEGIN;

-- ──────────────────────────────────────────────────────────────────────────────
-- Sandbox pools: shared databases for light/trial tenants
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_sandbox_pool (
  id             BIGSERIAL PRIMARY KEY,
  code           text UNIQUE NOT NULL,
  plan           plan_t NOT NULL DEFAULT 'light',
  db_instance_id BIGINT NOT NULL REFERENCES db_instance(id) ON DELETE RESTRICT,
  db_name        text NOT NULL,
  is_default     boolean NOT NULL DEFAULT false,
  weight         smallint NOT NULL DEFAULT 100,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (db_name = lower(db_name))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tenant_sandbox_pool_updated_at') THEN
    CREATE TRIGGER trg_tenant_sandbox_pool_updated_at
      BEFORE UPDATE ON tenant_sandbox_pool
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_tenant_sandbox_pool_plan ON tenant_sandbox_pool(plan);

-- ──────────────────────────────────────────────────────────────────────────────
-- Dedicated pools: prefixes/instances for Pro/Enterprise tenants
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_dedicated_pool (
  id             BIGSERIAL PRIMARY KEY,
  code           text UNIQUE NOT NULL,
  plan           plan_t NOT NULL DEFAULT 'pro',
  db_instance_id BIGINT NOT NULL REFERENCES db_instance(id) ON DELETE RESTRICT,
  db_prefix      text NOT NULL,
  is_default     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(db_prefix) > 0)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tenant_dedicated_pool_updated_at') THEN
    CREATE TRIGGER trg_tenant_dedicated_pool_updated_at
      BEFORE UPDATE ON tenant_dedicated_pool
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_tenant_dedicated_pool_plan ON tenant_dedicated_pool(plan);

COMMIT;

