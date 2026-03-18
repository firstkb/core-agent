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
- `.agent-cli/config.json`
- `.agent-cli/`
- `docs/codex-native-repo.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/`

Persisted run outputs under `artifacts/` are runtime artifacts, not design-time source files.

## Retired surfaces

Do not restore these as active runtime layers:

- the retired pre-Codex source-of-truth layer

## Stable naming

System agent ids stay stable and machine-oriented:

- `module_orchestrator`
- `research_codebase`
- `brief_auditor`

Skill nicknames stay stable and human-oriented:

- `maestro`
- `charlie`
- `grant`

## Runtime policy

- Update the active Codex-native surfaces directly.
- Do not treat `render-runtimes` as the compiler for the active runtime.
- Prefer validation and contracts over prose when a typed surface exists.
- Keep persisted module, feature, and stage artifacts in English.
- Do not expand the runtime surface casually; new runtime behavior should land in the active Codex-native layers.
