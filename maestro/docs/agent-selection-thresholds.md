---
doc_status: active
doc_scope: maestro_vnext
doc_type: agent_selection_thresholds
lang: en
---

# Agent Selection Thresholds

## Purpose

This document gives Maestro compact defaults for when to keep work inline and
when to use an internal specialist or outsourced capability.

These thresholds are not an execution chain. Maestro chooses the smallest useful
move for the current slice, then reconciles the result and evidence.

## Core Rule

Delegate when it improves correctness, speed, context isolation,
implementation focus, verification, review, or evidence. Keep work inline when
delegation adds ceremony, hides product judgment, or slows the next useful
action.

## Thresholds

| Situation | Default Move | Escalate Or Delegate When | Keep Inline When |
|---|---|---|---|
| Tiny obvious task | Maestro inline | It touches auth, tenant isolation, migrations, release, production config, or approval-gated scope | One low-risk file or direct answer; checks are trivial |
| Unknown code path or data flow | Charlie | Ownership, dependencies, API/data flow, or touched files are unclear; likely more than 3 connected files or more than 1 package/app boundary | Exact file, symbol, and blast radius are already known |
| Product or implementation plan has risk | Grant | Scope may be too broad; acceptance is unclear; auth, tenant, migration, backend writes, package boundaries, or approval gates are involved | Plan is small, reversible, and acceptance is obvious |
| Scoped implementation | Mason | Work is bounded by allowed paths and acceptance checks; separate implementation context improves focus or speed | Tiny direct fix, or Maestro must make tightly coupled product/UX judgments while editing |
| Verification evidence | Scout | Tests, builds, CI, security checks, migration dry runs, or independent verification materially reduce risk | A single targeted local check is enough and Maestro can run it directly |
| UI/UX and browser-visible quality | Maestro owns judgment; Browser Use for structured in-Codex browser evidence; Computer Use external Chrome when real desktop width or app context matters; Build Web Apps when frontend-heavy expertise helps | Visible product work, responsive desktop/mobile claims, interaction flows, frontend-heavy implementation, React/design quality concerns | Text-only or non-visible change |
| Diff or evidence review | Lens | High-risk diff, security/tenant/auth implications, incomplete evidence, or significant implementation | Low-risk small change with direct evidence |
| Durable closeout | Scribe | Persisted T2+ or T3/T4 work needs a compact closeout/evidence record | Tiny T0/T1 closeout fits in final response or `work.md` |
| Docs, memory, or source-of-truth drift | Archivist | Large docs/memory/runtime changes, source-of-truth consistency, AGENTS/Maestro/memory alignment | Ordinary product code change with no durable docs/memory impact |
| Release or deploy | Release | Release packaging, deploy, workflow dispatch, promotion, rollback notes after explicit owner approval | No release or production-impacting action is requested |

## Owner Decision Threshold

Return to the owner when the next step changes product strategy, business or
domain behavior, material UX direction, visible product taste, scope, high-risk
approval state, or final acceptance criteria.

Maestro may still recommend a path. The owner makes the final product decision.

