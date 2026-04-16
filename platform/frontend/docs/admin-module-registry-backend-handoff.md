# Admin Module Registry Backend Handoff

Status: active frontend handoff  
Date: 2026-04-02

## Goal

This document is the frontend-facing handoff for the current backend state of:

- admin profile bootstrap
- admin navigation
- admin module registry
- current non-root admin rollout slice

Use this as the frontend AI agent source of truth for wiring the current admin UI to the existing backend contract.

## Source Documents

Backend references:

- [`platform/backend/docs/backend-admin-module-registry-brief.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-admin-module-registry-brief.md)
- [`platform/backend/docs/backend-admin-access-policy-layering.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-admin-access-policy-layering.md)

Frontend references:

- [`platform/frontend/docs/collection-table-backend-integration-contract.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/collection-table-backend-integration-contract.md)
- [`platform/frontend/docs/collection-table-runtime-contract.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/collection-table-runtime-contract.md)

## Current Routing Rule

The canonical secure admin API route family is:

- `/app/...`

Do not use:

- `/api/admin/...`
- legacy `/admin/...` API aliases

Current secure endpoints are intended for API Gateway JWT validation under `/app/...`.

## Auth And Bootstrap Order

Current frontend bootstrap order should be:

1. authenticate user
2. fetch `GET /app/profile`
3. after profile succeeds, fetch `GET /app/me/navigation`
4. build sidebar from navigation response

Important:

- `/app/profile` stays focused on the current principal
- sidebar/navigation must come from `/app/me/navigation`
- do not overload profile-derived UI state with static navigation assumptions

## Current Backend-Covered Admin Features

### 1. Root-only Module Registry

This feature is implemented and backend-ready.

Current page route:

- `/modules/list`

Current table surface id:

- `module-registry.list`

Root-only collection-table endpoints:

- `GET /app/admin/module-registry/list/meta`
- `POST /app/admin/module-registry/list/query`
- `GET /app/admin/module-registry/list/search-suggestions`
- `POST /app/admin/module-registry/list/favorite/toggle`
- `POST /app/admin/module-registry/list/saved-filters`
- `POST /app/admin/module-registry/list/bulk-actions/{actionId}`
- `POST /app/admin/module-registry/list/row-actions/{actionId}`
- `POST /app/admin/module-registry/list/export-xls`

Current frontend-observed runtime behavior for this surface:

- effective request URLs are `${adminApiUrl}/app/admin/module-registry/list/...`
- `meta` and `query` are served separately and the frontend reload action should refresh `query` only
- current backend meta example includes:
  - `actions.exportXls.visible = false`
  - `actions.favorite.visible = true`
  - `selection.enabled = true`
  - `rowActions = [{ id: "edit", execution: "frontend" }]`
  - backend may omit a dedicated `actions` column; the current frontend runtime injects it automatically when `rowActions` is non-empty
- `search-suggestions` items may omit `fieldId` and `id`; the host-page adapter normalizes them before the runtime consumes them
- current frontend-managed toolbar contract for admin app:
  - if backend sends `actions.create.visible = true`, the host page opens `/modules/edit/new`
- current frontend-managed row action contract for admin app:
  - if backend sends `{ id: "edit", kind: "button", execution: "frontend" }`, the host page opens `/modules/edit/{row.id}`
- current status-change contract remains selection-driven:
  - backend must send `selection.enabled = true`
  - backend now sends `bulkActions`:
    - `activate` with label `Active` and tone `success`
    - `planned` with tone `info`
    - `archive` with tone `neutral`
  - every `bulkActions[]` item must include `label`
  - frontend does not localize bulk-action button labels
  - archived rows remain selectable so root can reactivate archived modules through bulk `activate`
  - frontend does not treat a normal status cell as an inline checkbox toggle

Root-only management endpoints:

- `GET /app/admin/module-registry/modules/{moduleId}`
- `POST /app/admin/module-registry/modules`
- `PUT /app/admin/module-registry/modules/{moduleId}`
- `POST /app/admin/module-registry/modules/{moduleId}/archive`
- `POST /app/admin/module-registry/modules/{moduleId}/sections`
- `PUT /app/admin/module-registry/sections/{sectionId}`
- `POST /app/admin/module-registry/sections/{sectionId}/archive`

Root-only grant-management endpoints:

- `GET /app/admin/module-registry/sections/{sectionId}/grants`
- `PUT /app/admin/module-registry/sections/{sectionId}/grants/{adminUserId}`
- `DELETE /app/admin/module-registry/sections/{sectionId}/grants/{adminUserId}`
- `PUT /app/admin/module-registry/modules/{moduleId}/grants/{adminUserId}`
- `DELETE /app/admin/module-registry/modules/{moduleId}/grants/{adminUserId}`

Frontend rule:

- only `root` should see and use Module Registry UI
- non-root admin users should not get Module Registry entries in sidebar

### 2. Root-only Tenant Inventory

This feature is implemented and backend-ready.

Current page route:

- `/admin/tenants`

Root-only collection-table endpoints:

- `GET /app/admin/tenants/list/meta`
- `POST /app/admin/tenants/list/query`
- `GET /app/admin/tenants/list/search-suggestions`
- `POST /app/admin/tenants/list/favorite/toggle`
- `POST /app/admin/tenants/list/saved-filters`

Current frontend-observed runtime behavior for this surface:

- effective request URLs are `${adminApiUrl}/app/admin/tenants/list/...`
- backend create action stays hidden because tenant creation remains owned by onboarding
- backend favorite binding uses surface id `tenant.list`
- tenant inventory is a collection-table surface, not a custom workbench route

Frontend rule:

- `root` may see and use Tenant inventory
- non-root admin users must not get this section in sidebar until a non-root list slice is explicitly approved

### 3. Current Non-Root Rollout Slice

The current approved non-root admin slice is:

- `tenant.onboarding`

Currently mapped secure backend route:

- `POST /app/admin/tenants`

Required access:

- `write`

Current admin section route path:

- `/admin/tenants/onboarding`

Frontend rule:

- this section may appear in navigation for non-root only if backend grants return it
- if a non-root user has no granted onboarding access, the frontend must not fabricate the entry

## Current Navigation Contract

Endpoint:

- `GET /app/me/navigation`

Response shape:

```json
{
  "is_root": true,
  "favorites": [
    {
      "id": "uuid",
      "module_id": "uuid",
      "module_key": "tenant",
      "module_title": "Tenant",
      "module_icon": "building",
      "section_key": "onboarding",
      "title": "Onboarding",
      "description": "Tenant provisioning and onboarding flow.",
      "route_path": "/admin/tenants/onboarding",
      "access": "write"
    }
  ],
  "modules": [
    {
      "id": "uuid",
      "module_key": "tenant",
      "title": "Tenant",
      "description": "Tenant control-plane management and onboarding.",
      "icon": "building",
      "sections": [
        {
          "id": "uuid",
          "section_key": "onboarding",
          "title": "Onboarding",
          "description": "Tenant provisioning and onboarding flow.",
          "route_path": "/admin/tenants/onboarding",
          "access": "write"
        }
      ]
    }
  ]
}
```

Notes:

- `favorites[]` is per-user, not system-wide
- `favorites[]` is filtered through the same backend route coverage and grant rules as `modules[].sections[]`
- `favorites[]` is sourced from `admin_collection_favorite` through backend surface bindings
- current bound collection favorite surfaces include `module-registry.list`, `tenant.list`, and `employees.list`
- menu-only sections such as onboarding stay in `modules[].sections[]` and future section/topbar actions, not in collection favorites by default

Important semantics:

- `route_path` is the admin-app route projection, not an API URL
- frontend should use `route_path` for sidebar navigation targets
- frontend keeps only `Dashboard` static; every other sidebar group/item should come from `modules[]`
- `modules[].icon` is the module/group icon only
- child sidebar sections should not inherit the module icon automatically
- if backend wants a child section icon, it should send `sections[].icon`
- frontend favorites utility surfaces should use `favorites[]`; do not confuse this with collection-table `actions.favorite`
- after collection-table `favorite/toggle` succeeds, frontend should refresh `GET /app/me/navigation` so shell favorites update without a full app reload
- `access` is currently:
  - `read`
  - `write`
- `delete` does not exist in the current backend contract

## Navigation Rules That Matter For Frontend

### Root

Root receives all backend-covered active sections.

That currently includes:

- Module Registry
- Tenant inventory at `/admin/tenants`
- current covered admin sections such as tenant onboarding

### Non-root

Non-root receives only:

- explicitly granted sections
- sections with backend route-policy coverage

This means:

- do not assume all active sections from the registry will appear
- some seeded sections are intentionally hidden until backend coverage exists

Current example:

- `tenant.list_of_tenants` is not part of the current approved non-root rollout slice
- it is intentionally hidden from navigation for non-root users
- `root` receives it as a normal root-only collection-table surface
- frontend must not hardcode it into sidebar for non-root users

## Collection Table Guidance

For Module Registry list, use the shared collection-table runtime and backend integration contracts:

- [`collection-table-backend-integration-contract.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/collection-table-backend-integration-contract.md)
- [`collection-table-runtime-contract.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/collection-table-runtime-contract.md)

Frontend should treat the backend as authoritative for:

- field catalog
- column definitions
- search metadata
- row actions
- saved filter behavior

Do not hardcode old inspection-style field ids if backend meta returns the canonical surface definition.

## Current Backend Split

This is backend internal structure only. It should not affect frontend route usage, but it explains ownership:

- `moduleregistrylist` = collection-table surface
- `moduleregistrymanage` = form and CRUD
- `moduleregistrygrants` = section grants
- `navigation` = `/app/me/navigation`
- `accesspolicy` = secure route authorization

Frontend should consume the stable HTTP contract, not mirror backend package names.

## What Frontend Can Build Now

The current backend state is sufficient to start:

1. root sidebar from `/app/me/navigation`
2. non-root sidebar from `/app/me/navigation`
3. Module Registry list page at `/modules/list`
4. Module Registry root-only create/edit/archive flows
5. root-only section grant UI
6. tenant onboarding entry visibility based on granted navigation

## What Frontend Must Not Assume Yet

Do not assume these are already backend-ready for non-root rollout:

- tenant list page access for non-root
- generic non-root CRUD across admin modules
- a third permission mode like `delete`
- every seeded admin section is visible or authorized

Only the backend-covered rollout slice should be wired.

## Recommended AI Agent Task Boundary

For the next frontend implementation pass, the AI agent should:

1. switch admin secure calls to `/app/...`
2. fetch `/app/profile`
3. then fetch `/app/me/navigation`
4. build sidebar from navigation response only
5. wire Module Registry root UI to the collection-table endpoints
6. treat Module Registry as root-only
7. treat non-root admin rollout as currently limited to `tenant.onboarding`

## Completion Check For Frontend Hookup

Frontend hookup for the current backend slice is correct when:

- root sees Module Registry in sidebar
- non-root does not see Module Registry in sidebar
- non-root sees only backend-returned covered sections
- dashboard stays as the only static top-level entry
- favorites utility content comes from `GET /app/me/navigation`
- backend `route_path` values match real admin SPA routes
- Module Registry page uses backend meta/query/search/favorite/saved-filter contract
- admin UI does not call legacy `/admin/...` or `/api/admin/...` endpoints
