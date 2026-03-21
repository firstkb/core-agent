# Tenant Web

Tenant-scoped user application.

## Boundary

- owns tenant-facing journeys and navigation;
- consumes shared packages from `../../packages`;
- keeps early offline support inside the app boundary;
- must not be imported by any package.
