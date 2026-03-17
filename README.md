# Maestro + Charlie reference foundation

This repository is a clean reference scaffold for running the same shared agent package through two native adapters:

- Cursor: `.cursor/`
- Codex: `.codex/` + `.agents/skills/`

## Core principles

- `.agent-code/` is the shared source of truth for contracts, templates, prompts, registries, and standards.
- `.agent-cli/` is the deterministic validation layer.
- `AGENTS.md` is the shared project guidance.
- Persistent artifacts live under `artifacts/{module}/{feature}`.
- Maestro owns module-root orchestration artifacts and feature seed packs.
- Charlie owns only `research/README.md` and `research/status.json`.

## Layout

```text
.agent-code/           shared packages and standards
.agent-cli/            validation and path resolution
.agents/skills/        Codex-native skills
.cursor/               Cursor-native adapters, commands, and thin rules
.codex/                Codex-native custom agent configs
artifacts/             persistent agent artifacts
platform/              product-code root placeholder
```

## Notes

- Cursor rules are intentionally thin. Shared standards live in `.agent-code/standards/` to avoid drift.
- Codex-native skills live in `.agents/skills/`; `.codex/` is used for project config and custom agents.
- The shared contract IDs remain `module_orchestrator` and `research_codebase` so the validation layer stays compatible with the existing artifact model.
