# Open Questions Preparation

- Status: `draft`
- Scope: planning preparation before implementation plan
- Date: 2026-05-01

## Purpose

Prepare decisions for the current workstream before creating an implementation
plan. The goal is to avoid starting slices too early and to keep changes
coherent across Maestro, memory, helper agents, contracts, and templates.

## 1. Context Compaction Without `work.md`

### Question

What should Maestro do after `Context automatically compacted` when no
`work.md` exists?

### Recommendation

For T0/current-chat work, Maestro should not create an artifact by default.
After compaction, Maestro should:

1. reconstruct the latest owner request from thread summary and current owner
   message;
2. reread `AGENTS.md`;
3. for repository/product work, reread `maestro/memory/START_HERE.md` and
   `maestro/memory/index/read-routes.yaml`;
4. inspect repo state only when it materially affects the task;
5. continue only if scope and next action are clear;
6. ask one focused question if scope, acceptance, or next action cannot be
   safely reconstructed.

### Why

This protects continuity without turning every tiny request into persisted
work. It also prevents risky action from a stale or incomplete compacted
summary.

### Acceptance Criteria

- No artifact is required for harmless T0 work.
- Maestro does not continue risky or ambiguous work after compaction.
- Maestro rereads the compact memory baseline for repository/product work.
- Maestro asks focused clarification instead of broad reset questions.

## 2. T0 Promotion To T1

### Question

When should T0 be promoted to T1 and create `work.md`?

### Recommendation

Promote T0 to T1 when the task becomes continuity-sensitive:

- multi-turn with meaningful state;
- several owner constraints, corrections, or decisions must not be lost;
- multiple files, packages, apps, or FE/BE boundaries are involved;
- delegation, non-trivial evidence, or review is needed;
- scope, out-of-scope, or acceptance criteria matter;
- approval gates, auth, tenancy, migrations, release, security, or destructive
  operations are involved;
- work pauses, resumes, or is likely to continue after compaction;
- Maestro cannot safely reconstruct next action from chat summary alone.

Creating `work.md` remains continuity capture only. It does not approve product
code edits or high-risk action.

### Why

The artifact should appear when it buys reliability, not as a default ritual.

### Acceptance Criteria

- Tiny work stays light.
- Long or fragile work has a durable owner-intent anchor.
- Owner does not need to grant separate artifact permission for T1+ continuity.
- Product-code execution and high-risk gates remain separate from artifact
  creation.

## 3. Lightweight `decisions-log.md`

### Question

How should `maestro/memory/durable/decisions-log.md` be made lighter?

### Recommendation

Make `decisions-log.md` a compact decision index, then move detailed decision
payloads into a small number of topic files.

Preferred topic split:

- `maestro/memory/durable/decisions/product-platform.md`
- `maestro/memory/durable/decisions/docs-memory-routing.md`
- `maestro/memory/durable/decisions/agent-runtime-workflow.md`
- `maestro/memory/durable/decisions/legacy-retirement-provenance.md`

Avoid one file per decision unless the decision is unusually large or needs
special lifecycle treatment.

Status: superseded by the accepted Slice 4 plan in
`decisions-log-restructure-plan.md`; implementation should follow that plan.

### Why

The current file is useful but over 1100 lines. As it grows, it becomes harder
to use as a retrieval entrypoint. A compact index would preserve scan speed,
while topic files preserve detail.

### Risks

- Splitting decisions may break existing references.
- Too many files would create its own retrieval burden.
- Historical provenance could be over-edited if the rewrite tries to clean too
  much at once.

### Acceptance Criteria

- `decisions-log.md` remains the first decision entrypoint.
- IDs remain stable.
- Topic files are few and routeable.
- Active/superseded/archive status stays clear.
- Existing source refs remain valid or are intentionally updated.

## 4. Lazy-Read Helper Agents

### Question

Should all helper agents get lazy-read behavior?

### Recommendation

Yes, but not mechanically. Apply lazy-read where required schemas/templates are
not needed for every invocation.

Default helper read behavior should be:

- read role skill and assignment;
- read `runtime-contract.md` when lifecycle behavior matters;
- read contracts/templates only when creating machine-readable handoffs,
  approvals, evidence, closeout, or when exact format affects the task;
- read lane AGENTS, memory packs, canonical docs, and target files only when
  the assignment requires implementation/research in that area.

### Likely Targets

- Charlie: task/handoff schemas should be lazy unless a machine-readable
  research handoff is requested.
- Mason: task/handoff schemas should be lazy unless durable handoff is
  requested.
- Scout: evidence schema should be lazy unless durable machine-readable
  evidence is requested.
- Lens: handoff schema should be lazy unless durable review handoff is
  requested.
- Grant: plan/handoff schemas should be lazy unless persisted audit handoff is
  requested.
- Scribe/Release: may keep stricter required reads because their job often is
  artifact/closeout/release record creation.
- Archivist: should stay audit-focused and read only relevant memory/docs
  surfaces.

### Why

This reduces context use and startup cost without weakening role contracts.

### Acceptance Criteria

- Helper prompts stay compact.
- Machine-readable output remains available when requested.
- Agents do not lose required constraints.
- No helper starts reading all contracts/templates by default.

## 5. Contracts/Templates Semantic Audit

### Question

What should the contracts/templates audit check?

### Recommendation

Audit after context continuity and helper lazy-read. The audit should answer:

- Do contracts/templates still imply fixed orchestration chains?
- Do they require packets/handoffs when compact `work.md` or `evidence.md` is
  enough?
- Do names match active vNext roles and `brief_auditor` legacy naming?
- Do schemas support adaptive delegation, inline work, and optional handoffs?
- Do templates preserve owner intent, scope, gates, evidence, and next action?
- Are any fields obsolete after native-first Maestro?

### Acceptance Criteria

- No template/schema forces ceremony for tiny work.
- Required fields protect continuity, gates, and evidence.
- Optional escalation fields stay available for auditability.
- Active naming and artifact paths are current.

## 6. Agent Hiring

### Question

Do we need new agents now?

### Recommendation

No. Do not hire now.

Current roles cover the known needs:

- Security/risk: Grant, Lens, Scout.
- Tests/evidence: Mason and Scout.
- UI/UX: Maestro with Browser Use, Computer Use, and Build Web Apps as
  outsourced capabilities.
- Memory/docs: Archivist.
- Closeout: Scribe.

Create a new role only after repeated evidence that the current team is
insufficient or a durable professional standard is missing.

### Candidate Future Roles

- Security Auditor: only if auth/tenant/security review regularly fails under
  Grant/Lens/Scout.
- Test Author: only if Mason/Scout repeatedly under-cover tests.
- UX Reviewer: probably not needed, because Maestro intentionally owns UI/UX
  judgment. Consider only if Maestro repeatedly misses usability issues despite
  browser evidence.
- Contract Auditor: only if contracts/templates drift repeatedly blocks work.

### Acceptance Criteria

- No new role is created from speculation.
- Hiring decision cites repeated failures or measurable gap.
- Existing role strengthening is attempted first.

## Recommended Implementation Order

1. Context compaction continuity.
2. Lazy-read helper agents.
3. Contracts/templates semantic audit.
4. Decisions-log lightweight restructuring.
5. Agent hiring review after evidence from real usage.

Why this order:

- continuity protects active owner intent immediately;
- lazy-read improves performance without changing memory shape;
- contracts/templates audit can then simplify actual persisted forms;
- decisions-log restructure is valuable but more invasive;
- hiring should be evidence-led, not speculative.

## Decision Needed From Owner

Before implementation planning, decide whether the recommended order is
accepted or whether `decisions-log.md` restructuring should move earlier.
