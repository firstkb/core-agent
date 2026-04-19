BEGIN;

-- Seed the static Form Builder model for the canonical tenant users table.
-- The metadata inserts are intentionally non-destructive; existing authored rows win.

CREATE TEMP TABLE _ps_users_field_seed (
  field_id          TEXT PRIMARY KEY,
  label             TEXT NOT NULL,
  kind              TEXT NOT NULL,
  family            TEXT NOT NULL,
  source_column     TEXT,
  source_value_kind TEXT NOT NULL,
  preset            TEXT,
  lookup_model      TEXT,
  lookup_label      TEXT,
  display_fields    TEXT[],
  widget_key        TEXT,
  suggest_config    JSONB,
  order_index       INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_users_field_seed (
  field_id,
  label,
  kind,
  family,
  source_column,
  source_value_kind,
  preset,
  lookup_model,
  lookup_label,
  display_fields,
  widget_key,
  suggest_config,
  order_index
)
VALUES
  ('first_name', 'First Name', 'short_text', 'core', 'first_name', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 0),
  ('middle_name', 'Middle Name', 'short_text', 'core', 'middle_name', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 1),
  ('last_name', 'Last Name', 'short_text', 'core', 'last_name', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 2),
  ('system_access', 'System Access', 'boolean', 'core', 'system_access', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 3),
  ('admin_access', 'ADMIN Access', 'boolean', 'core', 'admin_access', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 4),
  ('job_type', 'Job Type', 'db_lookup', 'preset', 'job_type_id', 'lookup_id', NULL, 'jobtype', 'Job Type', ARRAY['name'], NULL, NULL, 5),
  ('email', 'Email', 'short_text', 'core', 'email', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 6),
  ('company', 'Business Unit', 'db_lookup', 'preset', 'company_id', 'lookup_id', 'company_lookup', 'company', 'Company', ARRAY['name'], NULL, NULL, 7),
  ('project_access_manager', 'Project Access List', 'custom_widget', 'custom', NULL, 'virtual', NULL, NULL, NULL, NULL, 'project_access_manager', NULL, 8),
  ('sex', 'Employee Sex', 'short_text', 'core', 'sex', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 9),
  ('employee_number', 'Employee ID', 'short_text', 'core', 'employee_number', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 10),
  ('occupation', 'Employee Occupation', 'short_text', 'core', 'occupation', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 11),
  ('salary_amount', 'Gross Wages/Salary($)', 'currency', 'core', 'salary_amount', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 12),
  ('salary_rate', 'Gross Wages/Salary(Per)', 'decimal', 'core', 'salary_rate', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 13),
  ('date_of_birth', 'Date of Birth', 'date', 'core', 'date_of_birth', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 14),
  ('hire_date', 'Date of Hire', 'date', 'core', 'hire_date', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 15),
  ('phone', 'Phone', 'short_text', 'core', 'phone', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 16),
  ('mobile_phone', 'Mobile Phone', 'short_text', 'core', 'mobile_phone', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 17),
  ('messenger_app', 'Messenger App', 'short_text', 'core', 'messenger_app', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 18),
  ('messenger_account', 'Messenger Account', 'short_text', 'core', 'messenger_account', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 19),
  (
    'city',
    'City',
    'short_text',
    'preset',
    'city',
    'scalar',
    'suggest_text',
    NULL,
    NULL,
    NULL,
    NULL,
    '{"sourceMode":"same_field_distinct_values","searchMode":"contains","minQueryLength":1,"maxResults":20,"allowCustomValue":true}'::jsonb,
    20
  ),
  ('state', 'State', 'db_lookup', 'preset', 'state_id', 'lookup_id', NULL, 'state', 'State', ARRAY['name'], NULL, NULL, 21),
  ('timezone', 'Timezone', 'db_lookup', 'preset', 'timezone_id', 'lookup_id', NULL, 'timezone', 'Timezone', ARRAY['name'], NULL, NULL, 22),
  ('zip', 'Zip', 'short_text', 'core', 'zip', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 23),
  ('address_line_1', 'Address', 'long_text', 'core', 'address_line_1', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 24),
  ('notes', 'Add. Info.', 'long_text', 'core', 'notes', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 25),
  ('ssn', 'SSN', 'short_text', 'core', 'ssn', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 26),
  ('status', 'Status', 'short_text', 'core', 'status', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 27),
  ('active', 'Active', 'boolean', 'core', 'active', 'scalar', NULL, NULL, NULL, NULL, NULL, NULL, 28);

CREATE TEMP TABLE _ps_users_view_seed (
  view_id    TEXT PRIMARY KEY,
  view_key   TEXT NOT NULL,
  title      TEXT NOT NULL,
  is_default BOOLEAN NOT NULL,
  rt_alias   TEXT NOT NULL,
  grid_view  TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_users_view_seed (view_id, view_key, title, is_default, rt_alias, grid_view)
VALUES
  ('view-default', 'default', 'Users', true, 'default', 'vg_users__default'),
  ('view-contacts', 'contacts', 'Contacts', false, 'contacts', 'vg_users__contacts'),
  ('view-accounts', 'accounts', 'List of Accounts', false, 'accounts', 'vg_users__accounts');

CREATE TEMP TABLE _ps_users_view_node_seed (
  view_id     TEXT NOT NULL,
  field_id    TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (view_id, field_id)
) ON COMMIT DROP;

INSERT INTO _ps_users_view_node_seed (view_id, field_id, order_index)
SELECT 'view-default', field_id, ordinality - 1
  FROM unnest(ARRAY[
    'first_name',
    'middle_name',
    'last_name',
    'system_access',
    'admin_access',
    'job_type',
    'email',
    'company',
    'project_access_manager',
    'sex',
    'employee_number',
    'occupation',
    'salary_amount',
    'salary_rate',
    'date_of_birth',
    'hire_date',
    'phone',
    'mobile_phone',
    'messenger_app',
    'messenger_account',
    'city',
    'state',
    'timezone',
    'zip',
    'address_line_1',
    'notes',
    'ssn',
    'status',
    'active'
  ]) WITH ORDINALITY AS fields(field_id, ordinality);

INSERT INTO _ps_users_view_node_seed (view_id, field_id, order_index)
SELECT 'view-contacts', field_id, ordinality - 1
  FROM unnest(ARRAY[
    'first_name',
    'middle_name',
    'last_name',
    'system_access',
    'admin_access',
    'job_type',
    'company',
    'sex',
    'employee_number',
    'occupation',
    'salary_amount',
    'salary_rate',
    'date_of_birth',
    'hire_date',
    'email',
    'phone',
    'mobile_phone',
    'messenger_app',
    'messenger_account',
    'city',
    'state',
    'zip',
    'address_line_1',
    'notes',
    'status',
    'active'
  ]) WITH ORDINALITY AS fields(field_id, ordinality);

INSERT INTO _ps_users_view_node_seed (view_id, field_id, order_index)
SELECT 'view-accounts', field_id, ordinality - 1
  FROM unnest(ARRAY[
    'first_name',
    'last_name',
    'system_access',
    'admin_access',
    'job_type',
    'email',
    'company',
    'project_access_manager',
    'active'
  ]) WITH ORDINALITY AS fields(field_id, ordinality);

CREATE TEMP TABLE _ps_users_grid_column_seed (
  view_id     TEXT NOT NULL,
  field_id    TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (view_id, field_id)
) ON COMMIT DROP;

INSERT INTO _ps_users_grid_column_seed (view_id, field_id, order_index)
SELECT 'view-default', field_id, ordinality - 1
  FROM unnest(ARRAY[
    'first_name',
    'middle_name',
    'last_name',
    'job_type',
    'company',
    'employee_number',
    'email',
    'status',
    'system_access',
    'admin_access',
    'active'
  ]) WITH ORDINALITY AS fields(field_id, ordinality);

INSERT INTO _ps_users_grid_column_seed (view_id, field_id, order_index)
SELECT 'view-contacts', field_id, ordinality - 1
  FROM unnest(ARRAY[
    'first_name',
    'middle_name',
    'last_name',
    'job_type',
    'company',
    'employee_number',
    'email',
    'status',
    'active'
  ]) WITH ORDINALITY AS fields(field_id, ordinality);

INSERT INTO _ps_users_grid_column_seed (view_id, field_id, order_index)
SELECT 'view-accounts', field_id, ordinality - 1
  FROM unnest(ARRAY[
    'first_name',
    'last_name',
    'job_type',
    'email',
    'company',
    'system_access',
    'admin_access',
    'active'
  ]) WITH ORDINALITY AS fields(field_id, ordinality);

WITH field_payload AS (
  SELECT jsonb_agg(
           jsonb_strip_nulls(
             jsonb_build_object(
               'id', field_id,
               'fieldId', field_id,
               'family', family,
               'kind', kind,
               'label', label,
               'displayName', label,
               'storageKey', field_id,
               'schemaScopeId', 'root',
               'schemaScopeKey', 'root',
               'status', 'persisted',
               'isPersisted', true,
               'runtime', jsonb_strip_nulls(jsonb_build_object(
                 'sourceColumnName', source_column,
                 'sourceValueKind', source_value_kind
               ))
             )
           )
           || CASE
             WHEN preset IS NOT NULL THEN jsonb_build_object('preset', preset)
             ELSE '{}'::jsonb
           END
           || CASE
             WHEN lookup_model IS NOT NULL THEN jsonb_build_object(
               'lookupConfig', jsonb_build_object('sourceModel', lookup_model),
               'selectionMode', 'single',
               'sourceLabel', lookup_label,
               'displayFields', to_jsonb(display_fields)
             )
             ELSE '{}'::jsonb
           END
           || CASE
             WHEN widget_key IS NOT NULL THEN jsonb_build_object('widgetKey', widget_key)
             ELSE '{}'::jsonb
           END
           || CASE
             WHEN suggest_config IS NOT NULL THEN jsonb_build_object('suggestConfig', suggest_config)
             ELSE '{}'::jsonb
           END
           ORDER BY order_index
         ) AS fields_json
    FROM _ps_users_field_seed
),
layout_payload AS (
  SELECT jsonb_agg(
           jsonb_build_object(
             'containerKey', '__scope_root__',
             'fieldId', field_id,
             'order', order_index
           )
           ORDER BY order_index
         ) AS placements_json
    FROM _ps_users_field_seed
)
INSERT INTO ps_model (
  model_id,
  model_key,
  storage_key,
  display_name,
  description,
  source_type,
  status,
  version,
  published_version,
  structure_version,
  model_locked,
  definition_json
)
SELECT
  'users',
  'users',
  'users',
  'Users',
  '',
  'external',
  'draft',
  1,
  0,
  1,
  true,
  jsonb_build_object(
    'id', 'users',
    'key', 'users',
    'name', 'Users',
    'title', 'Users',
    'displayName', 'Users',
    'description', '',
    'sourceType', 'external',
    'storageKey', 'users',
    'version', 1,
    'publishedVersion', 0,
    'modelStructureVersion', 1,
    'modelLocked', true,
    'isStructureLocked', true,
    'canEditViewsOnly', true,
    'dataSchema', jsonb_build_object(
      'modelId', 'users',
      'modelTitle', 'Users',
      'rootScope', jsonb_build_object(
        'schemaScopeId', 'root',
        'scopeType', 'ROOT',
        'fields', field_payload.fields_json,
        'runtime', jsonb_build_object(
          'rtAlias', 'users',
          'tableName', 'users',
          'mvTableName', '',
          'dataViewName', 'vw_users',
          'sourceIdColumn', 'id',
          'sourceTenantIdColumn', 'tenant_id',
          'sourceGuidColumn', 'guid',
          'sourceCreatedAtColumn', 'created_at',
          'sourceUpdatedAtColumn', 'updated_at',
          'tenantScoped', true
        )
      ),
      'subformScopes', '[]'::jsonb
    ),
    'layoutBlueprint', jsonb_build_object(
      'rootScope', jsonb_build_object(
        'schemaScopeId', 'root',
        'containers', '[]'::jsonb,
        'fieldPlacements', layout_payload.placements_json,
        'unplacedFieldIds', '[]'::jsonb
      ),
      'subformScopes', '[]'::jsonb
    )
  )
FROM field_payload, layout_payload
ON CONFLICT (model_id) DO NOTHING;

WITH view_payload AS (
  SELECT
    view_seed.view_id,
    view_seed.view_key,
    view_seed.title,
    view_seed.is_default,
    view_seed.rt_alias,
    view_seed.grid_view,
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'id', 'root-field-' || node_seed.field_id,
                 'type', 'field',
                 'fieldId', node_seed.field_id,
                 'order', node_seed.order_index
               )
               || CASE
                 WHEN node_seed.field_id = 'admin_access' THEN jsonb_build_object(
                   'rules', jsonb_build_object(
                     'requirementRules', '[]'::jsonb,
                     'visibilityRules', jsonb_build_array(jsonb_build_object(
                       'id', 'visibility-rule-admin-access-system-access',
                       'effect', 'show',
                       'when', jsonb_build_object(
                         'all', jsonb_build_array(jsonb_build_object(
                           'id', 'rule-condition-admin-access-system-access',
                           'fieldId', 'system_access',
                           'operator', 'eq',
                           'value', true
                         ))
                       )
                     ))
                   )
                 )
                 ELSE '{}'::jsonb
               END
               ORDER BY node_seed.order_index
             )
        FROM _ps_users_view_node_seed node_seed
       WHERE node_seed.view_id = view_seed.view_id
    ) AS nodes_json,
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'id', 'grid-column-' || grid_seed.field_id,
                 'fieldId', grid_seed.field_id,
                 'order', grid_seed.order_index
               )
               ORDER BY grid_seed.order_index
             )
        FROM _ps_users_grid_column_seed grid_seed
       WHERE grid_seed.view_id = view_seed.view_id
    ) AS columns_json
  FROM _ps_users_view_seed view_seed
)
INSERT INTO ps_view (
  model_id,
  view_id,
  view_key,
  display_name,
  description,
  view_type,
  is_default,
  is_active,
  view_locked,
  status,
  version,
  published_version,
  last_aligned_model_structure_version,
  definition_json,
  published_artifacts_json
)
SELECT
  'users',
  view_id,
  view_key,
  title,
  '',
  'form',
  is_default,
  true,
  false,
  'draft',
  1,
  0,
  1,
  jsonb_build_object(
    'id', view_id,
    'key', view_key,
    'modelId', 'users',
    'name', title,
    'title', title,
    'displayName', title,
    'description', '',
    'kind', 'form',
    'isDefault', is_default,
    'isActive', true,
    'isViewLocked', false,
    'viewLocked', false,
    'version', 1,
    'viewVersion', 1,
    'publishedVersion', 0,
    'lastAlignedModelStructureVersion', 1,
    'selectedScopeId', 'root',
    'uiSchema', jsonb_build_object(
      'currentParentId', NULL,
      'rootScope', jsonb_build_object(
        'schemaScopeId', 'root',
        'runtime', jsonb_build_object(
          'viewRtAlias', rt_alias,
          'dataViewName', 'vw_users',
          'gridViewName', grid_view
        ),
        'nodes', nodes_json,
        'selectedNodeId', NULL,
        'filterDefinitions', jsonb_build_object(
          'defaultFilters', jsonb_build_object(
            'conditions', '[]'::jsonb,
            'logic', 'and'
          ),
          'quickFilters', '[]'::jsonb,
          'version', 1
        ),
        'viewSettings', jsonb_build_object(
          'actions', jsonb_build_object(
            'canAdd', true,
            'canDelete', true,
            'canEdit', true,
            'canView', true
          ),
          'list', jsonb_build_object(
            'columns', columns_json,
            'sorting', jsonb_build_object(
              'fieldId', 'last_name',
              'direction', 'asc'
            )
          )
        )
      ),
      'subformScopes', '[]'::jsonb
    )
  ),
  '{}'::jsonb
FROM view_payload
ON CONFLICT (model_id, view_id) DO NOTHING;

CREATE OR REPLACE VIEW public.vw_users AS
SELECT
  t.id AS _id,
  t.tenant_id AS tenant_id,
  t.guid AS _guid,
  t.created_at AS _created_at,
  t.updated_at AS _updated_at,
  t.first_name AS first_name,
  t.middle_name AS middle_name,
  t.last_name AS last_name,
  t.system_access AS system_access,
  t.admin_access AS admin_access,
  t.job_type_id AS job_type_id,
  NULLIF(lk_job_type.name::text, '') AS job_type__label,
  t.email::text AS email,
  t.company_id AS company_id,
  NULLIF(lk_company.name::text, '') AS company__label,
  NULLIF(lk_company_type.name::text, '') AS company__type,
  NULLIF(lk_main_company.name::text, '') AS company__main_company_name,
  COALESCE(NULLIF(lk_company_state.name::text, ''), lk_company.state_id::text) AS company__state,
  t.sex AS sex,
  t.employee_number AS employee_number,
  t.occupation AS occupation,
  t.salary_amount AS salary_amount,
  t.salary_rate AS salary_rate,
  t.date_of_birth AS date_of_birth,
  t.hire_date AS hire_date,
  t.phone AS phone,
  t.mobile_phone AS mobile_phone,
  t.messenger_app AS messenger_app,
  t.messenger_account AS messenger_account,
  t.city AS city,
  t.state_id AS state_id,
  NULLIF(lk_state.name::text, '') AS state__label,
  t.timezone_id AS timezone_id,
  NULLIF(lk_timezone.name::text, '') AS timezone__label,
  t.zip AS zip,
  t.address_line_1 AS address_line_1,
  t.notes AS notes,
  t.ssn AS ssn,
  t.status AS status,
  t.active AS active
FROM public.users t
LEFT JOIN public.jobtype lk_job_type
  ON t.job_type_id = lk_job_type.id
 AND t.tenant_id = lk_job_type.tenant_id
LEFT JOIN public.company lk_company
  ON t.company_id = lk_company.id
 AND t.tenant_id = lk_company.tenant_id
LEFT JOIN public.company lk_main_company
  ON lk_company.main_company_id = lk_main_company.id
 AND lk_company.tenant_id = lk_main_company.tenant_id
LEFT JOIN public.state lk_company_state
  ON lk_company.state_id = lk_company_state.id
LEFT JOIN public.companytype lk_company_type
  ON lk_company.company_type_id = lk_company_type.id
 AND lk_company.tenant_id = lk_company_type.tenant_id
LEFT JOIN public.state lk_state
  ON t.state_id = lk_state.id
LEFT JOIN public.timezone lk_timezone
  ON t.timezone_id = lk_timezone.id;

CREATE OR REPLACE VIEW public.vg_users__default AS
SELECT
  _id,
  tenant_id,
  _guid,
  _created_at,
  _updated_at,
  first_name,
  middle_name,
  last_name,
  job_type__label AS job_type,
  company__label AS company,
  employee_number,
  email,
  status,
  system_access,
  admin_access,
  active
FROM public.vw_users;

CREATE OR REPLACE VIEW public.vg_users__contacts AS
SELECT
  _id,
  tenant_id,
  _guid,
  _created_at,
  _updated_at,
  first_name,
  middle_name,
  last_name,
  job_type__label AS job_type,
  company__label AS company,
  employee_number,
  email,
  status,
  active
FROM public.vw_users;

CREATE OR REPLACE VIEW public.vg_users__accounts AS
SELECT
  _id,
  tenant_id,
  _guid,
  _created_at,
  _updated_at,
  first_name,
  last_name,
  job_type__label AS job_type,
  email,
  company__label AS company,
  system_access,
  admin_access,
  active
FROM public.vw_users;

COMMIT;
