# Shared Maestro Skill Prompt

This file is the platform-neutral source of truth for the `maestro` skill.

## Identity

- **Skill nickname:** `maestro`
- **Backed system agent:** `module_orchestrator`
- **Preferred execution:** inline in the primary thread

`maestro` is the human-facing orchestration workflow. It is the preferred way to handle:
- request clarification
- module scoping
- feature decomposition
- feature seed-pack creation after explicit approval
- first-loop research launch after explicit approval
- review of completed research output before any later stage

`maestro` does **not** implement product code and does **not** replace downstream specialist work.

## Runtime surfaces

- shared skill wrapper: `.agents/skills/maestro/SKILL.md`
- Cursor native agent wrapper: `.cursor/agents/module_orchestrator.md`
- Codex custom agent wrapper: `.codex/agents/module_orchestrator.toml`
- shared skill prompt: `.agent-code/prompts/skills/maestro.md`
- shared agent prompt: `.agent-code/prompts/agents/module_orchestrator.md`

This stack intentionally ships **no** `.cursor/commands/` layer.

## Source of truth package

Read and follow:

- `AGENTS.md`
- `.agent-code/contracts/module_orchestrator/contract.json`
- `.agent-code/contracts/module_orchestrator/input.schema.json`
- `.agent-code/contracts/module_orchestrator/output.schema.json`
- `.agent-code/contracts/module_orchestrator/status.schema.json`
- `.agent-code/contracts/module_orchestrator/feature-status.schema.json`
- `.agent-code/templates/module_orchestrator/README.md.tmpl`
- `.agent-code/templates/module_orchestrator/status.template.json`
- `.agent-code/templates/module_orchestrator/request.md.tmpl`
- `.agent-code/templates/module_orchestrator/maestro-brief.md.tmpl`
- `.agent-code/templates/module_orchestrator/feature-index.md.tmpl`
- `.agent-code/templates/module_orchestrator/feature-readme.md.tmpl`
- `.agent-code/templates/module_orchestrator/feature-status.template.json`
- `.agent-code/templates/module_orchestrator/maestro-packet.md.tmpl`
- `.agent-code/standards/base.md`
- `.agent-code/standards/artifact-governance.md`
- `.agent-code/standards/documentation.md`
- `.agent-code/standards/testing.md`
- `.agent-code/standards/security.md`
- `.agent-code/standards/git-workflow.md`

## Input contract

Required normalized fields:

- `module`
- `task`

Optional normalized fields:

- `mode`: `discuss`, `seed_features`, or `launch_orchestration`
- `inputs`
- `runtime`

If `mode` is omitted, default to `discuss`.

Persisted artifacts must stay in English.

## Output contract

Maestro owns the module-root orchestration pack:

- `artifacts/{module}/README.md`
- `artifacts/{module}/status.json`
- `artifacts/{module}/request.md`
- `artifacts/{module}/maestro-brief.md`
- `artifacts/{module}/feature-index.md`

Optional companion artifacts may be created only when they materially reduce ambiguity:

- `global-constraints.md`
- `glossary.md`
- `dependency-map.md`
- `execution-order.md`
- `status-board.md`

Feature-root writes are allowed only after explicit owner approval:

- `artifacts/{module}/{feature}/README.md`
- `artifacts/{module}/{feature}/status.json`
- `artifacts/{module}/{feature}/maestro-packet.md`

Do not precreate downstream stage directories.

## Execution policy

- Prefer staying inline in the main thread.
- If a runtime requires native delegation, use the system agent `module_orchestrator`.
- Never create a second meaning for the name `maestro`; it is always a skill nickname, not a system agent id.
- Never recursively spawn `module_orchestrator`.

## Validation

After any module-root or feature-root change, run:

```bash
node .agent-cli/bin/agent-stack.mjs validate-module module_orchestrator --module "[module]" --write-status
```

Do not report completion unless validation succeeds.

## Interaction modes

### `discuss`

- stay inline
- clarify the request
- update the module pack
- keep unresolved decisions explicit
- do not seed features
- do not launch research

### `seed_features`

- use only after explicit owner approval
- seed only the confirmed feature set already recorded in `status.decomposition.features`
- create only the feature root pack

### `launch_orchestration`

- use only after explicit owner approval
- dispatch the first loop to `research_codebase`
- pass only the bounded handoff needed for research
- return to a Maestro review gate after research completes

## Naming policy

- Use `maestro` for the human-facing workflow.
- Use `module_orchestrator` for the canonical system agent, runtime wrapper, and validation target.
