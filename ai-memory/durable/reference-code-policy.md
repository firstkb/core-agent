# Reference Code Policy

Status: active local policy
Last compacted: 2026-04-25

Reference code means donor/vendor/example code used for learning, comparison, extraction planning, or UI inspiration.
Examples include Metronic, old app references, generated scaffolds, and third-party templates.

Reference code is not a source of truth for this product.

## Default Rule

- Do not read reference code during ordinary agent work.
- Do not place raw reference code in hot docs paths.
- Do not copy large donor snippets into memory.
- Distill reusable decisions into `ai-memory` module contracts, state, or lessons.
- Keep licensing, origin, and allowed usage explicit for every reference pack.

## Local Folder Strategy

Use `docs/ref/reference-code.md` as the tracked alias registry.
Use `ai-memory/reference-code/` as the local governance, pack-index, and relocation-planning surface.

If raw reference packs must be stored locally inside this workspace after relocation, keep them below:

- `reference-code/<domain>/<pack>/`

`reference-code/` should be local-only and ignored by git.
The preferred long-term storage remains a separate private reference repository, with this workspace keeping only aliases and compact indexes.

Every pack must have a compact metadata file:

- `source`: vendor, repository, export, or internal archive origin
- `license`: known license or review-required marker
- `status`: active-reference, historical-reference, superseded, or blocked
- `allowed_use`: inspiration, comparison, extraction planning, or migration aid
- `forbidden_use`: direct copy rules and restricted areas
- `owner_modules`: product modules that may consult the pack
- `distilled_outputs`: links to compact memory files created from the pack

## Retrieval Rule

Agents may read reference code only when the task explicitly asks for it or the relevant module memory points to a specific reference pack.

Metronic-style UI reference should normally produce:

- compact design lessons in `ai-memory/modules/frontend/ui-kit/README.md`
- package boundary notes in `ai-memory/modules/frontend/workspace/`
- product-specific contracts in the target module memory

It should not become a permanent default read for frontend work.

## Future Physical Repo Reorg

When tracked docs are rewritten, reference code should not live inside active FE/BE docs.
Acceptable locations are:

- local-only `reference-code/**`
- a separate private reference repository synchronized outside this repo
- a tracked `docs/ref/**` index that contains metadata and links, not raw bulky donor trees

The preferred long-term model is a separate private reference repository plus a compact local index in `ai-memory`.

## Stable Aliases

Use `reference-pack:<alias>` citations instead of hot-doc raw paths.

Current aliases:

- `reference-pack:metronic`
- `reference-pack:extdb-legacy`
- `reference-pack:ezform-prototype`
- `reference-pack:smartapp-runtime`
- `reference-pack:old-builder-reference`
- `reference-pack:mssql-legacy-schema`
