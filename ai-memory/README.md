# AI Memory

Status: local working memory layer
Scope: repository-specific AI retrieval, planning, and documentation compaction

This folder is a local AI knowledge layer for this repository.
It is designed to reduce context-window load and give agents a deterministic read path.

It does not replace the tracked runtime source of truth by itself.
When this layer conflicts with code or tracked canonical docs, verify against the owner surface listed in `index/memory-index.yaml`.

## Read Order

Use this order for agent work:

1. `AGENTS.md`
2. `ai-memory/AGENTS.override.md`
3. `ai-memory/index/memory-index.yaml`
4. `ai-memory/durable/current-state.md`
5. `ai-memory/durable/module-index.md`
6. the relevant module `README.md`
7. the relevant module `contract.md`, `state.md`, and `lessons.md`
8. only then open deep source docs or code paths named by the module pack

## Memory Types

- Procedural memory: how agents should work. Keep this in `AGENTS.md`, `.codex/`, `.agents/`, and this local override only when it is local routing guidance.
- Semantic memory: durable project facts, contracts, state, and accepted decisions. Keep this in `durable/` and module `contract.md` / `state.md`.
- Episodic memory: reusable lessons and pitfalls distilled from completed work. Keep this in module `lessons.md` or `lessons/`.
- Working memory: active task state. Keep this in `working/active/` or `runs/active/`; do not treat it as durable truth.

## Directory Roles

- `index/`: compact retrieval index and read routing.
- `durable/`: small cross-project memory that should be read before deep docs.
- `modules/domains/`: product/domain memory where frontend, backend, or multiple apps must stay aligned.
- `modules/frontend/`: frontend-owned module packs and UI/package concerns.
- `modules/backend/`: backend-owned module packs and runtime/data concerns.
- `docs/`: compacted frontend/backend docs organized as contracts, guides, and archive.
- `reference-code/`: local index and optional opt-in packs for donor/vendor/reference code.
- `lessons/`: cross-module lessons that do not belong to one module pack.
- `working/`: task-local active notes.
- `runs/`: local run packets; closed runs must move to `runs/archive/`.

Note: `modules/domains/` is an AI-memory classification name.
It does not rename or reinterpret real code paths such as `platform/backend/modules/shared`.

## Authoring Rules

- Keep hot files short and factual.
- Prefer one canonical owner surface plus links over duplicating the same truth.
- Use explicit state labels: `landed`, `accepted`, `planned`, `blocked`, `deprecated`, `superseded`, `archived`.
- Use confidence labels: `code-confirmed`, `doc-confirmed`, `owner-confirmed`, `inferred`.
- Do not place raw transcripts, long launch prompts, or closed run packets in hot memory.
- Do not use machine-local absolute paths.

## Current First Slice

The initial memory slice covers:

- product/domain platform state
- auth and session
- schema and tenancy
- admin control plane
- admin module registry
- collection table
- Platform Studio suite and Form Builder
- planned Navigation Builder, Action Builder, PDF Builder, and Report Builder boundaries
- first FE/BE split for Platform Studio implementation concerns
- frontend and backend docs classification maps
- target structure for future physical FE/BE docs rewrite
- source-to-target migration plan for future physical docs rewrite
- reference-code governance, alias registry, and relocation plan for Metronic, EXTDB, ezform, smartapp, old builder snapshots, and legacy MSSQL material
