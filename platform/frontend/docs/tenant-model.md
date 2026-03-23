# Tenant Model

Canonical boundary for tenant-aware shared logic.

This document answers one question:

- what belongs in `packages/tenant-core` versus in the owning app

It does not define:

- which app owns the tenant-facing runtime surface
- when offline becomes its own runtime

See:

- `app-surfaces.md`
- `offline-strategy.md`

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

## Stays In App Code

- tenant-specific page behavior
- route-level composition
- screen-specific permissions decisions
- tenant workflows that are not reused across apps
- offline features that still belong only to `tenant-web`

## Rule

Tenant-aware logic that is reused across apps belongs in `packages/tenant-core`.
Tenant-specific runtime behavior stays inside the owning app until it becomes a real shared contract.
