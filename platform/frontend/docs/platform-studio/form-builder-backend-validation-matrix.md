# Form Builder Backend Validation Matrix

Status: active
Date: 2026-04-09

## Purpose

This document defines which backend validations must run on:

- `saveBuilderDraft`
- `publishBuilderDraft`

It exists to remove ambiguity between:

- draft-authoring validation
- publish-time storage validation
- UI-side early hints
- backend final authority

This matrix is companion guidance for:

- `form-builder-backend-boundary.md`
- `form-builder-backend-api-contract.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-object-generation-matrix.md`
- `form-builder-backend-migration-policy.md`

## Core Rule

Accepted rule:

- `saveBuilderDraft` validates authoring correctness and contract shape
- `publishBuilderDraft` validates everything required for generated storage reconciliation

Important rule:

- a validation may run on both `save` and `publish`
- `publish` remains the final authority even if the same rule also ran during `save`

## Validation Outcome Vocabulary

Recommended severity levels:

- `error`
  - operation must fail
- `warning`
  - operation may succeed, but the result should be surfaced to the UI

Recommended enforcement vocabulary:

- `save_only`
- `publish_only`
- `save_and_publish`

## Matrix

### Contract Shape And Identity

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| JSON shape and required top-level keys | error | error | Payload must match `BackendFormBuilderPayload` |
| Required `model` and `view` identity fields | error | error | Missing ids or keys must fail immediately |
| Scope ids are unique | error | error | `rootScope` and `subformScopes` must not collide |
| Node ids are unique within the builder document | error | error | Stable ids must remain unique |
| Field ids are unique across all scopes | error | error | Required for storage and binding safety |
| Stable keys are present where required | error | error | Applies to model key, view key, field storage keys, subform table keys |

### Scope And Placement Rules

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| Root-only concerns stay on `rootScope` | error | error | `System Fields`, `Corrective Action`, root actions, root page filters |
| `Section` is allowed only at scope root | error | error | Applies to root form and each subform root |
| Child nodes belong to the correct scope | error | error | Prevents cross-scope drift |
| `System Fields` exist only once per form | error | error | One root semantic binding per role |
| `System Fields` are not allowed in subforms | error | error | Includes `DEFAULT` and `CHECKLIST` |
| `CHECKLIST` subform forbids unsupported child composition | error | error | For example nested subform or invalid result field |
| `DEFAULT` subform grid config is only stored on that subform scope | error | error | Root grid and child grid stay separate |
| `CHECKLIST` subform does not define child grid columns | error | error | Checklist runtime does not use grid config |

### Binding And Semantic Rules

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| Node field bindings reference existing fields | error | error | Bound field nodes must resolve |
| `DB lookup` source metadata is structurally valid | error | error | `sourceModel`, display fields, search fields, display mode |
| `Reported By` uses approved underlying field family | error | error | Must bind to approved lookup preset |
| `Reported Date` uses approved underlying field family | error | error | `date` or accepted `date_time` bind |
| `Status` uses approved underlying field family | error | error | `single_select` with options |
| `CHECKLIST.Lookup Field` resolves to child `DB lookup` | error | error | Root lookup is not valid here |
| `CHECKLIST.Result Field` resolves to child `single_select` | error | error | Legacy combobox normalizes here |
| Grid columns reference existing field ids or approved lookup outputs | error | error | Applies to root and child grids |
| Rules reference fields in the same scope only | error | error | Root cannot depend on child rows and vice versa |

### Key Uniqueness And Naming

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| Model key uniqueness | error | error | Backend remains final authority |
| View key uniqueness within the model | error | error | Includes default-view conflicts |
| Field storage key uniqueness within a scope | error | error | Protects physical columns |
| Subform table key uniqueness within a root model | error | error | Protects child table naming |
| Generated storage names are derivable from stable keys | error | error | Must normalize before save succeeds |
| Generated SQL view names are collision-free in the current draft | warning | error | Save may surface projected collision risk before publish |

### Lock And Version Safety

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| Optimistic concurrency token is current | error | error | Stale writes must fail |
| Locked model forbids structural mutation | error | error | Save should reject immediately |
| Locked field forbids structural mutation | error | error | View-only edits may still pass if policy allows |
| External locked model forbids backend-owned schema mutation | error | error | Views may remain editable |
| Publish against stale generated storage snapshot | no | error | Publish must recheck backend reality |

### Storage And Reconciliation Rules

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| Physical table name collision | warning | error | Save may project collision, publish must block |
| Physical column name collision | warning | error | Save can compute projected names, publish is final |
| Parent-child foreign key naming collision | warning | error | Child table parent fk must remain valid |
| Incompatible field-type storage mutation on published schema | no | error | First-slice publish should reject destructive changes |
| Published subform table key rename requiring destructive migration | no | error | Defer until explicit migration mode exists |
| Generated SQL data view compilation failure | no | error | Publish-only because SQL generation is authoritative there |
| Generated SQL grid view compilation failure | no | error | Depends on concrete published grid projection |
| Lookup-derived output naming collision | warning | error | Save can project, publish must enforce |
| Unsupported external-table binding for `external_locked` model | warning | error | Save may flag intent risk, publish must block |

### Filter And Grid Runtime Rules

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| `pageFilters` payload shape is valid | error | error | Includes typed date and lookup clauses |
| Lookup-specific filter clauses use allowed tokens | error | error | `current_user_id`, `assigned_projects`, and other accepted tokens |
| Date presets use accepted enum values | error | error | Must match canonical filter contract |
| Quick filter references allowed fields or outputs | error | error | Backend controls what is filterable |
| Grid columns order is contiguous and stable | error | error | Builder should save normalized order |
| Grid includes disallowed target from `CHECKLIST` scope | error | error | Checklist child grid is unsupported |

### UI-Only Or Local-First Concerns

| Validation rule | Save | Publish | Notes |
| --- | --- | --- | --- |
| Missing friendly label on a node | no | no | UI should catch earlier; backend does not need to own this as a hard error |
| Temporary empty layout while authoring | no | no | Empty draft may still be valid to save |
| Preview-only renderer mismatch | no | no | Local preview concern, not a persistence blocker |

## Save vs Publish Summary

### `saveBuilderDraft` should block on

- malformed payload shape
- invalid ids, keys, and scope relationships
- root-only rule violations
- `CHECKLIST` structural violations
- invalid bindings
- same-scope rule violations
- lock violations already knowable from stored metadata
- stale version tokens

### `saveBuilderDraft` may warn on

- projected storage naming collisions
- projected SQL-view naming collisions
- projected lookup-output collisions
- external-source compatibility risks not yet fully verifiable

### `publishBuilderDraft` must additionally block on

- physical table and column collisions
- incompatible published-schema mutations
- generated SQL data-view failures
- generated SQL grid-view failures
- lookup-output generation failures
- publish-time drift between draft assumptions and actual backend state

## Error Code Mapping

Recommended primary mapping:

| Validation family | Error code |
| --- | --- |
| stale versions | `version_conflict` |
| contract shape | `validation_failed` |
| lock policy | `lock_violation` |
| storage naming or DDL collision | `storage_collision` |
| external source mismatch | `external_source_incompatible` |
| explicit migration required | `migration_mode_required` |
| publish reconciliation failure | `publish_failed` |

## UI/UX Guidance

Frontend should present:

- `save` errors as authoring or contract errors
- `save` warnings as projected publish risks
- `publish` errors as storage or deployment blockers

Recommended UI rule:

- do not present projected `save` warnings as if they were already definitive publish failures

Recommended builder behavior:

- after `save`, show that the draft is valid for persistence
- after `publish`, show that storage artifacts were actually reconciled

## First-Slice Recommendation

For the first real backend slice:

- keep `saveBuilderDraft` strict on contract correctness
- keep `publishBuilderDraft` strict on storage safety
- do not try to implement merge or auto-fix on backend validation failures
- return structured errors and the latest authoritative versions instead
