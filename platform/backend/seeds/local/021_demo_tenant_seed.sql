\if :{?tenant_id}
\else
\echo 'tenant_id variable is required: psql -v tenant_id=101 -f ./seeds/local/021_demo_tenant_seed.sql'
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
  '22222222-2222-2222-2222-222222222222',
  'owner@demo.local',
  '+1555000202',
  true,
  true,
  true,
  90,
  'Demo',
  'Owner',
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
