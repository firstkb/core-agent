BEGIN;

-- Migration 008 seeded the Projects UI nodes without explicit containerKey
-- metadata. Authoring reconciliation then created a second canonical tab set
-- and left the first one empty. Rewrite the stored static metadata to one
-- canonical tab container tree shared by model layout and view UI nodes.

CREATE TEMP TABLE _ps_projects_layout_container_fix (
  container_key        TEXT PRIMARY KEY,
  type                 TEXT NOT NULL,
  title                TEXT,
  parent_container_key TEXT NOT NULL,
  order_index          INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_projects_layout_container_fix (
  container_key,
  type,
  title,
  parent_container_key,
  order_index
)
VALUES
  ('root.tabs.projects', 'tabs', NULL, '', 0),
  ('root.tabs.projects.main', 'tab_item', 'Main', 'root.tabs.projects', 0),
  ('root.tabs.projects.details', 'tab_item', 'Details', 'root.tabs.projects', 1);

CREATE TEMP TABLE _ps_projects_field_placement_fix (
  field_id      TEXT PRIMARY KEY,
  container_key TEXT NOT NULL,
  order_index   INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_projects_field_placement_fix (field_id, container_key, order_index)
VALUES
  ('project_number', 'root.tabs.projects.main', 0),
  ('name', 'root.tabs.projects.main', 1),
  ('year', 'root.tabs.projects.main', 2),
  ('start_date', 'root.tabs.projects.main', 3),
  ('end_date', 'root.tabs.projects.main', 4),
  ('contract_value', 'root.tabs.projects.main', 5),
  ('company', 'root.tabs.projects.main', 6),
  ('cm', 'root.tabs.projects.main', 7),
  ('gc', 'root.tabs.projects.main', 8),
  ('naics_code', 'root.tabs.projects.main', 9),
  ('industry_description', 'root.tabs.projects.main', 10),
  ('avg', 'root.tabs.projects.main', 11),
  ('status', 'root.tabs.projects.main', 12),
  ('active', 'root.tabs.projects.main', 13),
  ('industry_size', 'root.tabs.projects.main', 14),
  ('industry_type', 'root.tabs.projects.main', 15),
  ('address_line_1', 'root.tabs.projects.details', 0),
  ('address_line_2', 'root.tabs.projects.details', 1),
  ('phone', 'root.tabs.projects.details', 2),
  ('fax', 'root.tabs.projects.details', 3),
  ('email', 'root.tabs.projects.details', 4),
  ('city', 'root.tabs.projects.details', 5),
  ('zip', 'root.tabs.projects.details', 6),
  ('state', 'root.tabs.projects.details', 7),
  ('contact', 'root.tabs.projects.details', 8),
  ('geo_code', 'root.tabs.projects.details', 9),
  ('description', 'root.tabs.projects.details', 10),
  ('info', 'root.tabs.projects.details', 11);

CREATE TEMP TABLE _ps_projects_view_node_fix (
  node_id       TEXT PRIMARY KEY,
  node_type     TEXT NOT NULL,
  field_id      TEXT,
  title         TEXT,
  parent_id     TEXT,
  container_key TEXT,
  order_index   INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ps_projects_view_node_fix (
  node_id,
  node_type,
  field_id,
  title,
  parent_id,
  container_key,
  order_index
)
VALUES
  ('root-tabs-projects', 'tabs', NULL, NULL, NULL, 'root.tabs.projects', 0),
  ('root-tab-main', 'tab_item', NULL, 'Main', 'root-tabs-projects', 'root.tabs.projects.main', 0),
  ('root-tab-details', 'tab_item', NULL, 'Details', 'root-tabs-projects', 'root.tabs.projects.details', 1);

INSERT INTO _ps_projects_view_node_fix (
  node_id,
  node_type,
  field_id,
  title,
  parent_id,
  container_key,
  order_index
)
SELECT
  'root-field-' || placement.field_id,
  'field',
  placement.field_id,
  NULL,
  CASE placement.container_key
    WHEN 'root.tabs.projects.main' THEN 'root-tab-main'
    ELSE 'root-tab-details'
  END,
  NULL,
  placement.order_index
FROM _ps_projects_field_placement_fix placement;

WITH layout_payload AS (
  SELECT
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'containerKey', container_key,
                 'type', type,
                 'title', title,
                 'parentContainerKey', parent_container_key,
                 'order', order_index
               )
               ORDER BY
                 CASE WHEN parent_container_key = '' THEN 0 ELSE 1 END,
                 parent_container_key,
                 order_index
             )
        FROM _ps_projects_layout_container_fix
    ) AS containers_json,
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'containerKey', container_key,
                 'fieldId', field_id,
                 'order', order_index
               )
               ORDER BY container_key, order_index
             )
        FROM _ps_projects_field_placement_fix
    ) AS placements_json
)
UPDATE ps_model
   SET definition_json =
       jsonb_set(
         jsonb_set(
           jsonb_set(
             definition_json,
             '{layoutBlueprint,rootScope,containers}',
             layout_payload.containers_json,
             true
           ),
           '{layoutBlueprint,rootScope,fieldPlacements}',
           layout_payload.placements_json,
           true
         ),
         '{layoutBlueprint,rootScope,unplacedFieldIds}',
         '[]'::jsonb,
         true
       )
  FROM layout_payload
 WHERE ps_model.model_id = 'projects';

WITH nodes_payload AS (
  SELECT jsonb_agg(
           jsonb_strip_nulls(jsonb_build_object(
             'id', node_id,
             'type', node_type,
             'fieldId', field_id,
             'title', title,
             'parentId', parent_id,
             'containerKey', container_key,
             'order', order_index
           ))
           ORDER BY
             CASE
               WHEN node_id = 'root-tabs-projects' THEN 0
               WHEN node_id = 'root-tab-main' THEN 1
               WHEN parent_id = 'root-tab-main' THEN 2
               WHEN node_id = 'root-tab-details' THEN 3
               ELSE 4
             END,
             order_index
         ) AS nodes_json
    FROM _ps_projects_view_node_fix
)
UPDATE ps_view
   SET definition_json =
       jsonb_set(
         jsonb_set(
           jsonb_set(
             jsonb_set(
               definition_json,
               '{uiSchema,currentParentId}',
               'null'::jsonb,
               true
             ),
             '{uiSchema,rootScope,nodes}',
             nodes_payload.nodes_json,
             true
           ),
           '{uiSchema,rootScope,selectedNodeId}',
           'null'::jsonb,
           true
         ),
         '{uiSchema,rootScope,unplacedFieldIds}',
         '[]'::jsonb,
         true
       )
  FROM nodes_payload
 WHERE ps_view.model_id = 'projects'
   AND ps_view.view_id = 'view-default';

COMMIT;
