# Offline Strategy

Offline is a capability first, not a separate app by default.

## Current Rule

Keep offline code under `apps/tenant-web/src/offline`.

## Move To `packages/offline-sync` Only When

- sync logic is reused by multiple apps;
- retry, queue, conflict, and reconciliation rules become stable;
- the public API can be documented cleanly.

## Move To `apps/tenant-pwa` Only When

- offline-first UX becomes materially different;
- the release track diverges;
- installability and runtime constraints require a separate app shell.
