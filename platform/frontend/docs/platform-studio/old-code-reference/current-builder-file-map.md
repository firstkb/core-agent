# Current Builder File Map

Temporary raw snapshot residue:

- `platform/frontend/docs/platform-studio/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/draft/builder-draft-seed.ts`
- `platform/frontend/docs/platform-studio/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/draft/builder-draft-store.ts`
- `platform/frontend/docs/platform-studio/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/draft/builder-preview-manifest.ts`
- `platform/frontend/docs/platform-studio/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/preview/resolve-builder-preview-state.ts`
- `platform/frontend/docs/platform-studio/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/views/view-builder-state.ts`

## Classification Summary

| Area | Previous live path | Classification | Current status after final cleanup |
| --- | --- | --- | --- |
| Access UI | `platform/frontend/apps/tenant-web/src/features/platform-builder/access/**` | discarded UI | raw snapshot removed; keep only notes in `discarded-ui-patterns.md` |
| Capability gate | `platform/frontend/apps/tenant-web/src/features/platform-builder/capability/**` | discarded rollout UI | raw snapshot removed; no live tenant entry point remains |
| Builder chrome | `platform/frontend/apps/tenant-web/src/features/platform-builder/components/**` | discarded UI shell | raw snapshot removed; no live page uses builder shell or action rail |
| Draft authoring state | `platform/frontend/apps/tenant-web/src/features/platform-builder/draft/**` | temporary raw reference | keep only `builder-draft-seed.ts`, `builder-draft-store.ts`, and `builder-preview-manifest.ts` |
| Navigation builder UI | `platform/frontend/apps/tenant-web/src/features/platform-builder/navigation/**` | discarded UI | raw snapshot removed; tenant sidebar no longer exposes it |
| Models / views / preview pages | `platform/frontend/apps/tenant-web/src/features/platform-builder/pages/**`, `.../preview/**`, `.../views/**` | mixed: mostly discarded UI, tiny technical residue | raw pages removed; keep only `preview/resolve-builder-preview-state.ts` and `views/view-builder-state.ts` |
| Publish UI | `platform/frontend/apps/tenant-web/src/features/platform-builder/publish/**` | discarded UI | raw snapshot removed; publish-center-first UX remains documented only |
| Runtime helpers embedded in old builder | `platform/frontend/apps/tenant-web/src/features/platform-builder/runtime/**` | keep active foundation, but not at old path | raw runtime copy removed; reusable runtime lives in `platform/frontend/apps/tenant-web/src/features/published-app/**` |
| Workflow builder UI | `platform/frontend/apps/tenant-web/src/features/platform-builder/workflows/**` | discarded UI | raw snapshot removed; no live shell entry point remains |
| Builder feature barrel / routes | `platform/frontend/apps/tenant-web/src/features/platform-builder/index.ts`, `.../routes.ts` | discarded UI wiring | raw snapshot removed; route wiring reference now lives in active published runtime paths |
| Shared typed contracts and validation | `platform/frontend/packages/platform-studio-core/**` | keep active foundation | remains live for contracts, schemas, manifest validation, route resolution, and visibility evaluation |

## Live Entry Point Files Changed

These were not archived as raw source snapshots. They were edited in place to remove the retired product direction from the live tenant shell:

- `platform/frontend/apps/tenant-web/src/app/app.tsx`
- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
- `platform/frontend/apps/tenant-web/src/shared/tenant-sidebar-navigation.tsx`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`

## Active Replacement Surface

Reusable runtime behavior that still has value for V2 preparation now lives under:

- `platform/frontend/apps/tenant-web/src/features/published-app/**`

That folder keeps only the neutral published-manifest runtime path used by `/app/:routeKey/*`.
The final cleanup also removed the old builder-named localStorage fallback from the live published runtime.
