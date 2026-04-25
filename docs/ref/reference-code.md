---
doc_status: reference
doc_scope: opt_in
doc_type: reference_code_registry
lang: en
---

# Reference Code Registry

Status: Current alias registry for opt-in reference code.

This document names donor/vendor/legacy code packs that may be useful for research, comparison, extraction planning, or product-behavior archaeology.
Reference code is not product truth and must not be part of the default read path.

## Rules

- Use reference packs only when the task explicitly asks for donor/legacy/reference material.
- Do not copy donor code directly into product code without license and ownership review.
- Do not treat donor routing, auth, providers, schema, or runtime architecture as current product contracts.
- Distill useful findings into active product docs before implementation.
- Prefer `reference-pack:<alias>` citations over raw file paths in active docs.
- Raw reference packs live outside active FE/BE docs paths after physical relocation.
- Do not keep compatibility README folders under `platform/frontend/docs/**` or `platform/backend/docs/**` for raw packs.

## Alias Registry

| Alias | Local raw-pack location | Role | Allowed use | Forbidden use |
| --- | --- | --- | --- | --- |
| `reference-pack:metronic` | `reference-code/frontend/metronic/` | Frontend vendor UI donor material. | UI inspiration, component extraction planning, visual pattern review. | Product routing/auth/provider copy, treating demo pages as product requirements. |
| `reference-pack:extdb-legacy` | `reference-code/platform-studio/extdb/` | Legacy Platform Studio/Form Builder behavior source. | Old field ids, page settings, filters, import/PDF/report behavior archaeology. | Copying ASP/.NET/SQL code or old architecture. |
| `reference-pack:ezform-prototype` | `reference-code/platform-studio/ezform/` | Form Builder authoring-shell prototype. | Interaction flow comparison, builder ergonomics, shell layout review. | Copying UI/code as production implementation. |
| `reference-pack:smartapp-runtime` | `reference-code/platform-studio/smartapp/` | Legacy/runtime rendering reference. | Runtime behavior comparison and old field rendering review. | Treating runtime implementation as current architecture. |
| `reference-pack:old-builder-reference` | `reference-code/platform-studio/old-builder-reference/` | Historical old builder notes/code snapshot. | Historical comparison after active docs are insufficient. | Treating historical notes as current product contract. |
| `reference-pack:mssql-legacy-schema` | `reference-code/backend/mssql-legacy-schema/` | Legacy MSSQL schema reference. | Import mapping, legacy field interpretation, migration archaeology. | Treating MSSQL schema as active backend schema truth. |

## Citation Format

Use this format when an active doc needs to preserve a traceable donor basis without pulling the raw path into the hot read path:

```text
Source basis: reference-pack:extdb-legacy / Template/ExtDBpg_edit.htm
Source basis: reference-pack:metronic / metronic-tailwind-react-starter-kit/typescript/vite/src/components/ui/button.tsx
```

## Migration State

Raw packs have been relocated out of active docs paths.
Tracked docs keep only compact metadata and distilled product decisions; old compatibility README folders were deleted.
