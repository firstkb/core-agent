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
3. `ai-memory/README.md`
4. `ai-memory/index/memory-index.yaml`
5. `ai-memory/index/read-routes.yaml`
6. `ai-memory/durable/current-state.md`
7. `ai-memory/durable/module-index.md`
8. the relevant module pack under `ai-memory/modules/**`
9. only the exact canonical docs and source files named by that module pack

For Atlas workflow changes, additionally read:

- `ai-memory/atlas/README.md`
- `ai-memory/atlas/migration-audit.md`
- `ai-memory/atlas/automation-manifest.json`
- `.agents/skills/ramp-conductor/SKILL.md`

## Conflict Rule

`ai-memory/` is a compact retrieval layer.
If it conflicts with source code, `.codex/`, `.agents/`, or tracked canonical
docs, verify against the owner surface named in the module pack or
`memory-index.yaml`.

When old `platform/docs/ai/**` conflicts with current root `AGENTS.md`,
Codex-native runtime docs, or `ai-memory`, the current runtime and compact
memory routes win unless the task is explicitly historical reconstruction.

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
