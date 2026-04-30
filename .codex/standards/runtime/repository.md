# Repository Runtime Standard

This standard defines the active runtime boundaries for this repository.

## Active source of truth

Treat these as authoritative:

- `AGENTS.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `.codex/config.toml`
- `.codex/agents/*`
- `.codex/contracts/*`
- `.codex/templates/*`
- `.codex/standards/*`
- `README.md`
- `maestro/docs/runtime-contract.md`
- `maestro/contracts/*`
- `maestro/templates/*`

Persisted run outputs under `maestro/artifact/` and legacy `artifacts/` are
runtime artifacts, not design-time source files.

## Retired surfaces

Do not restore these as active runtime layers:

- the retired pre-Codex source-of-truth layer;
- Maestro Cockpit/backend/dashboard/service prototypes.

## Stable naming

Active vNext system agent ids:

- `maestro_vnext`
- `research_charlie`
- `audit_grant`
- `implementation_mason`
- `verification_scout`
- `review_lens`
- `release_manager`
- `closeout_scribe`
- `memory_archivist`

Skill nicknames:

- `maestro`
- `charlie`
- `grant`
- `mason`
- `scout`
- `lens`
- `release`
- `scribe`
- `archivist`

Legacy system agent ids retained for old `artifacts/<module>/...` continuation:

- `module_orchestrator`
- `research_codebase`
- `brief_auditor`

## Runtime policy

- Use Maestro vNext for new owner-led orchestration.
- Use legacy module-orchestrator agents only for old run continuation.
- Do not restore deleted CLI or render-managed surfaces as active runtime.
- Prefer validation and contracts over prose when a typed surface exists.
- Keep persisted artifacts in English.
- Do not expand the runtime surface casually; new behavior should land in the active Codex-native layers and Maestro contracts.
