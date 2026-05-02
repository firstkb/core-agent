# Work

- Work ID: `2026-05-01-agent-memory-cross-model-audit`
- Status: `closed`
- Owner goal: Review two external model reports about the agent/runtime/memory organization, verify their claims against the live repository, and produce Maestro's own report in a new artifact.
- Mode: planning
- Scope: `.agents`, `.codex`, `maestro/docs`, `maestro/contracts`, `maestro/templates`, `maestro/memory`, root/runtime `AGENTS.md` surfaces.
- Out of scope: product code changes, platform FE/BE implementation review, commits.

## Owner Context

The owner wants a practical discussion, not bureaucracy. The report should help decide what to improve next while preserving the intended philosophy: a fast, high-quality human-agent "jet" where the owner owns product strategy and Maestro owns engineering quality, UI/UX judgment, evidence, and agent/tool coordination.

## Analysis Approach

- Read the current Maestro skill and runtime baseline.
- Compared the two external reports against live files.
- Verified concrete drift with targeted file reads and small machine checks.
- Separated verified defects from weaker claims, intentional asymmetries, and long-term improvements.

## Files

- Report: `report.md`
- Final order plan: `final-order-plan.md`
- Slice 0 edit map: `slice-0-edit-map.md`
- Validator v1 spec: `validator-v1-spec.md`
- Evidence: `evidence.md`
- Closeout: `closeout.md`

## Current Conclusion

Both reports found real issues. The strongest immediate theme is not "bad architecture"; it is drift hardening. The system is mature, but several authoritative runtime surfaces now disagree or still point at legacy behavior. The next useful slice should fix the highest-confidence drift before adding more agents, more prompts, or broader orchestration.

## Recommended Next Action

Stage and commit the closed runtime cleanup work if the owner approves the
current diff.

## Owner Follow-Up

The owner asked to carefully process both external reports, preserve the useful
findings, avoid missing important issues, clean up `AGENTS.md` responsibility
duplication, and remove stale active information about old artifact/runtime
models.

This follow-up is captured in `final-order-plan.md`.

## Second Review Integration

The owner provided two additional reviews of `final-order-plan.md`. The plan
was updated to include explicit active hot paths, P0-A/P0-B prioritization,
expected final states, traceability, validator v1/v2 split, per-slice
definition of done, owner approval boundaries, negative acceptance criteria,
and additional under-covered items such as active nickname ambiguity, openai
YAML shape checks, evidence metadata strictness, legacy isolation, and
current-state compaction trigger.

## Slice 0 Result

Slice 0 is complete. The exact `AGENTS.md` edit map and validator v1 spec are
captured without changing active runtime files.

Decision: no Charlie subagent is needed for the initial edit map. The relevant
sections are short and line-level ownership is clear. Use Charlie only if
implementation reveals hidden ambiguity.

## Slice 1 Result

Slice 1 is complete. Added validator v1 in report/check mode:

- script: `scripts/ai/runtime_drift_check.py`
- modes: `--report`, `--check`, `--self-test`
- checks: agent registry consistency, contract template path resolution,
  tracked local memory/auth files, and forbidden old lifecycle terms in active
  hot paths.

Current `--report` output correctly finds known drift:

- unregistered `foundation-explorer` and `foundation-reviewer`;
- broken legacy template paths in `module_orchestrator` and
  `research_codebase` contracts;
- stale old lifecycle instructions in
  `.codex/standards/runtime/artifact-governance.md`.

`--check` intentionally fails until P0-A cleanup is implemented.

## Slice 2 Result

Slice 2 is complete. Direct P0-A contradictions were cleaned up:

- removed unregistered `foundation-explorer` and `foundation-reviewer` from
  active `.codex/agents`;
- rewrote `.codex/standards/runtime/artifact-governance.md` for the active
  Maestro vNext artifact model;
- updated `.codex/standards/README.md` so the read order names the active
  vNext artifact model;
- aligned planning mode in `maestro/docs/maestro-character.md` and
  `maestro/AGENTS.md`;
- documented `intake` as Maestro orchestration-only in
  `maestro/docs/stage-contract.md` and schema descriptions.

After Slice 2, `runtime_drift_check.py --report` no longer reports foundation
agents or stale artifact governance. It still reports the known P1 legacy
template path drift in `module_orchestrator` and `research_codebase` contracts.
`--check` therefore still intentionally fails until Slice 5/P1 template hygiene.

## Slice 3 Result

Slice 3 is complete. Active `AGENTS.md` responsibility boundaries were cleaned
up and the plan checkboxes were updated:

- `platform/AGENTS.md` now keeps platform product invariants, read-order
  routing, memory update rules, and cross-stack caution areas, while referring
  detailed Maestro tiers/artifacts/tool policy to root `AGENTS.md` and
  `maestro/docs/runtime-contract.md`;
- `platform/frontend/AGENTS.md` keeps frontend implementation, package,
  auth/transport, layout, command, and docs rules, while leaving final UI/UX,
  browser evidence, and agent/tool policy with Maestro;
- `platform/backend/AGENTS.md` keeps backend implementation, architecture,
  auth/tenant/schema, command, test, and docs rules, while leaving release,
  approval, artifact, and agent/tool policy with Maestro;
- `maestro/AGENTS.md` keeps local Maestro directory editing rules and points
  canonical mode/approval/artifact/delegation behavior to
  `maestro/docs/runtime-contract.md`;
- root `AGENTS.md` was left stable.

The remaining validator `--check` failure is still the known P1 legacy template
path drift, not a Slice 3 responsibility-boundary issue.

## Slice 4 Result

Slice 4 is complete. Legacy memory cleanup kept provenance but removed active
stale instructions:

- `DEC-060` and `DEC-062` now read as superseded by DEC-088 instead of active
  retired-runtime operating rules;
- DEC-088 is explicitly stated as the current active retired-runtime boundary
  in `decisions/legacy-retirement-provenance.md`;
- `DEC-080` no longer points to the removed
  `maestro/memory/runs/archive/.../final.md` path as an active source;
- `maestro/memory/docs/frontend/doc-map.md` now respects the
  `START_HERE.md` + `read-routes.yaml` baseline before `memory-index.yaml`;
- `maestro/memory/docs/frontend/drift-report.md` no longer asks agents to
  rewrite the deleted `auth-runtime-followups.md`;
- `maestro/memory/docs/target-docs-structure.md` now separates landed slices
  from future-only target paths.

## Slice 5 Result

Slice 5 is complete. Contract/template hygiene now has one documented mapping
model and the runtime drift validator is green:

- approval mapping now includes direct `runtime_restore` and
  `destructive_operation` approval record types;
- release handoff naming is documented as intentional
  `handoff-<stage>-<role>-NNN`, so release uses
  `handoff-release-release-NNN`;
- `evidence.schema.json` is documented as a single evidence item while
  `evidence.md.tmpl` is an aggregate Markdown evidence log;
- evidence metadata now allows only scalar values, not arbitrary nested
  payloads;
- `closeout.md.tmpl` includes `Owner input required`;
- `packet.md.tmpl` now lists the full packetable stage set and documents that
  `intake` is orchestration-only while `approval`/`archive` are lifecycle
  stages;
- `review.md.tmpl` documents that its verdict values are a review subset of
  stage-handoff recommendations;
- `maestro/docs/template-schema-mapping.md` records intentional schema/template
  asymmetries and the adaptive stage-to-role model;
- legacy `.codex/contracts/*` template paths now resolve, including
  `brief_auditor` support templates;
- `runtime_drift_check.py` now checks `support_templates` in addition to normal
  `template` keys.

After Slice 5, `runtime_drift_check.py --check` passes.

## Slice 6 Result

Slice 6 is complete. The runtime drift validator is now part of the fast
preflight path and includes selective v2 checks:

- `scripts/ai/preflight.sh --docs` now runs
  `python3 scripts/ai/runtime_drift_check.py --check` after docs/memory and env
  policy checks;
- validator errors now include a suggested owner for the failing surface;
- `.agents/skills/*/agents/openai.yaml` files are checked for required shape,
  `#RRGGBB` brand color, explicit `$skill` prompt, and
  `allow_implicit_invocation: false`;
- `.codex/config.toml` nicknames are checked for active collisions and
  legacy-vs-active ambiguity;
- `.codex/agents/*.toml`, registered config files, contracts, and template refs
  continue to be checked;
- `read-routes.yaml` is checked for baseline order, duplicate route keys,
  missing read paths, retired runtime reads, broad platform reads, and raw
  reference-code reads;
- documented stage enum asymmetry is checked: `intake` may appear only in the
  orchestration plan and must remain documented as orchestration-only.

After Slice 6, `scripts/ai/preflight.sh --docs` passes with the validator
enabled.

## Slice 7 Result

Slice 7 is complete. The final cleanup slice reduced prompt load and added
continuity examples without adding a fixed orchestration chain:

- added `maestro/examples/t3-multi-step/` with `work.md`, aggregate
  `evidence.md`, one evidence JSON item, and a minimal
  `orchestration-plan.json`;
- added a lightweight critical runtime file governance rule to
  `maestro/docs/runtime-contract.md`;
- compacted `.agents/skills/maestro/SKILL.md` from 343 lines to 243 lines;
- preserved the required Maestro hot-path behavior: owner/engineering boundary,
  UI/UX ownership, plugin/tool policy, context compaction, artifact resume,
  approval gates, memory baseline, and next-step rule;
- reviewed helper skills for prompt bloat; they are already compact, so no
  extra standards references were added to avoid unnecessary prompt weight.

After Slice 7, `scripts/ai/preflight.sh --docs` passes.

## Final Audit And Closeout Result

Final audit is complete and the work record is archived under
`maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/`.

Final checks passed:

- `scripts/ai/preflight.sh --docs`
- `python3 scripts/ai/runtime_drift_check.py --self-test`
- `git diff --check`

The final plan checkboxes now distinguish completed work from intentional
deferred items. Completed P3 security guardrails include ignored local memory,
local-auth tracking in the validator, local-auth secrecy wording in memory, and
a soft `current-state.md` compaction trigger.

Deferred items remain explicit: `memory-index.yaml` path validation, optional
helper-skill standard references, possible legacy `.codex` isolation, persona
reuse documentation, and thin `$ref` contract clarity.
