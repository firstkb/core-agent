# Work

- Work ID: `2026-05-01-agent-memory-continuity-improvements`
- Title: Agent, Memory, And Context Continuity Improvements
- Status: `completed`
- Date: 2026-05-01

## Owner Goal

Continue improving Maestro, the agent team, durable memory, and context
continuity after the completed human-agent symbiosis runtime cleanup.

The owner wants the next work to stay practical and non-bureaucratic while
addressing deeper reliability risks:

- `decisions-log.md` may be too large and should perhaps become a lightweight
  index with detailed decisions split into topic files.
- Helper agents may need the same lazy-read treatment that Maestro received.
- `maestro/contracts/**` and `maestro/templates/**` need a semantic audit for
  drift, legacy orchestration assumptions, and unnecessary ceremony.
- Agent hiring criteria review was considered but cancelled by owner for this
  workstream.
- Context compaction continuity is important: after automatic conversation
  compaction, Maestro must preserve or reconstruct the original owner task,
  current scope, artifact state, gates, evidence, unresolved owner decisions,
  and next action.

## Current Understanding

The previous work is closed and archived at:

`maestro/artifact/archive/2026-05-01-human-agent-symbiosis/`

This is a new active workstream. It should not reopen the archived artifact.

The highest-risk topic is context continuity, because not every task creates a
`work.md`. A continuity policy cannot rely only on persisted artifacts. It must
cover both:

- tiny current-chat work where no artifact exists;
- T1+ work where `work.md` should become the continuity anchor.

## Proposed Topic Order

1. Context compaction continuity policy.
2. Lightweight semantic restructuring strategy for `decisions-log.md`.
3. Lazy-read policy for helper agents.
4. Semantic audit of Maestro contracts and templates.
5. Mechanical implementation of the accepted `decisions-log.md` split plan.
6. Follow-up contract/template improvements from the semantic audit.
7. Final consistency review and closeout.

## Scope

In scope for planning:

- define what problem each topic solves;
- decide which topic should be implemented first;
- identify source-of-truth surfaces that would need updates;
- avoid duplicating policy across AGENTS, memory, runtime docs, skills, and
  artifacts.

Out of scope unless explicitly approved by slice:

- editing runtime docs, skills, memory, contracts, or templates;
- splitting `decisions-log.md`;
- adding or removing agents;
- product code changes;
- commits, release, deploy, or PR publishing.

## Open Questions

- Should context continuity be implemented first, before decisions-log
  restructuring?
  - Draft answer: yes. It protects the active owner task before optimizing
    retrieval.
- What is the minimum policy for T0 current-chat work after compaction when no
  artifact exists?
  - Draft answer: reconstruct from thread summary and latest owner message,
    reread memory baseline for repository/product work, and ask a focused
    question if scope or next action is unclear.
- When should Maestro promote T0 work to T1 and create `work.md` purely to
  protect continuity?
  - Draft answer: when the work becomes multi-turn, decision-heavy, risky,
    delegated, evidence-heavy, or likely to continue after compaction.
- Should `decisions-log.md` become an index plus topic files, or stay as a
  single compact file with stricter pruning?
- Which helper agents actually suffer from hot-path context bloat today?
- Do current contracts/templates create real ceremony, or only preserve optional
  structure for persisted work?
- What evidence would justify hiring a new specialist agent?

## Current Constraints

- Keep process light.
- Do not create artifacts for tiny work unless continuity, risk, or owner value
  justifies it.
- Do not duplicate Maestro policy in lane AGENTS files.
- Do not add new memory files or runtime rules until a specific implementation
  slice is accepted.
- Agent hiring criteria review is cancelled for this workstream unless the
  owner reopens it.
- Preserve the human-agent symbiosis model: owner owns strategy and final
  product direction; Maestro owns engineering execution, evidence, and
  continuity.

## Continuity Snapshot

- Latest owner instruction: proceed with Slice 7 final consistency review.
- Current phase: `completed`
- Artifact path:
  `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/`
- Gates / approvals: Slices 1, 2, 3, 4, 5, 6, and 7 approved by owner
  instruction; no high-risk gate.
- Evidence status: Slices 1 through 7 checks passed; see
  `evidence.md`.
- Unresolved owner decisions:
  - none for current planning.
- Next allowed action: stage and commit the completed work when the owner is
  ready.

## Artifacts

- `context-continuity-policy.md`: draft continuity policy for T0 and T1+ work
  after automatic context compaction, resume, or long multi-turn drift.
- `open-questions-prep.md`: planning preparation across context continuity,
  T0/T1 promotion, decisions-log restructuring, lazy-read helpers,
  contracts/templates audit, and the now-cancelled agent-hiring question.
- `implementation-plan.md`: sliced implementation plan for context continuity,
  helper lazy-read, contracts/templates audit, decisions-log restructure plan,
  decisions-log implementation, contracts/templates follow-up, and final
  consistency review.
- `contracts-templates-semantic-audit.md`: Slice 3 audit of Maestro contracts,
  templates, and related `.codex/contracts` semantics.
- `decisions-log-restructure-plan.md`: Slice 4 plan for making
  `decisions-log.md` a lightweight index with topic files.
- `evidence.md`: compact evidence for completed slices.
- `closeout.md`: final result, evidence, skipped checks, residual risks, and
  next step.

## Next Action

Stage and commit this completed work when the owner is ready.
