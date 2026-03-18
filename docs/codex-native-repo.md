---
doc_status: current
doc_scope: canonical
doc_type: repo_runtime
lang: en
---

# Codex-Native Repository Layout

This document defines the live repository layout after the cutover to a Codex-native runtime model.

## Active Source Of Truth

The active runtime source of truth is:

- `AGENTS.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `.codex/config.toml`
- `.codex/agents/*`
- `.codex/contracts/*`
- `.codex/standards/*`
- `.codex/templates/*`
- `.agent-cli/config.json`
- `.agent-cli/`
- `docs/maestro/module-orchestrator-v2-spec-pack/`

These files define the current runtime behavior, agent wiring, contracts, and packaging metadata.

## Runtime Layout

```text
.agents/skills/
  maestro/
  charlie/
  grant/

.codex/
  config.toml
  agents/
  contracts/
  standards/
  templates/

.agent-cli/
artifacts/
AGENTS.md
docs/
```

## Role Of Each Surface

### `.agents/skills/`

Repo-local Codex skills.

Each skill bundle owns:

- behavior-facing skill instructions in `SKILL.md`
- Codex/OpenAI-style UI metadata in `agents/openai.yaml`
- optional avatars or packaging assets in `assets/`

### `.codex/`

Codex-native runtime wiring.

- `config.toml` defines repo-scoped Codex configuration
- `agents/*.toml` define native agent configs
- `contracts/` hold machine-readable agent contracts and schemas
- `standards/` holds the canonical reusable standards library for runtime and engineering guidance
- `templates/` hold canonical Markdown or JSON templates used by the runtime

### `.agent-cli/`

Typed lifecycle gateway and validation surface for module, feature, and stage state.

The CLI owns mutable JSON state transitions under `artifacts/`.

Repo-local CLI defaults live in:

- `.agent-cli/config.json`

### `artifacts/`

Persistent run outputs. These are runtime results, not design-time source files.

## Retired Surfaces

The retired pre-Codex source-of-truth layer no longer participates in the active runtime.


## Migration Policy

When adding or changing runtime behavior:

- update the active Codex-native surfaces directly
- keep persisted artifacts in English
- preserve stable system agent ids:
  - `module_orchestrator`
  - `research_codebase`
  - `brief_auditor`
- preserve stable skill nicknames:
  - `maestro`
  - `charlie`
  - `grant`

## Compatibility Command

`node .agent-cli/bin/agent-stack.mjs render-runtimes --check`

is retained only as a compatibility no-op health check after the removal of the old generated multi-platform adapters.

It does not define the active runtime.
