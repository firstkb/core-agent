# Reference Code Relocation Checkpoint

Status: landed checkpoint
Date: 2026-04-25

This checkpoint records the physical raw-pack relocation from active FE/BE docs paths into ignored local `reference-code/` storage.
It is a review artifact for AI memory maintenance and should not become a tracked product-doc dependency.

## Scope

| Alias | Old tracked pointer path | Local raw-pack path | Approximate size |
| --- | --- | --- | ---: |
| `reference-pack:metronic` | `platform/frontend/docs/metronic/README.md` | `reference-code/frontend/metronic/` | 188M |
| `reference-pack:extdb-legacy` | `platform/frontend/docs/platform-studio/EXTDB/README.md` | `reference-code/platform-studio/extdb/` | 1.4M |
| `reference-pack:ezform-prototype` | `platform/frontend/docs/platform-studio/ezform/README.md` | `reference-code/platform-studio/ezform/` | 292K |
| `reference-pack:smartapp-runtime` | `platform/frontend/docs/platform-studio/smartapp/README.md` | `reference-code/platform-studio/smartapp/` | 4.9M |
| `reference-pack:old-builder-reference` | `platform/frontend/docs/platform-studio/old-code-reference/README.md` | `reference-code/platform-studio/old-builder-reference/` | 92K |
| `reference-pack:mssql-legacy-schema` | `platform/backend/docs/MSSQL/README.md` | `reference-code/backend/mssql-legacy-schema/` | 56K |

## Review Result

- `reference-code/` is ignored by `.gitignore`.
- Old raw-pack locations contain only pointer `README.md` files.
- Six local raw-pack metadata files exist as `REFERENCE-PACK.md`.
- `docs/ref/reference-code.md` is the tracked alias registry.
- `ai-memory/reference-code/packs-index.md` marks all six packs as `raw_local_only`.
- Tracked FE/BE docs must cite `reference-pack:*` aliases, not local raw paths.
- Product docs must not link to `ai-memory/`.

## Validation Snapshot

- YAML memory indexes loaded successfully.
- No `ai-memory` references were found in tracked FE/BE docs checked during relocation.
- No stale raw-pack-tracked status remained in the checked memory/docs set.
- No machine-local absolute paths remained in the checked memory/docs set.
- The old tracked raw paths now show expected git deletions for raw files; this is intentional.

## Git Checkpoint

Expected tracked changes include:

- Large deletion set for raw donor/vendor/reference files removed from old docs paths.
- New or modified pointer READMEs at old raw-pack paths.
- `reference-code/` ignored locally, so raw packs are not staged or committed from this repo.

Do not treat the raw deletion count as data loss before checking:

- `docs/ref/reference-code.md`
- `ai-memory/reference-code/packs-index.md`
- local `reference-code/**/REFERENCE-PACK.md`

## Residual Risks

- Raw pack licensing and allowed-use metadata still need owner-level review before reusing code or assets.
- Raw packs are local-only and must be backed up or synchronized through the owner's separate private reference-code workflow.
- Agents should not infer product behavior directly from raw packs; durable findings must be distilled into active tracked docs or module memory first.
- The old raw-pack pointer paths are compatibility anchors only, not product documentation.
