# Local AI Memory Override

Status: local guidance
Scope: `ai-memory/`

This file is intended for local use only.
Do not treat it as a tracked repository runtime contract unless the owner explicitly promotes it.

## Purpose

Use `ai-memory/` as the first retrieval layer before opening large platform docs.
The goal is to keep agent context small while preserving the important accepted decisions, current state, and module boundaries.

## Required Read Order

For project work, read:

1. `AGENTS.md`
2. `ai-memory/README.md`
3. `ai-memory/index/memory-index.yaml`
4. `ai-memory/durable/current-state.md`
5. `ai-memory/durable/module-index.md`
6. the relevant module pack under `ai-memory/modules/**`
7. only the exact canonical docs and source files named by that module pack

## Conflict Rule

`ai-memory/` is a compact retrieval layer.
If it conflicts with source code, `.codex/`, `.agents/`, or tracked canonical docs, verify against the owner surface named in the module pack or `memory-index.yaml`.
When old `platform/docs/ai` memory conflicts with current root `AGENTS.md` or Codex-native runtime docs, current root runtime docs win.

## Update Gate

After a significant task, decide explicitly whether to update:

- no memory update
- `durable/current-state.md`
- `durable/decisions-log.md`
- `durable/canonical-docs.md`
- module `contract.md`
- module `state.md`
- module `lessons.md`
- archive only

Never update memory implicitly.
Do not duplicate the same fact in multiple active files unless one file is clearly a summary and names the canonical owner.

## Archive Rule

Closed runs, old prompts, superseded plans, and one-off audits must not remain in the hot read path.
This applies to both `ai-memory/runs/**` and `platform/docs/ai/runs/**`.
Distill durable outcomes into `contract.md`, `state.md`, or `lessons.md`, then archive the raw artifact.

## Reference Code Rule

Reference code such as Metronic is opt-in only.
Read `docs/ref/reference-code.md` and `ai-memory/durable/reference-code-policy.md` before opening any raw reference pack, use `reference-pack:*` aliases, and distill reusable findings into module memory instead of making donor code a default context source.
