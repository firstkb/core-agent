# Contracts And Templates Semantic Audit

- Work ID: `2026-05-01-agent-memory-continuity-improvements`
- Slice: 3
- Status: `completed`
- Date: 2026-05-01

## Scope

Audited:

- `maestro/contracts/**`
- `maestro/templates/**`
- related `.codex/contracts/**` where needed for comparison

No schema or template rewrite was performed in this slice.

## Executive Summary

The active Maestro vNext contract/template surface is usable and mostly aligned
with the current native-first model. It already separates active vNext contracts
from legacy `module_orchestrator`, uses current role nicknames in
`maestro/contracts/**`, and supports optional handoffs in the runtime docs.

The main risk is semantic pressure toward unnecessary machine-readable packets
and handoffs. A few schemas/templates still read like every delegated action
should be packet -> JSON handoff, while the runtime now says compact
`work.md`/`evidence.md` notes are preferred for normal low-risk work.

## Findings

### F1. Required Handoff Expectations Can Recreate Ceremony

- Severity: `medium`
- Files:
  - `maestro/contracts/task-packet.schema.json` lines 7-22, 217-220
  - `maestro/templates/packet.md.tmpl` lines 58-60

`task-packet.schema.json` requires `handoff_expectations` with `minItems: 1`.
`packet.md.tmpl` then says to return `handoff-<stage>-<role>-NNN.json`
unconditionally. This conflicts with the current runtime rule that normal
low-risk work should prefer compact `work.md` / `evidence.md` notes and use
machine-readable handoffs only when resume, audit, or accountability requires
them.

Recommended follow-up:

- Replace unconditional handoff language with an explicit output mode:
  `chat_summary`, `agent_note`, `evidence_md`, or `handoff_json`.
- Allow `handoff_expectations` to be empty or `none` when machine-readable
  handoff is not required.
- Keep handoff required only for release or owner-approved durable specialist
  packets.

### F2. Helper Agent Contracts Still Look Structured By Default

- Severity: `medium`
- Files:
  - `.codex/contracts/research_charlie/input.schema.json` lines 1-4
  - `.codex/contracts/research_charlie/output.schema.json` lines 1-4
  - `.codex/contracts/research_charlie/contract.json` lines 11-15, 20-29
  - same pattern exists for Grant, Mason, Scout, Lens, Scribe, Archivist, and
    Release

The `.codex/contracts/*/input.schema.json` files point directly to
`task-packet.schema.json`, and outputs point directly to
`stage-handoff.schema.json`. Most role contract files correctly mark handoff
artifacts as `required: false`, but the input/output schema shape still implies
structured packet/handoff as the default interface.

This does not block current work because Slice 2 moved helper prompts to
lazy-read. The remaining risk is future drift: someone may treat the `.codex`
contract schema as mandatory for every helper invocation.

Recommended follow-up:

- Add a contract-level distinction between `default_invocation` and
  `machine_readable_invocation`.
- Keep the current input/output schemas as optional validation schemas for
  machine-readable mode.
- Keep Release stricter, because release evidence is intentionally durable.

### F3. Orchestration Plan Schema Requires Stage/Agent Lists Even For T0

- Severity: `low`
- File: `maestro/contracts/orchestration-plan.schema.json` lines 7-20,
  109-133, 303-331

The schema requires `stages` and `agents` with at least one entry for every
orchestration plan. For T0, the schema later forces `artifact_shape: none` and
`record_required: false`, which is good. The remaining issue is semantic:
validating T0 through a schema that still requires stage/agent arrays can make
tiny inline work feel more orchestrated than it should.

Recommended follow-up:

- Clarify that `orchestration-plan.schema.json` is a machine-readable internal
  plan only when a plan record is useful, not required for every T0 action.
- Optionally allow a smaller T0-only shape with `next_allowed_action`,
  `owner_intent_summary`, and no stage/agent list.

### F4. Approval Type Names Are Not Fully Aligned

- Severity: `medium`
- Files:
  - `maestro/contracts/orchestration-plan.schema.json` lines 150-162
  - `maestro/contracts/task-packet.schema.json` lines 170-183
  - `maestro/contracts/approval.schema.json` lines 39-48

Plan/packet schemas use approval requirement names like
`owner_high_risk_approval`, while `approval.schema.json` stores approval types
like `high_risk_implementation`. The meaning is close, but the vocabularies are
not one-to-one.

Recommended follow-up:

- Either align the enum values directly, or document an explicit mapping from
  requirement names to approval record `approval_type`.
- Avoid adding more approval names until this mapping is clear.

### F5. `approve` Recommendation Can Blur Authority

- Severity: `medium`
- Files:
  - `maestro/contracts/stage-handoff.schema.json` lines 82-94
  - `maestro/docs/runtime-contract.md` lines 248-250, 252-266

`stage-handoff.schema.json` allows `recommendation: approve`. Runtime policy
says specialists recommend next action, while Maestro owns lifecycle decisions
and owner approval is separate durable state. `approve` can be interpreted as a
specialist approval even though Grant, Lens, Scout, and other helpers must not
approve work on behalf of the owner.

Recommended follow-up:

- Replace `approve` with `continue` or a clearer non-authoritative value such
  as `gate_ready`.
- If `approve` must stay, constrain it to an explicit approval/owner decision
  context and document that it is not owner approval.

### F6. Contracts README Can Be More Lazy-Read Friendly

- Severity: `low`
- File: `maestro/contracts/README.md` lines 21-22

The README says JSON contracts are used for gates, subagent boundaries, and
validation. That is true, but it can still sound broader than current runtime
policy after Slice 2. Normal low-risk helper work should not require reading or
writing JSON contracts unless machine-readable continuity is useful.

Recommended follow-up:

- Change the README wording to "Use JSON contracts when gates, machine-readable
  subagent boundaries, resume, auditability, or validation require them."

## Confirmed Good

- `maestro/contracts/**` and `maestro/templates/**` use current vNext role
  nicknames: `maestro`, `charlie`, `grant`, `mason`, `scout`, `lens`,
  `release`, `scribe`, `archivist`.
- Legacy `.codex/contracts/module_orchestrator`,
  `.codex/contracts/research_codebase`, and `.codex/contracts/brief_auditor`
  are explicitly legacy and point back to old `artifacts/<module>` runs.
- `approval.md.tmpl` correctly states that Markdown alone is not a gate record.
- `work.md.tmpl` now contains the continuity snapshot needed after compaction.
- `release_manager` is intentionally stricter: release/deploy work needs
  durable machine-readable evidence.
- `closeout.md.tmpl`, `evidence.md.tmpl`, and `work.md.tmpl` are compact enough
  for the jet model and do not need immediate restructuring.

## Suggested Implementation Order

1. Fix packet/handoff optionality in `task-packet.schema.json` and
   `packet.md.tmpl`.
2. Clarify `.codex/contracts/*` default vs machine-readable invocation mode.
3. Align approval requirement names with `approval.schema.json`.
4. Rename or constrain `stage-handoff` recommendation `approve`.
5. Update `maestro/contracts/README.md` lazy-read wording.

Do not rewrite all schemas at once. These are small semantic corrections, and
each should preserve compatibility with current artifacts.
