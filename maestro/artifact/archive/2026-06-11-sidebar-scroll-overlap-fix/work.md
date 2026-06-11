# Work

- Work ID: `2026-06-11-sidebar-scroll-overlap-fix`
- Status: `archived`
- Owner goal: Fix the tenant left menu so navigation scrolls and does not overlap the user card on short desktop or mobile screens.

## Goal Alignment

- Owner strategy: Keep the tenant web shell usable on constrained desktop and mobile viewports.
- Product/user risk: Sidebar navigation items can become hidden behind the user profile card, blocking access to lower menu entries.
- Current action: Patch the app shell empty-navigation render path plus tenant sidebar layout CSS, then verify with Browser Use on the authenticated local route.
- Exit criteria: The sidebar navigation uses the available middle column height, becomes its own scroll area only when content exceeds that height, and the user card remains separate on desktop and mobile drawer checks.

## Understanding

The owner reported that the left menu is missing or not honoring scroll and that, on smaller screens, menu items slide under the user profile card. Screenshots show the `Links` section and `eSafety Systems` row colliding with the bottom user card.

## Agreed Scope

- In: Tenant web sidebar layout CSS, the app-shell empty-navigation render path, and focused visual/browser verification.
- Out: Navigation data, runtime navigation permissions, backend, auth/session behavior, tenant routing, and design-system restructuring.

## Continuity Snapshot

- Latest owner correction: Use Browser Use with the already authenticated open in-app browser tab.
- Current phase: `in_progress`
- Artifact path: `maestro/artifact/archive/2026-06-11-sidebar-scroll-overlap-fix/`
- Gates / approvals: none required; frontend-only layout fix.
- Evidence status: Browser Use desktop/mobile checks passed; targeted typecheck/lint passed; preflight passed with bundled Python 3.12.
- Unresolved owner decisions: none.
- Next allowed action: Apply the scoped CSS fix and rerun Browser Use checks.

## Decisions

- Keep the flex-scroll sizing app-local in tenant-web CSS because the tenant app currently supplies the full sidebar navigation through the shell label slot.
- Do not render an empty app-shell navigation container when `navigation` has no items; it is inert UI and consumes flex height.

## Plan

1. Skip empty shell navigation render when `navigation.length === 0`.
2. Constrain the tenant sidebar navigation wrapper so the nav stack can shrink and scroll.
3. Verify short desktop and mobile drawer viewports in Browser Use.
4. Run focused frontend checks and repository preflight before closeout.

## Risks / Gates

- No approval gate. Main risk is changing shared shell behavior accidentally, so the patch avoids shared package API changes.

## Agent / Tool Notes

- Browser Use is available and connected to `https://demo.platform.localhost/dashboard` with local seeded authenticated state.

## Evidence

- Pending `evidence.md`.

## Next Action

Owner review.
