# Collection Table

Status: active compact module pack
Owner surface: collection-table product domain, frontend package plus backend helpers
Last compacted: 2026-04-25

## Read This When

- changing `@platform/collection-table`
- changing collection metadata, fields, columns, search, filters, saved filters, favorites, row actions, or exports
- changing shared table backend helpers
- adding a new table consumer
- evaluating admin-vs-tenant reuse

## Owner Sources

- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/collection-table.md`
- `platform/frontend/docs/contracts/package-boundaries.md`

Historical import context lives in `ai-memory/durable/legacy-memory-import.md`; the old `platform/docs/ai/**` path has been deleted.

## Fast Facts

- Collection Table is its own reusable runtime/package domain.
- It is not owned by Module Registry.
- Frontend runtime/page host lives in `@platform/collection-table`.
- Current real admin consumers are Module Registry, Employees, and Tenants.
- App hosts own endpoint mapping, route behavior, auth/session, and route-specific actions.
