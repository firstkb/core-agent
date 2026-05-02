# AI Memory Agent Workflow

Status: active local workflow guidance
Scope: `maestro/memory/`

Use this file as the explicit local workflow guide for agents that opt into
the repository memory layer.

This file is not a replacement for `AGENTS.md`, `.codex/`, `.agents/`, source
code, or tracked canonical FE/BE docs.

## Purpose

Use `maestro/memory/` as the first retrieval layer before opening large platform docs.
The goal is to keep agent context small while preserving accepted decisions,
current state, module boundaries, and Maestro workflow state.

## Required Read Order

For platform product work, read:

1. `AGENTS.md`
2. `platform/AGENTS.md`
3. `maestro/memory/START_HERE.md`
4. `maestro/memory/index/read-routes.yaml`
5. `maestro/memory/durable/current-state.md`
6. the relevant module pack under `maestro/memory/modules/**`
7. `maestro/memory/index/memory-index.yaml` when broader routing is needed
8. `maestro/memory/durable/module-index.md` when module ownership is unclear
9. only the exact canonical docs and source files named by that module pack

For Maestro workflow changes, additionally read:

- `maestro/README.md`
- `maestro/docs/runtime-contract.md`
- `.agents/skills/maestro/SKILL.md`
- the relevant `maestro/docs/**`, `maestro/contracts/**`, and `maestro/templates/**` files

## Conflict Rule

`maestro/memory/` is a compact retrieval layer.
If it conflicts with source code, `.codex/`, `.agents/`, or tracked canonical
docs, verify against the owner surface named in the module pack or
`memory-index.yaml`.

The former `platform/docs/ai/**` layer has been migrated and deleted. If a task
needs old wording for explicit historical reconstruction, use
`maestro/memory/durable/legacy-memory-import.md`, compact archive summaries, and git
history. Current runtime docs and `maestro/memory` win for active work.

## Update Gate

After a significant task, decide explicitly whether to update:

- no memory update
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/decisions-log.md` plus the relevant
  `maestro/memory/durable/decisions/*.md` topic file
- `maestro/memory/durable/canonical-docs.md`
- relevant module `contract.md`
- relevant module `state.md`
- relevant module `lessons.md`
- tracked FE/BE canonical docs
- archive only

Never update memory implicitly.
Do not duplicate the same fact in multiple active files unless one file is
clearly a summary and names the canonical owner.

Durable memory records accepted decisions that change future strategy,
standards, architecture, ownership, risk, or workflow. Keep brainstorming,
rejected options, temporary plans, raw evidence, screenshots, command logs, and
full planning artifacts in the active artifact or chat.

## Mandatory Memory Update Matrix

When a new durable decision is accepted:

- update `maestro/memory/durable/decisions-log.md` as the compact index
- add the full decision body to the relevant `maestro/memory/durable/decisions/*.md` topic file
- update `maestro/memory/durable/current-state.md` if the decision changes active state, risk, or next work
- update the relevant `maestro/memory/modules/**/README.md` when a module boundary, contract, or integration seam changes
- update tracked FE/BE docs only when they own the changed contract

When a new module, app, package, runtime, or Platform Studio tool becomes active:

- update `maestro/memory/durable/module-index.md`
- update `maestro/memory/durable/repo-map.md` when the repo/runtime shape changes
- create or update the relevant module pack under `maestro/memory/modules/**`
- update `maestro/memory/index/memory-index.yaml` and `maestro/memory/index/read-routes.yaml` if agents need a new retrieval route
- update `maestro/memory/durable/canonical-docs.md` if a new owner surface becomes canonical

When a doc changes status:

- update `maestro/memory/durable/canonical-docs.md`
- update the relevant docs map under `maestro/memory/docs/**`
- update archive/proposal maps when old docs are demoted
- use git history for exact historical migration records

When reference-code or donor material changes:

- update `maestro/memory/reference-code/README.md`
- update `maestro/memory/reference-code/packs-index.md`
- update `maestro/memory/durable/reference-code-policy.md` only if policy changes
- never route normal agents directly to raw `reference-code/**`

When Maestro/Archivist/agent workflow changes:

- update the relevant `.agents/skills/**/SKILL.md`
- update matching `.agents/skills/**/agents/openai.yaml`
- update `maestro/memory/durable/current-state.md` and `decisions-log.md` for durable workflow decisions
- update `maestro/docs/**`, `maestro/contracts/**`, or `maestro/templates/**` when the native orchestration contract changes

When no memory update is needed, say so explicitly in the closeout.
For docs/memory work, run:

```bash
python3 scripts/checks/docs_memory_check.py --check
python3 scripts/checks/check_env_policy.py --check
```

For non-trivial implementation work, run `scripts/preflight.sh` or report
which checks could not run and why. Use `scripts/preflight.sh --full` only
when a broader backend/frontend sweep is needed. The preflight is local/manual
and must not install dependencies.

For non-trivial closeout or PR body text, use
`maestro/templates/evidence.md.tmpl`. Keep it compact and do not create
a standalone evidence file unless the owner asks.

Use `Archivist` (`$archivist`) after large docs/memory, AGENTS, Maestro, or reference-code changes.
Do not run Archivist on every commit by default.

## Memory Write Matrix

| Change | Write to |
| --- | --- |
| New durable product decision | `maestro/memory/durable/decisions-log.md`, relevant `maestro/memory/durable/decisions/*.md` topic file, and `maestro/memory/durable/current-state.md` when active state/risk changes |
| New frontend contract | `platform/frontend/docs/contracts/**` and the relevant frontend docs map |
| New backend contract | `platform/backend/docs/contracts/**` and the relevant backend docs map |
| New module, app, package, runtime, or Platform Studio tool | `maestro/memory/durable/module-index.md`, `maestro/memory/durable/repo-map.md`, module memory, and read routes |
| Active Maestro artifact | `maestro/artifact/active/YYYY-MM-DD-<work-slug>/` |
| Closed Maestro artifact | `maestro/artifact/archive/YYYY-MM-DD-<work-slug>/` |
| Verified lesson after an error | relevant module `lessons.md` or `maestro/memory/lessons/**` |
| Temporary notes | current chat or active Maestro artifact only |

## Module Memory Size Rule

`maestro/memory/modules/**` is only for durable, compressed, operationally useful
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
Read `maestro/memory/reference-code/README.md` and `maestro/memory/durable/reference-code-policy.md`
before opening any raw reference pack, use `reference-pack:*` aliases, and
distill reusable findings into module memory instead of making donor code a
default context source.
