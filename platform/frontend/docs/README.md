# Frontend Docs

Active docs for the frontend workspace.

- `frontend-ai-agent-starter-kit.md`: starter set, decisions, and ordered next steps
- `ui-delivery-order.md`: canonical execution order for donor extraction, review, gap filling, and only then the main system template
- `foundation-rollout-plan.md`: canonical plan for introducing the visual foundation before module-level UI work
- `layout-baseline.md`: lightweight layout and grid contract for stable width behavior without a heavy framework grid system
- `phase-e-gap-review.md`: grounded shortlist of real frontend shared-layer gaps after the foundation and approval passes
- `package-boundaries.md`: canonical package responsibilities and import rules
- `ui-lab-structure.md`: exact `UI Lab` section structure, purpose, and promotion boundary
- `ui-lab-ui-kit-coverage.md`: current `ui-kit` inventory mapped to the canonical `UI Lab` sections
- `ui-kit-boundary-audit.md`: what stays in `ui-kit`, what is provisional, and what stays in app code
- `ui-kit-stable-approved-audit.md`: current snapshot of which `ui-kit` primitives are already approved as stable shared contracts
- `app-surfaces.md`: app responsibilities and naming decisions
- `tenant-model.md`: tenant runtime model and cross-app tenant concerns
- `offline-strategy.md`: when offline stays inside `tenant-web` and when it becomes its own surface
- `vendor/metronic-inventory.md`: inventory and extraction decisions for Metronic donor sources

Reference material:

- `frontend-skeleton-tree.txt`
- `frontend-skeleton.zip`
- `metronic/`
- `metronic-ai-standard-guide.md`

UI Lab implementation:

- runtime route: `/root/ui-lab`
- implementation module: `apps/platform-admin-web/src/internal/ui-lab`
- route wiring: `apps/platform-admin-web/src/app/app.tsx`
