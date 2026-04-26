# Repository guidance

## Runtime Source Of Truth

Read and treat these as authoritative before doing agent work:

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
- `docs/README.md`
- `docs/codex-native-repo.md`

Persisted run outputs under `artifacts/` are runtime artifacts, not design-time source of truth.

Retired surfaces:

- the retired pre-Codex source-of-truth layer must not be reintroduced.

Platform product memory:

- `ai-memory/` is the compact retrieval and durable-memory layer for platform product work.
- `ai-memory/` does not replace `.codex/`, `.agents/`, `.agent-cli/`, source code, or tracked canonical FE/BE docs when those surfaces own runtime behavior.
- the former `platform/docs/ai/**` layer is fully retired and deleted; use `ai-memory/durable/legacy-memory-import.md`, compact archive summaries, and git history for provenance.

## Docs classification

Treat:

- `docs/codex-native-repo.md`

as the live repository layout and source-of-truth boundary document.

Treat the active working set under:

- `docs/maestro/module-orchestrator-v2-spec-pack/`

as the current runtime reference for the Maestro control-plane model.

Treat:

- `docs/maestro/maestro-feature-formation-canonical.md`

as a future-target architecture document, not as the live runtime contract.

## Runtime Read Policy

Ordinary agent work should read only:

- `AGENTS.md`
- `ai-memory/START_HERE.md` and `ai-memory/index/read-routes.yaml` for non-trivial platform product work
- `ai-memory/index/memory-index.yaml` when the task needs a broader route map
- the relevant skill body under `.agents/skills/<skill>/SKILL.md`
- relevant files under `.codex/contracts/<agent>/`, `.codex/templates/<agent>/`, and `.codex/standards/`
- `.codex/config.toml` and `.codex/agents/*` when the task depends on runtime wiring
- the exact target artifacts under `artifacts/<module>/...` and `artifacts/<module>/features/<feature>/...`
- product/runtime code and docs that materially answer the task

Do not read build or plumbing surfaces during ordinary work:

- `.agent-cli/src/`
- `.agent-cli/test/`
- artifact folders for other modules unless the owner explicitly asks
- deleted legacy platform memory paths from `platform/docs/ai/**`; recover exact old text from git history only for explicit historical reconstruction

You are not the build system. Do not inspect validator source, fixtures, internal CLI plumbing, or old runs to infer behavior that is already defined in the active Codex-native skill, contract, template, standard, and doc surfaces.

## Completion Checks

Before marking non-trivial implementation work complete, run:

```bash
scripts/ai/preflight.sh
```

Use `scripts/ai/preflight.sh --full` only when the task needs a broader
product sweep across backend/frontend checks.
If the task is docs/memory-only, the targeted docs/memory checks are enough.
If preflight cannot run or optional checks fail, state exactly which checks ran,
which did not, and why.

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

- `artifacts/<module>/features/<feature>/stages/research/<attempt>/README.md`
- `artifacts/<module>/features/<feature>/stages/research/<attempt>/handoff.json`

### Grant

Use Grant for optional technical brief review when the goal is to:

- audit `brief.md` before owner approval
- validate the proposed solution, feature plan, and dependency ordering against the cited technical surface
- find ambiguity, contradictions, weak decomposition, missing dependencies, unsupported technical assumptions, or transient lifecycle language
- return a marked reviewer note block for `## Reviewer Notes`

Grant should run as an optional helper to Maestro, not as a lifecycle owner.

Grant does not:

- approve the brief
- change lifecycle state
- write repository artifacts directly

### Scribe

Use Scribe for semantic docs and ai-memory audit when the goal is to:

- find source-of-truth drift after large docs or memory changes
- check AGENTS, Atlas, FE/BE docs, and `ai-memory` consistency
- identify stale lifecycle language, duplicated ownership, or context-window bloat
- review reference-code policy usage without opening raw packs by default

Scribe is an audit workflow, not a feature owner or implementation agent.
It should report findings first and patch files only when the owner asks to apply the audit.

## Naming

- `maestro` -> `module_orchestrator`
- `charlie` -> `research_codebase`
- `grant` -> `brief_auditor`
- `scribe` -> semantic docs/memory auditor skill; no backed system agent

## Artifact model

- module root: `artifacts/<module>/...`
- feature root: `artifacts/<module>/features/<feature>/...`
- stage root: `artifacts/<module>/features/<feature>/stages/<stage>/...`
- persisted artifacts stay in English

## Artifact History Policy

- Treat only the exact target module and target feature artifact tree as the active run history.
- Do not read or cite artifact folders from other modules as style references, structure examples, templates, or fallback context unless the owner explicitly asks.

## V2 CLI

The active CLI surface is the V2 typed state gateway.

Use:

```bash
node .agent-cli/bin/agent-stack.mjs module <subcommand> ...
node .agent-cli/bin/agent-stack.mjs feature <subcommand> ...
node .agent-cli/bin/agent-stack.mjs stage <subcommand> ...
```

Do not assume the old validator-first commands still exist.

Markdown authorship boundary:

- AI authors `brief.md`, feature `README.md`, and stage attempt `README.md`
- CLI owns mutable JSON state and lifecycle transitions

## Legacy Compatibility

`render-runtimes` is retained only as a compatibility command during the final removal of the old generated multi-platform model.

Use:

```bash
node .agent-cli/bin/agent-stack.mjs render-runtimes --check
```

only to confirm that no legacy render-managed surfaces are expected.

Do not treat `render-runtimes` as the compiler for the active runtime. Active runtime behavior lives in `.agents/skills/`, `.codex/`, `AGENTS.md`, and the typed CLI.
