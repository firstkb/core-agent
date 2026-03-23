# Offline Strategy

Canonical escalation rule for offline capability.

This document answers one question:

- when offline stays inside `tenant-web`, becomes a shared package, or becomes its own app surface

It does not redefine:

- app ownership from `app-surfaces.md`
- tenant shared-logic boundaries from `tenant-model.md`

## Core Position

Offline is a capability first, not a separate app by default.

## Current Rule

Keep offline code under `apps/tenant-web/src/offline`.

Reason:

- the current offline capability is still part of the tenant app, not a third runtime surface
- tenant-specific offline UX should stay close to the owning app until reuse or runtime divergence is real

## Move To `packages/offline-sync` Only When

- sync logic is reused by multiple apps;
- retry, queue, conflict, and reconciliation rules become stable;
- the public API can be documented cleanly.

## Move To `apps/tenant-pwa` Only When

- offline-first UX becomes materially different;
- the release track diverges;
- installability and runtime constraints require a separate app shell.

## Rule

- shared offline mechanics go to `packages/offline-sync` only after reuse and API stability are real
- tenant-only offline behavior stays in `tenant-web`
- `tenant-pwa` is a later runtime split, not a default part of the current frontend layout
