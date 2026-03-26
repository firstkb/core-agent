# Frontend Docs

Entry point for the active frontend documentation set.

## Active Docs

- `ui-delivery-order.md`: canonical execution order for donor extraction, review, gap filling, and only then the main system template
- `package-boundaries.md`: canonical package responsibilities and import rules
- `app-surfaces.md`: app responsibilities and naming decisions
- `tenant-model.md`: tenant runtime model and cross-app tenant concerns
- `auth-runtime-followups.md`: tracked follow-up work for config bootstrap, mock auth/profile gating, and future API integration
- `offline-strategy.md`: when offline stays inside `tenant-web` and when it becomes its own surface
- `foundation-rollout-plan.md`: closed rollout document for the foundation baseline and current rollout status
- `layout-baseline.md`: lightweight layout and grid contract for stable width behavior without a heavy framework grid system
- `install-helper-runtime.md`: current install/access layer contract built on `packages/install-helper`
- `phase-e-gap-review.md`: closed-cycle gap review for shared-layer expansion after the first full approval pass
- `deferred-composed-surfaces.md`: backlog and boundary rules for larger workflow-shaped surfaces that should be revisited after the main interface baseline
- `ui-lab-structure.md`: exact `UI Lab` section structure, purpose, and promotion boundary
- `ui-lab-ui-kit-coverage.md`: current `ui-kit` inventory mapped to the canonical `UI Lab` sections
- `ui-kit-boundary-audit.md`: what stays in `ui-kit`, what is provisional, and what stays in app code
- `ui-kit-stable-approved-audit.md`: current snapshot of which `ui-kit` primitives are already approved as stable shared contracts

## Vendor Donor Material

- `vendor/README.md`: vendor-doc index
- `vendor/metronic-inventory.md`: inventory and extraction decisions for Metronic donor sources
- `metronic/`

`metronic/` stays in the repository as donor reference material. Do not treat it as runtime source of truth.

## UI Lab Implementation

- runtime route: `/root/ui-lab`
- implementation module: `apps/platform-admin-web/src/internal/ui-lab`
- route wiring: `apps/platform-admin-web/src/app/app.tsx`
