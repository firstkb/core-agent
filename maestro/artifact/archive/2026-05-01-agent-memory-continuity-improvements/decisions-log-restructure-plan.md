# Decisions Log Restructure Plan

- Work ID: `2026-05-01-agent-memory-continuity-improvements`
- Slice: 4
- Status: `completed`
- Date: 2026-05-01

## Scope

This is a planning artifact only. It does not move or rewrite
`maestro/memory/durable/decisions-log.md`.

Audited:

- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/START_HERE.md`
- `maestro/memory/index/read-routes.yaml`
- `maestro/memory/index/memory-index.yaml`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/module-index.md`

## Current Inventory

- File size: 1172 lines.
- Decisions: 96 headings.
- Status count:
  - `active`: 86
  - `superseded`: 9
  - `historical`: 1
- ID notes:
  - no duplicate `### DEC-*` headings found;
  - `DEC-049B` is intentionally retained because `DEC-049` had historical
    duplication;
  - new decisions should continue after `DEC-095`.

## Problem

`decisions-log.md` is no longer just a compact decision index. It contains full
details for several different decision types:

- product/platform architecture and active product-domain decisions;
- FE/BE docs migration ledger entries;
- memory/routing/runtime workflow decisions;
- retired runtime and deleted `platform/docs/ai/**` provenance;
- current human-agent symbiosis and Maestro operating standards.

The file is still useful and mostly clean, but it is too heavy as a hot durable
memory entrypoint. The main issue is retrieval weight, not garbage.

## Proposed Shape

Keep `maestro/memory/durable/decisions-log.md` as the lightweight index and move
decision details into topic files:

```text
maestro/memory/durable/decisions-log.md
maestro/memory/durable/decisions/
  product-platform.md
  docs-memory-routing.md
  agent-runtime-workflow.md
  legacy-retirement-provenance.md
```

### `decisions-log.md`

Purpose: hot index and append point.

Recommended sections:

- status / last compacted;
- rules for durable decisions;
- ID normalization note for `DEC-049B`;
- next ID pointer;
- topic file map;
- compact table:
  - ID;
  - title;
  - status;
  - state;
  - topic file;
  - one-line decision summary.

The index should not include full source lists unless the source is essential to
avoid misuse. Details belong in the topic files.

### `decisions/product-platform.md`

Purpose: active product/platform architecture and domain boundaries.

Initial content group:

- platform architecture, tenancy, auth/session, admin control plane;
- Collection Table and Platform Studio domain decisions;
- online web first, local dev, Storybook/local visual smoke.

Candidate decisions:

- `DEC-004` through `DEC-018`
- `DEC-020`
- `DEC-023`
- `DEC-079`
- `DEC-087`

### `decisions/docs-memory-routing.md`

Purpose: docs migration, memory routing, maintenance, source-of-truth routing,
and checks.

Initial content group:

- FE/BE docs target-folder migration;
- compact memory route/read policy;
- docs/memory drift checks and CI;
- Form Builder exact-detail retention/extraction policy;
- memory maintenance standards.

Candidate decisions:

- `DEC-021`
- `DEC-024` through `DEC-054`
- `DEC-065` through `DEC-077`
- `DEC-083`

### `decisions/agent-runtime-workflow.md`

Purpose: active Codex/Maestro runtime, agent/team behavior, evidence budget, and
owner/Maestro responsibility split.

Initial content group:

- Codex-native runtime;
- Maestro artifact model;
- active read order;
- human-agent symbiosis;
- UI/UX evidence policy;
- adaptive agent selection;
- Definition of Done and evidence budget;
- AGENTS ownership boundaries.

Candidate decisions:

- `DEC-019`
- `DEC-071`
- `DEC-073`
- `DEC-075` through `DEC-078`
- `DEC-083` through `DEC-095`

If a decision fits both docs/memory routing and agent runtime, pick one primary
topic file and cross-reference from the other topic file only when necessary.
Do not duplicate the full decision body.

### `decisions/legacy-retirement-provenance.md`

Purpose: superseded, historical, and provenance-heavy decisions that should not
be hot-read by default but must remain recoverable.

Initial content group:

- superseded initial memory decisions;
- retired runtime and old run model;
- deleted `platform/docs/ai/**` provenance;
- exact-history and git-history-only notes.

Candidate decisions:

- `DEC-001` through `DEC-003`
- `DEC-025`
- `DEC-055` through `DEC-064`
- `DEC-078`
- `DEC-086`
- `DEC-088`

## Source Reference Rules

- Do not renumber decisions.
- Preserve `DEC-049B`.
- Preserve deleted-path sources as provenance when they explain why a decision
  exists.
- Mark deleted legacy sources as provenance, not active read targets.
- Prefer current canonical docs or compact memory routes for active read paths.
- Do not rewrite old decisions to pretend they were originally sourced from new
  files.
- New decisions should include:
  - stable ID;
  - date;
  - status;
  - state;
  - decision;
  - rationale when it affects future judgment;
  - current sources;
  - topic file.

## Routing Implications

No new always-read file is needed.

Keep current baseline:

- `maestro/memory/START_HERE.md`
- `maestro/memory/index/read-routes.yaml`

Recommended updates when implementation is approved:

- `START_HERE.md`: keep pointing new durable decisions at
  `decisions-log.md`, because it becomes the index/append point.
- `read-routes.yaml`: add topic files only to the routes that need them.
  For example:
  - `maestro_workflow` can read `decisions/agent-runtime-workflow.md` when
    runtime policy history matters.
  - docs/memory rewrite routes can read `decisions/docs-memory-routing.md`
    when migration history matters.
  - product routes normally do not need full decision history unless a decision
    conflict or provenance question arises.
- `memory-index.yaml`: optional update only if topic files become common
  retrieval targets.

## Migration Strategy

Use one dedicated implementation slice, not mixed with unrelated runtime work.

Recommended steps:

1. Create `maestro/memory/durable/decisions/`.
2. Move full decision bodies into the four topic files.
3. Replace `decisions-log.md` with the lightweight index.
4. Verify every `DEC-*` ID appears exactly once in a topic file and exactly
   once in the index table.
5. Verify `DEC-049B` remains explicit.
6. Update `START_HERE.md`, `read-routes.yaml`, and maybe `memory-index.yaml`
   only as needed.
7. Run docs/memory checks and focused `rg` for deleted active paths.

Do not create one file per decision by default. The topic files should be large
enough to preserve context but small enough to avoid loading the entire decision
history for every task.

## Rollback / Risk Control

- The split should be mechanical first: move content, do not semantically
  rewrite decisions in the same pass.
- If the split causes route confusion, revert the implementation commit or
  restore the original `decisions-log.md`.
- Do not delete superseded/historical decisions during the split.
- Do not change accepted decision text while moving it.
- Deeper semantic pruning should be a later owner-approved slice.

## Recommendation

Proceed with the split only after the owner approves it.

Best next implementation shape:

- one dedicated docs/memory slice;
- mechanical move plus index creation;
- no decision text rewrite;
- no one-file-per-decision structure;
- routing updates only where the topic files become useful.
