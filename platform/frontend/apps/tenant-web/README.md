# Tenant Web

Tenant-scoped user application.

For the active app contract, read:

- `platform/frontend/docs/modules/tenant-web.md`

## Boundary

- owns tenant-facing journeys and navigation;
- consumes shared packages from `../../packages`;
- treats PWA/offline/mobile as future scope unless explicitly activated;
- must not be imported by any package.
