---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: stage_contract
lang: en
---

# Maestro vNext Stage Contract

## Purpose

Stages are optional building blocks in Maestro's adaptive loop. Maestro selects
only the stages that improve correctness, evidence, approval safety, review
quality, or closeout portability.

A stage is not a workflow obligation. Maestro may skip any stage that does not
help the current route.

## Canonical Stage Names

Use these stage names in internal packets, handoffs, and plans when
machine-readable coordination is useful:

| Stage | Typical Role | Purpose |
|---|---|---|
| `intake` | Maestro | Understand owner intent, mode, risk, and next useful action |
| `research` | Charlie | Find code/docs facts, dependencies, risks, and change points |
| `planning` | Maestro | Shape product understanding, scope, risks, first slice, evidence, and optional internal route |
| `audit` | Grant | Challenge plan, risk, acceptance, dependency order, and gates |
| `approval` | Owner/Maestro | Capture real gate decisions when required |
| `implementation` | Mason or Maestro | Apply scoped changes |
| `verification` | Scout | Run checks and collect evidence |
| `review` | Lens | Read-only review of diff, evidence, security, and acceptance |
| `release` | Release | Release/deploy/package/rollback work after release approval |
| `closeout` | Scribe or Maestro | Summarize result, evidence, skipped checks, and residual risk |
| `archive` | Maestro/Scribe | Move completed, cancelled, or frozen work to archive |
| `memory` | Archivist | Audit docs and durable memory drift |

## Route Tier Compatibility

| Tier | Default Stages |
|---|---|
| `T0_inline` | `intake`, inline answer or tiny implementation, optional final evidence in response |
| `T1_task` | `intake`, optional `planning`, optional `implementation`, `closeout` |
| `T2_staged` | `intake`, `planning`, `implementation`, optional `verification`/`review`, `closeout` |
| `T3_multi_step` | `intake`, optional `research`, `planning`, optional `audit`, staged slices, verification/review, closeout |
| `T4_gated` | `intake`, research/audit as needed, approval, implementation, verification, review, optional release, closeout |

High-risk work must not enter implementation or release without the required
gate decision and `approval-*.json` record.

## Stage Attempt Rules

- Stage attempts are append-only only when durable auditability matters.
- A stage agent may recommend the next action but does not advance lifecycle.
- Maestro records transitions in conversation or artifacts when persistence is useful.
- Failed, blocked, skipped, and partially verified stages must be explicit.
- Handoffs use `handoff-<stage>-<role>-NNN.json` when machine-readable
  handoff is useful.
- Specialist output that changes next action, approval readiness, risk, or scope
  must be persisted in `work.md`, `evidence.md`, an agent note, or a handoff
  artifact.

## Stage Inputs And Outputs

### `research`

Input: owner intent, route notes, target files/docs when known.

Output: observed facts, inferences, evidence refs, risks, and recommended next
action. Use `handoff-research-charlie-NNN.json` only when machine-readable
research continuity is useful.

### `planning`

Input: owner request, research handoff when available, relevant repo contracts.

Output: `work.md` when persistence is useful, with optional expanded
`intent.md`, `plan.md`, `task.md`, and/or `packet.md` only when they improve
continuation, delegation, or auditability.

### `audit`

Input: plan, brief, assignment, risk model, approval policy, acceptance checks.

Output: durable audit evidence with `continue`, `revise`, `block`, or
`request_owner_decision` recommendation. Use `handoff-audit-grant-NNN.json`
when machine-readable auditability is needed; otherwise a compact agent note may
be enough. Maestro may summarize it, revise the work note, and record audit
status when useful.

### `approval`

Input: requested action, risk reason, scope, expected evidence, decision actor.

Output: `approval-NNN.json` validated by `maestro/contracts/approval.schema.json`
for real gates. Markdown approval notes are optional and not sufficient for high
risk gate checking.

### `implementation`

Input: assignment with allowed paths, forbidden paths, approvals, evidence
expectations, and stop conditions.

Output: changed files and evidence. Use `handoff-implementation-mason-NNN.json`
only when staged machine-readable handoff is useful.

### `verification`

Input: implementation handoff, acceptance checks, evidence expectations.

Output: evidence records for commands, tests, browser checks, CI, migrations,
security checks, or skipped checks. Use `handoff-verification-scout-NNN.json`
when independent machine-readable verification is useful.

### `review`

Input: diff, implementation handoff, verification evidence, acceptance criteria,
risk notes, and approval refs when relevant.

Output: review findings with a recommendation to continue, revise, block,
request owner decision, or close. Use `handoff-review-lens-NNN.json` when
machine-readable review is useful.

### `release`

Input: release packet, verification/review evidence, and release approval.

Output: `handoff-release-release-NNN.json`, release evidence, target environment,
command/workflow result, rollback or recovery notes.

### `closeout`

Input: work notes, stage handoffs when present, evidence refs, changed files, skipped checks, approvals,
residual risks, and follow-ups.

Output: `closeout.md` and optional JSON closeout summary validated by
`maestro/contracts/closeout.schema.json`.

### `memory`

Input: closeout, changed docs/memory files, durable memory implications.

Output: `handoff-memory-archivist-NNN.json` or owner-readable findings. Archivist
patches docs/memory only when explicitly assigned.

## Review Decisions

Use these recommendations in `stage-handoff.schema.json`:

- `continue`
- `revise`
- `block`
- `request_owner_decision`
- `release`
- `archive`
- `close`
- `none`

Maestro owns the final lifecycle decision.
