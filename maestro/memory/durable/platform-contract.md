# Platform Contract

Status: compact active contract
Last compacted: 2026-04-25

## Product Shape

- `landed`: The product is a monorepo with product runtime under `platform/`.
- `landed`: Backend is a modular monolith with multiple runtime entrypoints, not early microservices.
- `landed`: Frontend is split into product applications plus shared packages.
- `landed`: Shared packages are allowed only when reuse and API stability justify them.

## Backend Contract

- `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, and `cmd/migrate` are current runtime surfaces.
- `cmd/worker` is planned/deferred, not current code.
- Handlers stay thin; business logic belongs in services; persistence belongs in repositories or platform storage layers.
- Transport DTOs must not leak into repository logic.
- Migrations are owned by `cmd/migrate`; API startup must not run schema migrations.
- Admin and tenant semantics must stay explicit.
- Tenant scope must come from trusted runtime context.
- Backend partial-success or post-save failures should include actionable diagnostic context: tenant, affected object ids, and underlying error.

## Frontend Contract

- Current apps are `platform-admin-web` and `tenant-web`.
- Current app delivery is online web application delivery.
- `tenant-pwa` is deferred.
- Offline PWA and Flutter/hybrid mobile are future delivery layers, not active implementation scope.
- Apps may import packages; packages must not import apps.
- No deep imports across package boundaries.
- UI-free packages must stay UI-free.
- `platform-studio-core` is a typed contract/helper package, not a shared UI package.
- `@platform/collection-table` is the current collection table runtime package.

## Platform Studio Contract

- Platform Studio is a tenant-web suite of builder/configuration tools, not a synonym for Form Builder.
- Form Builder is active and owns model/view authoring plus additive runtime apply.
- Navigation Builder is planned and owns sidebar/navigation composition, module assembly from views, runtime exposure, and likely access/permission assignment.
- Action Builder is planned and owns authored events, notifications, conditional behavior, and post-submit side effects.
- PDF Builder is planned and owns PDF template/configuration output over authored/runtime data.
- Report Builder is planned and owns report definitions and analytical/read-only outputs.
- Planned tool concerns must not be implemented as Form Builder scope creep without an accepted boundary decision.

## Multi-Tenant Contract

- Master DB owns control-plane and auth-related data.
- Tenant DBs own tenant application data.
- Tenant-aware tables retain `tenant_id`.
- Tenant databases may be sandbox/shared or dedicated.
- Tenant scope must not come from arbitrary client input.
- Cross-tenant data leakage is a critical failure.

## Auth Contract

- Refresh token is cookie-backed and `HttpOnly`.
- Frontend must not read or persist refresh token in JavaScript.
- Frontend auth endpoints must use `credentials: "include"`.
- Frontend stores access token and expiry for runtime-authenticated requests.
- Same-site browser-facing paths are `/auth/v1/*` and `/api/v1/*`.
- `/app/profile` is the authenticated profile bootstrap endpoint.
- Admin navigation comes from `GET /app/me/navigation`.

## Documentation Contract

- Use repo-relative paths in new docs.
- Distinguish canonical, supporting, working, operational, and historical docs.
- Do not treat prompts, templates, run artifacts, or old execution notes as durable project truth.
- Do not keep closed runs in hot retrieval.
- Distill durable outcomes into compact module packs before archiving raw work artifacts.
- Treat reference code as opt-in donor material, not product truth.
- Keep raw reference packs outside the default read path and distill reusable lessons into module memory.
- Treat PWA/offline and Flutter/mobile docs as proposals until owner activation.
