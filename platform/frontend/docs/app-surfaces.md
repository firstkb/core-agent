# App Surfaces

## `platform-admin-web`

Internal platform or backoffice application.

Owns:

- operational dashboards
- tenant management screens
- support and moderation tools
- platform-level settings

## `tenant-web`

Tenant-scoped product surface.

Owns:

- tenant user journeys
- tenant-specific navigation
- tenant branding and permissions
- progressive offline support inside the app boundary

## Deferred Surface

Add `tenant-pwa` only when at least one of these becomes true:

- offline-first flow diverges from the browser flow;
- release cadence differs from `tenant-web`;
- routing, shell, or sync model becomes materially different.
