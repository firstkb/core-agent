# Reference Code

Status: local index and relocation control
Last compacted: 2026-04-25

This folder stores local governance for donor/vendor/legacy reference code.
It is not part of the default AI read path.

Read policy:

- Read `maestro/memory/durable/reference-code-policy.md` before opening any raw pack.
- Read `maestro/memory/reference-code/packs-index.md` only when a task explicitly asks for reference code or raw-pack relocation.
- Do not read packs unless the task explicitly names a pack or the module memory links to a specific alias.
- Distill useful findings into module memory or active tracked docs; do not keep raw donor code in hot docs.
- Do not copy donor code directly into product code without license and ownership review.
- Prefer `reference-pack:<alias>` citations over raw file paths in active docs.

Local files:

- `maestro/memory/reference-code/packs-index.md`: alias-to-path mapping and metadata checklist.
- `maestro/memory/reference-code/relocation-plan.md`: physical move plan for raw packs formerly stored in active docs paths.
- `maestro/memory/reference-code/relocation-checkpoint.md`: landed review checkpoint for the physical relocation.

Current registered aliases:

| Alias | Local raw-pack location | Role | Allowed use | Forbidden use |
| --- | --- | --- | --- | --- |
| `reference-pack:metronic` | `reference-code/frontend/metronic/` | Frontend vendor UI donor material. | UI inspiration, component extraction planning, visual pattern review. | Product routing/auth/provider copy, treating demo pages as product requirements. |
| `reference-pack:extdb-legacy` | `reference-code/platform-studio/extdb/` | Legacy Platform Studio/Form Builder behavior source. | Old field ids, page settings, filters, import/PDF/report behavior archaeology. | Copying ASP/.NET/SQL code or old architecture. |
| `reference-pack:ezform-prototype` | `reference-code/platform-studio/ezform/` | Form Builder authoring-shell prototype. | Interaction flow comparison, builder ergonomics, shell layout review. | Copying UI/code as production implementation. |
| `reference-pack:smartapp-runtime` | `reference-code/platform-studio/smartapp/` | Legacy/runtime rendering reference. | Runtime behavior comparison and old field rendering review. | Treating runtime implementation as current architecture. |
| `reference-pack:old-builder-reference` | `reference-code/platform-studio/old-builder-reference/` | Historical old builder notes/code snapshot. | Historical comparison after active docs are insufficient. | Treating historical notes as current product contract. |
| `reference-pack:mssql-legacy-schema` | `reference-code/backend/mssql-legacy-schema/` | Legacy MSSQL schema reference. | Import mapping, legacy field interpretation, migration archaeology. | Treating MSSQL schema as active backend schema truth. |

Raw-pack path after relocation:

- `reference-code/<domain>/<pack>/`

Raw packs are local-only under `reference-code/`.
Old tracked docs pointer README paths were deleted; use aliases only.
