---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: stage_contract
lang: en
---

# Maestro vNext Stage Contract

## Purpose

This document defines the standard stages Maestro may use after selecting a
route tier.

Stages are optional building blocks. Maestro should select only the stages that
improve correctness, evidence, approval safety, or handoff quality.

## Stage Rules

- Do not create a stage just for ceremony.
- A stage attempt is append-only.
- A stage agent may recommend the next stage but does not advance lifecycle.
- Stage transitions happen through Maestro API or `maestroctl`.
- High-risk stages must not begin until required approvals are present.
- A stage can be skipped only when its evidence value is not needed for the
  selected route tier.

## Stage Summary

| Stage | Purpose | Typical Agent | Required By Default |
|---|---|---|---|
| `planning` | Shape scope, route, task packets, and decomposition | Maestro | Tier 3+ |
| `research` | Find code path, facts, dependencies, risks | Charlie | When unknowns matter |
| `brief_audit` | Audit brief, decomposition, gates, and acceptance | Grant | Tier 4 / high-risk |
| `implementation` | Apply scoped changes | Mason | Any code/docs change |
| `verification` | Run checks and gather proof | Scout or Mason | When evidence matters |
| `review` | Independent read-only review of diff/evidence | Lens | Risky or non-trivial work |
| `release` | Deployment, workflow dispatch, release, rollback notes | Release | Release work only |
| `closeout` | Summarize result, evidence, risks, next action | Scribe or Maestro | Persisted work |
| `memory_audit` | Validate docs and `ai-memory` updates | Archivist | Memory/docs impact |

## Stage: `planning`

Purpose:

- classify route tier;
- select `artifact_shape`;
- define task/feature breakdown;
- identify approvals, evidence, and agent needs.

Allowed route tiers:

- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Maestro.

Input artifacts:

- owner request;
- optional prior work artifacts;
- relevant repository docs.

Output artifacts:

- orchestration plan;
- `task.md` for persisted work;
- `brief.md` when feature/module/high-risk work needs approval;
- `packet.md` only when a launch packet is useful.

Required evidence:

- none by default;
- cite observed constraints when the plan depends on repository facts.

Allowed next stages:

- `research`
- `brief_audit`
- `implementation`
- `verification`
- `closeout`

Failure behavior:

- return to owner with one focused clarification question when route-critical
  information is missing;
- mark work blocked only when safe routing is impossible.

## Stage: `research`

Purpose:

- find real code paths;
- identify dependencies, risks, contracts, and likely touched files;
- separate observed facts from inference.

Allowed route tiers:

- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Charlie.

Input artifacts:

- `task.md` or `brief.md`;
- target feature packet when present.

Output artifacts:

- attempt `README.md`;
- `handoff.json`;
- evidence references.

Required evidence:

- file paths, symbols, docs, contracts, or commands read;
- risks and unknowns.

Allowed next stages:

- `planning`
- `brief_audit`
- `implementation`
- `closeout`

Failure behavior:

- return `blocked` when source-of-truth conflict prevents safe planning;
- recommend clarification when the owner decision is missing.

## Stage: `brief_audit`

Purpose:

- challenge work brief, decomposition, dependencies, approvals, risks, and
  acceptance before execution.

Allowed route tiers:

- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Grant.

Input artifacts:

- `brief.md`;
- relevant `task.md` or feature packet when present.

Output artifacts:

- review note block;
- stage attempt report only when the audit is run as a formal stage.

Required evidence:

- specific ambiguity, contradiction, missing dependency, unsupported assumption,
  or acceptance weakness.

Allowed next stages:

- `planning`
- `implementation`
- `closeout`

Approval gates:

- owner approval is required after a `revise` or `blocked` audit result before
  execution can begin.

Failure behavior:

- return `revise` when the plan is fixable;
- return `blocked` when execution would be unsafe.

## Stage: `implementation`

Purpose:

- apply scoped product, docs, test, or artifact changes.

Allowed route tiers:

- `direct`
- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Maestro only for tiny direct work;
- Mason for scoped implementation work.

Input artifacts:

- `task.md`;
- `packet.md` when launched as an agent/stage;
- relevant prior research handoff.

Output artifacts:

- changed files;
- attempt `README.md` and `handoff.json` when staged;
- evidence references for commands run during implementation.

Required evidence:

- changed file list;
- commands run and result;
- unresolved risks.

Allowed next stages:

- `verification`
- `review`
- `closeout`

Approval gates:

- high-risk implementation approval must be present before high-risk work
  begins.

Failure behavior:

- return `blocked` when implementation cannot proceed without owner or research
  input;
- return `failed` when checks prevent a useful handoff.

## Stage: `verification`

Purpose:

- prove the result with checks, tests, CI, browser, Storybook, visual review,
  migration checks, or security checks.

Allowed route tiers:

- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Scout;
- Mason when verification is simple and coupled to implementation.

Input artifacts:

- `task.md`;
- implementation handoff;
- evidence expectations.

Output artifacts:

- attempt `README.md`;
- `handoff.json`;
- evidence files or links.

Required evidence:

- commands run and result;
- browser or visual notes when UI is visible;
- CI links when CI is part of the gate;
- migration/security notes when relevant.

Allowed next stages:

- `review`
- `implementation`
- `closeout`

Failure behavior:

- return `failed` when checks fail;
- return `blocked` when environment or missing approval prevents verification;
- recommend `implementation` when fixes are needed.

## Stage: `review`

Purpose:

- independently review diff, evidence, acceptance, security, tenant/auth risk,
  and scope drift.

Allowed route tiers:

- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Lens.

Input artifacts:

- `task.md`;
- changed file list;
- implementation and verification handoffs;
- evidence references.

Output artifacts:

- review findings;
- accept/revise/block recommendation;
- attempt report when review is staged.

Required evidence:

- concrete file/symbol references for findings;
- missing test or evidence notes.

Allowed next stages:

- `implementation`
- `verification`
- `release`
- `closeout`

Failure behavior:

- return `revise` for actionable defects;
- return `blocked` for unsafe or unreviewable changes.

## Stage: `release`

Purpose:

- perform or prepare production-impacting release actions, workflow dispatch,
  deployment, release notes, or rollback notes.

Allowed route tiers:

- `high_risk`
- `module_sized_work` only when release is explicitly in scope.

Allowed agents:

- Release.

Input artifacts:

- approved work/task;
- verification and review evidence;
- release approval.

Output artifacts:

- release notes;
- deployment or workflow links;
- rollback notes;
- evidence references.

Required evidence:

- release approval;
- target environment;
- command/workflow result;
- rollback path.

Allowed next stages:

- `verification`
- `closeout`

Approval gates:

- release approval is required before production-impacting action.

Failure behavior:

- return `blocked` when approval or environment is missing;
- return `failed` when release action fails.

## Stage: `closeout`

Purpose:

- record final result, evidence, approvals, checks, memory/docs impact, residual
  risks, and next action.

Allowed route tiers:

- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Scribe;
- Maestro for simple work.

Input artifacts:

- task/work state;
- stage handoffs;
- evidence;
- approvals;
- changed file list.

Output artifacts:

- `closeout.md`;
- optional final evidence index.

Required evidence:

- summary of checks;
- approval summary when approvals existed;
- residual risks or explicit none.

Allowed next stages:

- `memory_audit`
- none.

Failure behavior:

- return `blocked` when required evidence or approval records are missing.

## Stage: `memory_audit`

Purpose:

- validate docs and `ai-memory` consistency after meaningful docs/memory or
  source-of-truth changes.

Allowed route tiers:

- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed agents:

- Archivist.

Input artifacts:

- closeout summary;
- changed docs/memory files;
- proposed memory deltas.

Output artifacts:

- audit findings;
- recommended memory/doc updates;
- optional applied docs/memory patch when owner asked for patching.

Required evidence:

- docs/memory checks run;
- drift findings or explicit no findings.

Allowed next stages:

- `closeout`;
- none.

Failure behavior:

- report findings first;
- patch only when owner asked for patching.

## Stage Handoff Contract

Every staged attempt should return:

- result: `complete`, `blocked`, `failed`, or `cancelled`;
- summary;
- files changed;
- commands run;
- evidence refs;
- risks;
- recommended next stage.

The machine-readable handoff must follow:

- `maestro/contracts/stage-handoff.schema.json`

## Stage Review Decisions

Allowed review decisions:

- `accept`
- `revise`
- `block`
- `cancel`

Rules:

- `accept` may set a next stage or complete the stage chain.
- `revise` routes back to the stage that needs correction.
- `block` requires a blocker reason and next owner/system action.
- `cancel` ends the stage chain without success.
