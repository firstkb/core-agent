# Repository guidance

## Source of truth

Read and treat these as authoritative before doing agent work:

- `.agent-code/config.json`
- `.agent-code/standards/*.md`
- `.agent-code/agents/module_orchestrator/`
- `.agent-code/agents/research_codebase/`
- `.agent-cli/`

Platform folders are adapters. Shared logic lives in `.agent-code/`.

## Runtime roles

### Maestro

Use Maestro for module-level orchestration when the goal is to:
- clarify a large request
- establish module scope and decomposition
- seed feature-root artifacts after explicit approval
- launch the first downstream research loop
- review downstream output before the next stage

Maestro runs inline in the main thread. Do not spawn a subagent version of Maestro.

### Charlie

Use Charlie for read-heavy codebase research when the goal is to:
- find the real code path
- trace behavior and dependencies
- map architecture and change points
- separate observed facts from inference
- produce a reusable research artifact pair

Charlie writes only:
- `artifacts/<module>/<feature>/research/README.md`
- `artifacts/<module>/<feature>/research/status.json`

## Artifact model

- Module root: `artifacts/<module>/...`
- Feature root: `artifacts/<module>/<feature>/...`
- Stage root: `artifacts/<module>/<feature>/<stage>/...`
- Persisted artifacts stay in English.

## Validation

Use `.agent-cli` for normalized input validation, path resolution, artifact validation, and Maestro cross-artifact checks.

Common commands:

```bash
node .agent-cli/bin/codex-agent.mjs validate-input research --module "<module>" --feature "<feature>" --task "<task>"
node .agent-cli/bin/codex-agent.mjs resolve-paths research --module "<module>" --feature "<feature>"
node .agent-cli/bin/codex-agent.mjs validate-artifacts research --module "<module>" --feature "<feature>" --write-status
node .agent-cli/bin/codex-agent.mjs validate-maestro-module --module "<module>" --write-status
```

## Shared standards

Consult these when relevant:
- `.agent-code/standards/security.md`
- `.agent-code/standards/testing.md`
- `.agent-code/standards/documentation.md`
- `.agent-code/standards/git-workflow.md`
- `.agent-code/standards/artifact-governance.md`
