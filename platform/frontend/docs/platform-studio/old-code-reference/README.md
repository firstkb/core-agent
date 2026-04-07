# Old Code Reference

This folder stores reference material for the retired Platform Studio implementation without letting that implementation act like live product guidance again.

## Reusable Foundation

Keep reusable foundation in live source paths, not in this archive.

Primary active surfaces:

- `platform/frontend/packages/platform-studio-core/**`
- `platform/frontend/apps/tenant-web/src/features/published-app/**`
- `platform/frontend/apps/tenant-web/src/shared/**`

See `reusable-foundation-notes.md` for the current classification.

## Discarded UI

Discarded product direction belongs in notes, not in live code and not as a large raw snapshot.

Use `discarded-ui-patterns.md` for:

- old sidebar-module framing
- cockpit-style control surfaces
- diagnostics-first top-level pages
- publish-center-first UX
- other UI patterns that should not return as the V2 baseline

## Temporary Code Snapshot

The `code-snapshot/` subtree is now a tiny temporary residue, not a full source dump.
Keep only the remaining raw files that still help explain draft/view mutation and preview adaptation details:

- `code-snapshot/tenant-web/src/features/platform-builder/draft/builder-draft-seed.ts`
- `code-snapshot/tenant-web/src/features/platform-builder/draft/builder-draft-store.ts`
- `code-snapshot/tenant-web/src/features/platform-builder/draft/builder-preview-manifest.ts`
- `code-snapshot/tenant-web/src/features/platform-builder/preview/resolve-builder-preview-state.ts`
- `code-snapshot/tenant-web/src/features/platform-builder/views/view-builder-state.ts`

Do not keep here:

- active frontend source code moved out of the app just for archival
- discarded UI screens, shells, CSS, or route trees
- duplicated runtime helpers that still exist in live source
- tests kept only because they were part of the old dump
- new design decisions for V2

Delete the temporary snapshot once those remaining patterns are fully captured in notes or deliberately re-extracted into a cleaner legacy location.
