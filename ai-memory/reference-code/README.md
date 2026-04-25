# Reference Code

Status: local index and relocation control
Last compacted: 2026-04-25

This folder stores local governance for donor/vendor/legacy reference code.
It is not part of the default AI read path.

Read policy:

- Read `docs/ref/reference-code.md` for stable public aliases.
- Read `ai-memory/durable/reference-code-policy.md` before opening any raw pack.
- Read `ai-memory/reference-code/packs-index.md` only when a task explicitly asks for reference code or raw-pack relocation.
- Do not read packs unless the task explicitly names a pack or the module memory links to a specific alias.
- Distill useful findings into module memory or active tracked docs; do not keep raw donor code in hot docs.

Local files:

- `ai-memory/reference-code/packs-index.md`: alias-to-path mapping and metadata checklist.
- `ai-memory/reference-code/relocation-plan.md`: physical move plan for raw packs formerly stored in active docs paths.
- `ai-memory/reference-code/relocation-checkpoint.md`: landed review checkpoint for the physical relocation.

Current registered aliases:

- `reference-pack:metronic`
- `reference-pack:extdb-legacy`
- `reference-pack:ezform-prototype`
- `reference-pack:smartapp-runtime`
- `reference-pack:old-builder-reference`
- `reference-pack:mssql-legacy-schema`

Raw-pack path after relocation:

- `reference-code/<domain>/<pack>/`

Raw packs are local-only under `reference-code/`.
Old tracked docs pointer README paths were deleted; use aliases only.
