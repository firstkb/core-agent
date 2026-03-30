-- 000_master.sql
-- Master database schema
-- PostgreSQL 15+

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ──────────────────────────────────────────────────────────────────────────────
-- Types
-- ──────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE plan_t AS ENUM ('trial','light','pro','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE isolation_mode AS ENUM ('sandbox','dedicated_schema','dedicated_db');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Generic updated_at trigger
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────
-- DB instances registry
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS db_instance (
  id           BIGSERIAL PRIMARY KEY,
  code         text UNIQUE NOT NULL,                 -- e.g., 'S1', 'S2'
  dns          text,                                 -- full DSN for dev (optional)
  secret_name  text,                                 -- Secrets Manager name/ARN (optional)
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (dns IS NOT NULL OR secret_name IS NOT NULL)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_db_instance_updated_at') THEN
    CREATE TRIGGER trg_db_instance_updated_at
      BEFORE UPDATE ON db_instance
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_db_instance_updated_at ON db_instance(updated_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- Tenants (no plan column: plan is tracked in tenant_plan_history)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant (
  id          BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 100 INCREMENT BY 1) PRIMARY KEY,
  guid        uuid NOT NULL DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  isolation   isolation_mode NOT NULL DEFAULT 'sandbox',
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tenant_updated_at') THEN
    CREATE TRIGGER trg_tenant_updated_at
      BEFORE UPDATE ON tenant
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_tenant_updated_at ON tenant(updated_at);
CREATE INDEX IF NOT EXISTS ix_tenant_status      ON tenant(status);
CREATE UNIQUE INDEX IF NOT EXISTS tenant_guid_key ON tenant(guid);

-- ──────────────────────────────────────────────────────────────────────────────
-- Tenant domains (global unique, lowercase/punycode host)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_domain (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   BIGINT NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  host        text NOT NULL,                         -- lowercase/punycode
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (host = lower(host))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tenant_domain_updated_at') THEN
    CREATE TRIGGER trg_tenant_domain_updated_at
      BEFORE UPDATE ON tenant_domain
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_tenant_domain_host ON tenant_domain(host);
CREATE INDEX IF NOT EXISTS ix_tenant_domain_tenant     ON tenant_domain(tenant_id);
CREATE INDEX IF NOT EXISTS ix_tenant_domain_updated_at ON tenant_domain(updated_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- Tenant DB bindings (one active row per tenant)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_db (
  id             BIGSERIAL PRIMARY KEY,
  tenant_id      BIGINT NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  db_instance_id BIGINT NOT NULL REFERENCES db_instance(id) ON DELETE RESTRICT,
  db_name        text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tenant_db_updated_at') THEN
    CREATE TRIGGER trg_tenant_db_updated_at
      BEFORE UPDATE ON tenant_db
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- One active DB per tenant
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_db_tenant_one
  ON tenant_db (tenant_id);

-- Avoid duplicates for same instance/name
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_db_tenant_instance_name
  ON tenant_db (tenant_id, db_instance_id, db_name);

CREATE INDEX IF NOT EXISTS ix_tenant_db_instance   ON tenant_db(db_instance_id);
CREATE INDEX IF NOT EXISTS ix_tenant_db_updated_at ON tenant_db(updated_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- Tenant plan history (temporal)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_plan_history (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   BIGINT NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  plan        plan_t NOT NULL,
  valid_from  timestamptz NOT NULL,
  valid_to    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 1) open intervals (current plan without valid_to)
CREATE INDEX IF NOT EXISTS ix_tenant_plan_open
  ON tenant_plan_history (tenant_id, valid_from DESC)
  WHERE valid_to IS NULL;

-- 2) closed intervals (with valid_to)
CREATE INDEX IF NOT EXISTS ix_tenant_plan_closed
  ON tenant_plan_history (tenant_id, valid_from DESC, valid_to)
  WHERE valid_to IS NOT NULL;

CREATE OR REPLACE VIEW v_tenant_current_plan AS
SELECT DISTINCT ON (tenant_id)
  tenant_id, plan, valid_from, valid_to
FROM tenant_plan_history
WHERE valid_from <= now() AND (valid_to IS NULL OR now() < valid_to)
ORDER BY tenant_id, valid_from DESC;

-- ──────────────────────────────────────────────────────────────────────────────
-- Resolver view: host → tenant + active DB + instance + current plan
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_tenant_by_host AS
SELECT
  td.host                          AS host,
  t.id                             AS tenant_id,
  t.name                           AS tenant_name,
  cp.plan                          AS plan,                 -- from history
  t.isolation,
  t.status,
  t.updated_at                     AS tenant_updated_at,
  tdb.db_name,
  di.id                            AS db_instance_id,
  di.code                          AS db_instance_code,
  di.dns,
  di.secret_name,
  GREATEST(td.updated_at, tdb.updated_at, t.updated_at, di.updated_at) AS updated_at
FROM tenant_domain td
JOIN tenant t        ON t.id = td.tenant_id
JOIN tenant_db tdb   ON tdb.tenant_id = t.id
JOIN db_instance di  ON di.id = tdb.db_instance_id
LEFT JOIN v_tenant_current_plan cp ON cp.tenant_id = t.id;

-- ──────────────────────────────────────────────────────────────────────────────
-- Migration coordination
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS migration_runs (
  id           BIGSERIAL PRIMARY KEY,
  version      TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status       TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  error        TEXT,
  applied_dbs  TEXT[]
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_migration_runs_running
  ON migration_runs(version, status)
  WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_migration_runs_status
  ON migration_runs(status, started_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────
-- Platform admin users
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_user(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  name text,
  level int NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_admin_user_email ON admin_user(email);
CREATE INDEX IF NOT EXISTS ix_admin_user_status ON admin_user(status) WHERE status != 'active';

-- ──────────────────────────────────────────────────────────────────────────────
-- Auth control tables
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_otp (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  BIGINT NOT NULL,
  channel    text   NOT NULL,
  address    text   NOT NULL,
  code_hash  text   NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_auth_otp_lookup
  ON auth_otp (tenant_id, channel, address, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_auth_otp_expires
  ON auth_otp (tenant_id, expires_at);

CREATE TABLE IF NOT EXISTS auth_refresh_token (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  BIGINT NOT NULL,
  user_id    uuid   NOT NULL,
  token_hash text   NOT NULL UNIQUE,
  client_id  text,
  device_id  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS ix_refresh_token_user
  ON auth_refresh_token (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_token_expires
  ON auth_refresh_token (tenant_id, expires_at);
CREATE INDEX IF NOT EXISTS ix_refresh_token_revoked
  ON auth_refresh_token (tenant_id, revoked_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS tenant_auth_policy (
  tenant_id                    BIGINT PRIMARY KEY REFERENCES tenant(id) ON DELETE CASCADE,
  otp_length                   SMALLINT NOT NULL DEFAULT 6 CHECK (otp_length BETWEEN 4 AND 10),
  otp_ttl_seconds              INTEGER NOT NULL DEFAULT 600 CHECK (otp_ttl_seconds BETWEEN 60 AND 3600),
  otp_max_attempts             INTEGER NOT NULL DEFAULT 5 CHECK (otp_max_attempts BETWEEN 1 AND 20),
  otp_email_enabled            BOOLEAN NOT NULL DEFAULT true,
  otp_phone_enabled            BOOLEAN NOT NULL DEFAULT true,
  login_requires_users_access  BOOLEAN NOT NULL DEFAULT true,
  login_requires_users_act     BOOLEAN NOT NULL DEFAULT true,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tenant_auth_policy_updated_at') THEN
    CREATE TRIGGER trg_tenant_auth_policy_updated_at
      BEFORE UPDATE ON tenant_auth_policy
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_tenant_auth_policy_updated_at ON tenant_auth_policy(updated_at);

CREATE TABLE IF NOT EXISTS admin_tenant_access_audit (
  id            BIGSERIAL PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  tenant_id     BIGINT NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  access_mode   TEXT NOT NULL,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_admin_tenant_access_audit_admin_created
  ON admin_tenant_access_audit(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_admin_tenant_access_audit_tenant_created
  ON admin_tenant_access_audit(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_admin_tenant_access_audit_action_created
  ON admin_tenant_access_audit(action, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────
-- Onboarding pool registry
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

-- ──────────────────────────────────────────────────────────────────────────────
-- Seed helper (optional): upsert S1 using a literal DSN for dev.
-- Replace '<MASTER_DSN>' with your actual master DSN if you want to seed via SQL.
-- In production prefer bootstrapping from the app using ENV to avoid secrets in DDL.
--
-- INSERT INTO db_instance(code, dns)
-- VALUES ('S1', '<MASTER_DSN>')
-- ON CONFLICT (code) DO NOTHING;
--
-- Example to bind a tenant to S1 as default:
-- INSERT INTO tenant_db(tenant_id, db_instance_id, db_name)
-- SELECT $TENANT_ID, id, '<DB_NAME>' FROM db_instance WHERE code='S1'
-- ON CONFLICT (tenant_id)
-- DO UPDATE SET db_name = EXCLUDED.db_name, db_instance_id = EXCLUDED.db_instance_id, updated_at = now();
--
-- Or do this from the app at bootstrap time.
-- ──────────────────────────────────────────────────────────────────────────────

COMMIT;
