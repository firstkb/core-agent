# Legacy Memory Import

Status: final import audit
Last compacted: 2026-04-25

This file records how durable knowledge from the former `platform/docs/ai`
layer was folded into `maestro/memory`. The old directory has been deleted from the
working tree; use git history only when exact old text is explicitly required.

Top-level legacy markdown files under `platform/docs/ai/*.md`, legacy module
files under `platform/docs/ai/modules/*.md`, legacy prompts/templates, and the
legacy automation manifest were migrated, compacted, and deleted.
Use `maestro/memory` for active memory.

## Source Classification

Imported as durable semantic memory:

- `platform/docs/ai/current-state.md`
- `platform/docs/ai/platform-contract.md`
- `platform/docs/ai/decisions-log.md`
- `platform/docs/ai/repo-map.md`
- `platform/docs/ai/module-index.md`
- `platform/docs/ai/canonical-docs.md`
- `platform/docs/ai/modules/*.md`

Imported only as governance/reference:

- `platform/docs/ai/README.md`
- `platform/docs/ai/markdown-governance.md`
- `platform/docs/ai/orchestration-boundaries.md`

Operational scaffolds, not durable product truth:

- `platform/docs/ai/prompts/**`
- `platform/docs/ai/templates/**`
- `platform/docs/ai/automation-manifest.json`
- `platform/docs/ai/automation-changelog.md`

Archived retired runtime operational copies are owner-managed outside the active
repository.

Former retired pointer stubs, now deleted:

- `platform/docs/ai/*.md`
- `platform/docs/ai/modules/*.md`
- `platform/docs/ai/prompts/*.md`
- `platform/docs/ai/templates/*.md`
- `platform/docs/ai/automation-manifest.json`

Historical/episodic artifacts, not active memory:

- `platform/docs/ai/runs/**`

Compact run triage is available from owner-managed external provenance or git
history when exact historical reconstruction is required.

## Transfer Status

- `auth-and-session`: imported stable cookie refresh, access-token storage, profile/navigation split, bootstrap recovery, and common failure modes into `maestro/memory/modules/domains/auth-and-session/`.
- `schema-and-tenancy`: imported master/tenant split, `cmd/migrate` ownership, tenant_id retention, trusted tenant scope, local DB topology, and migration risk rules into `maestro/memory/modules/domains/schema-and-tenancy/`.
- `admin-control-plane`: imported root/non-root rules, section-level allow-only grants, tenant onboarding, tenant inventory, employees, and navigation/profile separation into `maestro/memory/modules/domains/admin-control-plane/`.
- `admin-module-registry`: imported root-only registry contract, endpoint families, grant semantics, and collection-table consumer boundary into `maestro/memory/modules/domains/admin-module-registry/`.
- `collection-table`: imported package extraction, consumers, host/runtime separation, optional XLS/view/pdf backlog, and failure modes into `maestro/memory/modules/domains/collection-table/`.
- `platform-studio`: imported Form Builder contracts and expanded owner-confirmed suite boundaries into `maestro/memory/modules/domains/platform-studio/`.

## Important Drift Resolved

- Old memory used retired runtime product-orchestration operational language. Current repo runtime is Codex-native per root `AGENTS.md`, `.codex/`, `.agents/skills/maestro|charlie|grant`, ``, and `AGENTS.md`.
- Old Platform Studio memory focused on Form Builder plus planned Navigation/Action. New memory records owner clarification that Platform Studio is a larger suite including Form Builder, Navigation Builder, Action Builder, PDF Builder, Report Builder, and future tools.
- Collection Table old wording sometimes described app-local proving state; current memory treats `@platform/collection-table` extraction as landed for admin consumers while keeping cross-app/full capability work planned.
- Closed run artifacts remain useful for provenance only; they must not be used as canonical truth if compact module memory disagrees.

## Default Read Rule

Use `maestro/memory/index/memory-index.yaml` and module packs first.
The old `platform/docs/ai` path no longer exists in the working tree.
Recover exact old text from git history only when:

- verifying a source citation,
- resolving a conflict between compact memory and tracked docs,
- recovering detail intentionally omitted during compaction,
- migrating another durable decision into `maestro/memory`.

Do not recreate or use `platform/docs/ai/modules/*.md` as active module memory.
Read `maestro/memory/durable/module-index.md` and the relevant
`maestro/memory/modules/**` pack first.

Do not recreate or use `platform/docs/ai/prompts/**`,
`platform/docs/ai/templates/**`, or `platform/docs/ai/automation-manifest.json`
for active workflow. Archived copies are owner-managed outside the active
repository for provenance only.

Do not recreate or use `platform/docs/ai/runs/**` as active design input. Use
the owner-managed external archive or git history only if the owner asks for
exact historical reconstruction.
