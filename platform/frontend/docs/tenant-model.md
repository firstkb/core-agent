# Tenant Model

Tenant concerns are cross-app but tenant behavior should not leak everywhere.

## Tenant-Core Owns

- current tenant identity
- tenant-scoped configuration
- branding resolution
- tenant permissions mapping
- runtime tenant context

## Apps Consume

- resolved tenant context
- branded UI tokens
- tenant-aware routing and guards

## Boundary

Tenant-aware logic that is reused across apps belongs in `packages/tenant-core`.
Tenant-specific page behavior stays inside the owning app.
