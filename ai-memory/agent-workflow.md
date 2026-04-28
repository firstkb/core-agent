# AI Memory Agent Workflow

Status: active local workflow guidance
Scope: `ai-memory/`

Use this file as the explicit local workflow guide for agents that opt into
the repository memory layer.

This file is not a replacement for `AGENTS.md`, `.codex/`, `.agents/`, source
code, or tracked canonical FE/BE docs.

## Purpose

Use `ai-memory/` as the first retrieval layer before opening large platform docs.
The goal is to keep agent context small while preserving accepted decisions,
current state, module boundaries, and Atlas workflow state.

## Required Read Order

For platform product work, read:

1. `AGENTS.md`
2. `platform/AGENTS.md`
3. `ai-memory/START_HERE.md`
4. `ai-memory/index/read-routes.yaml`
5. `ai-memory/durable/current-state.md`
6. the relevant module pack under `ai-memory/modules/**`
7. `ai-memory/index/memory-index.yaml` when broader routing is needed
8. `ai-memory/durable/module-index.md` when module ownership is unclear
9. only the exact canonical docs and source files named by that module pack

For Atlas workflow changes, additionally read:

- `ai-memory/atlas/README.md`
- `ai-memory/atlas/migration-audit.md`
- `ai-memory/atlas/automation-manifest.json`
- `.agents/skills/atlas/SKILL.md`

## Conflict Rule

`ai-memory/` is a compact retrieval layer.
If it conflicts with source code, `.codex/`, `.agents/`, or tracked canonical
docs, verify against the owner surface named in the module pack or
`memory-index.yaml`.

The former `platform/docs/ai/**` layer has been migrated and deleted. If a task
needs old wording for explicit historical reconstruction, use
`ai-memory/durable/legacy-memory-import.md`, compact archive summaries, and git
history. Current runtime docs and `ai-memory` win for active work.

## Update Gate

After a significant task, decide explicitly whether to update:

- no memory update
- `ai-memory/durable/current-state.md`
- `ai-memory/durable/decisions-log.md`
- `ai-memory/durable/canonical-docs.md`
- relevant module `contract.md`
- relevant module `state.md`
- relevant module `lessons.md`
- tracked FE/BE canonical docs
- archive only

Never update memory implicitly.
Do not duplicate the same fact in multiple active files unless one file is
clearly a summary and names the canonical owner.

## Mandatory Memory Update Matrix

When a new durable decision is accepted:

- update `ai-memory/durable/decisions-log.md`
- update `ai-memory/durable/current-state.md` if the decision changes active state, risk, or next work
- update the relevant `ai-memory/modules/**/README.md` when a module boundary, contract, or integration seam changes
- update tracked FE/BE docs only when they own the changed contract

When a new module, app, package, runtime, or Platform Studio tool becomes active:

- update `ai-memory/durable/module-index.md`
- update `ai-memory/durable/repo-map.md` when the repo/runtime shape changes
- create or update the relevant module pack under `ai-memory/modules/**`
- update `ai-memory/index/memory-index.yaml` and `ai-memory/index/read-routes.yaml` if agents need a new retrieval route
- update `ai-memory/durable/canonical-docs.md` if a new owner surface becomes canonical

When a doc changes status:

- update `ai-memory/durable/canonical-docs.md`
- update the relevant docs map under `ai-memory/docs/**`
- update `ai-memory/docs/docs-migration-plan.md` for physical move, delete, archive, supersede, or compatibility decisions
- update archive/proposal maps when old docs are demoted

When reference-code or donor material changes:

- update `docs/ref/reference-code.md`
- update `ai-memory/reference-code/packs-index.md`
- update `ai-memory/durable/reference-code-policy.md` only if policy changes
- never route normal agents directly to raw `reference-code/**`

When Atlas/Scribe/agent workflow changes:

- update the relevant `.agents/skills/**/SKILL.md`
- update matching `.agents/skills/**/agents/openai.yaml`
- update `ai-memory/atlas/automation-changelog.md` for Atlas prompt/template/scaffolder changes
- update `ai-memory/durable/current-state.md` and `decisions-log.md` for durable workflow decisions

When no memory update is needed, say so explicitly in the closeout.
For docs/memory work, run:

```bash
python3 scripts/ai/docs_memory_check.py --check
python3 scripts/ai/check-env-policy.py --check
python3 scripts/ai/automation_versions.py --check
```

For non-trivial implementation work, run `scripts/ai/preflight.sh` or report
which checks could not run and why. Use `scripts/ai/preflight.sh --full` only
when a broader backend/frontend sweep is needed. The preflight is local/manual
and must not install dependencies.

For non-trivial closeout or PR body text, use
`ai-memory/atlas/templates/agent-evidence.md`. Keep it compact and do not create
a standalone evidence file unless the owner asks.

Use `Scribe` (`$scribe`) after large docs/memory, AGENTS, Atlas, or reference-code changes.
Do not run Scribe on every commit by default.

## Memory Write Matrix

| Change | Write to |
| --- | --- |
| New durable product decision | `ai-memory/durable/decisions-log.md` and `ai-memory/durable/current-state.md` |
| New frontend contract | `platform/frontend/docs/contracts/**` and the relevant frontend docs map |
| New backend contract | `platform/backend/docs/contracts/**` and the relevant backend docs map |
| New module, app, package, runtime, or Platform Studio tool | `ai-memory/durable/module-index.md`, `ai-memory/durable/repo-map.md`, module memory, and read routes |
| Active run artifact | `ai-memory/runs/active/<task-id>/` |
| Closed reusable run summary | `ai-memory/runs/archive/` |
| Verified lesson after an error | relevant module `lessons.md` or `ai-memory/lessons/**` |
| Temporary notes | the active run folder only |

## Module Memory Size Rule

`ai-memory/modules/**` is only for durable, compressed, operationally useful
facts.

Do not copy full FE/BE docs into module memory.
Do not copy implementation details that are faster and safer to verify in code.
Do not preserve historical debates in hot module memory.

## Archive Rule

Closed runs, old prompts, superseded plans, and one-off audits must not remain
in the hot read path.

Distill durable outcomes into module memory or tracked canonical docs, then
archive the raw artifact.

## Reference Code Rule

Reference code such as Metronic is opt-in only.
Read `docs/ref/reference-code.md` and `ai-memory/durable/reference-code-policy.md`
before opening any raw reference pack, use `reference-pack:*` aliases, and
distill reusable findings into module memory instead of making donor code a
default context source.
