# Final Order Plan

## Purpose

This plan consolidates the useful parts of the two external reports, Maestro's
verification, and the follow-up review of this plan itself. The goal is to
bring the agent/runtime/memory infrastructure to a clean, high-confidence
baseline without turning Maestro into a classical orchestration system.

The target philosophy stays unchanged:

- owner owns strategy, product direction, taste, priorities, and final product
  decisions;
- Maestro owns engineering path, UI/UX judgment, code quality, evidence,
  agent/tool selection, and fast safe execution;
- specialists are used only when they materially improve quality, speed,
  isolation, review, verification, or evidence;
- artifacts are a flight recorder, not a management UI;
- old runtime/artifact information must not live in active hot paths.

## Review Conclusions

The follow-up model reviews were useful. They do not require a rewrite of this
plan, but they do require tightening it before implementation.

Accepted changes:

- define "active hot paths" explicitly;
- split P0 into direct workflow contradictions and important active drift;
- move `approval` README mapping and release handoff naming out of P0;
- add expected final states for ambiguous tasks;
- split validator work into v1 and v2;
- move validator earlier in the implementation order;
- add per-slice definition of done;
- add a traceability table from finding to fix;
- add negative acceptance criteria;
- add owner approval boundaries;
- add a `maestro/AGENTS.md` migration rule so invariants are not lost;
- add validator fixture/test expectations;
- include previously under-covered issues: active nickname ambiguity checks,
  `openai.yaml` shape checks, evidence metadata strictness, legacy isolation,
  and current-state compaction trigger.

Not accepted as a hard rule:

- "Always run Charlie before Slice 1." Instead, create an exact edit-map step.
  Maestro may do this inline; Charlie is used only if line-level separation is
  non-obvious or independent research would reduce risk.

## Active Hot Paths

Active hot paths are files that can directly influence normal agent behavior,
routing, source-of-truth selection, or runtime safety. They must not carry stale
legacy runtime instructions.

Current active hot paths:

- `AGENTS.md`
- `platform/AGENTS.md`
- `platform/frontend/AGENTS.md`
- `platform/backend/AGENTS.md`
- `maestro/AGENTS.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `.codex/config.toml`
- registered `.codex/agents/*.toml`
- active `.codex/contracts/**`
- `.codex/standards/README.md`
- `.codex/standards/runtime/*.md` included by the standards read order
- `maestro/README.md`
- `maestro/docs/runtime-contract.md`
- `maestro/contracts/**`
- `maestro/templates/**`
- `maestro/memory/START_HERE.md`
- `maestro/memory/index/read-routes.yaml`
- `maestro/memory/index/memory-index.yaml` when route breadth is needed
- current active work artifacts under `maestro/artifact/active/<work-slug>/`

Allowed legacy/provenance surfaces are not active hot paths unless explicitly
selected for a legacy continuation or historical reconstruction.

## Final Source-Of-Truth Model

Use this hierarchy when conflicts appear.

### Top-Level Runtime

| Surface | Owns | Must Not Own |
|---|---|---|
| Root `AGENTS.md` | repo-wide source-of-truth map, active role registry, active vs legacy boundary, top-level read policy, completion checks, artifact model summary | detailed Maestro behavior, frontend/backend implementation details |
| `.codex/config.toml` | active and legacy system-agent registry, supported nicknames, config-file wiring | role behavior prose, product decisions, artifact lifecycle law |
| `.codex/standards/**` | reusable engineering/runtime standards | stale legacy lifecycle rules in active read order |

### Maestro Runtime

| Surface | Owns | Must Not Own |
|---|---|---|
| `maestro/docs/runtime-contract.md` | canonical Maestro runtime behavior: modes, tiers, artifacts, compaction, approvals, delegation, UI/UX ownership, plugin/tool policy | product-domain memory or lane implementation rules |
| `.agents/skills/<role>/SKILL.md` | hot invocation behavior for the role, minimal required reads, hard rules, role-specific stop conditions | long rationale, history, examples, duplicate full runtime manual |
| `.codex/agents/*.toml` | Codex system-agent bootstrap and role config | durable product decisions or artifact lifecycle law |
| `.codex/contracts/**` and `maestro/contracts/**` | machine-checkable input/output and lifecycle contracts | prose-only policy that can drift from schema |
| `maestro/templates/**` | human-readable artifact forms | lifecycle semantics not backed by docs/schema |
| `maestro/AGENTS.md` | local editing rules for files under `maestro/` | alternate mode semantics that conflict with `runtime-contract.md` |

### Product And Memory

| Surface | Owns | Must Not Own |
|---|---|---|
| `maestro/memory/**` | compact product/repo memory and retrieval routes | runtime law that overrides `.codex`, `.agents`, contracts, or canonical FE/BE docs |
| `platform/AGENTS.md` | platform-wide product-development invariants, cross-stack safety, memory-update expectations | Maestro routing mechanics, artifacts, browser/desktop policy, specialist selection |
| `platform/frontend/AGENTS.md` | frontend implementation rules, app/package boundaries, auth/transport constraints, commands, docs update triggers | final UI/UX acceptance, browser policy, agent delegation |
| `platform/backend/AGENTS.md` | backend implementation rules, runtime/module boundaries, auth/tenant/schema/migration constraints, commands, docs update triggers | release orchestration, agent routing, Maestro lifecycle |

## Owner Approval Boundaries

Owner approval is required before:

- deleting historical provenance rather than marking it legacy/superseded;
- changing the active role roster or hiring/removing a named specialist role;
- changing release approval semantics;
- changing the active artifact storage model;
- changing the Maestro vs owner decision boundary;
- moving the memory root or recreating old retired-runtime memory roots;
- making destructive cleanup outside already agreed docs/runtime edits.

## AGENTS.md Cleanup Policy

There are only five `AGENTS.md` files in the repo:

- `AGENTS.md`
- `platform/AGENTS.md`
- `platform/frontend/AGENTS.md`
- `platform/backend/AGENTS.md`
- `maestro/AGENTS.md`

All five are useful, but their responsibilities should be stricter.

### Keep

- Root `AGENTS.md`: keep as the top-level map and active role registry.
- `platform/AGENTS.md`: keep as platform product invariant layer.
- Frontend/backend `AGENTS.md`: keep as lane-local engineering rules.
- `maestro/AGENTS.md`: keep as local file-editing guidance for Maestro docs,
  contracts, templates, and artifacts.

### Remove Or Reduce Duplication

- Remove detailed Maestro tier/artifact mechanics from `platform/AGENTS.md`;
  replace with a reference to root `AGENTS.md` and
  `maestro/docs/runtime-contract.md`.
- Remove or shrink "Orchestration rule" blocks from frontend/backend lane
  files. Lanes can say when to involve Maestro, but should not define runtime
  behavior.
- Keep read order in lane files only for local implementation context. Do not
  repeat broad memory policy there.
- Keep frontend/backend command lists, implementation rules, and docs update
  triggers in lane files.
- Keep UI/UX final judgment and Browser/Computer/Build-Web-Apps policy out of
  frontend lane files. That stays with Maestro.
- Align `maestro/AGENTS.md` with the current planning mode: no product-code
  edits in planning, but lean artifact updates are allowed once T1+ work is
  understood.

### `maestro/AGENTS.md` Migration Rule

Do not delete useful invariants from `maestro/AGENTS.md` blindly.

Final state:

- local editing boundaries stay in `maestro/AGENTS.md`;
- canonical runtime behavior stays in `maestro/docs/runtime-contract.md`;
- detailed rationale/examples stay in supporting `maestro/docs/**`;
- duplicated mode, approval, artifact, and delegation semantics are reduced to
  references when already owned by `runtime-contract.md`;
- conflicting planning wording is corrected, not preserved.

### Done

- A reader can answer "who owns this rule?" without checking more than one
  layer.
- No lane `AGENTS.md` defines agent delegation, UI/UX acceptance,
  browser/desktop evidence policy, or artifact lifecycle.
- No active `AGENTS.md` points agents toward old `artifacts/<module>` as a
  normal path for new work.
- `maestro/AGENTS.md` has no planning wording that conflicts with
  `runtime-contract.md`.

## Legacy And Stale Information Policy

Do not delete history just because it is old. Do remove old runtime rules from
active decision-making surfaces.

### Allowed Historical References

Historical references may remain only in:

- explicitly legacy `.codex` agents/contracts;
- `maestro/memory/durable/legacy-memory-import.md`;
- `maestro/memory/durable/decisions/legacy-retirement-provenance.md`;
- archived artifacts;
- git history;
- short root-level compatibility notes that say "old only, not for new work".

### Not Allowed In Active Hot Paths

Active hot paths must not instruct agents to use:

- old `platform/docs/ai/**`;
- old `maestro/memory/runs/**`;
- old `maestro/memory/retired-runtime/**`;
- old `artifacts/<module>/...` for new Maestro work;
- CLI-owned `status.json` lifecycle for vNext work.

### Cleanup Rule

When old information must stay for provenance, it should be marked:

- `historical`;
- `superseded`;
- `legacy-only`;
- or "git-history only".

It should not be marked `active` unless it describes a current compatibility
surface that can still be intentionally used.

## Traceability

| Finding | Fix | Priority | Main Files |
|---|---|---:|---|
| Stale artifact governance promotes old lifecycle | Rewrite or legacy-mark standard and update standards read order | P0-A | `.codex/standards/runtime/artifact-governance.md`, `.codex/standards/README.md` |
| Unregistered foundation agents in active directory | Remove, move to explicit experimental/legacy, or fully register | P0-A | `.codex/agents/foundation-*.toml`, `.codex/config.toml` |
| Planning mode conflict | Align wording across Maestro hot-path docs | P0-A | `maestro/docs/maestro-character.md`, `maestro/AGENTS.md`, `.agents/skills/maestro/SKILL.md` |
| `intake` stage mismatch | Document as orchestration-only, or intentionally extend schemas | P0-A | `maestro/docs/stage-contract.md`, `maestro/contracts/*.json` |
| AGENTS responsibility overlap | Shrink platform/lane runtime mechanics | P1 | `platform/AGENTS.md`, lane `AGENTS.md`, `maestro/AGENTS.md` |
| Active-looking legacy memory | Mark old runtime paths historical/superseded and keep DEC-088 dominant | P1 | `decisions-log.md`, `decisions/*.md` |
| Approval mapping docs incomplete | Add missing direct approval types | P1 | `maestro/contracts/README.md`, `approval.schema.json` |
| Release handoff name inconsistent | Pick one release handoff filename and update docs/contracts/skill | P1 | `release_manager/contract.json`, release skill/docs |
| Template/schema asymmetry unclear | Align or document intentional mappings | P1 | `maestro/templates/**`, `maestro/contracts/**` |
| Drift can return | Add runtime validator v1/v2 with fixtures | P2 | `scripts/ai/**`, fixtures/tests |
| Prompt hot path can grow | Compact only after drift is fixed | P3 | `.agents/skills/**`, `maestro/docs/**` |

## Consolidated Remediation Backlog

### P0-A: Direct Workflow Contradictions

These can cause the agent to choose the wrong workflow or treat stale runtime
law as active.

- [x] Rewrite `.codex/standards/runtime/artifact-governance.md` for vNext or
  move the current text to a legacy-only standard.
  - Expected: active standards no longer instruct new work to use
    `artifacts/<module>`, CLI-owned lifecycle state, or `status.json`.
- [x] Update `.codex/standards/README.md` so active runtime read order no
  longer promotes stale artifact governance.
  - Expected: active read order points only to vNext-compatible runtime
    standards.
- [x] Resolve `.codex/agents/foundation-explorer.toml` and
  `.codex/agents/foundation-reviewer.toml`.
  - Expected: no unregistered active-looking agent files remain under
    `.codex/agents`; preferred resolution is remove from active directory unless
    owner explicitly wants them registered.
- [x] Align planning mode across `maestro/docs/maestro-character.md`,
  `maestro/AGENTS.md`, and existing runtime surfaces.
  - Expected: planning means no product-code edits; lean Maestro artifacts may
    be created or updated once T1+ persisted work is understood.
- [x] Decide and document `intake`.
  - Expected preferred model: `intake` is Maestro orchestration-only metadata,
    not a specialist packet `assigned_stage`, and not a stage-handoff lifecycle
    stage.

### P0-B: Active Drift To Fix Before Compaction

These are important, but they are not the same severity as P0-A workflow
contradictions.

- [x] Add an exact edit map for AGENTS cleanup before changing lane files.
  - Expected: list the exact sections to remove, retain, or rewrite in
    `platform/AGENTS.md`, `platform/frontend/AGENTS.md`,
    `platform/backend/AGENTS.md`, and `maestro/AGENTS.md`.
- [x] Document active hot paths in the plan and use them for validation.
  - Expected: validator and reviewers use the same hot-path list.
- [x] Keep root `AGENTS.md` mostly stable unless a small clarification prevents
  duplicate interpretation.

### P1: AGENTS Responsibility Cleanup

These changes reduce future duplicate interpretation.

- [x] Root `AGENTS.md`: keep the source-of-truth map and role registry, but
  avoid turning it into a second runtime manual.
- [x] `platform/AGENTS.md`: remove detailed T0-T4 and artifact-template
  mechanics; keep platform invariants and cross-stack gates.
- [x] `platform/frontend/AGENTS.md`: keep frontend implementation rules and
  commands; shrink Maestro invocation/routing text.
- [x] `platform/backend/AGENTS.md`: keep backend implementation rules and
  commands; shrink Maestro invocation/routing text.
- [x] `maestro/AGENTS.md`: keep local editing rules; remove conflicting
  planning/read-only wording while preserving local safety boundaries.

### P1: Legacy And Decision Cleanup

These remove old artifact/runtime instructions from active memory.

- [x] Update active-looking retired-runtime decisions so DEC-088 clearly
  supersedes old `maestro/memory/runs/**` and `retired-runtime/**` operations.
- [x] Keep old `platform/docs/ai/**` source paths only as historical
  provenance, not active read/write guidance.
- [x] Clean `DEC-060`, `DEC-062`, `DEC-080` sources/status wording where they
  imply missing active paths.
- [x] Remove stale `auth-runtime-followups.md` follow-up from
  `maestro/memory/docs/frontend/drift-report.md`.
- [x] Update `maestro/memory/docs/frontend/doc-map.md` read order so it
  respects `START_HERE.md` + `read-routes.yaml` baseline.
- [x] Improve `target-docs-structure.md` visual separation between landed docs
  and future-only paths.

### P1: Contract And Template Hygiene

These make artifacts easier to resume and validate.

- [x] Fix `maestro/contracts/README.md` approval mapping for `runtime_restore`
  and `destructive_operation`.
  - Expected: README either maps them to owner gate names or states they are
    direct approval record types.
- [x] Fix release handoff naming in `.codex/contracts/release_manager`,
  `.agents/skills/release/SKILL.md`, and related Maestro docs.
  - Expected: all release docs/contracts consistently use one handoff filename
    pattern and schema reference.
- [x] Clarify whether `evidence.schema.json` is a single evidence item while
  `evidence.md.tmpl` is an aggregate evidence log.
- [x] Tighten or explicitly justify `evidence.schema.json`
  `metadata.additionalProperties`.
- [x] Add `owner_input_required` to `closeout.md.tmpl` or document why markdown
  closeout does not mirror JSON closeout.
- [x] Update `packet.md.tmpl` assigned-stage placeholder or explicitly document
  that `approval`/`archive` are not normal specialist packet stages.
- [x] Align or explain `review.md.tmpl` verdict values versus
  `stage-handoff.schema.json` recommendations.
- [x] Create or update a compact template/schema mapping note if asymmetries
  remain intentional.
- [x] Fix legacy `.codex/contracts/module_orchestrator` and
  `research_codebase` template paths or explicitly mark those fields as
  legacy/dead.
- [x] Consider adaptive stage-to-role constraints.
  - Expected: strict constraints apply only to specialist task packets and
    stage handoff JSON. They must not prevent Maestro from answering inline,
    planning inline, or combining low-risk T0/T1 work without a packet.

### P2: Validator v1

This is the earliest structural guard. It reports drift; it does not decide
routing, assign agents, mutate artifacts, or infer runtime behavior.

Validator v1 checks:

- [x] every `.codex/agents/*.toml` is registered or explicitly allowed as
  legacy/experimental;
- [x] every registered agent config file exists;
- [x] every active registered agent has a contract folder or explicit exemption;
- [x] contract template paths resolve or are explicitly legacy/dead;
- [x] `maestro/memory/local/**` is not tracked;
- [x] active hot paths do not contain forbidden old lifecycle instructions.

Validator v1 test expectations:

- [x] include known-bad fixtures or sample inputs for orphan agent, broken template
  path, tracked local auth path, and forbidden old lifecycle string;
- [x] assert the validator fails on each known-bad case;
- [x] assert the validator passes after the cleanup slice.

### P2: Validator v2

Validator v2 can be added after the first cleanup slices.

Additional checks:

- [x] active `.agents/skills/*/agents/openai.yaml` files have required keys and
  consistent shape;
- [x] active nicknames are unique inside `.codex/config.toml`;
- [x] legacy nicknames use explicit legacy forms and do not collide with active
  nicknames;
- [x] active `.codex/agents/*.toml` nickname candidates do not create ambiguity;
- [x] stage enum differences are expected and documented;
- [x] `read-routes.yaml` paths exist unless explicitly future/optional;
- [ ] `memory-index.yaml` paths exist or are explicitly future/legacy;
- [x] no active route promotes retired paths.

Route drift means:

- missing path in a route read list;
- duplicate route key or silently overwritten route key;
- route read list points to retired/deleted runtime surfaces;
- route read order contradicts `START_HERE.md` baseline;
- route requires broad `platform/**` or reference-pack reads without an
  explicit trigger.

### P2: Examples And Continuity

These improve agent reliability without more prompt text.

- [x] Add a T3 multi-step example.
- [x] Add a minimal `work.md` continuity example.
- [x] Add a minimal `orchestration-plan.json` example only if the schema is
  actively used.
- [x] Add an evidence JSON item example if machine-readable evidence remains
  part of the contract.

### P3: Skill And Prompt Compaction

Do this after P0/P1 cleanup, not before. Otherwise compaction may preserve the
wrong source of truth.

- [x] Keep the Maestro skill hot and operational.
- [x] Target after cleanup: Maestro skill should trend toward 250 lines or less
  only if the required behavior remains intact.
- [x] Do not remove owner/engineering boundary, UI/UX ownership, plugin policy,
  context compaction, artifact resume, approval gates, or next-step rule.
- [x] Move rationale and long examples to `runtime-contract.md` or supporting
  docs.
- [x] Review helper skills for the same pattern: required behavior in skill,
  rationale/examples in docs.
- [ ] Add explicit standard references where useful, such as Scout to testing,
  Release to repository/release standards, and Mason to engineering/security.

### P3: Security And Memory Size Guardrails

- [x] Keep `maestro/memory/local/**` ignored.
- [x] Implement local-auth tracking guard through Validator v1.
- [x] Add a docs rule that local auth details must not be copied into tracked
  artifacts/evidence.
- [x] Add a soft compaction trigger for `maestro/memory/durable/current-state.md`.
  - Expected: when it grows past roughly 250 lines or starts mixing stale
    history with current state, schedule a semantic compaction slice.

### P4: Governance And Deferred Minor Items

These are useful but not blockers for cleanup.

- [x] Add a lightweight ownership rule for critical runtime files.
  - Critical files: `runtime-contract.md`, `START_HERE.md`,
    `read-routes.yaml`, `task-packet.schema.json`,
    `stage-handoff.schema.json`, `approval.schema.json`, root `AGENTS.md`,
    and `.codex/config.toml`.
  - Expected: changes require owner review or explicit owner-approved slice.
- [ ] Document persona/skill reuse across legacy and vNext.
  - Expected: short-name routing uses `.codex/config.toml` nicknames only;
    legacy system agents must keep `legacy_*` nicknames.
- [ ] Consider isolating legacy `.codex` material more visibly if owner later
  approves a larger cleanup.
- [ ] Revisit thin `$ref` contracts such as `research_charlie/input.schema.json`
  only if validator/audit clarity remains weak.

## Things Not To Do

- Do not hire new agents now. Current roles cover the needed work.
- Do not build a fixed orchestration chain.
- Do not delete historical provenance without owner approval.
- Do not move legacy artifacts into vNext folders.
- Do not make platform/frontend/backend `AGENTS.md` responsible for Maestro
  behavior.
- Do not compact Maestro skill until P0/P1 active contradictions are fixed.
- Do not make schemas so rigid that Maestro loses the ability to handle safe
  inline work.
- Do not let the validator become a second runtime implementation.

## Proposed Implementation Slices

### Slice 0: Edit Map And Validator Spec

Goal: prepare exact changes before touching active instructions.

Checklist:

- produce an edit map for `AGENTS.md` cleanup;
- identify exact sections to remove, keep, or rewrite;
- write the validator v1 spec and known-bad fixture list;
- decide whether Maestro can do the edit map inline or whether Charlie should
  perform a bounded read-only research pass.

Done when:

- every planned `AGENTS.md` change has a target final owner;
- no invariant is scheduled for deletion without a new owner surface;
- validator v1 scope is small enough to implement without becoming runtime
  machinery.

### Slice 1: Validator v1 Report Mode

Goal: make the most important drift visible early.

Checklist:

- add validator script in report-only mode;
- cover registry, template paths, local auth tracking, and forbidden old
  lifecycle strings;
- include known-bad fixtures or equivalent test samples;
- do not gate the repo until P0-A cleanup removes known failures.

Done when:

- validator detects orphan agent and broken template-path fixtures;
- validator can run on current repo and report known drift clearly;
- docs/memory checks still pass.

### Slice 2: P0-A Active Contradiction Cleanup

Goal: remove direct active workflow contradictions.

Checklist:

- fix or legacy-mark artifact governance standard;
- update standards read order;
- resolve foundation agent files;
- align planning wording in `maestro-character.md` and `maestro/AGENTS.md`;
- document `intake` as orchestration-only or intentionally extend schemas.

Done when:

- active runtime files all describe the vNext artifact model;
- no unregistered active-looking `.codex/agents/*.toml` remains;
- planning mode has one meaning across hot paths;
- `intake` has one canonical meaning.

### Slice 3: AGENTS Responsibility Cleanup

Goal: make active instructions agree on who owns what.

Checklist:

- update `platform/AGENTS.md`;
- update `platform/frontend/AGENTS.md`;
- update `platform/backend/AGENTS.md`;
- update `maestro/AGENTS.md`;
- leave root `AGENTS.md` mostly stable unless a small clarification is needed.

Done when:

- no platform/lane `AGENTS.md` defines T0-T4 mechanics;
- no frontend/backend `AGENTS.md` defines browser evidence policy;
- no frontend/backend `AGENTS.md` defines agent delegation policy;
- lane files keep implementation rules, commands, and docs update triggers;
- docs/memory checks pass.

### Slice 4: Legacy Memory Cleanup

Goal: keep provenance but remove active stale instructions.

Checklist:

- update stale decision statuses/sources;
- clean frontend doc-map read order;
- clean drift-report stale follow-up;
- clarify target-docs-structure landed vs future.

Done when:

- old runtime paths appear only as historical, superseded, legacy-only, or
  git-history-only provenance;
- DEC-088 clearly dominates old retired-runtime operational decisions;
- active read routes do not promote old runtime roots.

### Slice 5: Contract/Template Hygiene

Goal: make artifacts easier to resume and validate.

Checklist:

- fix approval mapping;
- fix release handoff naming;
- align closeout/evidence/packet/review templates with schemas or document
  intentional asymmetry;
- fix legacy template paths or mark them legacy/dead;
- decide adaptive stage-role validation model.

Done when:

- schema/template differences are either removed or documented as intentional;
- release handoff naming is consistent across contracts, skill, and docs;
- no active contract template path is broken unless explicitly legacy/dead.

### Slice 6: Enable Validator And Add v2 Checks

Goal: make drift harder to reintroduce.

Checklist:

- [x] enable validator v1 as a real check after P0-A/P1 cleanup;
- [x] add v2 checks selectively: openai.yaml shape, nickname uniqueness, route
  drift, and documented stage enum asymmetry;
- [x] include clear failure messages with file paths and suggested owner.

Done when:

- [x] validator catches orphan agents, broken template paths, forbidden old hot-path
  strings, and basic route drift;
- [x] validator does not assign agents, mutate artifacts, or infer runtime
  behavior;
- [x] docs/memory/preflight path includes the validator only if it remains fast.

### Slice 7: Examples, Governance, And Skill Compaction

Goal: reduce prompt load by giving better examples and less duplicated prose.

Checklist:

- [x] add missing T3/work/evidence examples;
- [x] add lightweight critical-file ownership rule;
- [x] compact Maestro skill only after all earlier changes are stable;
- [ ] optionally add standards references to helper skills.

Done when:

- [x] examples cover the main resume/continuity cases;
- [x] critical runtime changes have an owner-review expectation;
- [x] skill compaction preserves the required behavior list.

## Final Acceptance Criteria

- Active runtime files all describe the same artifact model.
- Active `AGENTS.md` files have non-overlapping responsibilities.
- Legacy information is isolated to explicit legacy/provenance surfaces.
- No active hot-path file instructs new work to use old run/artifact models.
- Schema/template differences are either removed or documented as intentional.
- The validator catches orphan agents, broken template paths, forbidden old
  lifecycle strings, tracked local auth files, and basic route drift.
- Active nicknames in `.codex/config.toml` are unique.
- Legacy nicknames are explicit and do not collide with active nicknames.
- Full repo mode: docs/memory checks pass strictly.
- Stripped analysis snapshot mode, if added later: runtime-only checks pass
  without requiring full platform docs/code.
- Maestro remains adaptive and fast; no fixed agent chain is introduced.
