\if :{?tenant_id}
\else
\echo 'tenant_id variable is required: psql -v tenant_id=101 -f ./seeds/local/021_demo_tenant_seed.sql'
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
