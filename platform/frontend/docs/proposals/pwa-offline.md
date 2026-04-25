# PWA And Offline Proposal

Status: proposed future
Owner: frontend
Last audited: 2026-04-25
Canonical scope: future offline/PWA delivery strategy

This proposal preserves the offline/PWA decision boundary.
It is not active implementation scope.

## Current Position

- Current applications are online web applications.
- `platform-admin-web` and `tenant-web` are the active apps.
- Offline PWA and Flutter/hybrid mobile are future delivery layers after the main web platform stabilizes.
- `tenant-pwa` is deferred and is not a current runtime surface.

## Current Rule

Do not introduce offline-first architecture, service-worker sync, local persistence sync, conflict resolution queues, or mobile shell assumptions into current implementation tasks without explicit owner activation.

## Offline As Capability

Offline starts as a capability, not as a separate app by default.

If lightweight tenant-only offline behavior is needed before a separate runtime exists, it should stay close to `tenant-web` until reuse, API shape, and runtime constraints are proven.

## Move To A Shared Offline Package Only When

- sync logic is reused by multiple apps
- retry, queue, conflict, and reconciliation rules are stable
- the public API can be documented cleanly
- security and tenant-isolation rules are explicit

## Move To A Separate PWA App Only When

- offline-first UX becomes materially different from `tenant-web`
- the release track diverges
- installability and runtime constraints require a separate app shell
- service worker and local data lifecycle become product-critical
- the owner explicitly activates PWA/offline delivery

## Flutter Or Hybrid Mobile

Flutter/hybrid mobile is also future delivery scope.
Do not design current web app contracts around mobile shell assumptions unless that work is activated.

When activated, mobile/PWA strategy should get its own contract instead of being mixed into current online web app docs.
