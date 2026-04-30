---
doc_status: accepted
doc_scope: maestro_vnext
doc_type: cockpit_freeze_note
lang: en
---

# Maestro Cockpit Freeze Note

## Decision

Maestro Cockpit development is frozen.

The current Cockpit implementation is preserved as an experimental dashboard,
ledger, API, artifact reader, and local state prototype. It should not drive the
next Maestro implementation phase.

## Reason

The useful product insight is clear:

- Maestro's core value is native-first agent orchestration, not a management UI.
- The Cockpit backend can store useful state, artifacts, evidence, and runs.
- The Cockpit frontend began exposing too much backend machinery to the owner.
- Continuing to polish the UI now risks building a heavier control plane before
  the real Maestro agent workflow exists.

The product direction is therefore:

- pause Cockpit feature work;
- keep the current Cockpit code as reference and optional tooling;
- build Maestro as an improved Atlas-style native assistant first;
- let future Cockpit UI reflect real Maestro behavior after the workflow proves
  itself.

## Frozen Scope

Frozen for now:

- `maestro/backend`
- `maestro/frontend`
- Cockpit-specific API growth
- Cockpit-specific UI polish
- custom runner or queue automation
- cloud worker implementation

Still useful as reference:

- artifact URI model
- safe artifact reader
- work/task/stage/attempt/evidence/approval vocabulary
- native-first boundary documents
- Maestro Cockpit lessons learned

## Next Focus

The next active work is the native Maestro environment:

- Maestro operating character and owner-facing behavior;
- routing from tiny inline requests to larger work;
- small skill set for repeated workflows;
- native subagent usage only when isolated context helps;
- handoff and evidence discipline without a custom runtime;
- clear boundary between Maestro, Atlas, skills, and optional Cockpit records.

## Resume Criteria

Resume Cockpit only when the native Maestro loop creates repeated friction that a
UI can genuinely remove.

Examples:

- too many active work items to track conversationally;
- evidence and handoffs are hard to inspect from files alone;
- owner approvals need a visible queue;
- agent runs need observational telemetry after real usage.

Until then, Cockpit remains parked.

## Removal Policy

Removing Cockpit from git should be a separate explicit decision and separate
commit. Do not mix removal with this freeze note.
