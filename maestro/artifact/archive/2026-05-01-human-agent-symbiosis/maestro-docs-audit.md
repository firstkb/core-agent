# Maestro Docs Audit

- Status: `draft`
- Scope: quality and drift audit of `maestro/docs/`
- Date: 2026-05-01

## Executive Assessment

`maestro/docs/` is useful, but it has grown from a vNext pilot design surface
into a mixed set of canonical contract, rationale docs, internal mechanics, and
completed migration notes.

The folder should not be deleted wholesale. The core ideas are sound:

- native-first Maestro;
- adaptive loop, not fixed chains;
- owner-facing solution architect;
- bounded specialists;
- flat artifacts;
- evidence-first closeout;
- real approval gates;
- durable memory as retrieval, not source of truth.

The problem is drift and duplication. Several docs still speak in older
"orchestration / stage chain / Browser Use is preferred" language. A few docs
repeat the same rules in slightly different ways, which makes future updates
expensive and increases contradiction risk.

Practical rating:

- Conceptual quality: `8/10`
- Current consistency: `6/10`
- Context efficiency: `6/10`
- Runtime usefulness after cleanup: `8.5/10`

## Inventory

Current files:

| File | Lines | Current Role |
|---|---:|---|
| `runtime-contract.md` | 335 | compact canonical runtime contract |
| `operating-charter.md` | 230 | engineering charter / decision priorities |
| `maestro-character.md` | 261 | owner-facing behavior and voice |
| `native-first-maestro.md` | 124 | rationale / native-first overview |
| `adaptive-loop-contract.md` | 297 | detailed adaptive loop |
| `orchestration-contract.md` | 254 | internal coordination mechanics |
| `routing-tier-contract.md` | 371 | route tier details |
| `stage-contract.md` | 160 | stage names and handoff semantics |
| `agent-roles.md` | 100 | role summary and system-agent mapping |
| `agent-contracts.md` | 434 | detailed specialist role contracts |
| `agent-sequences.md` | 148 | optional execution recipes |
| `security-permissions-contract.md` | 150 | approval/security/path-scope rules |
| `artifact-model.md` | 102 | artifact philosophy and shapes |
| `artifact-file-contract.md` | 155 | artifact file semantics |
| `acceptance-suite.md` | 87 | behavioral acceptance scenarios |
| `memory-migration-plan.md` | 118 | completed migration record |
| `README.md` | 44 | docs index |

## What Works Well

- `runtime-contract.md` is the right canonical entrypoint and is compact enough
  to remain the primary runtime doc.
- `operating-charter.md` and `maestro-character.md` separate engineering
  posture from owner-facing voice. This is useful and should remain.
- `adaptive-loop-contract.md` strongly reinforces the important idea: Maestro
  chooses the next useful move, not a fixed role chain.
- `artifact-model.md` is good. It explains the flat artifact model without
  excessive mechanics.
- `stage-contract.md` is useful as a vocabulary reference for machine-readable
  packets and handoffs.
- `agent-roles.md` has the clearest current nine-role matrix and should be kept
  as the fast role map.
- `security-permissions-contract.md` is useful because approval/security rules
  should not be hidden inside general orchestration docs.
- `acceptance-suite.md` is a useful lightweight regression checklist for
  runtime behavior.

## Main Problems

### 1. `auditor` legacy naming drift

`runtime-contract.md` and `agent-roles.md` still mention legacy `auditor`.
Current active naming is `brief_auditor` for the legacy audit agent. This drift
was already identified earlier and should be fixed anywhere it appears.

Affected docs:

- `runtime-contract.md`
- `agent-roles.md`

### 2. FE visual evidence policy is stale

Several docs still say Maestro should personally use Browser Use when available
or that Browser Use is the preferred rendered-state verification tool.

This must be aligned with the accepted planning direction:

- Browser Use = default structured in-Codex browser smoke/evidence surface.
- Computer Use + external Chrome = final desktop visual/UX acceptance when Codex
  width may bias judgment or a real desktop/browser/app surface matters.
- Build Web Apps = must consider for visible frontend work, but use selectively.
- Maestro owns UI/UX judgment; Scout verifies and supplements, but does not own
  final product feel.

Affected docs:

- `runtime-contract.md`
- `operating-charter.md`
- `maestro-character.md`
- `native-first-maestro.md`
- `adaptive-loop-contract.md`
- `agent-sequences.md`
- `agent-contracts.md`
- `acceptance-suite.md`

### 3. `orchestration-contract.md` conflicts with the current philosophy

The file repeatedly says it is internal mechanics and not automatic chains,
which is good. But its name and some content pull Maestro back toward classical
orchestration language.

The strongest conflict is the owner-facing output section: it says Maestro
should report route tier, selected stages, selected agents, artifact targets,
and approvals at intake. That contradicts the current Quiet Decision Frame
approach where those details stay internal unless they affect product, risk,
timing, or evidence.

Recommendation: do not keep this as a hot supporting doc in its current form.
Either:

- rename/replace it with `internal-coordination-contract.md` and remove
  owner-facing mechanics; or
- fold the useful parts into `runtime-contract.md`,
  `adaptive-loop-contract.md`, and `routing-tier-contract.md`, then retire the
  old file.

### 4. Too much duplication across loop/routing/stage/sequence docs

The same concepts are repeated in:

- `runtime-contract.md`
- `adaptive-loop-contract.md`
- `orchestration-contract.md`
- `routing-tier-contract.md`
- `stage-contract.md`
- `agent-sequences.md`

Duplication is not fatal, but it causes drift. For example, each place has its
own version of UI checks, agent sequence posture, artifact use, and owner-facing
output.

Recommendation: keep `runtime-contract.md` canonical, then keep only the
smallest useful supporting docs:

- `adaptive-loop-contract.md` for loop behavior;
- `routing-tier-contract.md` for tier thresholds;
- `stage-contract.md` for stage vocabulary;
- retire or heavily compress `agent-sequences.md` and
  `orchestration-contract.md`.

### 5. Assigned-work reassignment is too strict for pre-persistence work

`runtime-contract.md` and `agent-contracts.md` currently require owner approval
before Maestro can execute work assigned to another role.

The owner clarified that Maestro may call internal or outsourced specialists
when useful, and early executor choice should not create bureaucracy.

Recommended rule:

- If no durable packet/assignment exists and owner did not explicitly approve a
  named executor, Maestro may keep work inline or choose the actual executor and
  record it accurately.
- Owner approval is required only after a persisted assignment, explicit
  owner-named executor, approval gate, or high-risk scope exists.

Affected docs:

- `runtime-contract.md`
- `agent-contracts.md`
- `acceptance-suite.md`

### 6. `native-first-maestro.md` has stale "Next Transition" language

The file still says the next active work is a small native Maestro environment
and an accepted transition plan for memory migration. That transition has
already happened.

Recommendation: convert it into a short rationale doc or merge its useful
native-first guardrails into `operating-charter.md`, then mark it as supporting
rationale. It should not talk about "next transition" as if it is still future.

### 7. `memory-migration-plan.md` is completed historical material

This file already has `doc_status: historical_record`, which is correct. It
does not belong in the normal support-doc hot path.

Recommendation:

- keep it for provenance, or move to a future `maestro/docs/archive/` if we
  introduce an archive folder;
- update `README.md` so it is clearly listed as historical/provenance, not a
  supporting model doc.

### 8. `agent-sequences.md` is risky because recipes can become fake chains

The file says recipes are not automatic chains, but its table still makes paths
look like standard sequences. This conflicts with the "no classical
orchestration" philosophy.

Recommendation:

- retire it if `adaptive-loop-contract.md` and `routing-tier-contract.md` cover
  enough;
- or rename it to `agent-selection-thresholds.md` and replace recipes with the
  lightweight threshold matrix accepted in this artifact set.

### 9. Artifact docs can be simplified

`artifact-model.md` and `artifact-file-contract.md` are both useful, but they
overlap.

Recommendation:

- keep `artifact-model.md` as the short human model;
- keep `artifact-file-contract.md` only if machine-readable artifact semantics
  need a separate reference;
- otherwise merge into one `artifact-contract.md`.

### 10. Product/operations boundary needs the newer owner/Maestro split

Several docs say "owner thinks product, Maestro thinks operations." This is
directionally useful, but too narrow after the current owner clarification.

Recommended wording:

- Owner owns product strategy, taste, priorities, and final product direction.
- Maestro owns engineering path, product-quality analysis, UI/UX evidence,
  code quality, agents/tools, checks, and safe execution.
- Maestro returns to owner for material UX/product decisions, disputed product
  taste, scope changes, or strategic tradeoffs.

Affected docs:

- `runtime-contract.md`
- `operating-charter.md`
- `maestro-character.md`
- `native-first-maestro.md`

## File-By-File Recommendation

| File | Recommendation | Why |
|---|---|---|
| `runtime-contract.md` | Keep, update | Canonical. Needs FE policy, legacy `brief_auditor`, reassignment rule, responsibility split, maybe lazy-read wording. |
| `operating-charter.md` | Keep, update | Good philosophy. Needs FE policy, responsibility split, and provenance link. |
| `maestro-character.md` | Keep, update | Useful character file. Needs provenance note, FE policy, less T-level owner-facing wording. |
| `adaptive-loop-contract.md` | Keep, update/compress | Strong loop doc. Needs FE policy and agent-threshold language. |
| `routing-tier-contract.md` | Keep, update | Useful thresholds. Needs current agent selection thresholds and less ceremony wording. |
| `stage-contract.md` | Keep as reference | Useful stage vocabulary. Minor wording only. |
| `agent-roles.md` | Keep, update | Fast role map. Fix `auditor` -> `brief_auditor`; adjust Scout/Browser Use wording. |
| `agent-contracts.md` | Keep, update | Detailed agent boundaries. Needs reassignment rule, FE policy, Scout boundary, Mason debug/fix language. |
| `security-permissions-contract.md` | Keep, update lightly | Useful approval/path-scope doc. Adjust Browser column if FE policy changes. |
| `artifact-model.md` | Keep | Good compact model. |
| `artifact-file-contract.md` | Keep or merge later | Useful, but could merge with artifact model if we want fewer docs. |
| `acceptance-suite.md` | Keep, update | Useful behavioral regression list. Needs FE policy and reassignment rule updates. |
| `native-first-maestro.md` | Compress or merge | Good rationale, but has stale transition language and repeats other docs. |
| `orchestration-contract.md` | Retire/replace | Name and owner-facing output conflict with current philosophy. Useful parts belong elsewhere. |
| `agent-sequences.md` | Retire/replace | Recipes can look like chains. Better as agent-selection thresholds. |
| `memory-migration-plan.md` | Keep as historical or move to archive | Completed migration. Should not be in normal supporting model list. |
| `README.md` | Update | Should separate canonical, supporting, reference, historical/retired docs. |

## Recommended Target Shape

Preferred lean structure:

```text
maestro/docs/
  README.md
  runtime-contract.md
  operating-charter.md
  maestro-character.md
  adaptive-loop-contract.md
  routing-tier-contract.md
  agent-roles.md
  agent-contracts.md
  security-permissions-contract.md
  artifact-model.md
  artifact-file-contract.md
  stage-contract.md
  acceptance-suite.md
  archive/
    memory-migration-plan.md
    native-first-maestro.md
    orchestration-contract.md
    agent-sequences.md
```

Alternative if we do not want an archive folder yet:

- keep files in place;
- change `README.md` classification;
- mark `native-first-maestro.md`, `orchestration-contract.md`,
  `agent-sequences.md`, and `memory-migration-plan.md` as historical/supporting
  reference, not active hot model docs.

## Implementation Order

1. Update `README.md` classification first.
2. Update `runtime-contract.md` as the canonical source:
   - FE tool policy;
   - owner/Maestro responsibility split;
   - `brief_auditor`;
   - reassignment rule;
   - lazy-read schemas/templates if in scope.
3. Update `operating-charter.md` and `maestro-character.md` to match the new
   philosophy and provenance decision.
4. Update `agent-roles.md` and `agent-contracts.md` for role boundaries.
5. Update `adaptive-loop-contract.md`, `routing-tier-contract.md`, and
   `acceptance-suite.md`.
6. Decide whether to retire/replace `orchestration-contract.md` and
   `agent-sequences.md`.
7. Decide whether to move completed historical docs into `maestro/docs/archive/`.
8. Run docs/memory checks and update `maestro/memory` only for accepted durable
   decisions.

## Do Not Do

- Do not delete files before references are updated.
- Do not make the folder larger by adding more contract docs unless one replaces
  or compresses existing docs.
- Do not turn `agent-sequences.md` into a mandatory chain model.
- Do not reintroduce root `docs/`.
- Do not promote all planning-artifact language into runtime; promote only
  accepted compact rules.

## Conclusion

`maestro/docs/` should be tightened, not rebuilt. The highest-value cleanup is:

1. update `runtime-contract.md`;
2. align FE tooling/UI evidence language across all active docs;
3. fix `auditor` -> `brief_auditor`;
4. replace strict pre-persistence reassignment rules;
5. retire or replace `orchestration-contract.md` and `agent-sequences.md`;
6. move completed migration content out of the active support-doc path.
