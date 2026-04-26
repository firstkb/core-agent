-- Local example seed.
-- Creates one sandbox tenant and one dedicated demo tenant.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO db_instance (code, dns)
VALUES (
  'LOCAL',
  'host=127.0.0.1 port=5432 user=postgres password=postgres sslmode=disable'
)
ON CONFLICT (code) DO UPDATE
SET dns = EXCLUDED.dns,
    updated_at = now();

INSERT INTO tenant_sandbox_pool (code, plan, db_instance_id, db_name, is_default, weight)
SELECT 'LOCAL-SANDBOX', 'light', id, '108-sandbox', true, 100
  FROM db_instance
 WHERE code = 'LOCAL'
ON CONFLICT (code) DO UPDATE
SET plan = EXCLUDED.plan,
    db_instance_id = EXCLUDED.db_instance_id,
    db_name = EXCLUDED.db_name,
    is_default = EXCLUDED.is_default,
    weight = EXCLUDED.weight,
    updated_at = now();

INSERT INTO tenant_dedicated_pool (code, plan, db_instance_id, db_prefix, is_default)
SELECT 'LOCAL-PRO', 'pro', id, '108-', true
  FROM db_instance
 WHERE code = 'LOCAL'
ON CONFLICT (code) DO UPDATE
SET plan = EXCLUDED.plan,
    db_instance_id = EXCLUDED.db_instance_id,
    db_prefix = EXCLUDED.db_prefix,
    is_default = EXCLUDED.is_default,
    updated_at = now();

-- Migrate pre-.localhost local dev hostnames in existing developer databases.
UPDATE tenant_domain
   SET host = 'acme.platform.localhost',
       updated_at = now()
 WHERE host = 'acme.platform.local';

UPDATE tenant_domain
   SET host = 'demo.platform.localhost',
       updated_at = now()
 WHERE host = 'demo.platform.local';

INSERT INTO tenant (name, isolation, status)
SELECT 'Acme Sandbox', 'sandbox'::isolation_mode, 'active'
WHERE NOT EXISTS (
  SELECT 1
    FROM tenant_domain
   WHERE host = 'acme.platform.localhost'
);

INSERT INTO tenant (name, isolation, status)
SELECT 'Demo Dedicated', 'dedicated_db'::isolation_mode, 'active'
WHERE NOT EXISTS (
  SELECT 1
    FROM tenant_domain
   WHERE host = 'demo.platform.localhost'
);

INSERT INTO tenant_domain (tenant_id, host)
SELECT t.id, 'acme.platform.localhost'
  FROM tenant t
 WHERE t.name = 'Acme Sandbox'
   AND NOT EXISTS (
     SELECT 1 FROM tenant_domain td WHERE td.host = 'acme.platform.localhost'
   );

INSERT INTO tenant_domain (tenant_id, host)
SELECT t.id, 'demo.platform.localhost'
  FROM tenant t
 WHERE t.name = 'Demo Dedicated'
   AND NOT EXISTS (
     SELECT 1 FROM tenant_domain td WHERE td.host = 'demo.platform.localhost'
   );

INSERT INTO tenant_db (tenant_id, db_instance_id, db_name)
SELECT t.id, di.id, '108-sandbox'
  FROM tenant t
  JOIN db_instance di ON di.code = 'LOCAL'
 WHERE t.name = 'Acme Sandbox'
ON CONFLICT (tenant_id)
DO UPDATE SET db_instance_id = EXCLUDED.db_instance_id,
              db_name = EXCLUDED.db_name,
              updated_at = now();

INSERT INTO tenant_db (tenant_id, db_instance_id, db_name)
SELECT t.id, di.id, '108-demo'
  FROM tenant t
  JOIN db_instance di ON di.code = 'LOCAL'
 WHERE t.name = 'Demo Dedicated'
ON CONFLICT (tenant_id)
DO UPDATE SET db_instance_id = EXCLUDED.db_instance_id,
              db_name = EXCLUDED.db_name,
              updated_at = now();

INSERT INTO tenant_plan_history (tenant_id, plan, valid_from)
SELECT t.id, 'light', now()
  FROM tenant t
 WHERE t.name = 'Acme Sandbox'
   AND NOT EXISTS (
     SELECT 1
       FROM tenant_plan_history tph
      WHERE tph.tenant_id = t.id
        AND tph.valid_to IS NULL
   );

INSERT INTO tenant_plan_history (tenant_id, plan, valid_from)
SELECT t.id, 'pro', now()
  FROM tenant t
WHERE t.name = 'Demo Dedicated'
   AND NOT EXISTS (
     SELECT 1
       FROM tenant_plan_history tph
      WHERE tph.tenant_id = t.id
        AND tph.valid_to IS NULL
   );

INSERT INTO tenant_auth_policy (
  tenant_id,
  otp_length,
  otp_ttl_seconds,
  otp_max_attempts,
  otp_email_enabled,
  otp_phone_enabled,
  login_requires_users_access,
  login_requires_users_act
)
SELECT
  t.id,
  6,
  600,
  5,
  true,
  true,
  true,
  true
FROM tenant t
WHERE t.name IN ('Acme Sandbox', 'Demo Dedicated')
ON CONFLICT (tenant_id) DO UPDATE
SET otp_length = EXCLUDED.otp_length,
    otp_ttl_seconds = EXCLUDED.otp_ttl_seconds,
    otp_max_attempts = EXCLUDED.otp_max_attempts,
    otp_email_enabled = EXCLUDED.otp_email_enabled,
    otp_phone_enabled = EXCLUDED.otp_phone_enabled,
    login_requires_users_access = EXCLUDED.login_requires_users_access,
    login_requires_users_act = EXCLUDED.login_requires_users_act,
    updated_at = now();

INSERT INTO admin_user (email, phone, name, level, status)
VALUES ('admin@platform.local', '+1555000001', 'Local Platform Admin', 100, 'active')
ON CONFLICT (email) DO UPDATE
SET phone = EXCLUDED.phone,
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    status = EXCLUDED.status;
