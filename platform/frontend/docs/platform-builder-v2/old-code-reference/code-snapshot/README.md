# Temporary Code Snapshot

This directory is a temporary raw residue, not a full archive of the retired Platform Builder source tree.

Status:

- historical reference only
- not part of the live tenant runtime
- not authoritative for V2 product or runtime decisions
- reduced to the minimum raw files still useful for draft/view mutation and preview adaptation reference

Retained raw files:

- `tenant-web/src/features/platform-builder/draft/builder-draft-seed.ts`
- `tenant-web/src/features/platform-builder/draft/builder-draft-store.ts`
- `tenant-web/src/features/platform-builder/draft/builder-preview-manifest.ts`
- `tenant-web/src/features/platform-builder/preview/resolve-builder-preview-state.ts`
- `tenant-web/src/features/platform-builder/views/view-builder-state.ts`

Read these before opening snapshot code:

- `../README.md`
- `../current-builder-file-map.md`
- `../reusable-foundation-notes.md`

If a behavior is still active, it must live in current source paths such as:

- `platform/frontend/apps/tenant-web/src/features/published-app/**`
- `platform/frontend/packages/platform-builder-core/**`

Discarded UI pages, shells, CSS, tests, and runtime copies were intentionally removed from this snapshot during final cleanup.
Do not move files from this residue back into live app paths without an explicit extraction decision.
