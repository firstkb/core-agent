# UI Kit

Shared UI primitives and reusable UI patterns built on top of `design-tokens`.

This package is the landing zone for vendor-free extraction from the Metronic references. Do not copy vendor routing, auth, provider, or demo-layout logic here.

Canonical governance lives in `platform/frontend/docs/contracts/ui-kit.md`.

## Boundary

- reusable UI only;
- no tenant-specific behavior;
- no platform-admin page logic;
- no routing or auth logic;
- no direct dependence on demo config.

## Extraction Order

1. `components/button`
2. `components/input`
3. `components/card`
4. `components/badge`
5. `patterns/empty-state`
6. `patterns/loading-state`
7. `layouts/app-shell`

Current canonical component inventory is maintained in `platform/frontend/docs/contracts/ui-kit.md`.
