# Backend Admin Modules

Status: active compact backend pack
Owner surface: backend admin modules
Last compacted: 2026-04-24

## Read This When

- changing backend admin modules, admin navigation, access policy, employees, tenant management, or module registry

## Owner Sources

- `ai-memory/modules/domains/admin-control-plane/`
- `ai-memory/modules/domains/admin-module-registry/`
- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`
- `platform/backend/modules/admin/**`

## Current Modules

- `accesspolicy`
- `employeeslist`
- `moduleregistrygrants`
- `moduleregistrylist`
- `moduleregistrymanage`
- `navigation`
- `profile`
- `tenantlist`
- `tenantmanagement`

## Contract

- Keep root-only boundaries explicit.
- Non-root access requires route-to-section policy coverage.
- Module Registry remains root-only.
- Employees and tenant inventory remain root-only until explicit non-root coverage is approved.

## Lessons

- Do not expose backend routes without matching access policy.
- Do not treat frontend navigation visibility as authorization.
- Do not let module-specific table behavior leak into shared collection helpers.
