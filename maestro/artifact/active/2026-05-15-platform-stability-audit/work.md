# Work

- Work ID: `2026-05-15-platform-stability-audit`
- Status: `in_progress`
- Owner goal: Improve stability of the VSM application by testing the tenant app frontend/backend module chain first, with admin deferred because it is not yet developed to the same depth.

## Understanding

The owner wants a stability-oriented audit before broad fixes. The current priority is the tenant app because it already contains the active product workflows: Platform Studio, Form Builder, Navigation Builder, form rendering/table output, and static information pages.

## Agreed Scope

- In: tenant app FE/BE stability testing, authenticated Browser Use smoke at `https://demo.platform.localhost/`, backend targeted checks for tenant modules, FE runtime/visual checks, and evidence-driven issue prioritization.
- Out: admin app deep testing, product-code edits, production email/SMS provider implementation, migrations, auth/tenant behavior changes, destructive operations, release/deploy, or broad refactors until an explicit execution slice is selected.

## Continuity Snapshot

- Latest owner correction: Start the next testing phase inside the tenant app; admin is deferred because it is still raw.
- Current phase: `tenant auth remaining testing items complete`
- Artifact path: `maestro/artifact/active/2026-05-15-platform-stability-audit/`
- Gates / approvals: No product-code or high-risk approval yet.
- Evidence status: Read-only command baseline, public FE Browser smoke, tenant authenticated Browser auth smoke, direct tenant auth/API probe, targeted Auth FE/BE code checks, Auth notification/provider review, tenant secure route wiring test, and tenant Auth dependency Browser/API smoke completed.
- Unresolved owner decisions: None for read-only baseline.
- Next allowed action: Continue to the next tenant module testing slice; remaining Auth items are documented coverage/future-work gaps, not current blockers.

## Decisions

- Use one Maestro-coordinated stability audit, not separate independent FE and BE audits.
- Prefer vertical product/module slices for business logic stability, with horizontal FE-only or BE-only checks reserved for infrastructure surfaces.
- Defer deep admin testing; prioritize tenant app stability because active tenant workflows are more complete.

## Plan

1. Capture the current repository/product baseline and command health without making product-code changes.
2. Build a stability matrix covering backend, frontend, cross-stack contracts, auth/tenant/security, and UI/runtime evidence needs.
3. Prioritize the first vertical module slice from actual failures and known risk areas.
4. Only after the first slice is selected, move into scoped implementation and verification.

## First Tenant Stability Slice

- Slice: Tenant app authenticated shell plus Platform Studio runtime chain.
- Why first: all mature tenant workflows depend on profile bootstrap, runtime navigation, Platform Studio entrypoints, Form Builder, Navigation Builder, form runtime/table output, and static app pages.
- Backend surfaces: `cmd/api-tenant`, `modules/tenant/profile`, `modules/tenant/platformstudioformbuilder`, `modules/tenant/platformstudioformruntime`, `modules/tenant/platformstudionavigationbuilder`, `modules/tenant/apppages/businesstree`, and shared tenant/auth helpers as needed.
- Frontend surfaces: `apps/tenant-web/src/app/*`, `features/platform-studio/**`, `features/form-runtime/**`, `features/published-app/**`, `features/app-pages/**`, `packages/api-client`, `packages/auth-core`, `packages/tenant-core`, and `packages/platform-studio-core`.
- Evidence target: authenticated Browser Use smoke, API/bootstrap checks, targeted tenant FE tests, targeted tenant BE tests, and a prioritized issue matrix.

## Auth Code-Test Slice

- Scope: close the tenant Auth question before continuing to Platform Studio.
- Criteria:
  - Errors: targeted tests, type/lint/build where useful, obvious runtime/error-handling faults.
  - Logic: OTP request/verify, refresh/logout, profile bootstrap, tenant context, access-token handling, retry/recovery behavior, and no frontend-supplied tenant identity.
  - Boundaries: frontend `api-client`/`auth-core`/`tenant-web` responsibilities, backend `cmd/auth`/shared auth/session/tenant profile separation, and no handler-owned SQL or catch-all module growth.
  - Contract/security drift: `credentials: "include"`, HttpOnly refresh cookie, access token only in JS state, same-site paths, trusted tenant context, and profile/navigation responsibility split.
  - Coverage: identify what is tested, what is smoke-tested only, and what remains uncovered.
- Recorded findings:
  - OTP code is included in persisted audit event data; owner accepts this temporarily because real email/SMS delivery is not implemented yet.
  - OTP code generation is fixed for development-like environments and random only outside those environments.
  - Email/SMS delivery is debug-only; production provider implementation and prod config guard are separate future product work and are out of the current testing scope.
- Follow-up testing results:
  - Added backend route wiring coverage for tenant Auth-dependent routes: `/app/profile`, `/app/navigation`, `/app/platform-studio/navigation`, and `/app/platform-studio/forms/models` are registered as `TierSecure`.
  - Browser Use confirmed authenticated dashboard, Form Builder, and Navigation Builder entrypoints render without sign-in redirect or console warnings.
  - Direct unauthenticated probes confirmed `/app/profile`, `/app/navigation`, `/app/platform-studio/navigation`, and `/app/platform-studio/forms/models` return `401`.
  - Tenant sign-in component/integration test remains a known FE coverage gap; adding a DOM testing stack is out of the current testing scope.
  - Node warning was caused by login-shell PATH resolving `/usr/local/bin/node` v18.17.0 before `/opt/homebrew/bin/node` v22.22.1. The local machine was corrected at shell profile level (`~/.zprofile` and `~/.bash_profile`), while the project now fails fast through `.npmrc` `engine-strict=true` and keys Turbo cache on frontend Node/version-manager files.
- Next allowed action: move to the next tenant module test slice unless owner explicitly opens an Auth implementation slice.

## Risks / Gates

- Auth/session, tenant isolation, permissions, migrations, seed data, and production/release actions require explicit approval before changes.
- A green FE-only or BE-only result is insufficient when the user-visible workflow depends on both sides.
- Broad refactoring before baseline evidence could hide regressions or make failures harder to attribute.
- Owner has authenticated in the in-app browser. Evidence must not record credentials or auth codes; use `Auth: local seeded dev login.` wording only.

## Agent / Tool Notes

- Keep work inline for the initial baseline.
- Use specialists only if a later slice needs separate research, implementation, verification, or review.
- Build Web Apps `frontend-testing-debugging` plus Browser plugin is approved for FE smoke and visual/runtime checks.

## Evidence

- `evidence.md`

## Next Action

Continue tenant runtime navigation and Platform Studio entrypoint testing.
