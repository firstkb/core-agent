# Admin Module Registry

Status: active compact module pack
Owner surface: admin Module Registry product domain, cross-stack admin FE/BE
Last compacted: 2026-04-25

## Read This When

- changing Module Registry list/manage/grants
- touching module/section maintenance
- changing module registry endpoint families
- changing admin pages that manage modules or sections
- changing module-registry-specific use of Collection Table

## Owner Sources

- `platform/docs/ai/modules/admin-module-registry.md`
- `platform/backend/docs/contracts/admin-module-registry.md`
- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/collection-table.md`

## Fast Facts

- Admin Module Registry is a root-only control-plane domain.
- It uses Collection Table for its list surface.
- It does not own the generic Collection Table contract.
- The list surface id is `module-registry.list`.
- Prefer new contract-first admin docs over old compatibility pointer paths.
