# Closeout

- Work ID: `2026-06-11-sidebar-scroll-overlap-fix`
- Status: `archived`

## Result

Fixed the tenant sidebar scroll height and bottom-card overlap on short desktop
and mobile drawer viewports.

## Changed Files

- `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
- `platform/frontend/apps/tenant-web/src/app/app.css`
- `maestro/artifact/active/2026-06-11-sidebar-scroll-overlap-fix/work.md`
- `maestro/artifact/active/2026-06-11-sidebar-scroll-overlap-fix/evidence.md`
- `maestro/artifact/active/2026-06-11-sidebar-scroll-overlap-fix/closeout.md`

## Checks

- Browser Use: `1024x768`, `390x844`, and `1440x900` route/state checks.
- `pnpm --filter @platform/app-shell typecheck`
- `pnpm --filter @platform/tenant-web typecheck`
- `pnpm --filter @platform/app-shell lint`
- `pnpm --filter @platform/tenant-web lint`
- `scripts/preflight.sh` with bundled Python 3.12.13 on PATH.

## Notes

- Initial `scripts/preflight.sh` using system `/usr/bin/python3` failed because it is Python 3.9.6 and lacks stdlib `tomllib`; rerunning with the bundled Python 3.12.13 passed.
- No durable memory update needed; this is a localized layout/rendering fix, not a product or architecture decision.
