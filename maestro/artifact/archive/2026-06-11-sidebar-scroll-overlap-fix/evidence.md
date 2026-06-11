# Evidence

- Work ID: `2026-06-11-sidebar-scroll-overlap-fix`
- Shape: compact Markdown evidence log.

## Summary

Tenant sidebar scroll/overlap was fixed with a combined React and CSS change:
`WorkspaceShell` no longer renders an empty navigation container when `navigation`
has no items, and the tenant sidebar navigation slot now participates in flex
sizing so the nav stack gets the full available middle height.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| Browser Use page identity | passed | `https://demo.platform.localhost/dashboard`, title `Tenant Web` | Auth: local seeded dev login. |
| Browser Use nonblank DOM | passed | DOM snapshot contained `Dashboard` and `Safety Intelligence` | No framework overlay found. |
| Browser Use console health | passed | `tab.dev.logs({ levels: ["error", "warn"], limit: 50 })` returned `[]` | Checked after implementation. |
| Browser Use desktop short viewport | passed | `1024x768` | Expanded sidebar: `emptyShellNavCount=0`, nav stack `clientHeight=558`, `scrollHeight=664`, footer overlap `0`. |
| Browser Use desktop scroll interaction | passed | `1024x768` | Wheel scroll changed nav stack `scrollTop` from `0` to `107`; `eSafety Systems` visible above footer. |
| Browser Use mobile drawer viewport | passed | `390x844` | Drawer open: nav stack `clientHeight=467`, `scrollHeight=664`, footer/mobile-bottom overlap `0`. |
| Browser Use mobile scroll interaction | passed | `390x844` | Wheel scroll changed nav stack `scrollTop` to `198`; `eSafety Systems` visible above `DEV` and user card. |
| `pnpm --filter @platform/app-shell typecheck` | passed | `tsc -p tsconfig.json --noEmit` | Shared shell React change. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` | Tenant app surface. |
| `pnpm --filter @platform/app-shell lint` | passed | `eslint src` | Shared shell React change. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` | Tenant app CSS surface. |
| `scripts/preflight.sh` | passed | rerun with bundled Python 3.12.13 on PATH | Initial system Python 3.9.6 run failed because `tomllib` was unavailable. |

## Changed Files

- `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
- `platform/frontend/apps/tenant-web/src/app/app.css`
- `maestro/artifact/active/2026-06-11-sidebar-scroll-overlap-fix/work.md`
- `maestro/artifact/active/2026-06-11-sidebar-scroll-overlap-fix/evidence.md`

## Browser / Visual Evidence

- Before fix at `1024x768`: expanded sidebar nav content extended under the user card; `eSafety Systems` intersected the footer area visually.
- After CSS-only patch: overlap was clipped, but scroll-area height was only `275px`, because an empty shell nav still consumed half the middle column.
- Final after React + CSS patch: empty shell nav count is `0`; the scroll area uses the full available middle block on desktop and mobile.

## Review Evidence

- Build Web Apps `frontend-app-builder` used as small UI fix guidance inside the existing design system; ImageGen/concept work skipped because this is not a redesign.
- Build Web Apps `frontend-testing-debugging` used for Browser Use validation loop.
- React best practices used for explicit conditional rendering / early return: do not render inert empty navigation UI.

## Skipped Checks

- No full frontend build or full test suite run; change is scoped to app-shell render behavior and tenant sidebar layout, with targeted typecheck/lint plus repo preflight.

## Residual Risks

- The tenant app still uses `sidebarNavigationLabel` as a full navigation slot. The fix preserves that pattern rather than introducing a new shared `sidebarNavigation` prop.
