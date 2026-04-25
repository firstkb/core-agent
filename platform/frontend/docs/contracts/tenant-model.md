# Frontend Tenant Model Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: tenant-aware frontend shared logic

This contract defines what belongs in `tenant-core` versus the owning app.

It does not define app ownership or future offline/PWA runtime split.

## `tenant-core` Owns

- current tenant identity
- tenant-scoped configuration
- branding resolution
- tenant permissions mapping
- runtime tenant context
- stable tenant primitives reused across apps

## Apps Consume

- resolved tenant context
- branded UI tokens
- tenant-aware routing data
- tenant permission results
- tenant guards and route-level behavior composed by the app

## Stays In App Code

- tenant-specific page behavior
- route-level composition
- screen-specific permission decisions
- tenant workflows that are not reused across apps
- tenant-only offline behavior while offline remains future/proposal scope

## Rule

Tenant-aware logic reused across apps belongs in `platform/frontend/packages/tenant-core`.
Tenant-specific runtime behavior stays inside the owning app until it becomes a real shared contract.

If future PWA/offline or Flutter/mobile work is activated, tenant shared logic must be re-evaluated before extracting new packages.
