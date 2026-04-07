# Module Memory — Admin Module Registry

Status: active
Date: 2026-04-06

## Read this when

- touching module registry list, management, or grants
- touching root-only control-plane behavior for module/section maintenance
- changing module registry endpoints, DTOs, or route alignment
- changing the admin app pages that manage modules or sections
- changing how the current proving surface consumes collection-table

## What this domain is

`Admin Module Registry` is a control-plane domain.
It currently uses collection-table for the list surface, but it does not own the collection-table runtime contract.

## Confirmed backend surfaces

- `platform/backend/modules/admin/moduleregistrylist`
- `platform/backend/modules/admin/moduleregistrymanage`
- `platform/backend/modules/admin/moduleregistrygrants`
- route wiring under `platform/backend/cmd/api-admin/internal/server/routes_module_registry_*.go`

## Confirmed frontend surfaces

- `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/modules-edit/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-client.ts`
- `platform/frontend/packages/collection-table`

## Locked invariants

- `Module registry` is root-only
- canonical secure route family is `/app/admin/module-registry/...`
- section-level grants are allow-only
- current access values are `read` and `write`
- navigation stays separate from profile bootstrap
- the list surface id stays stable as `module-registry.list`
- collection-table is the current list runtime, but module registry page logic must not redefine the universal table contract
- module registry is now one of multiple admin-app collection-table consumers

## Canonical endpoint families

List / collection surface:

- `GET /app/admin/module-registry/list/meta`
- `POST /app/admin/module-registry/list/query`
- `GET /app/admin/module-registry/list/search-suggestions`
- `POST /app/admin/module-registry/list/bulk-actions/{actionId}`
- `POST /app/admin/module-registry/list/row-actions/{actionId}`
- `POST /app/admin/module-registry/list/favorite/toggle`
- `POST /app/admin/module-registry/list/saved-filters`
- `POST /app/admin/module-registry/list/export-xls`

Management / grants:

- `GET /app/admin/module-registry/modules/{moduleId}`
- `POST /app/admin/module-registry/modules`
- `PUT /app/admin/module-registry/modules/{moduleId}`
- `POST /app/admin/module-registry/modules/{moduleId}/archive`
- `POST /app/admin/module-registry/modules/{moduleId}/sections`
- `PUT /app/admin/module-registry/sections/{sectionId}`
- `POST /app/admin/module-registry/sections/{sectionId}/archive`
- `GET /app/admin/module-registry/sections/{sectionId}/grants`
- `PUT /app/admin/module-registry/sections/{sectionId}/grants/{adminUserId}`
- `DELETE /app/admin/module-registry/sections/{sectionId}/grants/{adminUserId}`
- `PUT /app/admin/module-registry/modules/{moduleId}/grants/{adminUserId}`

## Canonical docs

- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-admin-access-policy-layering.md`
- `platform/frontend/docs/collection-table-backend-integration-contract.md`

## Supporting docs

- `platform/frontend/docs/admin-module-registry-backend-handoff.md`
- `platform/frontend/docs/collection-table-runtime-contract.md`

## Common failure modes

- mixing generic collection-table runtime changes into a module-registry-only task
- changing endpoint families without updating the admin app adapter
- weakening root-only or grant semantics during UI work
- letting page-local assumptions leak into global admin navigation or access policy

## When to update memory

Update this file when:

- endpoint families change
- module/section/grant semantics change
- list surface behavior changes in a module-registry-specific way
- root-only boundaries or rollout rules change
