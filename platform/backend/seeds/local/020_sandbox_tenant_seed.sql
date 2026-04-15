\if :{?tenant_id}
\else
\echo 'tenant_id variable is required: psql -v tenant_id=100 -f ./seeds/local/020_sandbox_tenant_seed.sql'
\quit 1
\endif

INSERT INTO users (
  id,
  tenant_id,
  guid,
  email,
  mobile_phone,
  system_access,
  active,
  admin_access,
  auth_level,
  first_name,
  last_name,
  recorded_at
)
VALUES (
  1,
  :tenant_id,
  '11111111-1111-1111-1111-111111111111',
  'user@acme.local',
  '+1555000101',
  true,
  true,
  false,
  20,
  'Acme',
  'User',
  now()
)
ON CONFLICT (id) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id,
    guid = EXCLUDED.guid,
    email = EXCLUDED.email,
    mobile_phone = EXCLUDED.mobile_phone,
    system_access = EXCLUDED.system_access,
    active = EXCLUDED.active,
    admin_access = EXCLUDED.admin_access,
    auth_level = EXCLUDED.auth_level,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    recorded_at = EXCLUDED.recorded_at;
