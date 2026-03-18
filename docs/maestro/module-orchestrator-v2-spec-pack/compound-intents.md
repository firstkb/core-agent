---
doc_status: current
doc_scope: working_set
doc_type: workflow_contract
canonical_for: module_orchestrator_owner_intents
---

# Maestro Compound Intents

This document defines the owner-facing compound intents that Maestro should treat as one semantic action, even when multiple typed CLI transitions are required underneath.

The goal is to reduce ambiguity for the model:

- the owner expresses one intent;
- Maestro performs the required ordered substeps;
- the CLI still remains the only writer of mutable JSON state.

This document does not replace the typed CLI contract.
It sits above it as the orchestration contract for Maestro.

---

## 1. Design Rule

Maestro should reason in **compound intents**, not in isolated low-level CLI commands.

Therefore:

- one owner-facing request may expand into multiple CLI transitions;
- Maestro should not expose that internal fragmentation as separate semantic steps unless the owner asks for the low-level details;
- Maestro must still stop at the documented lifecycle boundary for each compound intent.
- if multiple features exist, Maestro should preserve the approved feature order and launch them sequentially rather than in parallel.
- if the owner explicitly requests multiple intents in one message, Maestro may execute those intents in semantic order but must still stop at the last explicitly requested boundary.

---

## 2. Current Compound Intents

## 2.1. `create discuss run`

Owner intent examples:

- `create discuss run`
- `start a new module run in discuss mode`
- `set up the module and draft the brief`

Preconditions:

- module does not already exist

Expansion:

1. `module init --module <module>`
2. Maestro authors `artifacts/<module>/brief.md`

Expected stop point:

- module remains in `discussion`
- no feature is seeded
- no downstream stage is launched

Notes:

- this intent does **not** include `module submit-for-brief-approval`

---

## 2.2. `revise brief`

Owner intent examples:

- `revise brief`
- `update the brief`
- `return the brief to discussion`

Preconditions:

- module already exists

Expansion:

If module is already in `discussion`:

1. Maestro updates `brief.md`

If module is in `awaiting_owner_brief_approval`:

1. `module return-to-discussion --module <module>`
2. Maestro updates `brief.md`

Expected stop point:

- module ends in `discussion`
- brief remains mutable

---

## 2.3. `approve brief`

Owner intent examples:

- `approve brief`
- `brief approved`
- `freeze the brief`

Preconditions:

- `brief.md` exists

Expansion:

If module is in `discussion`:

1. `module submit-for-brief-approval --module <module>`
2. `module record-owner-approval --module <module> --approval brief`
3. `module freeze-brief --module <module>`

If module is already in `awaiting_owner_brief_approval`:

1. `module record-owner-approval --module <module> --approval brief`
2. `module freeze-brief --module <module>`

Expected stop point:

- module ends in `brief_frozen`
- `owner_approvals.brief = true`
- `brief.frozen = true`
- no feature is seeded yet

Notes:

- this is the clearest example of why Maestro should think in compound intents rather than individual commands

---

## 2.4. `Grant review`

Owner intent examples:

- `review brief with Grant`
- `run Grant on this brief`
- `audit the brief before approval`

Preconditions:

- module already exists
- `brief.md` exists

Expansion:

1. invoke `brief_auditor / Grant`
2. receive review payload
3. insert the marked note block under `## Reviewer Notes` in `brief.md`

Expected stop point:

- module lifecycle does not change
- `brief.md` remains the only module-level working document

Notes:

- Grant is optional
- Grant does not approve the brief
- Grant does not write JSON or create extra files

---

## 2.5. `seed features`

Owner intent examples:

- `seed features`
- `create the approved features`
- `materialize the approved feature set`

Preconditions:

- module is in `brief_frozen`

Expansion:

For each approved feature in order:

1. choose the stable `feature_id`
2. `feature seed --module <module> --feature <feature>`
3. Maestro verifies `features/<feature>/status.json` exists
4. Maestro authors `features/<feature>/README.md`

Expected stop point:

- every approved feature root exists
- every seeded feature has `status.json`
- every seeded feature has `README.md`
- `module.status.json.features` preserves the approved order
- all seeded features remain in `seeded`

Notes:

- stopping after only raw CLI seeding is allowed only when the owner explicitly asked for `seed only` or `state only`
- this intent includes authoring feature `README.md` files in the same pass

---

## 2.6. `approve execution`

Owner intent examples:

- `approve execution`
- `execution approved`
- `allow downstream launch`

Preconditions:

- at least one feature exists
- every seeded feature required for launch has both `status.json` and `README.md`

Expansion:

If module is in `brief_frozen`:

1. `module prepare-execution --module <module>`
2. `module record-owner-approval --module <module> --approval execution`

If module is already in `awaiting_owner_execution_approval`:

1. `module record-owner-approval --module <module> --approval execution`

Expected stop point:

- execution is approved
- no feature is started yet

Notes:

- this is permission to begin execution later
- this is not automatic run-to-completion

---

## 2.7. `start first feature`

Owner intent examples:

- `start first feature`
- `start the first ordered feature`
- `launch the first approved feature`

Preconditions:

- module has execution approval
- the first ordered launchable feature exists

Expansion:

1. determine the first launchable feature in `module.status.json.features`
2. verify dependency preconditions are satisfied
3. `feature set-next-stage --module <module> --feature <feature> --stage research`
4. `stage start --module <module> --feature <feature> --stage research --agent research_codebase`

Expected stop point:

- the first ordered feature moves to `stage_in_progress`
- later features remain idle
- Maestro stops and the specialist stage agent takes over

Notes:

- do not start later features in parallel with an active feature
- do not skip ahead in the ordered roster

---

## 2.8. `start next feature`

Owner intent examples:

- `start next feature`
- `launch the next approved feature`
- `move on to the next feature`

Preconditions:

- an earlier feature already reached an allowed boundary
- the next ordered feature is launchable

Expansion:

1. find the next launchable feature after the previously active one
2. verify order and dependency conditions
3. `feature set-next-stage --module <module> --feature <feature> --stage research`
4. `stage start --module <module> --feature <feature> --stage research --agent research_codebase`

Expected stop point:

- the next ordered feature moves to `stage_in_progress`
- later features remain idle

Notes:

- do not skip ahead in the ordered roster

---

## 2.9. `accept stage and continue`

Owner intent examples:

- `accept research and continue`
- `accept this stage and move on`

Preconditions:

- a matching handoff exists
- feature is in `awaiting_review`

Expansion:

1. `stage review --module <module> --feature <feature> --stage <stage> --attempt <attempt_id> --decision accept --reason "<reason>" --next-stage <stage>`

Expected stop point:

- reviewed attempt gets the decision block appended to attempt `README.md`
- feature returns to `ready_for_stage`
- the next stage is armed, but not started automatically unless the owner explicitly asked for launch

---

## 2.10. `accept stage and complete`

Owner intent examples:

- `accept and complete feature`
- `this stage is final, complete the feature`

Preconditions:

- reviewed attempt is sufficient to finish feature work

Expansion:

1. `stage review --module <module> --feature <feature> --stage <stage> --attempt <attempt_id> --decision accept --reason "<reason>" --complete`

Expected stop point:

- feature ends in `done`

---

## 2.11. `request stage revision`

Owner intent examples:

- `revise research`
- `send this stage back`
- `the stage is incomplete`

Preconditions:

- a matching handoff exists
- feature is in `awaiting_review`

Expansion:

1. `stage review --module <module> --feature <feature> --stage <stage> --attempt <attempt_id> --decision revise --reason "<reason>"`

Expected stop point:

- feature returns to `ready_for_stage`
- the same stage is expected to run again on a new attempt later
- no new attempt is started automatically unless the owner explicitly asks for relaunch

---

## 3. Modeling Rules For Maestro

When an owner request matches one of these intents:

- treat it as one semantic operation;
- execute the required internal CLI sequence in order;
- author the required Markdown artifacts in the same pass when they are part of the intent;
- stop at the documented stop point;
- summarize the result in owner-facing terms, not as a raw list of internal CLI transitions.

Do not:

- expose low-level CLI fragmentation as if it were three separate owner decisions;
- stop in the middle of a compound intent unless the owner explicitly asked for a state-only step;
- silently advance into the next compound intent without explicit owner approval.

---

## 4. Implementation Direction

Current state:

- these compound intents are modeled at the prompt/orchestration layer;
- the underlying CLI remains typed and granular.

Future direction:

- the most common compound intents may later become first-class CLI convenience commands;
- the first candidates are:
  - `module approve-brief`
  - `feature seed-and-author`
  - `module approve-execution`

Until then, Maestro should emulate these as ordered internal workflows on top of the typed CLI surface.
