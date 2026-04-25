# Frontend Collection Table Package

Status: active compact frontend pack
Owner surface: `@platform/collection-table`
Last compacted: 2026-04-25

## Read This When

- editing `platform/frontend/packages/collection-table`
- changing table runtime state, render shell, quick filters, saved filters, favorites, row actions, or package exports
- changing admin host adapters for table pages

## Owner Sources

- `ai-memory/modules/domains/collection-table/`
- `platform/frontend/docs/contracts/collection-table.md`
- `platform/frontend/docs/contracts/package-boundaries.md`
- `platform/frontend/packages/collection-table`

## Frontend Contract

- Shared package owns generic runtime/state/render/table interactions.
- App hosts own endpoint mapping, auth/session, route navigation, and toolbar composition.
- Shared package must not import app code.
- Generic callbacks may exist for host side effects.
- Package extraction is landed but does not prove full cross-app adoption.

## Current Consumers

- `platform-admin-web` Module Registry list
- `platform-admin-web` Employees list
- `platform-admin-web` Tenants list

## Lessons

- Do not add page-specific toolbar behavior to the package.
- Do not hardcode admin backend URLs into the package.
- Do not treat an admin consumer as a universal product requirement.
