\if :{?tenant_id}
\else
\echo 'tenant_id variable is required: psql -v tenant_id=100 -f ./seeds/local/020_sandbox_tenant_seed.sql'
\quit 1
\endif

INSERT INTO users (
  users_tenant_id,
  users_id,
  users_guid,
  users_email,
  users_mobilephone,
  users_access,
  users_act,
  users_admin,
  users_auth,
  users_firstname,
  users_lastname,
  users_date
)
VALUES (
  :tenant_id,
  1,
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
ON CONFLICT (users_tenant_id, users_id) DO UPDATE
SET users_guid = EXCLUDED.users_guid,
    users_email = EXCLUDED.users_email,
    users_mobilephone = EXCLUDED.users_mobilephone,
    users_access = EXCLUDED.users_access,
    users_act = EXCLUDED.users_act,
    users_admin = EXCLUDED.users_admin,
    users_auth = EXCLUDED.users_auth,
    users_firstname = EXCLUDED.users_firstname,
    users_lastname = EXCLUDED.users_lastname,
    users_date = EXCLUDED.users_date;
