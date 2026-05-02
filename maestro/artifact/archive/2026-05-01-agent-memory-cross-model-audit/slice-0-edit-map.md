# Slice 0 Edit Map

## Purpose

Prepare exact edits before changing active runtime instructions. This map keeps
the cleanup small: remove duplicate Maestro mechanics from lane files, preserve
lane engineering rules, and align `maestro/AGENTS.md` with the current runtime
contract.

No subagent is required for this map. The relevant sections are short and
line-level ownership is clear enough for Maestro to handle inline. Use Charlie
only if implementation discovers hidden cross-file ambiguity.

## Target Files

- `AGENTS.md`
- `platform/AGENTS.md`
- `platform/frontend/AGENTS.md`
- `platform/backend/AGENTS.md`
- `maestro/AGENTS.md`

## Root `AGENTS.md`

Current useful ownership:

- lines 3-32: source-of-truth and retired-surface policy;
- lines 34-59: AGENTS responsibility boundaries;
- lines 61-78: docs classification and vNext vs legacy boundary;
- lines 80-100: runtime read policy;
- lines 102-118: completion checks;
- lines 121-207: role summaries;
- lines 209-230: active and legacy naming;
- lines 232-260: artifact model and legacy compatibility.

Implementation guidance:

- Keep root mostly stable.
- Keep role registry and artifact model summary here.
- Keep explicit legacy compatibility for old `artifacts/<module>/...` runs.
- If edited, clarify that `artifacts/<module>/...` is legacy-continuation-only
  and not a normal read path for new Maestro work.
- Do not move detailed Maestro mode/tier behavior into root.

Expected final state:

- Root remains the top-level runtime map.
- It does not become a second `runtime-contract.md`.
- It does not point new work toward the old `artifacts/<module>` model.

## `platform/AGENTS.md`

Current useful ownership:

- lines 1-11: platform scope and responsibility;
- lines 29-37: memory system role;
- lines 39-51: local preflight;
- lines 53-75: memory roles;
- lines 100-115: ignore set;
- lines 117-128: product invariants;
- lines 142-180: memory update expectations;
- lines 194-204: high-risk changes;
- lines 206-210: documentation rule.

Sections to rewrite or shrink:

- lines 13-27: read order currently makes `current-state.md` and module packs
  look mandatory for every product task. Rewrite as baseline plus routed reads:
  `platform/AGENTS.md`, `START_HERE.md`, `read-routes.yaml`, then current-state,
  module packs, indexes, lane AGENTS, and FE/BE docs only when routed or needed.
- lines 77-98: "Maestro orchestration rule" defines T0-T4, artifact paths, and
  templates. Replace with a compact reference:
  - use Maestro for ambiguous, cross-stack, multi-session, high-risk, or durable
    evidence work;
  - direct FE/BE lane work is acceptable for clearly local changes;
  - detailed route tiers, artifacts, and templates live in root `AGENTS.md` and
    `maestro/docs/runtime-contract.md`.
- lines 130-140: development workflow is mostly product discipline. Keep or
  lightly simplify, but do not turn it into Maestro lifecycle.
- lines 182-192: long-task support and archive rule duplicate artifact model.
  Replace with one reference to the active Maestro artifact model and keep the
  "do not dump transcripts" rule.

Expected final state:

- Platform file owns product invariants and cross-stack safety.
- It does not list T0-T4 mechanics.
- It does not list Maestro template mechanics.
- It keeps memory update rules because those are platform product maintenance.

## `platform/frontend/AGENTS.md`

Current useful ownership:

- lines 1-9: scope and responsibility;
- lines 11-19: local read order;
- lines 27-62: app/package/shared UI/tenant boundaries;
- lines 64-74: default ignore set;
- lines 76-85: high-risk areas;
- lines 87-129: auth/transport/layout/file-size/collection-table/working rules;
- lines 131-168: commands;
- lines 170-191: docs update and summary format.

Sections to rewrite or shrink:

- lines 21-25: "Orchestration rule" should not define Maestro behavior. Replace
  with a compact routing note:
  - route through Maestro when frontend work is ambiguous, cross-stack,
    high-risk, UI-visible enough to need evidence, or durable-memory sensitive;
  - tiny frontend-local edits may stay direct;
  - Maestro runtime policy lives in root `AGENTS.md` and
    `maestro/docs/runtime-contract.md`.
- lines 76-85: keep high-risk areas, but phrase them as frontend caution and
  Maestro escalation triggers, not as independent approval policy.

Do not remove:

- package rules;
- shared UI boundary;
- tenant boundary;
- auth/transport rules;
- layout/file-size guardrails;
- commands and docs update triggers.

Expected final state:

- Frontend file owns frontend implementation discipline.
- It does not own final UI/UX judgment, browser policy, agent delegation, or
  artifact lifecycle.
- It still tells implementers when frontend work should be escalated to Maestro.

## `platform/backend/AGENTS.md`

Current useful ownership:

- lines 1-9: scope and responsibility;
- lines 11-19: local read order;
- lines 27-69: backend focus and architecture rules;
- lines 71-80: file size guardrails;
- lines 82-91: default ignore set;
- lines 93-102: high-risk areas;
- lines 104-132: commands;
- lines 134-166: required tests, docs update, summary format.

Sections to rewrite or shrink:

- lines 21-25: "Orchestration rule" should not define Maestro behavior. Replace
  with a compact routing note:
  - route through Maestro when backend work is ambiguous, cross-stack,
    high-risk, schema/auth/tenant sensitive, or durable-evidence sensitive;
  - tiny backend-local edits may stay direct;
  - Maestro runtime policy lives in root `AGENTS.md` and
    `maestro/docs/runtime-contract.md`.
- lines 93-102: keep high-risk areas, but phrase them as backend caution and
  Maestro escalation triggers, not as independent release/approval lifecycle.

Do not remove:

- transport/service/repository separation;
- auth/tenant/schema/migration rules;
- command lists;
- required backend test categories;
- backend docs update triggers.

Expected final state:

- Backend file owns backend implementation discipline.
- It does not own release orchestration, artifact lifecycle, or agent routing.
- It still makes auth/tenant/schema risk visible.

## `maestro/AGENTS.md`

Current useful ownership:

- lines 3-10: status and legacy boundary;
- lines 12-23: read order before changing Maestro behavior;
- lines 25-33: local boundaries;
- lines 35-42: required invariants.

Required change:

- line 37 conflicts with current runtime because it says discussion and
  planning are read-only unless owner explicitly asks to persist a file.

Expected rewrite:

```text
- Discussion mode is read-only unless the owner explicitly asks to persist a
  file.
- Planning mode allows lean Maestro artifact updates once T1+ work is
  understood; it does not allow product-code edits or high-risk execution.
```

Potential simplification:

- Keep local editing boundaries in this file.
- Keep high-risk/release/specialist invariants only as short local reminders
  if they do not conflict with `runtime-contract.md`.
- Reference `maestro/docs/runtime-contract.md` for canonical runtime behavior.

Expected final state:

- `maestro/AGENTS.md` remains local guidance for editing `maestro/**`.
- It does not define alternate Maestro semantics.
- It preserves local safety reminders without duplicating the full runtime
  manual.

## Slice 0 Decision

Proceed without Charlie for the initial implementation. The edit surface is
small and exact. If implementation reveals unclear ownership or line-level
ambiguity, pause and use Charlie for a bounded read-only research pass.
