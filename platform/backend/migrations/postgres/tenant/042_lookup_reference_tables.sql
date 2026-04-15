CREATE TABLE IF NOT EXISTS state (
  state_id BIGINT PRIMARY KEY,
  state_name TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_state_name
  ON state(state_name);

INSERT INTO state (state_id, state_name) VALUES
  (1, '[AK] Alaska'),
  (2, '[AL] Alabama'),
  (3, '[AR] Arkansas'),
  (4, '[AZ] Arizona'),
  (5, '[CA] California'),
  (6, '[CO] Colorado'),
  (7, '[CT] Connecticut'),
  (8, '[DC] District of Columbia'),
  (9, '[DE] Delaware'),
  (10, '[FL] Florida'),
  (11, '[GA] Georgia'),
  (12, '[HI] Hawaii'),
  (13, '[IA] Iowa'),
  (14, '[ID] Idaho'),
  (15, '[IL] Illinois'),
  (16, '[IN] Indiana'),
  (17, '[KS] Kansas'),
  (18, '[KY] Kentucky'),
  (19, '[LA] Louisiana'),
  (20, '[MA] Massachusetts'),
  (21, '[MD] Maryland'),
  (22, '[ME] Maine'),
  (23, '[MI] Michigan'),
  (24, '[MN] Minnesota'),
  (25, '[MO] Missouri'),
  (26, '[MS] Mississippi'),
  (27, '[MT] Montana'),
  (28, '[NC] North Carolina'),
  (29, '[ND] North Dakota'),
  (30, '[NE] Nebraska'),
  (31, '[NH] New Hampshire'),
  (32, '[NJ] New Jersey'),
  (33, '[NM] New Mexico'),
  (34, '[NV] Nevada'),
  (35, '[NY] New York'),
  (36, '[OH] Ohio'),
  (37, '[OK] Oklahoma'),
  (38, '[OR] Oregon'),
  (39, '[PA] Pennsylvania'),
  (40, '[RI] Rhode Island'),
  (41, '[SC] South Carolina'),
  (42, '[SD] South Dakota'),
  (43, '[TN] Tennessee'),
  (44, '[TX] Texas'),
  (45, '[UT] Utah'),
  (46, '[VA] Virginia'),
  (47, '[VT] Vermont'),
  (48, '[WA] Washington'),
  (49, '[WI] Wisconsin'),
  (50, '[WV] West Virginia'),
  (51, '[WY] Wyoming')
ON CONFLICT (state_id) DO UPDATE
SET state_name = EXCLUDED.state_name;

CREATE TABLE IF NOT EXISTS jobtype (
  jobtype_id BIGINT PRIMARY KEY,
  tenant_id BIGINT NOT NULL DEFAULT COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0),
  jobtype_name TEXT NOT NULL,
  jobtype_act BOOLEAN NOT NULL DEFAULT true,
  jobtype_guid UUID NOT NULL DEFAULT gen_random_uuid(),
  jobtype_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  jobtype_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_jobtype_tenant
  ON jobtype(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_jobtype_tenant_guid
  ON jobtype(tenant_id, jobtype_guid);
CREATE INDEX IF NOT EXISTS ix_jobtype_tenant_act
  ON jobtype(tenant_id, jobtype_act);
CREATE UNIQUE INDEX IF NOT EXISTS ux_jobtype_tenant_name
  ON jobtype(tenant_id, jobtype_name);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jobtype_updated_at') THEN
    CREATE TRIGGER trg_jobtype_updated_at
      BEFORE UPDATE ON jobtype
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

INSERT INTO jobtype (jobtype_id, tenant_id, jobtype_name, jobtype_act, jobtype_guid) VALUES
  (1, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Administrator', true, 'c958d6de-4f54-4eba-b35c-db5d43d05722'),
  (2, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Superintendent', true, '7971035d-5f9d-432e-8d72-3063b1e19f18'),
  (3, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Foreman', true, '4cc0a3c2-11cc-40d0-b64b-0d3d9f124ac9'),
  (4, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Project Manager', true, '1d4967e1-e42c-415a-924e-b375068e4328'),
  (5, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Director of Operations Safety & Security', true, 'bff032c2-6be9-42b8-a4db-f3e6135bd044'),
  (6, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Chief of Safety & Security', true, 'a1286baf-d56f-4f43-857f-371ef3cf1750'),
  (7, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Safety Director', true, 'cc76766e-010c-4d0d-99ad-5a361d1f4cef'),
  (8, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Safety Manager', true, '85e799ef-294f-4a32-8586-16f4e73e68ac'),
  (9, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Field Safety Manager', true, '5f0eec54-2dd3-4914-a636-01faa2ee3730'),
  (11, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Test', false, 'd5539c0e-6a26-40c6-80d8-5948892314c8'),
  (12, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'test22', true, '3696841a-f86f-4887-a822-f82628035e0c'),
  (13, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'Test333', false, 'bfa031d5-4efd-4624-a60f-65c9d32f3a92'),
  (14, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'test44', false, '5a2f3415-a55b-4b33-bad2-5433848903d2'),
  (18, COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::bigint, 0), 'test46', false, '36f53bc2-4190-422b-9e39-ed433d4dfd5e')
ON CONFLICT (jobtype_id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  jobtype_name = EXCLUDED.jobtype_name,
  jobtype_act = EXCLUDED.jobtype_act,
  jobtype_guid = EXCLUDED.jobtype_guid;
