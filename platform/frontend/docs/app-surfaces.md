# App Surfaces

Canonical ownership map for the frontend runtime surfaces.

This document answers one question:

- which app owns which user-facing runtime surface

It does not redefine:

- tenant shared logic boundaries from `tenant-model.md`
- offline escalation rules from `offline-strategy.md`

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
- tenant page behavior
- tenant-facing use of branding, permissions, and tenant context
- current offline capability while it remains part of the tenant app itself

## Deferred Surface

`tenant-pwa` is not a current runtime surface.

Add it only if offline becomes a distinct runtime or release track.

For the exact escalation rules, see `offline-strategy.md`.
