# Reference Code Packs Index

Status: local pack index
Last compacted: 2026-04-25

This file maps stable `reference-pack:*` aliases to local/private raw-pack locations.
It is not part of the default AI read path.

## Read Rule

Read this only when a task explicitly asks for reference code, donor code, legacy behavior archaeology, or physical relocation of raw packs.
Do not read the raw pack before reading `docs/ref/reference-code.md` and `ai-memory/durable/reference-code-policy.md`.

## Pack Aliases

| Alias | Local raw-pack path | Status | Owner modules | Distilled outputs |
| --- | --- | --- | --- | --- |
| `reference-pack:metronic` | `reference-code/frontend/metronic/` | raw_local_only | frontend/ui-kit, frontend/workspace | `platform/frontend/docs/contracts/ui-kit.md`, `platform/frontend/docs/guides/ui-lab.md`, `platform/frontend/docs/vendor/metronic-inventory.md`, `ai-memory/modules/frontend/ui-kit/README.md` |
| `reference-pack:extdb-legacy` | `reference-code/platform-studio/extdb/` | raw_local_only | platform-studio, platform-studio-form-builder | `platform/frontend/docs/modules/platform-studio/form-builder.md`, `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`, `platform/backend/docs/contracts/platform-studio-form-builder.md` |
| `reference-pack:ezform-prototype` | `reference-code/platform-studio/ezform/` | raw_local_only | platform-studio, tenant-web | `platform/frontend/docs/platform-studio/ezform-analysis.md`, `platform/frontend/docs/modules/platform-studio/form-builder.md` |
| `reference-pack:smartapp-runtime` | `reference-code/platform-studio/smartapp/` | raw_local_only | platform-studio, platform-studio-form-builder | `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`, `platform/backend/docs/contracts/platform-studio-form-builder.md` |
| `reference-pack:old-builder-reference` | `reference-code/platform-studio/old-builder-reference/` | raw_local_only | platform-studio | `platform/frontend/docs/modules/platform-studio/form-builder.md`, `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md` |
| `reference-pack:mssql-legacy-schema` | `reference-code/backend/mssql-legacy-schema/` | raw_local_only | schema-and-tenancy, backend/import | `platform/backend/docs/contracts/schema-tenancy.md`, `platform/backend/docs/contracts/migrations.md`, `platform/backend/docs/reference/import-field-mapping.md` |

## Pack Metadata Requirements

Each raw pack should receive a compact metadata file during relocation:

- `alias`
- `source`
- `license`
- `status`
- `allowed_use`
- `forbidden_use`
- `owner_modules`
- `distilled_outputs`
- `relocated_from`
- `relocated_at`

## Known Sizes

Observed before relocation:

| Alias | Approximate size | Tracked files observed |
| --- | ---: | ---: |
| `reference-pack:metronic` | 188M | 4503 |
| `reference-pack:extdb-legacy` | 1.4M | 106 |
| `reference-pack:mssql-legacy-schema` | 52K | 9 |
| `reference-pack:ezform-prototype` | 288K | included in Platform Studio reference set |
| `reference-pack:smartapp-runtime` | 4.9M | included in Platform Studio reference set |
| `reference-pack:old-builder-reference` | 88K | included in Platform Studio reference set |
