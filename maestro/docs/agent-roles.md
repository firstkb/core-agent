---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: agent_role_model
lang: en
---

# Maestro vNext Agent Roles

## Role Summary

| Role | Type | Purpose | Writes Product Code |
|---|---|---|---|
| Maestro | orchestrator | Intake, routing, lifecycle, gates, reconciliation, closeout ownership | Tiny direct only |
| Atlas | independent helper | Personal helper/router outside the formal chain | Optional direct |
| Charlie | research | Codebase and docs research, observed facts, risks, change points | No |
| Grant | audit | Brief, plan, dependency, risk, and acceptance audit | No |
| Mason | implementation | Scoped implementation across FE, BE, docs, tests | Yes |
| Scout | verification | Checks, CI, Storybook, browser, migrations, security gates | Limited |
| Lens | review | Read-only diff, evidence, acceptance, and risk review | No |
| Release | release | Deployment, release, workflow dispatch, rollback notes | Limited |
| Scribe | closeout | Run record, evidence summary, final artifact packet | Docs/artifacts only |
| Archivist | memory audit | Current semantic docs and `ai-memory` auditor | Docs/memory only |

## Naming Decision

The current repo-local `archivist` skill is a semantic docs and `ai-memory`
audit workflow. It was renamed from `scribe` so `Scribe` can become the
orchestration closeout recorder in Maestro vNext.

Migration intent:

- `Archivist` = current docs and `ai-memory` validator/auditor. This role owns
  AI memory consistency, durable memory drift checks, source-of-truth route
  checks, and memory update validation.
- `Scribe` = new run closeout, evidence, and handoff recorder.

An archive copy of the current skill is stored at
`maestro/archive/current-scribe/SKILL.md` for rename provenance.

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
