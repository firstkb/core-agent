# Legacy Memory Import

Status: compact import audit
Last compacted: 2026-04-25

This file records how durable knowledge from `platform/docs/ai` was folded into `ai-memory`.
It prevents agents from rereading the entire old memory corpus unless a task needs verification.

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

Active Atlas operational copies now live under `ai-memory/atlas/**`.

Historical/episodic artifacts, not active memory:

- `platform/docs/ai/runs/**`

## Transfer Status

- `auth-and-session`: imported stable cookie refresh, access-token storage, profile/navigation split, bootstrap recovery, and common failure modes into `ai-memory/modules/domains/auth-and-session/`.
- `schema-and-tenancy`: imported master/tenant split, `cmd/migrate` ownership, tenant_id retention, trusted tenant scope, local DB topology, and migration risk rules into `ai-memory/modules/domains/schema-and-tenancy/`.
- `admin-control-plane`: imported root/non-root rules, section-level allow-only grants, tenant onboarding, tenant inventory, employees, and navigation/profile separation into `ai-memory/modules/domains/admin-control-plane/`.
- `admin-module-registry`: imported root-only registry contract, endpoint families, grant semantics, and collection-table consumer boundary into `ai-memory/modules/domains/admin-module-registry/`.
- `collection-table`: imported package extraction, consumers, host/runtime separation, optional XLS/view/pdf backlog, and failure modes into `ai-memory/modules/domains/collection-table/`.
- `platform-studio`: imported Form Builder contracts and expanded owner-confirmed suite boundaries into `ai-memory/modules/domains/platform-studio/`.

## Important Drift Resolved

- Old memory used Atlas/ramp-conductor operational language. Current repo runtime is Codex-native per root `AGENTS.md`, `.codex/`, `.agents/skills/maestro|charlie|grant`, `.agent-cli/`, and `docs/codex-native-repo.md`.
- Old Platform Studio memory focused on Form Builder plus planned Navigation/Action. New memory records owner clarification that Platform Studio is a larger suite including Form Builder, Navigation Builder, Action Builder, PDF Builder, Report Builder, and future tools.
- Collection Table old wording sometimes described app-local proving state; current memory treats `@platform/collection-table` extraction as landed for admin consumers while keeping cross-app/full capability work planned.
- Closed run artifacts remain useful for provenance only; they must not be used as canonical truth if compact module memory disagrees.

## Default Read Rule

Use `ai-memory/index/memory-index.yaml` and module packs first.
Open `platform/docs/ai` only when:

- verifying a source citation,
- resolving a conflict between compact memory and tracked docs,
- recovering detail intentionally omitted during compaction,
- migrating another durable decision into `ai-memory`.

Do not use `platform/docs/ai/runs/**` as active design input unless the owner asks for historical reconstruction.
