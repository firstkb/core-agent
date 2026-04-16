# Static Models Phase 1 Reference Schema Pack v1

Status: draft
Date: 2026-04-15

## Purpose

This document defines the exact phase 1 static-model schema packages for the reference and lookup tables that must be designed before `company` and `users`.

It covers:

- `state`
- `timezone`
- `companytype`
- `jobtype`

For each table it provides:

- exact root `dataSchema`
- exact root `layoutBlueprint`
- exact default `uiSchema`
- explicit root runtime blocks
- explicit exclusions
- open questions
- migration-ready `ps_model` / `ps_view` seed notes

This document is the concrete schema-design input for the accepted runtime contract.
The FE/BE runtime patch required by phase 1 has already landed and these schema packages must follow that shape exactly.

## Shared Locked Rules

- all phase 1 tables use `sourceType = external`
- all phase 1 tables are root-scope only
- all phase 1 tables seed exactly one authored view: `default`
- one canonical `vw_*` exists per model root scope
- one `vg_*` exists per authored view
- system/storage columns do not become ordinary business fields
- root form composition uses scope-root placement only in phase 1
- no secondary views are seeded unless there is a separate evidenced use case

## Table 1. `state`

Classification:

- `sourceType = external`
- `tenantScoped = false`
- default view only

### Exact `dataSchema`

```json
{
  "modelId": "state",
  "modelTitle": "State",
  "rootScope": {
    "schemaScopeId": "root",
    "scopeType": "ROOT",
    "fields": [
      {
        "family": "core",
        "id": "code",
        "kind": "short_text",
        "label": "Code",
        "displayName": "Code",
        "fieldId": "code",
        "storageKey": "code",
        "schemaScopeId": "root",
        "status": "persisted",
        "runtime": {
          "sourceColumnName": "code",
          "sourceValueKind": "scalar"
        }
      },
      {
        "family": "core",
        "id": "name",
        "kind": "short_text",
        "label": "Name",
        "displayName": "Name",
        "fieldId": "name",
        "storageKey": "name",
        "schemaScopeId": "root",
        "status": "persisted",
        "runtime": {
          "sourceColumnName": "name",
          "sourceValueKind": "scalar"
        }
      }
    ],
    "runtime": {
      "rtAlias": "state",
      "tableName": "state",
      "mvTableName": "",
      "dataViewName": "vw_state",
      "tenantScoped": false,
      "sourceIdColumn": "id"
    }
  },
  "subformScopes": []
}
```

### Exact `layoutBlueprint`

```json
{
  "rootScope": {
    "schemaScopeId": "root",
    "containers": [],
    "fieldPlacements": [
      {
        "fieldId": "code",
        "containerKey": "__scope_root__",
        "order": 0
      },
      {
        "fieldId": "name",
        "containerKey": "__scope_root__",
        "order": 1
      }
    ],
    "unplacedFieldIds": []
  },
  "subformScopes": []
}
```

### Exact Default `uiSchema`

```json
{
  "uiSchema": {
    "rootScope": {
      "schemaScopeId": "root",
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
      "unplacedFieldIds": [],
      "filterDefinitions": {
        "defaultFilters": {
          "conditions": [],
          "logic": "and"
        },
        "quickFilters": [],
        "version": 1
      },
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
      },
      "runtime": {
        "viewRtAlias": "default",
        "dataViewName": "vw_state",
        "gridViewName": "vg_state__default"
      }
    },
    "subformScopes": []
  }
}
```

### Explicit Exclusions

- `id` stays a system/root-record surface, not an authored business field
- no `Doc.id` view-only node is seeded in phase 1

### Open Questions

- no table-specific open questions beyond the shared runtime delta described later in this document

### Migration-Ready Seed Notes

- `ps_model.model_id = state`
- `ps_model.model_key = state`
- `ps_model.storage_key = state`
- `ps_model.display_name = State`
- `ps_model.source_type = external`
- `ps_model.structure_version = 1`
- `ps_view.view_id = view-default`
- `ps_view.view_key = default`
- `ps_view.display_name = State`
- `ps_view.is_default = true`
- `ps_view.is_active = true`
- `ps_view.last_aligned_model_structure_version = 1`
- downstream lookups should treat `name` as the primary display field
- `code` remains a first-class field and default grid column, but not the primary lookup label

## Table 2. `timezone`

Classification:

- `sourceType = external`
- `tenantScoped = false`
- default view only

### Exact `dataSchema`

```json
{
  "modelId": "timezone",
  "modelTitle": "Timezone",
  "rootScope": {
    "schemaScopeId": "root",
    "scopeType": "ROOT",
    "fields": [
      {
        "family": "core",
        "id": "name",
        "kind": "short_text",
        "label": "Name",
        "displayName": "Name",
        "fieldId": "name",
        "storageKey": "name",
        "schemaScopeId": "root",
        "status": "persisted",
        "runtime": {
          "sourceColumnName": "name",
          "sourceValueKind": "scalar"
        }
      }
    ],
    "runtime": {
      "rtAlias": "timezone",
      "tableName": "timezone",
      "mvTableName": "",
      "dataViewName": "vw_timezone",
      "tenantScoped": false,
      "sourceIdColumn": "id"
    }
  },
  "subformScopes": []
}
```

### Exact `layoutBlueprint`

```json
{
  "rootScope": {
    "schemaScopeId": "root",
    "containers": [],
    "fieldPlacements": [
      {
        "fieldId": "name",
        "containerKey": "__scope_root__",
        "order": 0
      }
    ],
    "unplacedFieldIds": []
  },
  "subformScopes": []
}
```

### Exact Default `uiSchema`

```json
{
  "uiSchema": {
    "rootScope": {
      "schemaScopeId": "root",
      "nodes": [
        {
          "fieldId": "name",
          "id": "root-field-name",
          "order": 0,
          "type": "field"
        }
      ],
      "unplacedFieldIds": [],
      "filterDefinitions": {
        "defaultFilters": {
          "conditions": [],
          "logic": "and"
        },
        "quickFilters": [],
        "version": 1
      },
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
      },
      "runtime": {
        "viewRtAlias": "default",
        "dataViewName": "vw_timezone",
        "gridViewName": "vg_timezone__default"
      }
    },
    "subformScopes": []
  }
}
```

### Explicit Exclusions

- `id` stays a system/root-record surface, not an authored business field
- no `Doc.id` view-only node is seeded in phase 1

### Open Questions

- no table-specific open questions beyond the shared runtime delta described later in this document

### Migration-Ready Seed Notes

- `ps_model.model_id = timezone`
- `ps_model.model_key = timezone`
- `ps_model.storage_key = timezone`
- `ps_model.display_name = Timezone`
- `ps_model.source_type = external`
- `ps_model.structure_version = 1`
- `ps_view.view_id = view-default`
- `ps_view.view_key = default`
- `ps_view.display_name = Timezone`
- `ps_view.is_default = true`
- `ps_view.is_active = true`
- `ps_view.last_aligned_model_structure_version = 1`
- downstream lookups should treat `name` as the primary display field

## Table 3. `companytype`

Classification:

- `sourceType = external`
- `tenantScoped = true`
- default view only

### Exact `dataSchema`

```json
{
  "modelId": "companytype",
  "modelTitle": "Company Type",
  "rootScope": {
    "schemaScopeId": "root",
    "scopeType": "ROOT",
    "fields": [
      {
        "family": "core",
        "id": "name",
        "kind": "short_text",
        "label": "Name",
        "displayName": "Name",
        "fieldId": "name",
        "storageKey": "name",
        "schemaScopeId": "root",
        "status": "persisted",
        "runtime": {
          "sourceColumnName": "name",
          "sourceValueKind": "scalar"
        }
      },
      {
        "family": "core",
        "id": "risk",
        "kind": "short_text",
        "label": "Risk",
        "displayName": "Risk",
        "fieldId": "risk",
        "storageKey": "risk",
        "schemaScopeId": "root",
        "status": "persisted",
        "runtime": {
          "sourceColumnName": "risk",
          "sourceValueKind": "scalar"
        }
      }
    ],
    "runtime": {
      "rtAlias": "companytype",
      "tableName": "companytype",
      "mvTableName": "",
      "dataViewName": "vw_companytype",
      "tenantScoped": true,
      "sourceIdColumn": "id",
      "sourceTenantIdColumn": "tenant_id",
      "sourceGuidColumn": "guid",
      "sourceCreatedAtColumn": "created_at",
      "sourceUpdatedAtColumn": "updated_at"
    }
  },
  "subformScopes": []
}
```

### Exact `layoutBlueprint`

```json
{
  "rootScope": {
    "schemaScopeId": "root",
    "containers": [],
    "fieldPlacements": [
      {
        "fieldId": "name",
        "containerKey": "__scope_root__",
        "order": 0
      },
      {
        "fieldId": "risk",
        "containerKey": "__scope_root__",
        "order": 1
      }
    ],
    "unplacedFieldIds": []
  },
  "subformScopes": []
}
```

### Exact Default `uiSchema`

```json
{
  "uiSchema": {
    "rootScope": {
      "schemaScopeId": "root",
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
      "unplacedFieldIds": [],
      "filterDefinitions": {
        "defaultFilters": {
          "conditions": [],
          "logic": "and"
        },
        "quickFilters": [],
        "version": 1
      },
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
      },
      "runtime": {
        "viewRtAlias": "default",
        "dataViewName": "vw_companytype",
        "gridViewName": "vg_companytype__default"
      }
    },
    "subformScopes": []
  }
}
```

### Explicit Exclusions

- `id` stays a system/root-record surface, not an authored business field
- `tenant_id` stays runtime/system-only
- `guid` stays runtime/system-only
- `created_at` stays runtime/system-only
- `updated_at` stays runtime/system-only
- no `Doc.id` view-only node is seeded in phase 1

### Open Questions

- no table-specific open questions beyond the shared runtime delta described later in this document

### Migration-Ready Seed Notes

- `ps_model.model_id = companytype`
- `ps_model.model_key = companytype`
- `ps_model.storage_key = companytype`
- `ps_model.display_name = Company Type`
- `ps_model.source_type = external`
- `ps_model.structure_version = 1`
- `ps_view.view_id = view-default`
- `ps_view.view_key = default`
- `ps_view.display_name = Company Type`
- `ps_view.is_default = true`
- `ps_view.is_active = true`
- `ps_view.last_aligned_model_structure_version = 1`
- downstream lookups should treat `name` as the primary display field
- `risk` is seeded as ordinary scalar text and not normalized further in phase 1

## Table 4. `jobtype`

Classification:

- `sourceType = external`
- `tenantScoped = true`
- default view only

### Exact `dataSchema`

```json
{
  "modelId": "jobtype",
  "modelTitle": "Job Type",
  "rootScope": {
    "schemaScopeId": "root",
    "scopeType": "ROOT",
    "fields": [
      {
        "family": "core",
        "id": "name",
        "kind": "short_text",
        "label": "Name",
        "displayName": "Name",
        "fieldId": "name",
        "storageKey": "name",
        "schemaScopeId": "root",
        "status": "persisted",
        "runtime": {
          "sourceColumnName": "name",
          "sourceValueKind": "scalar"
        }
      },
      {
        "family": "core",
        "id": "active",
        "kind": "boolean",
        "label": "Active",
        "displayName": "Active",
        "fieldId": "active",
        "storageKey": "active",
        "schemaScopeId": "root",
        "status": "persisted",
        "runtime": {
          "sourceColumnName": "active",
          "sourceValueKind": "scalar"
        }
      }
    ],
    "runtime": {
      "rtAlias": "jobtype",
      "tableName": "jobtype",
      "mvTableName": "",
      "dataViewName": "vw_jobtype",
      "tenantScoped": true,
      "sourceIdColumn": "id",
      "sourceTenantIdColumn": "tenant_id",
      "sourceGuidColumn": "guid",
      "sourceCreatedAtColumn": "created_at",
      "sourceUpdatedAtColumn": "updated_at"
    }
  },
  "subformScopes": []
}
```

### Exact `layoutBlueprint`

```json
{
  "rootScope": {
    "schemaScopeId": "root",
    "containers": [],
    "fieldPlacements": [
      {
        "fieldId": "name",
        "containerKey": "__scope_root__",
        "order": 0
      },
      {
        "fieldId": "active",
        "containerKey": "__scope_root__",
        "order": 1
      }
    ],
    "unplacedFieldIds": []
  },
  "subformScopes": []
}
```

### Exact Default `uiSchema`

```json
{
  "uiSchema": {
    "rootScope": {
      "schemaScopeId": "root",
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
      "unplacedFieldIds": [],
      "filterDefinitions": {
        "defaultFilters": {
          "conditions": [],
          "logic": "and"
        },
        "quickFilters": [],
        "version": 1
      },
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
      },
      "runtime": {
        "viewRtAlias": "default",
        "dataViewName": "vw_jobtype",
        "gridViewName": "vg_jobtype__default"
      }
    },
    "subformScopes": []
  }
}
```

### Explicit Exclusions

- `id` stays a system/root-record surface, not an authored business field
- `tenant_id` stays runtime/system-only
- `guid` stays runtime/system-only
- `created_at` stays runtime/system-only
- `updated_at` stays runtime/system-only
- no `Doc.id` view-only node is seeded in phase 1

### Open Questions

- no table-specific open questions beyond the shared runtime delta described later in this document

### Migration-Ready Seed Notes

- `ps_model.model_id = jobtype`
- `ps_model.model_key = jobtype`
- `ps_model.storage_key = jobtype`
- `ps_model.display_name = Job Type`
- `ps_model.source_type = external`
- `ps_model.structure_version = 1`
- `ps_view.view_id = view-default`
- `ps_view.view_key = default`
- `ps_view.display_name = Job Type`
- `ps_view.is_default = true`
- `ps_view.is_active = true`
- `ps_view.last_aligned_model_structure_version = 1`
- downstream lookups should treat `name` as the primary display field
- `active` remains a canonical boolean and should reuse the shared yes/no rendering contract

## Shared Runtime Shape Locked By Phase 1

The phase 1 schema packages depend on the accepted external runtime contract.

That contract now supports:

1. exact external root runtime metadata roundtrip without field loss
2. explicit source system-column mapping on external root scopes:
   - `sourceIdColumn`
   - `sourceTenantIdColumn`
   - `sourceGuidColumn`
   - `sourceCreatedAtColumn`
   - `sourceUpdatedAtColumn`
3. explicit global-versus-tenant scope classification on external root scopes:
   - `tenantScoped = false` for `state`, `timezone`
   - `tenantScoped = true` for `companytype`, `jobtype`, and later `company`, `users`, `projects`, `events`, `mails`
4. global external reference tables that do not expose:
   - `tenant_id`
   - `guid`
   - `created_at`
   - `updated_at`

Important persisted-shape rule:

- for global external tables such as `state` and `timezone`, omit `sourceTenantIdColumn`, `sourceGuidColumn`, `sourceCreatedAtColumn`, and `sourceUpdatedAtColumn` entirely
- do not serialize those keys as `null`
- omission is significant because external runtime defaults to tenant-scoped behavior unless `tenantScoped = false` is present explicitly

## Immediate Next Step

After review of this phase 1 pack:

1. continue with `company`
2. then continue with:
   - `users`
   - `projects`
   - `events`
   - `mails`

## Companion Docs

- [form-builder-static-models-atlas-task-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-atlas-task-v1.md)
- [form-builder-static-models-schema-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md)
- [form-builder-static-models-migration-draft-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-migration-draft-v1.md)
- [backend-tenant-canonical-refactor-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md)
- [backend-tenant-canonical-field-mapping-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-tenant-canonical-field-mapping-v1.md)
