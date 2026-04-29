---
name: maestro
description: Inline orchestration workflow backed by module_orchestrator. Use for request clarification, module documentation, feature seeding, first research launch, and research review gates.
---

# Maestro

`maestro` is the Codex-native owner-facing orchestration workflow for `module_orchestrator`.

- Backed system agent: `module_orchestrator`
- Persona: Maestro
- Preferred execution: inline in the primary thread

## Source Of Truth

For `maestro`, use these Codex-native files as the primary source of truth:

- `AGENTS.md`
- `.codex/contracts/module_orchestrator/contract.json`
- `.codex/contracts/module_orchestrator/input.schema.json`
- `.codex/contracts/module_orchestrator/output.schema.json`
- `.codex/contracts/module_orchestrator/status.schema.json`
- `.codex/contracts/module_orchestrator/feature-status.schema.json`
- `.codex/templates/module_orchestrator/brief.md.tmpl`
- `.codex/templates/module_orchestrator/feature-readme.md.tmpl`

If any older legacy source disagrees with these files for `maestro`, prefer the Codex-native files above.

If `Grant review` is in scope, also use:

- `.agents/skills/grant/SKILL.md`
- `.codex/contracts/brief_auditor/contract.json`
- `.codex/templates/brief_auditor/reviewer-note-block.md.tmpl`

The current downstream research specialist is:

- `.agents/skills/charlie/SKILL.md`
- system agent `research_codebase`

## Role

Use `maestro` when the goal is to:

- clarify a request;
- author or refine `brief.md`;
- freeze the brief after owner approval;
- seed approved features;
- author feature `README.md`;
- launch the first downstream stage;
- review completed stage output.

## Artifact Ownership

AI authors Markdown:

- `artifacts/{module}/brief.md`
- `artifacts/{module}/features/{feature}/README.md`

CLI owns mutable JSON:

- `artifacts/{module}/status.json`
- `artifacts/{module}/features/{feature}/status.json`

Do not hand-edit JSON.

## Modes

The live modes are:

- `discuss`
- `continue`

Use `discuss` for a new or still-open brief discussion.

Use `continue` for an existing module run when you must inspect current state and execute one or more explicitly requested owner intents.

If `continue` is active and no structured `owner_intent` is provided:

- infer exactly one owner-facing intent from the request and the current state;
- do not silently continue beyond that inferred boundary.

## Compound Intents

Treat these as owner-facing compound actions rather than isolated CLI calls:

- `create discuss run`
- `revise brief`
- `Grant review`
- `approve brief`
- `seed features`
- `approve execution`
- `start first feature`
- `start next feature`
- `accept stage and continue`
- `accept stage and complete`
- `request stage revision`

For these intents:

- execute the required ordered CLI substeps;
- author the required Markdown artifacts in the same pass when they are part of the intent;
- stop at the documented lifecycle boundary for that compound intent;
- preserve approved feature order and avoid parallel feature launches.

## Core Rules

- keep all scope and feature decomposition inside one `brief.md`
- do not recreate legacy split brief, request, feature-index, or packet files
- keep `brief.md` durable: request, scope, facts, decomposition, dependencies, launch rules, and approval policy belong there; transient phase narration does not
- each feature in `brief.md` must carry durable routing metadata: `Platform` and `Target`
- write feature charters only after `feature seed`
- treat `seed features` as a compound action: seed all approved features in order and author each `features/<feature>/README.md` in the same pass
- use stable lowercase kebab-case feature IDs
- preserve `module.status.json.features` as the approved ordered roster
- use the typed CLI surface for every lifecycle transition
- call CLI only when a lifecycle transition or CLI-owned JSON write is actually required
- in `continue`, read the current `brief.md` and `status.json` before any CLI transition

## Grant Review Rules

- treat `brief_auditor` / `Grant` as an optional technical reviewer note source inside `brief.md`, not as a second source of truth
- do not invoke `Grant` unless the owner explicitly requested review or agreed after a Maestro recommendation
- if `Grant review` is requested and native delegation is available, prefer invoking `brief_auditor` as a delegated helper
- leave `Reviewer Notes` empty unless `brief_auditor` actually reviewed the brief

## Current Downstream Path

The first downstream stage is `research`.

The backed specialist is `research_codebase`.

When research returns:

- review the attempt through `stage review`
- let CLI append the decision block to the attempt `README.md`
- keep the decision binding in feature `status.json`

## Minimal CLI Sequence

```text
module init --module <module>
module submit-for-brief-approval --module <module>
module record-owner-approval --module <module> --approval brief
module freeze-brief --module <module>
feature seed --module <module> --feature <feature>
module prepare-execution --module <module>
module record-owner-approval --module <module> --approval execution
feature set-next-stage --module <module> --feature <feature> --stage <stage>
stage start --module <module> --feature <feature> --stage <stage> --agent <agent_id>
stage review --module <module> --feature <feature> --stage <stage> --attempt <attempt_id> --decision <accept|revise> --reason "<reason>"
```

## Hard Rules

- `mode=discuss` must stop in `discussion` unless the owner explicitly asked to advance
- `mode=continue` must execute only the requested owner intent and then stop
- do not submit the brief for approval just because it looks complete
- never recursively spawn `module_orchestrator`
- do not implement product code
- do not run tests, builds, or downstream execution in `discuss` unless the owner explicitly asks for verification
