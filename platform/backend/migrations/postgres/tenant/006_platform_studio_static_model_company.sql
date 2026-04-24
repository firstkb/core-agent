BEGIN;

-- Seed the static Form Builder model for the canonical tenant company table.
-- Metadata inserts are intentionally non-destructive; existing authored rows win.

CREATE TEMP TABLE _ps_company_field_seed (
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
  suggest_config    JSONB,
  order_index       INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_company_field_seed (
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
  suggest_config,
  order_index
)
VALUES
  ('name', 'Business Unit Name', 'short_text', 'core', 'name', 'scalar', NULL, NULL, NULL, NULL, NULL, 0),
  ('company_type', 'Business Unit Type', 'db_lookup', 'preset', 'company_type_id', 'lookup_id', NULL, 'companytype', 'Company Type', ARRAY['name'], NULL, 1),
  ('main_company', 'Main Company', 'db_lookup', 'preset', 'main_company_id', 'lookup_id', 'company_lookup', 'company', 'Company', ARRAY['name'], NULL, 2),
  ('active', 'Active', 'boolean', 'core', 'active', 'scalar', NULL, NULL, NULL, NULL, NULL, 3),
  ('contact_name', 'Contact Name', 'short_text', 'core', 'contact_name', 'scalar', NULL, NULL, NULL, NULL, NULL, 4),
  ('phone', 'Phone', 'short_text', 'core', 'phone', 'scalar', NULL, NULL, NULL, NULL, NULL, 5),
  ('fax', 'Fax', 'short_text', 'core', 'fax', 'scalar', NULL, NULL, NULL, NULL, NULL, 6),
  ('email', 'Email', 'short_text', 'core', 'email', 'scalar', NULL, NULL, NULL, NULL, NULL, 7),
  ('url', 'URL', 'short_text', 'core', 'url', 'scalar', NULL, NULL, NULL, NULL, NULL, 8),
  ('address_line_1', 'Address Line 1', 'short_text', 'core', 'address_line_1', 'scalar', NULL, NULL, NULL, NULL, NULL, 9),
  ('address_line_2', 'Address Line 2', 'short_text', 'core', 'address_line_2', 'scalar', NULL, NULL, NULL, NULL, NULL, 10),
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
    '{"sourceMode":"same_field_distinct_values","searchMode":"contains","minQueryLength":1,"maxResults":20,"allowCustomValue":true}'::jsonb,
    11
  ),
  ('state', 'State', 'db_lookup', 'preset', 'state_id', 'lookup_id', NULL, 'state', 'State', ARRAY['name'], NULL, 12),
  (
    'zip',
    'Zip',
    'short_text',
    'preset',
    'zip',
    'scalar',
    'suggest_text',
    NULL,
    NULL,
    NULL,
    '{"sourceMode":"same_field_distinct_values","searchMode":"contains","minQueryLength":1,"maxResults":20,"allowCustomValue":true}'::jsonb,
    13
  ),
  ('timezone', 'Timezone', 'db_lookup', 'preset', 'timezone_id', 'lookup_id', NULL, 'timezone', 'Timezone', ARRAY['name'], NULL, 14),
  ('joined_at', 'Joined At', 'date', 'core', 'joined_at', 'scalar', NULL, NULL, NULL, NULL, NULL, 15),
  ('vendor_code', 'Vendor Code', 'short_text', 'core', 'vendor_code', 'scalar', NULL, NULL, NULL, NULL, NULL, 16),
  ('tax_id', 'Tax ID', 'short_text', 'core', 'tax_id', 'scalar', NULL, NULL, NULL, NULL, NULL, 17),
  ('naics_code', 'NAICS Code', 'short_text', 'core', 'naics_code', 'scalar', NULL, NULL, NULL, NULL, NULL, 18),
  ('product_code', 'Product Code', 'short_text', 'core', 'product_code', 'scalar', NULL, NULL, NULL, NULL, NULL, 19),
  ('company_number', 'Company Number', 'short_text', 'core', 'company_number', 'scalar', NULL, NULL, NULL, NULL, NULL, 20),
  ('record_group', 'Record Group', 'short_text', 'core', 'record_group', 'scalar', NULL, NULL, NULL, NULL, NULL, 21),
  ('geo_code', 'Geo Code', 'short_text', 'core', 'geo_code', 'scalar', NULL, NULL, NULL, NULL, NULL, 22),
  ('contract_number', 'Contract Number', 'short_text', 'core', 'contract_number', 'scalar', NULL, NULL, NULL, NULL, NULL, 23),
  ('premium', 'Premium', 'integer', 'core', 'premium', 'scalar', NULL, NULL, NULL, NULL, NULL, 24),
  ('liaison', 'Liaison', 'short_text', 'core', 'liaison', 'scalar', NULL, NULL, NULL, NULL, NULL, 25),
  ('description', 'Description', 'long_text', 'core', 'description', 'scalar', NULL, NULL, NULL, NULL, NULL, 26),
  ('company_policy', 'Company Policy', 'long_text', 'core', 'company_policy', 'scalar', NULL, NULL, NULL, NULL, NULL, 27),
  ('safety_policy', 'Safety Policy', 'long_text', 'core', 'safety_policy', 'scalar', NULL, NULL, NULL, NULL, NULL, 28),
  ('unemployment_policy', 'Unemployment Policy', 'long_text', 'core', 'unemployment_policy', 'scalar', NULL, NULL, NULL, NULL, NULL, 29);

CREATE TEMP TABLE _ps_company_view_node_seed (
  field_id    TEXT PRIMARY KEY,
  order_index INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_company_view_node_seed (field_id, order_index)
SELECT field_id, ordinality - 1
  FROM unnest(ARRAY[
    'name',
    'company_type',
    'main_company',
    'active',
    'contact_name',
    'phone',
    'fax',
    'email',
    'url',
    'address_line_1',
    'address_line_2',
    'city',
    'state',
    'zip',
    'timezone',
    'joined_at',
    'vendor_code',
    'tax_id',
    'naics_code',
    'product_code',
    'company_number',
    'record_group',
    'geo_code',
    'contract_number',
    'premium',
    'liaison',
    'description',
    'company_policy',
    'safety_policy',
    'unemployment_policy'
  ]) WITH ORDINALITY AS fields(field_id, ordinality);

CREATE TEMP TABLE _ps_company_grid_column_seed (
  field_id    TEXT PRIMARY KEY,
  order_index INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_company_grid_column_seed (field_id, order_index)
SELECT field_id, ordinality - 1
  FROM unnest(ARRAY[
    'name',
    'company_type',
    'main_company',
    'contact_name',
    'phone',
    'city',
    'state',
    'zip',
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
             WHEN suggest_config IS NOT NULL THEN jsonb_build_object('suggestConfig', suggest_config)
             ELSE '{}'::jsonb
           END
           ORDER BY order_index
         ) AS fields_json
    FROM _ps_company_field_seed
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
    FROM _ps_company_field_seed
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
  'company',
  'company',
  'company',
  'Company',
  '',
  'external',
  'draft',
  1,
  0,
  1,
  true,
  jsonb_build_object(
    'id', 'company',
    'key', 'company',
    'name', 'Company',
    'title', 'Company',
    'displayName', 'Company',
    'description', '',
    'sourceType', 'external',
    'storageKey', 'company',
    'version', 1,
    'publishedVersion', 0,
    'modelStructureVersion', 1,
    'modelLocked', true,
    'isStructureLocked', true,
    'canEditViewsOnly', true,
    'dataSchema', jsonb_build_object(
      'modelId', 'company',
      'modelTitle', 'Company',
      'rootScope', jsonb_build_object(
        'schemaScopeId', 'root',
        'scopeType', 'ROOT',
        'fields', field_payload.fields_json,
        'runtime', jsonb_build_object(
          'rtAlias', 'company',
          'tableName', 'company',
          'mvTableName', '',
          'dataViewName', 'vw_company',
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

WITH nodes_payload AS (
  SELECT jsonb_agg(
           jsonb_build_object(
             'id', 'root-field-' || field_id,
             'type', 'field',
             'fieldId', field_id,
             'order', order_index
           )
           ORDER BY order_index
         ) AS nodes_json
    FROM _ps_company_view_node_seed
),
columns_payload AS (
  SELECT jsonb_agg(
           jsonb_build_object(
             'id', 'grid-column-' || field_id,
             'fieldId', field_id,
             'order', order_index
           )
           ORDER BY order_index
         ) AS columns_json
    FROM _ps_company_grid_column_seed
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
  'company',
  'view-default',
  'default',
  'Business Units',
  '',
  'form',
  true,
  true,
  false,
  'draft',
  1,
  0,
  1,
  jsonb_build_object(
    'id', 'view-default',
    'key', 'default',
    'modelId', 'company',
    'name', 'Business Units',
    'title', 'Business Units',
    'displayName', 'Business Units',
    'description', '',
    'kind', 'form',
    'isDefault', true,
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
          'viewRtAlias', 'default',
          'dataViewName', 'vw_company',
          'gridViewName', 'vg_company__default'
        ),
        'nodes', nodes_payload.nodes_json,
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
            'columns', columns_payload.columns_json,
            'sorting', jsonb_build_object(
              'fieldId', 'name',
              'direction', 'asc'
            )
          )
        )
      ),
      'subformScopes', '[]'::jsonb
    )
  ),
  '{}'::jsonb
FROM nodes_payload, columns_payload
ON CONFLICT (model_id, view_id) DO NOTHING;

CREATE OR REPLACE VIEW public.vw_company AS
SELECT
  t.id AS _id,
  t.tenant_id AS tenant_id,
  t.guid AS _guid,
  t.created_at AS _created_at,
  t.updated_at AS _updated_at,
  t.name AS name,
  t.company_type_id AS company_type_id,
  NULLIF(lk_company_type.name::text, '') AS company_type__label,
  t.main_company_id AS main_company_id,
  NULLIF(lk_main_company.name::text, '') AS main_company__label,
  NULLIF(lk_main_company_type.name::text, '') AS main_company__type,
  NULLIF(lk_parent_company.name::text, '') AS main_company__main_company_name,
  COALESCE(NULLIF(lk_main_company_state.name::text, ''), lk_main_company.state_id::text) AS main_company__state,
  t.active AS active,
  t.contact_name AS contact_name,
  t.phone AS phone,
  t.fax AS fax,
  t.email::text AS email,
  t.url AS url,
  t.address_line_1 AS address_line_1,
  t.address_line_2 AS address_line_2,
  t.city AS city,
  t.state_id AS state_id,
  NULLIF(lk_state.name::text, '') AS state__label,
  t.zip AS zip,
  t.timezone_id AS timezone_id,
  NULLIF(lk_timezone.name::text, '') AS timezone__label,
  t.joined_at AS joined_at,
  t.vendor_code AS vendor_code,
  t.tax_id AS tax_id,
  t.naics_code AS naics_code,
  t.product_code AS product_code,
  t.company_number AS company_number,
  t.record_group AS record_group,
  t.geo_code AS geo_code,
  t.contract_number AS contract_number,
  t.premium AS premium,
  t.liaison AS liaison,
  t.description AS description,
  t.company_policy AS company_policy,
  t.safety_policy AS safety_policy,
  t.unemployment_policy AS unemployment_policy
FROM public.company t
LEFT JOIN public.companytype lk_company_type
  ON t.company_type_id = lk_company_type.id
 AND t.tenant_id = lk_company_type.tenant_id
LEFT JOIN public.company lk_main_company
  ON t.main_company_id = lk_main_company.id
 AND t.tenant_id = lk_main_company.tenant_id
LEFT JOIN public.companytype lk_main_company_type
  ON lk_main_company.company_type_id = lk_main_company_type.id
 AND lk_main_company.tenant_id = lk_main_company_type.tenant_id
LEFT JOIN public.company lk_parent_company
  ON lk_main_company.main_company_id = lk_parent_company.id
 AND lk_main_company.tenant_id = lk_parent_company.tenant_id
LEFT JOIN public.state lk_main_company_state
  ON lk_main_company.state_id = lk_main_company_state.id
LEFT JOIN public.state lk_state
  ON t.state_id = lk_state.id
LEFT JOIN public.timezone lk_timezone
  ON t.timezone_id = lk_timezone.id;

CREATE OR REPLACE VIEW public.vg_company__default AS
SELECT
  _id,
  tenant_id,
  _guid,
  _created_at,
  _updated_at,
  name,
  company_type__label AS company_type,
  main_company__label AS main_company,
  contact_name,
  phone,
  city,
  state__label AS state,
  zip,
  active
FROM public.vw_company;

COMMIT;
