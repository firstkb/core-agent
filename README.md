# Codex-native agent orchestration reference

This repository is a Codex-native reference scaffold for:

- repo-local skills in `.agents/skills/`
- native agent wiring in `.codex/`
- typed lifecycle control in `.agent-cli/`

## Core principles

- `.agents/skills/` and `.codex/` are the active runtime source of truth.
- `.agent-cli/` is the deterministic validation layer.
- `AGENTS.md` is the shared project guidance.
- Persistent artifacts live under `artifacts/{module}/{feature}`.
- Maestro owns module-root orchestration artifacts and feature seed packs.
- Charlie owns only stage research attempt outputs.

## Layout

```text
.agent-cli/            validation and path resolution
.agent-cli/config.json repo-local CLI defaults for artifacts
.agents/skills/        Codex-native skills
.codex/                Codex-native config, agents, contracts, templates, and standards
artifacts/             persistent agent artifacts
platform/              product-code root placeholder
```

## Notes

- Codex-native skills live in `.agents/skills/`; `.codex/` is used for project config, native agents, contracts, templates, and standards.
- The stable system ids remain `module_orchestrator`, `research_codebase`, and `brief_auditor`.
- `docs/codex-native-repo.md` defines the live repository layout and source-of-truth boundary.
