# Admin Module Registry Contract

Status: active compact contract

## Invariants

- Module Registry is root-only.
- Secure route family is `/app/admin/module-registry/...`.
- Section grants are allow-only.
- Current access values are `read` and `write`.
- Navigation stays separate from profile bootstrap.
- Module Registry page logic must not redefine the universal Collection Table contract.

## List Endpoints

- `GET /app/admin/module-registry/list/meta`
- `POST /app/admin/module-registry/list/query`
- `GET /app/admin/module-registry/list/search-suggestions`
- `POST /app/admin/module-registry/list/bulk-actions/{actionId}`
- `POST /app/admin/module-registry/list/row-actions/{actionId}`
- `POST /app/admin/module-registry/list/favorite/toggle`
- `POST /app/admin/module-registry/list/saved-filters`
- `POST /app/admin/module-registry/list/export-xls`

## Management / Grants Endpoints

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

## Current Surfaces

- `platform/backend/modules/admin/moduleregistrylist`
- `platform/backend/modules/admin/moduleregistrymanage`
- `platform/backend/modules/admin/moduleregistrygrants`
- `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/modules-edit/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-client.ts`

