---
doc_status: current
doc_scope: working_set
doc_type: acceptance_suite
canonical_for: maestro_pre_launch_acceptance_suite
---

# Maestro Pre-Launch Acceptance Suite

This document defines the live acceptance suite for proving that `Maestro` is reference-ready up to sequential feature start.

The suite is intentionally behavioral.
It validates live orchestration outcomes, not just prose quality.

## 1. Acceptance Rules

Every scenario must obey these rules:

- do not edit `status.json` by hand
- do not create artifact files outside the canonical model
- persisted artifacts stay in English
- feature execution remains sequential
- evidence must come from real artifact files and real final state, not from intention alone

## 2. Evidence Format

For each scenario, capture:

- `scenario_id`
- owner request
- target module
- expected stop point
- evidence paths
- verdict: `PASS` or `FAIL`
- concise notes on any drift

Minimum evidence paths:

- `artifacts/<module>/brief.md`
- `artifacts/<module>/status.json`
- any relevant `features/<feature>/README.md`
- any relevant `features/<feature>/status.json`
- any relevant stage attempt files when execution has started

## 3. Canonical Scenarios

### A1. Create Discuss Run

Goal:

- prove that a new `discuss` request creates the module cleanly and stops in `discussion`

Expected:

- module root exists
- `brief.md` exists
- `status.json.phase = discussion`
- no features exist
- no downstream stage folder exists
- no automatic brief approval happens

### A2. Continue Existing Discussion Run

Goal:

- prove that `continue` reads current state and refines the existing run rather than recreating it

Expected:

- existing `brief.md` is updated in place when needed
- no duplicate module is created
- no accidental lifecycle transition occurs
- final state still matches the requested stop point

### A3. Optional Grant Review

Goal:

- prove that `Grant` runs only as an optional helper and does not mutate lifecycle

Expected:

- `brief_auditor / Grant` is invoked only when requested or explicitly agreed
- `status.json` lifecycle does not change
- `brief.md` remains the only module-level document
- `## Reviewer Notes` gets a clearly marked `Grant` block
- no extra files are created

### A4. Approve Brief

Goal:

- prove that `approve brief` works as one owner-facing compound intent

Expected:

- module ends in `brief_frozen`
- `owner_approvals.brief = true`
- `brief.frozen = true`
- no feature is seeded yet
- no extra brief-side document is created

### A5. Seed Features In Order

Goal:

- prove that `seed features` materializes all approved features in the brief order

Expected:

- every approved feature gets a root folder
- every seeded feature has `status.json`
- every seeded feature has `README.md`
- `module.status.json.features` preserves the approved order from `brief.md`
- seeded features stay in `seeded`

### A6. Approve Execution

Goal:

- prove that execution approval grants permission without silently launching work

Expected:

- execution approval is recorded
- no feature is in `stage_in_progress`
- no stage attempt folder exists yet
- later lifecycle transitions still require explicit owner intent

### A7. Start First Feature

Goal:

- prove that the first feature launch is sequential and dependency-aware

Expected:

- only the first launchable ordered feature is armed and started
- that feature moves into `stage_in_progress`
- its first attempt folder exists
- later features remain idle

### A8. Start Next Feature

Goal:

- prove that `start next feature` respects order and dependency gates

Expected:

- the next feature starts only after the earlier feature reached the required accepted boundary
- no ordered feature is skipped
- no dependency is violated

### A9. Multiple Explicit Intents In One Continue Request

Goal:

- prove that `continue` can execute multiple explicitly requested owner intents in semantic order without silently running beyond them

Example:

- `approve brief and seed features`

Expected:

- the requested intents execute in order
- the run stops after the last explicitly requested boundary
- no unrequested `approve execution` or feature launch happens

## 4. Pass Criteria

The suite passes when:

- every scenario above has real evidence
- final artifact state matches the expected stop point
- no scenario requires manual JSON repair
- no scenario introduces non-canonical files
- ordering and sequential-launch rules hold across all multi-feature runs

## 5. Failure Classification

Use these categories when a scenario fails:

- `state_drift`: final `status.json` contradicts the reported stop point
- `artifact_drift`: non-canonical files are created or required files are missing
- `ordering_drift`: `features[]` order or launch order contradicts the approved brief
- `prompt_drift`: Maestro acts beyond the requested owner intent
- `review_drift`: `Grant` or later review behavior violates read/write or lifecycle boundaries

## 6. Recommended First Live Run Set

Use this minimum order when running the suite manually:

1. A1 Create Discuss Run
2. A2 Continue Existing Discussion Run
3. A3 Optional Grant Review
4. A4 Approve Brief
5. A5 Seed Features In Order
6. A6 Approve Execution
7. A7 Start First Feature
8. A8 Start Next Feature
9. A9 Multiple Explicit Intents In One Continue Request
