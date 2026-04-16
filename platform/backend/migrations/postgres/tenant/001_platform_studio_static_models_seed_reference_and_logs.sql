BEGIN;

-- Seed the first Form Builder static-model metadata subset for every tenant DB.
-- These inserts are intentionally idempotent and non-destructive:
-- - fresh tenant DBs may already receive the same rows from the regenerated bundle
-- - existing tenant DBs may already contain local authoring edits that must survive

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
VALUES
  (
    'state',
    'state',
    'state',
    'State',
    '',
    'external',
    'draft',
    1,
    0,
    1,
    false,
    $json$
    {
      "canEditViewsOnly": false,
      "dataSchema": {
        "modelId": "state",
        "modelTitle": "State",
        "rootScope": {
          "fields": [
            {
              "displayName": "Code",
              "family": "core",
              "fieldId": "code",
              "id": "code",
              "kind": "short_text",
              "label": "Code",
              "runtime": {
                "sourceColumnName": "code",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "code"
            },
            {
              "displayName": "Name",
              "family": "core",
              "fieldId": "name",
              "id": "name",
              "kind": "short_text",
              "label": "Name",
              "runtime": {
                "sourceColumnName": "name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "name"
            }
          ],
          "runtime": {
            "dataViewName": "vw_state",
            "mvTableName": "",
            "rtAlias": "state",
            "sourceIdColumn": "id",
            "tableName": "state",
            "tenantScoped": false
          },
          "schemaScopeId": "root",
          "scopeType": "ROOT"
        },
        "subformScopes": []
      },
      "description": "",
      "displayName": "State",
      "id": "state",
      "isStructureLocked": false,
      "key": "state",
      "layoutBlueprint": {
        "rootScope": {
          "containers": [],
          "fieldPlacements": [
            {
              "containerKey": "__scope_root__",
              "fieldId": "code",
              "order": 0
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "name",
              "order": 1
            }
          ],
          "schemaScopeId": "root",
          "unplacedFieldIds": []
        },
        "subformScopes": []
      },
      "modelLocked": false,
      "name": "State",
      "sourceType": "external",
      "storageKey": "state",
      "title": "State"
    }
    $json$::jsonb
  ),
  (
    'timezone',
    'timezone',
    'timezone',
    'Timezone',
    '',
    'external',
    'draft',
    1,
    0,
    1,
    false,
    $json$
    {
      "canEditViewsOnly": false,
      "dataSchema": {
        "modelId": "timezone",
        "modelTitle": "Timezone",
        "rootScope": {
          "fields": [
            {
              "displayName": "Name",
              "family": "core",
              "fieldId": "name",
              "id": "name",
              "kind": "short_text",
              "label": "Name",
              "runtime": {
                "sourceColumnName": "name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "name"
            }
          ],
          "runtime": {
            "dataViewName": "vw_timezone",
            "mvTableName": "",
            "rtAlias": "timezone",
            "sourceIdColumn": "id",
            "tableName": "timezone",
            "tenantScoped": false
          },
          "schemaScopeId": "root",
          "scopeType": "ROOT"
        },
        "subformScopes": []
      },
      "description": "",
      "displayName": "Timezone",
      "id": "timezone",
      "isStructureLocked": false,
      "key": "timezone",
      "layoutBlueprint": {
        "rootScope": {
          "containers": [],
          "fieldPlacements": [
            {
              "containerKey": "__scope_root__",
              "fieldId": "name",
              "order": 0
            }
          ],
          "schemaScopeId": "root",
          "unplacedFieldIds": []
        },
        "subformScopes": []
      },
      "modelLocked": false,
      "name": "Timezone",
      "sourceType": "external",
      "storageKey": "timezone",
      "title": "Timezone"
    }
    $json$::jsonb
  ),
  (
    'companytype',
    'companytype',
    'companytype',
    'Company Type',
    '',
    'external',
    'draft',
    1,
    0,
    1,
    false,
    $json$
    {
      "canEditViewsOnly": false,
      "dataSchema": {
        "modelId": "companytype",
        "modelTitle": "Company Type",
        "rootScope": {
          "fields": [
            {
              "displayName": "Name",
              "family": "core",
              "fieldId": "name",
              "id": "name",
              "kind": "short_text",
              "label": "Name",
              "runtime": {
                "sourceColumnName": "name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "name"
            },
            {
              "displayName": "Risk",
              "family": "core",
              "fieldId": "risk",
              "id": "risk",
              "kind": "short_text",
              "label": "Risk",
              "runtime": {
                "sourceColumnName": "risk",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "risk"
            }
          ],
          "runtime": {
            "dataViewName": "vw_companytype",
            "mvTableName": "",
            "rtAlias": "companytype",
            "sourceCreatedAtColumn": "created_at",
            "sourceGuidColumn": "guid",
            "sourceIdColumn": "id",
            "sourceTenantIdColumn": "tenant_id",
            "sourceUpdatedAtColumn": "updated_at",
            "tableName": "companytype",
            "tenantScoped": true
          },
          "schemaScopeId": "root",
          "scopeType": "ROOT"
        },
        "subformScopes": []
      },
      "description": "",
      "displayName": "Company Type",
      "id": "companytype",
      "isStructureLocked": false,
      "key": "companytype",
      "layoutBlueprint": {
        "rootScope": {
          "containers": [],
          "fieldPlacements": [
            {
              "containerKey": "__scope_root__",
              "fieldId": "name",
              "order": 0
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "risk",
              "order": 1
            }
          ],
          "schemaScopeId": "root",
          "unplacedFieldIds": []
        },
        "subformScopes": []
      },
      "modelLocked": false,
      "name": "Company Type",
      "sourceType": "external",
      "storageKey": "companytype",
      "title": "Company Type"
    }
    $json$::jsonb
  ),
  (
    'jobtype',
    'jobtype',
    'jobtype',
    'Job Type',
    '',
    'external',
    'draft',
    1,
    0,
    1,
    false,
    $json$
    {
      "canEditViewsOnly": false,
      "dataSchema": {
        "modelId": "jobtype",
        "modelTitle": "Job Type",
        "rootScope": {
          "fields": [
            {
              "displayName": "Name",
              "family": "core",
              "fieldId": "name",
              "id": "name",
              "kind": "short_text",
              "label": "Name",
              "runtime": {
                "sourceColumnName": "name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "name"
            },
            {
              "displayName": "Active",
              "family": "core",
              "fieldId": "active",
              "id": "active",
              "kind": "boolean",
              "label": "Active",
              "runtime": {
                "sourceColumnName": "active",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "active"
            }
          ],
          "runtime": {
            "dataViewName": "vw_jobtype",
            "mvTableName": "",
            "rtAlias": "jobtype",
            "sourceCreatedAtColumn": "created_at",
            "sourceGuidColumn": "guid",
            "sourceIdColumn": "id",
            "sourceTenantIdColumn": "tenant_id",
            "sourceUpdatedAtColumn": "updated_at",
            "tableName": "jobtype",
            "tenantScoped": true
          },
          "schemaScopeId": "root",
          "scopeType": "ROOT"
        },
        "subformScopes": []
      },
      "description": "",
      "displayName": "Job Type",
      "id": "jobtype",
      "isStructureLocked": false,
      "key": "jobtype",
      "layoutBlueprint": {
        "rootScope": {
          "containers": [],
          "fieldPlacements": [
            {
              "containerKey": "__scope_root__",
              "fieldId": "name",
              "order": 0
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "active",
              "order": 1
            }
          ],
          "schemaScopeId": "root",
          "unplacedFieldIds": []
        },
        "subformScopes": []
      },
      "modelLocked": false,
      "name": "Job Type",
      "sourceType": "external",
      "storageKey": "jobtype",
      "title": "Job Type"
    }
    $json$::jsonb
  ),
  (
    'events',
    'events',
    'events',
    'Events',
    '',
    'external',
    'draft',
    1,
    0,
    1,
    false,
    $json$
    {
      "canEditViewsOnly": false,
      "dataSchema": {
        "modelId": "events",
        "modelTitle": "Events",
        "rootScope": {
          "fields": [
            {
              "displayName": "User",
              "family": "preset",
              "fieldId": "user",
              "id": "user",
              "kind": "db_lookup",
              "label": "User",
              "lookupConfig": {
                "sourceModel": "contacts"
              },
              "preset": "contact_lookup",
              "runtime": {
                "sourceColumnName": "user_id",
                "sourceValueKind": "lookup_id"
              },
              "selectionMode": "single",
              "schemaScopeId": "root",
              "sourceLabel": "Contacts",
              "status": "persisted",
              "storageKey": "user"
            },
            {
              "displayName": "Principal GUID",
              "family": "core",
              "fieldId": "principal_guid",
              "id": "principal_guid",
              "kind": "short_text",
              "label": "Principal GUID",
              "runtime": {
                "sourceColumnName": "principal_guid",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "principal_guid"
            },
            {
              "displayName": "Occurred At",
              "family": "core",
              "fieldId": "occurred_at",
              "id": "occurred_at",
              "kind": "date_time",
              "label": "Occurred At",
              "runtime": {
                "sourceColumnName": "occurred_at",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "occurred_at"
            },
            {
              "displayName": "Event",
              "family": "core",
              "fieldId": "event",
              "id": "event",
              "kind": "short_text",
              "label": "Event",
              "runtime": {
                "sourceColumnName": "event",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "event"
            },
            {
              "displayName": "Module",
              "family": "core",
              "fieldId": "module",
              "id": "module",
              "kind": "short_text",
              "label": "Module",
              "runtime": {
                "sourceColumnName": "module",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "module"
            },
            {
              "displayName": "Record ID",
              "family": "core",
              "fieldId": "record_id",
              "id": "record_id",
              "kind": "integer",
              "label": "Record ID",
              "runtime": {
                "sourceColumnName": "record_id",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "record_id"
            },
            {
              "displayName": "Table Name",
              "family": "core",
              "fieldId": "table_name",
              "id": "table_name",
              "kind": "short_text",
              "label": "Table Name",
              "runtime": {
                "sourceColumnName": "table_name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "table_name"
            },
            {
              "displayName": "Text",
              "family": "core",
              "fieldId": "text",
              "id": "text",
              "kind": "long_text",
              "label": "Text",
              "runtime": {
                "sourceColumnName": "text",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "text"
            },
            {
              "displayName": "Timezone Name",
              "family": "core",
              "fieldId": "timezone_name",
              "id": "timezone_name",
              "kind": "short_text",
              "label": "Timezone Name",
              "runtime": {
                "sourceColumnName": "timezone_name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "timezone_name"
            },
            {
              "displayName": "User IP",
              "family": "core",
              "fieldId": "user_ip",
              "id": "user_ip",
              "kind": "short_text",
              "label": "User IP",
              "runtime": {
                "sourceColumnName": "user_ip",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "user_ip"
            },
            {
              "displayName": "Recipients",
              "family": "core",
              "fieldId": "recipients",
              "id": "recipients",
              "kind": "long_text",
              "label": "Recipients",
              "runtime": {
                "sourceColumnName": "recipients",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "recipients"
            },
            {
              "displayName": "Subject",
              "family": "core",
              "fieldId": "subject",
              "id": "subject",
              "kind": "short_text",
              "label": "Subject",
              "runtime": {
                "sourceColumnName": "subject",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "subject"
            },
            {
              "displayName": "Body",
              "family": "core",
              "fieldId": "body",
              "id": "body",
              "kind": "long_text",
              "label": "Body",
              "runtime": {
                "sourceColumnName": "body",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "body"
            }
          ],
          "runtime": {
            "dataViewName": "vw_events",
            "mvTableName": "",
            "rtAlias": "events",
            "sourceCreatedAtColumn": "created_at",
            "sourceGuidColumn": "guid",
            "sourceIdColumn": "id",
            "sourceTenantIdColumn": "tenant_id",
            "sourceUpdatedAtColumn": "updated_at",
            "tableName": "events",
            "tenantScoped": true
          },
          "schemaScopeId": "root",
          "scopeType": "ROOT"
        },
        "subformScopes": []
      },
      "description": "",
      "displayName": "Events",
      "id": "events",
      "isStructureLocked": false,
      "key": "events",
      "layoutBlueprint": {
        "rootScope": {
          "containers": [],
          "fieldPlacements": [
            {
              "containerKey": "__scope_root__",
              "fieldId": "user",
              "order": 0
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "principal_guid",
              "order": 1
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "occurred_at",
              "order": 2
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "event",
              "order": 3
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "module",
              "order": 4
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "record_id",
              "order": 5
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "table_name",
              "order": 6
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "text",
              "order": 7
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "timezone_name",
              "order": 8
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "user_ip",
              "order": 9
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "recipients",
              "order": 10
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "subject",
              "order": 11
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "body",
              "order": 12
            }
          ],
          "schemaScopeId": "root",
          "unplacedFieldIds": []
        },
        "subformScopes": []
      },
      "modelLocked": false,
      "name": "Events",
      "sourceType": "external",
      "storageKey": "events",
      "title": "Events"
    }
    $json$::jsonb
  ),
  (
    'mails',
    'mails',
    'mails',
    'Mails',
    '',
    'external',
    'draft',
    1,
    0,
    1,
    false,
    $json$
    {
      "canEditViewsOnly": false,
      "dataSchema": {
        "modelId": "mails",
        "modelTitle": "Mails",
        "rootScope": {
          "fields": [
            {
              "displayName": "User",
              "family": "preset",
              "fieldId": "user",
              "id": "user",
              "kind": "db_lookup",
              "label": "User",
              "lookupConfig": {
                "sourceModel": "contacts"
              },
              "preset": "contact_lookup",
              "runtime": {
                "sourceColumnName": "user_id",
                "sourceValueKind": "lookup_id"
              },
              "selectionMode": "single",
              "schemaScopeId": "root",
              "sourceLabel": "Contacts",
              "status": "persisted",
              "storageKey": "user"
            },
            {
              "displayName": "Sent At",
              "family": "core",
              "fieldId": "sent_at",
              "id": "sent_at",
              "kind": "date_time",
              "label": "Sent At",
              "runtime": {
                "sourceColumnName": "sent_at",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "sent_at"
            },
            {
              "displayName": "Timezone Name",
              "family": "core",
              "fieldId": "timezone_name",
              "id": "timezone_name",
              "kind": "short_text",
              "label": "Timezone Name",
              "runtime": {
                "sourceColumnName": "timezone_name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "timezone_name"
            },
            {
              "displayName": "From Address",
              "family": "core",
              "fieldId": "from_address",
              "id": "from_address",
              "kind": "short_text",
              "label": "From Address",
              "runtime": {
                "sourceColumnName": "from_address",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "from_address"
            },
            {
              "displayName": "To Addresses",
              "family": "core",
              "fieldId": "to_addresses",
              "id": "to_addresses",
              "kind": "long_text",
              "label": "To Addresses",
              "runtime": {
                "sourceColumnName": "to_addresses",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "to_addresses"
            },
            {
              "displayName": "CC Addresses",
              "family": "core",
              "fieldId": "cc_addresses",
              "id": "cc_addresses",
              "kind": "long_text",
              "label": "CC Addresses",
              "runtime": {
                "sourceColumnName": "cc_addresses",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "cc_addresses"
            },
            {
              "displayName": "BCC Addresses",
              "family": "core",
              "fieldId": "bcc_addresses",
              "id": "bcc_addresses",
              "kind": "long_text",
              "label": "BCC Addresses",
              "runtime": {
                "sourceColumnName": "bcc_addresses",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "bcc_addresses"
            },
            {
              "displayName": "Subject",
              "family": "core",
              "fieldId": "subject",
              "id": "subject",
              "kind": "short_text",
              "label": "Subject",
              "runtime": {
                "sourceColumnName": "subject",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "subject"
            },
            {
              "displayName": "Body",
              "family": "core",
              "fieldId": "body",
              "id": "body",
              "kind": "long_text",
              "label": "Body",
              "runtime": {
                "sourceColumnName": "body",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "body"
            },
            {
              "displayName": "Sender Name",
              "family": "core",
              "fieldId": "sender_name",
              "id": "sender_name",
              "kind": "short_text",
              "label": "Sender Name",
              "runtime": {
                "sourceColumnName": "sender_name",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "sender_name"
            },
            {
              "displayName": "Target Table",
              "family": "core",
              "fieldId": "target_table",
              "id": "target_table",
              "kind": "short_text",
              "label": "Target Table",
              "runtime": {
                "sourceColumnName": "target_table",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "target_table"
            },
            {
              "displayName": "Target Record ID",
              "family": "core",
              "fieldId": "target_record_id",
              "id": "target_record_id",
              "kind": "integer",
              "label": "Target Record ID",
              "runtime": {
                "sourceColumnName": "target_record_id",
                "sourceValueKind": "scalar"
              },
              "schemaScopeId": "root",
              "status": "persisted",
              "storageKey": "target_record_id"
            }
          ],
          "runtime": {
            "dataViewName": "vw_mails",
            "mvTableName": "",
            "rtAlias": "mails",
            "sourceCreatedAtColumn": "created_at",
            "sourceGuidColumn": "guid",
            "sourceIdColumn": "id",
            "sourceTenantIdColumn": "tenant_id",
            "sourceUpdatedAtColumn": "updated_at",
            "tableName": "mails",
            "tenantScoped": true
          },
          "schemaScopeId": "root",
          "scopeType": "ROOT"
        },
        "subformScopes": []
      },
      "description": "",
      "displayName": "Mails",
      "id": "mails",
      "isStructureLocked": false,
      "key": "mails",
      "layoutBlueprint": {
        "rootScope": {
          "containers": [],
          "fieldPlacements": [
            {
              "containerKey": "__scope_root__",
              "fieldId": "user",
              "order": 0
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "sent_at",
              "order": 1
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "timezone_name",
              "order": 2
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "from_address",
              "order": 3
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "to_addresses",
              "order": 4
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "cc_addresses",
              "order": 5
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "bcc_addresses",
              "order": 6
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "subject",
              "order": 7
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "body",
              "order": 8
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "sender_name",
              "order": 9
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "target_table",
              "order": 10
            },
            {
              "containerKey": "__scope_root__",
              "fieldId": "target_record_id",
              "order": 11
            }
          ],
          "schemaScopeId": "root",
          "unplacedFieldIds": []
        },
        "subformScopes": []
      },
      "modelLocked": false,
      "name": "Mails",
      "sourceType": "external",
      "storageKey": "mails",
      "title": "Mails"
    }
    $json$::jsonb
  )
ON CONFLICT (model_id) DO NOTHING;

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
VALUES
  (
    'state',
    'view-default',
    'default',
    'State',
    '',
    'form',
    true,
    true,
    false,
    'draft',
    1,
    0,
    1,
    $json$
    {
      "description": "",
      "displayName": "State",
      "id": "view-default",
      "isActive": true,
      "isDefault": true,
      "isViewLocked": false,
      "key": "default",
      "kind": "form",
      "modelId": "state",
      "name": "State",
      "title": "State",
      "uiSchema": {
        "rootScope": {
          "filterDefinitions": {
            "defaultFilters": {
              "conditions": [],
              "logic": "and"
            },
            "quickFilters": [],
            "version": 1
          },
          "nodes": [
            {
              "fieldId": "code",
              "id": "root-field-code",
              "order": 0,
              "type": "field"
            },
            {
              "fieldId": "name",
              "id": "root-field-name",
              "order": 1,
              "type": "field"
            }
          ],
          "runtime": {
            "dataViewName": "vw_state",
            "gridViewName": "vg_state__default",
            "viewRtAlias": "default"
          },
          "schemaScopeId": "root",
          "unplacedFieldIds": [],
          "viewSettings": {
            "actions": {
              "canAdd": true,
              "canDelete": true,
              "canEdit": true,
              "canView": true
            },
            "list": {
              "columns": [
                {
                  "fieldId": "code",
                  "id": "grid-column-code",
                  "order": 0,
                  "visible": true
                },
                {
                  "fieldId": "name",
                  "id": "grid-column-name",
                  "order": 1,
                  "visible": true
                }
              ],
              "sorting": {
                "direction": "asc"
              }
            }
          }
        },
        "subformScopes": []
      },
      "viewLocked": false
    }
    $json$::jsonb,
    '{}'::jsonb
  ),
  (
    'timezone',
    'view-default',
    'default',
    'Timezone',
    '',
    'form',
    true,
    true,
    false,
    'draft',
    1,
    0,
    1,
    $json$
    {
      "description": "",
      "displayName": "Timezone",
      "id": "view-default",
      "isActive": true,
      "isDefault": true,
      "isViewLocked": false,
      "key": "default",
      "kind": "form",
      "modelId": "timezone",
      "name": "Timezone",
      "title": "Timezone",
      "uiSchema": {
        "rootScope": {
          "filterDefinitions": {
            "defaultFilters": {
              "conditions": [],
              "logic": "and"
            },
            "quickFilters": [],
            "version": 1
          },
          "nodes": [
            {
              "fieldId": "name",
              "id": "root-field-name",
              "order": 0,
              "type": "field"
            }
          ],
          "runtime": {
            "dataViewName": "vw_timezone",
            "gridViewName": "vg_timezone__default",
            "viewRtAlias": "default"
          },
          "schemaScopeId": "root",
          "unplacedFieldIds": [],
          "viewSettings": {
            "actions": {
              "canAdd": true,
              "canDelete": true,
              "canEdit": true,
              "canView": true
            },
            "list": {
              "columns": [
                {
                  "fieldId": "name",
                  "id": "grid-column-name",
                  "order": 0,
                  "visible": true
                }
              ],
              "sorting": {
                "direction": "asc"
              }
            }
          }
        },
        "subformScopes": []
      },
      "viewLocked": false
    }
    $json$::jsonb,
    '{}'::jsonb
  ),
  (
    'companytype',
    'view-default',
    'default',
    'Company Type',
    '',
    'form',
    true,
    true,
    false,
    'draft',
    1,
    0,
    1,
    $json$
    {
      "description": "",
      "displayName": "Company Type",
      "id": "view-default",
      "isActive": true,
      "isDefault": true,
      "isViewLocked": false,
      "key": "default",
      "kind": "form",
      "modelId": "companytype",
      "name": "Company Type",
      "title": "Company Type",
      "uiSchema": {
        "rootScope": {
          "filterDefinitions": {
            "defaultFilters": {
              "conditions": [],
              "logic": "and"
            },
            "quickFilters": [],
            "version": 1
          },
          "nodes": [
            {
              "fieldId": "name",
              "id": "root-field-name",
              "order": 0,
              "type": "field"
            },
            {
              "fieldId": "risk",
              "id": "root-field-risk",
              "order": 1,
              "type": "field"
            }
          ],
          "runtime": {
            "dataViewName": "vw_companytype",
            "gridViewName": "vg_companytype__default",
            "viewRtAlias": "default"
          },
          "schemaScopeId": "root",
          "unplacedFieldIds": [],
          "viewSettings": {
            "actions": {
              "canAdd": true,
              "canDelete": true,
              "canEdit": true,
              "canView": true
            },
            "list": {
              "columns": [
                {
                  "fieldId": "name",
                  "id": "grid-column-name",
                  "order": 0,
                  "visible": true
                },
                {
                  "fieldId": "risk",
                  "id": "grid-column-risk",
                  "order": 1,
                  "visible": true
                }
              ],
              "sorting": {
                "direction": "asc"
              }
            }
          }
        },
        "subformScopes": []
      },
      "viewLocked": false
    }
    $json$::jsonb,
    '{}'::jsonb
  ),
  (
    'jobtype',
    'view-default',
    'default',
    'Job Type',
    '',
    'form',
    true,
    true,
    false,
    'draft',
    1,
    0,
    1,
    $json$
    {
      "description": "",
      "displayName": "Job Type",
      "id": "view-default",
      "isActive": true,
      "isDefault": true,
      "isViewLocked": false,
      "key": "default",
      "kind": "form",
      "modelId": "jobtype",
      "name": "Job Type",
      "title": "Job Type",
      "uiSchema": {
        "rootScope": {
          "filterDefinitions": {
            "defaultFilters": {
              "conditions": [],
              "logic": "and"
            },
            "quickFilters": [],
            "version": 1
          },
          "nodes": [
            {
              "fieldId": "name",
              "id": "root-field-name",
              "order": 0,
              "type": "field"
            },
            {
              "fieldId": "active",
              "id": "root-field-active",
              "order": 1,
              "type": "field"
            }
          ],
          "runtime": {
            "dataViewName": "vw_jobtype",
            "gridViewName": "vg_jobtype__default",
            "viewRtAlias": "default"
          },
          "schemaScopeId": "root",
          "unplacedFieldIds": [],
          "viewSettings": {
            "actions": {
              "canAdd": true,
              "canDelete": true,
              "canEdit": true,
              "canView": true
            },
            "list": {
              "columns": [
                {
                  "fieldId": "name",
                  "id": "grid-column-name",
                  "order": 0,
                  "visible": true
                },
                {
                  "fieldId": "active",
                  "id": "grid-column-active",
                  "order": 1,
                  "visible": true
                }
              ],
              "sorting": {
                "direction": "asc"
              }
            }
          }
        },
        "subformScopes": []
      },
      "viewLocked": false
    }
    $json$::jsonb,
    '{}'::jsonb
  ),
  (
    'events',
    'view-default',
    'default',
    'Events',
    '',
    'form',
    true,
    true,
    false,
    'draft',
    1,
    0,
    1,
    $json$
    {
      "description": "",
      "displayName": "Events",
      "id": "view-default",
      "isActive": true,
      "isDefault": true,
      "isViewLocked": false,
      "key": "default",
      "kind": "form",
      "modelId": "events",
      "name": "Events",
      "title": "Events",
      "uiSchema": {
        "rootScope": {
          "filterDefinitions": {
            "defaultFilters": {
              "conditions": [],
              "logic": "and"
            },
            "quickFilters": [],
            "version": 1
          },
          "nodes": [
            {
              "fieldId": "user",
              "id": "root-field-user",
              "order": 0,
              "type": "field"
            },
            {
              "fieldId": "principal_guid",
              "id": "root-field-principal_guid",
              "order": 1,
              "type": "field"
            },
            {
              "fieldId": "occurred_at",
              "id": "root-field-occurred_at",
              "order": 2,
              "type": "field"
            },
            {
              "fieldId": "event",
              "id": "root-field-event",
              "order": 3,
              "type": "field"
            },
            {
              "fieldId": "module",
              "id": "root-field-module",
              "order": 4,
              "type": "field"
            },
            {
              "fieldId": "record_id",
              "id": "root-field-record_id",
              "order": 5,
              "type": "field"
            },
            {
              "fieldId": "table_name",
              "id": "root-field-table_name",
              "order": 6,
              "type": "field"
            },
            {
              "fieldId": "text",
              "id": "root-field-text",
              "order": 7,
              "type": "field"
            },
            {
              "fieldId": "timezone_name",
              "id": "root-field-timezone_name",
              "order": 8,
              "type": "field"
            },
            {
              "fieldId": "user_ip",
              "id": "root-field-user_ip",
              "order": 9,
              "type": "field"
            },
            {
              "fieldId": "recipients",
              "id": "root-field-recipients",
              "order": 10,
              "type": "field"
            },
            {
              "fieldId": "subject",
              "id": "root-field-subject",
              "order": 11,
              "type": "field"
            },
            {
              "fieldId": "body",
              "id": "root-field-body",
              "order": 12,
              "type": "field"
            }
          ],
          "runtime": {
            "dataViewName": "vw_events",
            "gridViewName": "vg_events__default",
            "viewRtAlias": "default"
          },
          "schemaScopeId": "root",
          "unplacedFieldIds": [],
          "viewSettings": {
            "actions": {
              "canAdd": true,
              "canDelete": true,
              "canEdit": true,
              "canView": true
            },
            "list": {
              "columns": [
                {
                  "fieldId": "user",
                  "id": "grid-column-user",
                  "order": 0,
                  "visible": true
                },
                {
                  "fieldId": "principal_guid",
                  "id": "grid-column-principal_guid",
                  "order": 1,
                  "visible": true
                },
                {
                  "fieldId": "occurred_at",
                  "id": "grid-column-occurred_at",
                  "order": 2,
                  "visible": true
                },
                {
                  "fieldId": "event",
                  "id": "grid-column-event",
                  "order": 3,
                  "visible": true
                },
                {
                  "fieldId": "module",
                  "id": "grid-column-module",
                  "order": 4,
                  "visible": true
                },
                {
                  "fieldId": "record_id",
                  "id": "grid-column-record_id",
                  "order": 5,
                  "visible": true
                },
                {
                  "fieldId": "table_name",
                  "id": "grid-column-table_name",
                  "order": 6,
                  "visible": true
                },
                {
                  "fieldId": "text",
                  "id": "grid-column-text",
                  "order": 7,
                  "visible": true
                },
                {
                  "fieldId": "timezone_name",
                  "id": "grid-column-timezone_name",
                  "order": 8,
                  "visible": true
                },
                {
                  "fieldId": "user_ip",
                  "id": "grid-column-user_ip",
                  "order": 9,
                  "visible": true
                },
                {
                  "fieldId": "recipients",
                  "id": "grid-column-recipients",
                  "order": 10,
                  "visible": true
                },
                {
                  "fieldId": "subject",
                  "id": "grid-column-subject",
                  "order": 11,
                  "visible": true
                },
                {
                  "fieldId": "body",
                  "id": "grid-column-body",
                  "order": 12,
                  "visible": true
                }
              ],
              "sorting": {
                "direction": "asc"
              }
            }
          }
        },
        "subformScopes": []
      },
      "viewLocked": false
    }
    $json$::jsonb,
    '{}'::jsonb
  ),
  (
    'mails',
    'view-default',
    'default',
    'Mails',
    '',
    'form',
    true,
    true,
    false,
    'draft',
    1,
    0,
    1,
    $json$
    {
      "description": "",
      "displayName": "Mails",
      "id": "view-default",
      "isActive": true,
      "isDefault": true,
      "isViewLocked": false,
      "key": "default",
      "kind": "form",
      "modelId": "mails",
      "name": "Mails",
      "title": "Mails",
      "uiSchema": {
        "rootScope": {
          "filterDefinitions": {
            "defaultFilters": {
              "conditions": [],
              "logic": "and"
            },
            "quickFilters": [],
            "version": 1
          },
          "nodes": [
            {
              "fieldId": "user",
              "id": "root-field-user",
              "order": 0,
              "type": "field"
            },
            {
              "fieldId": "sent_at",
              "id": "root-field-sent_at",
              "order": 1,
              "type": "field"
            },
            {
              "fieldId": "timezone_name",
              "id": "root-field-timezone_name",
              "order": 2,
              "type": "field"
            },
            {
              "fieldId": "from_address",
              "id": "root-field-from_address",
              "order": 3,
              "type": "field"
            },
            {
              "fieldId": "to_addresses",
              "id": "root-field-to_addresses",
              "order": 4,
              "type": "field"
            },
            {
              "fieldId": "cc_addresses",
              "id": "root-field-cc_addresses",
              "order": 5,
              "type": "field"
            },
            {
              "fieldId": "bcc_addresses",
              "id": "root-field-bcc_addresses",
              "order": 6,
              "type": "field"
            },
            {
              "fieldId": "subject",
              "id": "root-field-subject",
              "order": 7,
              "type": "field"
            },
            {
              "fieldId": "body",
              "id": "root-field-body",
              "order": 8,
              "type": "field"
            },
            {
              "fieldId": "sender_name",
              "id": "root-field-sender_name",
              "order": 9,
              "type": "field"
            },
            {
              "fieldId": "target_table",
              "id": "root-field-target_table",
              "order": 10,
              "type": "field"
            },
            {
              "fieldId": "target_record_id",
              "id": "root-field-target_record_id",
              "order": 11,
              "type": "field"
            }
          ],
          "runtime": {
            "dataViewName": "vw_mails",
            "gridViewName": "vg_mails__default",
            "viewRtAlias": "default"
          },
          "schemaScopeId": "root",
          "unplacedFieldIds": [],
          "viewSettings": {
            "actions": {
              "canAdd": true,
              "canDelete": true,
              "canEdit": true,
              "canView": true
            },
            "list": {
              "columns": [
                {
                  "fieldId": "user",
                  "id": "grid-column-user",
                  "order": 0,
                  "visible": true
                },
                {
                  "fieldId": "sent_at",
                  "id": "grid-column-sent_at",
                  "order": 1,
                  "visible": true
                },
                {
                  "fieldId": "timezone_name",
                  "id": "grid-column-timezone_name",
                  "order": 2,
                  "visible": true
                },
                {
                  "fieldId": "from_address",
                  "id": "grid-column-from_address",
                  "order": 3,
                  "visible": true
                },
                {
                  "fieldId": "to_addresses",
                  "id": "grid-column-to_addresses",
                  "order": 4,
                  "visible": true
                },
                {
                  "fieldId": "cc_addresses",
                  "id": "grid-column-cc_addresses",
                  "order": 5,
                  "visible": true
                },
                {
                  "fieldId": "bcc_addresses",
                  "id": "grid-column-bcc_addresses",
                  "order": 6,
                  "visible": true
                },
                {
                  "fieldId": "subject",
                  "id": "grid-column-subject",
                  "order": 7,
                  "visible": true
                },
                {
                  "fieldId": "body",
                  "id": "grid-column-body",
                  "order": 8,
                  "visible": true
                },
                {
                  "fieldId": "sender_name",
                  "id": "grid-column-sender_name",
                  "order": 9,
                  "visible": true
                },
                {
                  "fieldId": "target_table",
                  "id": "grid-column-target_table",
                  "order": 10,
                  "visible": true
                },
                {
                  "fieldId": "target_record_id",
                  "id": "grid-column-target_record_id",
                  "order": 11,
                  "visible": true
                }
              ],
              "sorting": {
                "direction": "asc"
              }
            }
          }
        },
        "subformScopes": []
      },
      "viewLocked": false
    }
    $json$::jsonb,
    '{}'::jsonb
  )
ON CONFLICT (model_id, view_id) DO NOTHING;

COMMIT;
