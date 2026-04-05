# Platform Contract

Status: active
Date: 2026-04-05

This document is the shared architecture contract for Ramp Platform v108.
It is the first durable memory file to read before changing backend/frontend behavior.

## 1. Product shape

Ramp Platform v108 currently uses this model:

- one monorepo
- one product root at `platform/`
- one backend implemented as a modular monolith
- separate frontend applications for separate product surfaces
- shared packages only where reuse is real and stable

The platform is not using early microservice extraction.
The backend keeps runtime separation without repo or service fragmentation.

## 2. Backend contract

### Runtime surfaces

Confirmed in code:

- `api-admin`
- `api-tenant`
- `auth`
- `migrate`

Documented as future-target, not yet present in code:

- `worker`

### Backend architectural rules

- handlers stay thin
- business logic stays in services
- persistence stays in repositories or platform storage layers
- transport DTOs must not leak directly into repository logic
- migrations are owned by `cmd/migrate`, not by API startup
- multi-tenant isolation is mandatory
- admin and tenant semantics must stay explicit

## 3. Frontend contract

### App surfaces

Confirmed in code:

- `platform-admin-web`
- `tenant-web`

Deferred in docs, not present as an app:

- `tenant-pwa`

### Package boundaries

Confirmed shared packages:

- `design-tokens`
- `ui-kit`
- `api-client`
- `auth-core`
- `tenant-core`
- `app-shell`
- `forms`
- `platform-builder-core`
- `i18n`
- `install-helper`

Rules:

- apps may import packages
- packages must not import apps
- no deep imports across package boundaries
- UI-free packages must stay UI-free
- do not invent `shared-*` dumping grounds

### Collection-table boundary rule

- collection-table is currently an app-local proving runtime inside `platform-admin-web`
- the current proving surface is the admin `Module registry / List` page
- module registry does not own the collection-table contract
- collection-table may move into a shared package only after reuse is real and the shared boundary is approved
- route-specific transport, navigation, and toolbar behavior stay host-owned until that extraction is approved

## 4. Multi-tenant contract

The platform is explicitly multi-tenant.

Confirmed from docs and code:

- control-plane data lives in master database surfaces
- tenant runtime data lives in tenant databases
- local topology uses `108-master`, `108-sandbox`, and `108-demo`
- tenant databases may be sandbox/shared or dedicated
- tenant-aware tables keep `tenant_id` even when a dedicated DB exists
- tenant scope must come from trusted runtime context, not arbitrary client input

Never relax these rules without an explicit architecture decision.

## 5. Auth and session contract

Current cross-stack baseline:

- OTP request/verify lives in `cmd/auth`
- access token is returned in JSON
- refresh token is cookie-backed and `HttpOnly`
- frontend must not read or persist refresh token from JavaScript
- frontend auth endpoints must use `credentials: "include"`
- same-site browser paths are `/auth/v1/*` and `/api/v1/*`
- `/app/profile` is the canonical authenticated profile bootstrap endpoint

Admin navigation is separate from profile:

- `GET /app/me/navigation`

## 6. Admin control-plane contract

Current locked rules:

- secure admin API routes use `/app/...`
- `Module registry` is root-only
- non-root admin access is section-level, allow-only
- current access values are `read` and `write`
- `GET /app/profile` must not become a navigation payload
- non-root sections must come from backend grants, not frontend fabrication

## 7. Platform Builder V2 contract

Current direction:

- V2 lives app-local in `tenant-web`
- the shared layer is `platform-builder-core`, not a shared UI package
- Forms and Navigation are the primary builder surfaces
- `ezform` is a reference for interaction ideas, not code to copy
- old builder code is reference-only
- backend storage and DDL rules remain backend-owned

## 8. Documentation contract

- repo-relative links only in new docs
- `platform/docs/ai/*` is the canonical AI memory layer
- `platform/docs/ai/prompts/*` are stable operational prompt contracts, not project truth
- `platform/docs/ai/templates/*` are operational templates, not project truth
- `platform/docs/ai/runs/*` are execution artifacts, not canonical memory
- `platform/backend/docs/*` and `platform/frontend/docs/*` hold local contracts and runbooks
- one-off prompts belong in archive, not in canonical memory

## 9. Non-negotiable invariants

- no cross-tenant data leakage
- no hidden auth bypasses
- no silent frontend/backend contract drift
- no machine-local absolute links in new documentation
- no generated or donor surfaces used as default source of truth
- no widening of shared package boundaries without a real reuse reason
