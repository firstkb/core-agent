---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: agent_role_model
lang: en
---

# Maestro vNext Agent Roles

## Role Summary

| Role | Type | Purpose | Writes Product Code |
|---|---|---|---|
| Maestro | orchestrator | Intake, routing, lifecycle, gates, reconciliation, closeout ownership | Tiny direct only |
| Charlie | research | Codebase and docs research, observed facts, risks, change points | No |
| Grant | audit | Brief, plan, dependency, risk, and acceptance audit | No |
| Mason | implementation | Scoped implementation across FE, BE, docs, tests | Yes |
| Scout | verification | Checks, CI, Storybook, browser, migrations, security gates | Limited |
| Lens | review | Read-only diff, evidence, acceptance, and risk review | No |
| Release | release | Deployment, release, workflow dispatch, rollback notes | Limited |
| Scribe | closeout | Run record, evidence summary, final artifact packet | Docs/artifacts only |
| Archivist | memory audit | Semantic docs and durable memory auditor | Docs/memory only |

## Naming Decision

The current repo-local `archivist` skill is a semantic docs and durable memory
audit workflow. It was renamed from `scribe` so `Scribe` can become the
orchestration closeout recorder in Maestro vNext.

Migration intent:

- `Archivist` = docs and durable memory validator/auditor. This role owns
  memory consistency, durable memory drift checks, source-of-truth route checks,
  and memory update validation.
- `Scribe` = new run closeout, evidence, and handoff recorder.

Rename provenance is available from git history when needed.

## Maestro

Responsibilities:

- classify owner requests;
- choose route tier and stage chain;
- decide whether state/artifacts are required;
- create task packets and launch prompts;
- assign specialist agents;
- enforce approvals and next allowed actions;
- reconcile specialist outputs;
- decide whether work is complete, needs revision, or is blocked.

Maestro must not:

- recursively spawn itself;
- hide lifecycle transitions;
- bypass approval gates;
- turn every small task into a formal work brief.

## Specialist Agents

Specialist agents receive bounded packets. Each packet must include:

- local goal;
- allowed scope;
- out-of-scope boundaries;
- required reads;
- required checks;
- evidence expectations;
- expected handoff shape.

Specialist agents may propose memory/docs changes, but Maestro decides whether
to route those changes to Scribe or Archivist.

## Conditional Release Role

Release is not part of the always-on core path. Use Release only when the owner
request includes deployment, production promotion, release packaging, rollback
planning, or release notes.

Release requires explicit approval before any production-impacting action.

## Runtime Availability Matrix

The active vNext skill and Codex system-agent mapping is:

| Role | Skill | Codex system agent | Status |
|---|---|---|---|
| Maestro | `.agents/skills/maestro/` | `maestro_vnext` | active pilot |
| Charlie | `.agents/skills/charlie/` | `research_charlie` | active pilot |
| Grant | `.agents/skills/grant/` | `audit_grant` | active pilot |
| Mason | `.agents/skills/mason/` | `implementation_mason` | active pilot |
| Scout | `.agents/skills/scout/` | `verification_scout` | active pilot |
| Lens | `.agents/skills/lens/` | `review_lens` | active pilot |
| Release | `.agents/skills/release/` | `release_manager` | gated; requires release approval |
| Scribe | `.agents/skills/scribe/` | `closeout_scribe` | active pilot |
| Archivist | `.agents/skills/archivist/` | `memory_archivist` | active pilot |

Legacy agents `module_orchestrator`, `research_codebase`, and `auditor`
remain available only for old `artifacts/<module>/...` continuation.
