# Backend Admin Module Registry Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: root-only admin Module Registry, module/section records, grants, list surface, and registry routes

This contract defines the current backend Module Registry control-plane domain.

Read with:

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/collection-table.md`

## Core Invariants

- Module Registry is an admin API domain only.
- Tenant API uses different domain logic and is out of scope.
- Module Registry UI and management are root-only.
- Non-root admin users do not get access to the Module Registry module.
- Access grants are stored at section level only.
- Effective access model is allow-only.
- Root sees everything with implemented route coverage.
- Current access modes are `read` and `write`.
- `delete` is deferred.
- `/app/profile` is not navigation.
- Admin navigation is `GET /app/me/navigation`.
- Canonical secure route family is `/app/admin/module-registry/...`.
- Do not add legacy `/admin/module-registry/...` aliases unless an explicit migration bridge is approved.

## Current Backend Surfaces

List module:

- `platform/backend/modules/admin/moduleregistrylist`

Management module:

- `platform/backend/modules/admin/moduleregistrymanage`

Grant module:

- `platform/backend/modules/admin/moduleregistrygrants`

Shared collection preferences:

- `platform/backend/modules/shared/collectionprefs`

Runtime wiring:

- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_list.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_list.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_manage.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_manage.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_grants.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_grants.go`

## Data Model

Core records:

- `admin_module`
- `admin_module_section`
- `admin_section_grant`

Collection preference records:

- `admin_collection_favorite`
- `admin_collection_saved_filter`

Current seeded module rows include:

- `module_registry`
- `tenant`
- `users`

## List Surface

Current table surface id:

- `module-registry.list`

Canonical route family:

- `GET /app/admin/module-registry/list/meta`
- `POST /app/admin/module-registry/list/query`
- `GET /app/admin/module-registry/list/search-suggestions`
- `POST /app/admin/module-registry/list/bulk-actions/{actionId}`
- `POST /app/admin/module-registry/list/row-actions/{actionId}`
- `POST /app/admin/module-registry/list/favorite/toggle`
- `POST /app/admin/module-registry/list/saved-filters`
- `POST /app/admin/module-registry/list/export-xls`

Current behavior:

- list/meta/query/search are backed by master data
- favorite toggle and saved filters persist in master
- bulk actions support module status changes and archive where declared by metadata
- row-action route exists; unsupported or undeclared row actions are rejected
- export route validates and probes data but currently returns a successful mutation result without generated XLS output

## Management Rules

Root can manage module and section records.

Rules:

- `module_key` is immutable after creation
- `section_key` is immutable after creation
- create/update/archive are root-only
- archiving a module also archives its sections in one repository transaction
- section payloads expose parent module identity through external module GUID, not internal numeric row id
- sort order is normalized at service level

## Grant Rules

Root can manage section grants for non-root admin users.

Rules:

- grants target section rows
- access mode is `read` or `write`
- `delete` is not part of the current schema or UI contract
- root cannot be a grant target
- inactive admin users cannot receive new grants
- module-level grant operations are convenience endpoints that expand into section-level rows
- module-level upsert applies grants to all non-archived sections in the module

## Navigation And Route Policy

Navigation for admin users is projected by the admin navigation module, not by Module Registry directly.

Module Registry contributes:

- module records
- section records
- route paths
- section grants

Access and visibility are filtered through the admin control-plane route-binding policy.

Module Registry routes are root-only in both middleware and service logic.
Non-root navigation intentionally excludes Module Registry entries even if grant rows exist.

## Collection Table Boundary

Module Registry is a Collection Table consumer.
It does not own the generic Collection Table contract.

Generic table behavior belongs to:

- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/collection-table.md`

Module Registry owns only its own metadata, rows, actions, and preference integration.

## Out Of Scope

- tenant-side registry logic
- generic Collection Table ownership
- profile payload changes
- delete access mode
- non-root Module Registry UI
- legacy route aliases without explicit migration approval
