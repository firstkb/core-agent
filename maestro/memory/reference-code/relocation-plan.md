# Reference Code Relocation Plan

Status: landed local relocation plan
Last compacted: 2026-04-25

This plan records the physical move of raw reference-code packs out of active FE/BE docs paths.

## Goal

Keep product docs compact and trustworthy while preserving opt-in access to donor/vendor/legacy material.

Target shape:

```text
reference-code/
  frontend/
    metronic/
  platform-studio/
    extdb/
    ezform/
    smartapp/
    old-builder-reference/
  backend/
    mssql-legacy-schema/
```

`reference-code/` is local-only and ignored by git.

## Source-To-Pack Map

| Old raw path | Pack alias | Local raw-pack path | Action |
| --- | --- | --- | --- |
| `platform/frontend/docs/metronic/**` | `reference-pack:metronic` | `reference-code/frontend/metronic/` | moved_raw_delete_pointer |
| `platform/frontend/docs/platform-studio/EXTDB/**` | `reference-pack:extdb-legacy` | `reference-code/platform-studio/extdb/` | moved_raw_delete_pointer |
| `platform/frontend/docs/platform-studio/ezform/**` | `reference-pack:ezform-prototype` | `reference-code/platform-studio/ezform/` | moved_raw_delete_pointer |
| `platform/frontend/docs/platform-studio/smartapp/**` | `reference-pack:smartapp-runtime` | `reference-code/platform-studio/smartapp/` | moved_raw_delete_pointer |
| `platform/frontend/docs/platform-studio/old-code-reference/**` | `reference-pack:old-builder-reference` | `reference-code/platform-studio/old-builder-reference/` | moved_raw_delete_pointer |
| `platform/backend/docs/MSSQL/**` | `reference-pack:mssql-legacy-schema` | `reference-code/backend/mssql-legacy-schema/` | moved_raw_delete_pointer |

## Link Rewrite Rules

- Replace hot-doc raw paths with `reference-pack:<alias>` citations.
- Keep exact relative paths only after the alias, for example `reference-pack:extdb-legacy / Template/ExtDBpg_edit.htm`.
- Do not make tracked docs link to local `maestro/memory`.
- Do not make active FE/BE docs read raw packs by default.
- Do not keep old directory-level README pointers; use `maestro/memory/reference-code/README.md` and `reference-pack:*` aliases.

## Docs To Update During Physical Move

| Area | Files to update | Required change |
| --- | --- | --- |
| Root reference docs | `maestro/memory/reference-code/README.md` | Mark raw packs relocated and remove temporary-path language. |
| Frontend index | `platform/frontend/docs/README.md` | Keep donor material opt-in and point to alias registry. |
| Backend index | `platform/backend/docs/README.md` | Mark `MSSQL` as legacy reference pack only. |
| Vendor inventory | `platform/frontend/docs/vendor/README.md`, `platform/frontend/docs/vendor/metronic-inventory.md` | Replace raw Metronic path wording with alias wording. |
| Platform Studio old docs | `platform/frontend/docs/platform-studio/*.md` | Replace raw donor paths with aliases where the old docs remain. |
| Local memory | `maestro/memory/reference-code/packs-index.md`, `maestro/memory/docs/*`, `maestro/memory/index/*` | Status updated to `raw_local_only`. |

## Safety Checks

Before move:

- Confirm all raw-pack aliases exist in `maestro/memory/reference-code/README.md`.
- Confirm `maestro/memory/reference-code/packs-index.md` has a local raw-pack path for every pack.
- Confirm no active contract depends on raw donor paths as product truth.

After move:

- Old tracked reference directories are deleted from git.
- `rg -n "reference-pack:" platform/frontend/docs platform/backend/docs maestro/memory`
- `git check-ignore -v reference-code/frontend/metronic/REFERENCE-PACK.md reference-code/platform-studio/extdb/REFERENCE-PACK.md reference-code/backend/mssql-legacy-schema/REFERENCE-PACK.md`

## Current Decision

Owner approved physical relocation.
The relocation has landed: raw packs are local-only under `reference-code/`, and old tracked docs pointer directories were deleted.
The landed review checkpoint is `maestro/memory/reference-code/relocation-checkpoint.md`.
