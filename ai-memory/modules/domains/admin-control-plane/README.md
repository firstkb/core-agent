# Admin Control Plane

Status: active compact module pack
Owner surface: admin control-plane product domain, cross-stack admin FE/BE
Last compacted: 2026-04-25

## Read This When

- touching admin navigation
- touching root/non-root behavior
- changing grants or access policy
- changing tenant onboarding or tenant inventory
- changing Employees or other admin collection surfaces

## Owner Sources

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

Historical import context lives in `ai-memory/durable/legacy-memory-import.md`; the old `platform/docs/ai/**` path has been deleted.

## Fast Facts

- Module Registry is root-only.
- Employees directory is root-only.
- Tenant inventory is root-only until secured non-root list coverage exists.
- Non-root access is section-level and allow-only.
- Current access values are `read` and `write`.
- `/app/profile` is not navigation.
- Navigation comes from `GET /app/me/navigation`.
- Prefer new contract-first admin docs over old compatibility pointer paths.
