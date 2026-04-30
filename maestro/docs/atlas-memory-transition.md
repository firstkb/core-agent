---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: atlas_memory_transition
lang: en
---

# Atlas And Memory Transition

## Purpose

This document defines the target transition after Maestro vNext agents and
skills are implemented and accepted by the owner.

It does not change the active runtime today.

## Current State

- Atlas remains an independent personal helper.
- `ai-memory/` remains the current durable memory layer.
- `.codex/`, `.agents/`, `.agent-cli/`, and the active repo instructions remain
  the live runtime surfaces until Maestro vNext is promoted.

## Target State

After Maestro proves itself as the default work entrypoint:

- Maestro becomes the default engineering work partner.
- Atlas is frozen as provenance and removed from the default work path.
- Durable memory moves under the Maestro surface.

Target shape:

```text
maestro/
  memory/
    START_HERE.md
    index/
    durable/
    templates/
  archive/
    final-atlas/
```

## Atlas Final Archive

Atlas should be archived only after all are true:

- Maestro handles discussion, planning, execution, gated execution, closeout,
  artifacts, and memory rhythm at least as well as Atlas;
- owner confirms Maestro is the default work entrypoint;
- active references to Atlas as the default helper are removed or rewritten;
- the final Atlas source is copied into `maestro/archive/final-atlas/`;
- the archive clearly states that it is provenance, not active instruction.

Atlas may remain as a lightweight personal helper only if the owner explicitly
wants that separate surface after Maestro promotion.

## Memory Migration

Move `ai-memory/` to `maestro/memory/` only after owner approval.

Migration rules:

- preserve existing durable memory content;
- rewrite read routes and indexes to the new path;
- remove stale references to the old root path;
- keep memory compact and route-oriented;
- do not copy transient run detail into memory;
- run docs/memory validation after the move.

Archivist owns semantic audit of the migration. Maestro owns the decision to
perform it.

## Non-Goals

- Do not move memory before Maestro agents and skills are usable.
- Do not delete Atlas history.
- Do not make memory a live task-state store.
- Do not use the transition as an excuse to rebuild Cockpit.
