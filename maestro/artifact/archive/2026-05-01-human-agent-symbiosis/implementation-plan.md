# Implementation Plan

- Status: `completed`
- Scope: runtime/docs/memory/prompt cleanup after human-agent symbiosis analysis
- Date: 2026-05-01

## Goal

Implement the accepted Maestro operating-model improvements in small slices with
clear checklists and evidence, without turning the work into a large
orchestration rewrite.

This plan covers runtime docs, memory routing, prompt hardening, outsourced
capability policy, and durable memory promotion. Product code is out of scope.

## Global Rules

- Keep slices small enough to review independently.
- Do not change product behavior.
- Do not introduce a classical fixed agent chain.
- Do not add new docs unless they replace or materially compress existing
  surfaces.
- Do not promote planning notes wholesale into durable memory.
- Run focused checks after each slice.
- Use specialists only when they improve correctness or review; no default
  subagent chain.

## Slice Status

| Slice | Name | Status | Risk |
|---|---|---|---|
| 1 | Memory Retrieval Cleanup | `completed` | low |
| 2 | Maestro Core Runtime Docs | `completed` | medium |
| 3 | Maestro Docs Simplification | `completed` | medium |
| 4 | Skill / Agent Prompt Hardening | `completed` | medium |
| 5 | Durable Decisions Promotion | `completed` | medium |
| 6 | Final Consistency Review | `completed` | medium |
| 7 | Post-Review FE Policy Alignment | `completed` | low |

## Slice 1: Memory Retrieval Cleanup

### Goal

Fix stale or duplicated memory routing and compact orientation issues before
changing broader runtime docs.

### In Scope

- `maestro/memory/durable/repo-map.md`
- `maestro/memory/index/memory-index.yaml`
- `maestro/memory/index/read-routes.yaml`
- `maestro/memory/durable/legacy-memory-import.md`
- targeted memory references needed for consistency

### Out Of Scope

- `decisions-log.md` semantic cleanup
- FE visual evidence policy promotion
- skill prompt changes
- product code

### Checklist

- [x] Update `repo-map.md` to show the active vNext nine-role team.
- [x] Update Maestro description from legacy module orchestration to
      native-first solution architect / engineering partner.
- [x] Update `memory-index.yaml` `platform.runtime.codex-native` to include all
      active vNext skill surfaces and current runtime wording.
- [x] Remove duplicated `maestro/memory/reference-code/README.md` entries from
      `read-routes.yaml`.
- [x] Remove duplicated reference-code README entry from `memory-index.yaml`.
- [x] Fix malformed empty-backtick runtime source line in
      `legacy-memory-import.md`.
- [x] Leave `read-routes.hot.yaml` deferred unless this slice uncovers concrete
      context bloat that cannot be solved by dedupe/refresh.

### Acceptance Criteria

- Memory route surfaces no longer present stale active-team facts.
- Reference-code routes do not duplicate the same read in one route.
- Legacy import provenance remains historical but no longer has malformed
  source wording.
- No root `docs/` is recreated.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- focused `rg` for `auditor`, duplicated reference-code routes, malformed
  empty backticks, and active-team references

### Stop Conditions

- Stop if a memory change implies a runtime contract change outside this slice.
- Stop if updating route maps requires a new routing artifact.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/memory/durable/repo-map.md`
  - `maestro/memory/index/memory-index.yaml`
  - `maestro/memory/index/read-routes.yaml`
  - `maestro/memory/durable/legacy-memory-import.md`
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - Focused `rg` for stale Slice 1 terms found no old `owner-facing module
    orchestration`, malformed empty backtick source line, or legacy `auditor`
    naming in the changed Slice 1 files.
- Decision: `read-routes.hot.yaml` remains deferred. The duplicate/stale route
  issues were fixed without creating a new routing artifact.

## Slice 2: Maestro Core Runtime Docs

### Goal

Align canonical Maestro runtime behavior with the accepted philosophy and
responsibility model.

### In Scope

- `maestro/docs/runtime-contract.md`
- `maestro/docs/operating-charter.md`
- `maestro/docs/maestro-character.md`
- `maestro/docs/agent-roles.md`
- `maestro/docs/agent-contracts.md`
- `maestro/docs/acceptance-suite.md`

### Out Of Scope

- moving/renaming docs
- skill prompt edits
- decisions-log promotion
- product code

### Checklist

- [x] Update owner/Maestro responsibility split:
      owner owns strategy, taste, priorities, final product direction;
      Maestro owns engineering path, product-quality analysis, UI/UX evidence,
      code quality, agents/tools, checks, and safe execution.
- [x] Formalize return-to-owner points for material UX/product decisions,
      disputed taste, scope changes, strategic tradeoffs, approval gates, and
      unclear acceptance.
- [x] Replace `auditor` legacy naming with `brief_auditor` where applicable.
- [x] Update FE visual evidence policy:
      Browser Use = structured in-Codex smoke/evidence;
      Computer Use + external Chrome = final desktop visual/UX acceptance when
      Codex width may bias judgment or real desktop/browser behavior matters;
      Maestro remains final UI/UX judge.
- [x] Update Build Web Apps language:
      must consider for visible frontend work, actual use selective.
- [x] Update Scout boundary:
      Scout verifies and can supplement browser/visual evidence, but does not
      own final product feel or UI/UX acceptance.
- [x] Update reassignment rule:
      owner approval only after persisted assignment, explicit owner-named
      executor, approval gate, or high-risk scope exists.
- [x] Add explicit next-step closeout rule:
      after completing a task or slice, Maestro should propose one concrete
      useful next step when it helps momentum, while avoiding fake work or
      multiple-choice menus unless owner choice is genuinely needed.
- [x] Add `maestro-character.md` provenance note from the soul-document idea
      without metaphysical or theatrical language.
- [x] Ensure time-based greetings are not promoted.

### Acceptance Criteria

- `runtime-contract.md` remains the compact canonical source.
- All active docs agree on FE visual evidence responsibility.
- All active docs agree on owner/Maestro responsibility split.
- No doc requires fixed chains or mandatory specialist launches.
- Closeout behavior includes one useful recommended next step when appropriate.
- Legacy agent naming is accurate.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- focused `rg` for:
  - `auditor`
  - `Browser Use`
  - `Computer Use`
  - `stage chain`
  - `Good morning|Good evening|time-of-day|greeting`

### Stop Conditions

- Stop if wording starts to require a fixed agent sequence.
- Stop if FE tool policy conflicts with available tool/plugin behavior.
- Stop if character text becomes persona performance instead of operating
  behavior.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/docs/runtime-contract.md`
  - `maestro/docs/operating-charter.md`
  - `maestro/docs/maestro-character.md`
  - `maestro/docs/agent-roles.md`
  - `maestro/docs/agent-contracts.md`
  - `maestro/docs/acceptance-suite.md`
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - Focused `rg` found no legacy `auditor`, `stage chain`, old `owner thinks`,
    or time-based greeting wording in the Slice 2 target docs.
- Decision: Slice 2 updated active core runtime docs only. It did not move docs,
  update skill prompts, promote durable decisions, or touch product code.

## Slice 3: Maestro Docs Simplification

### Goal

Reduce duplication and prevent older orchestration-style docs from becoming hot
runtime guidance.

### In Scope

- `maestro/docs/README.md`
- `maestro/docs/native-first-maestro.md`
- `maestro/docs/orchestration-contract.md`
- `maestro/docs/agent-sequences.md`
- `maestro/docs/memory-migration-plan.md`
- optional `maestro/docs/archive/` if accepted for historical docs

### Out Of Scope

- changing core runtime behavior beyond classification/retirement
- skill prompts
- memory decisions cleanup
- product code

### Checklist

- [x] Update `README.md` to classify docs as:
      canonical, active supporting, reference, historical/provenance, retired.
- [x] Decide whether to create `maestro/docs/archive/`.
- [x] Move or reclassify `memory-migration-plan.md` as historical/provenance.
- [x] Compress or reclassify `native-first-maestro.md`; remove stale
      "Next Transition" language.
- [x] Retire/replace `orchestration-contract.md` or rename/rework it as
      internal coordination only.
- [x] Retire/replace `agent-sequences.md` or convert it into
      `agent-selection-thresholds.md`.
- [x] Ensure `README.md` points to `runtime-contract.md` as canonical and does
      not present retired docs as hot reads.

### Acceptance Criteria

- A new reader can tell which docs are canonical and which are historical.
- No active supporting doc implies fixed orchestration chains.
- Completed migration material is no longer in the hot support path.
- References are updated if files are moved or renamed.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- focused `rg` for old file paths if any docs are moved

### Stop Conditions

- Stop before deleting or moving a doc if active skills/configs still reference
  it.
- Stop if docs simplification requires schema/template changes not planned in
  this slice.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/README.md`
  - `maestro/docs/README.md`
  - `maestro/docs/agent-selection-thresholds.md`
  - `maestro/docs/native-first-maestro.md`
  - `maestro/docs/orchestration-contract.md`
  - `maestro/docs/agent-sequences.md`
  - `maestro/docs/memory-migration-plan.md`
  - `maestro/memory/index/read-routes.yaml`
- Decision: no `maestro/docs/archive/` folder was created in this slice.
  `memory-migration-plan.md` is still referenced by active Archivist runtime
  wiring, so it was reclassified in place as historical/provenance material
  instead of being moved.
- Decision: `agent-sequences.md` and `orchestration-contract.md` were retained
  only as retired compatibility pointers. Current selection guidance moved to
  `agent-selection-thresholds.md`.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - Focused `rg` found no stale fixed-chain or "Next Transition" wording in
    active Slice 3 docs. Remaining hits are checklist/prohibition text inside
    this implementation plan.

## Slice 4: Skill / Agent Prompt Hardening

### Goal

Strengthen active skill and agent prompts with compact, role-specific guidance
from the planning artifacts without copying Cursor-style fixed orchestration.

### In Scope

- `.agents/skills/maestro/SKILL.md`
- `.agents/skills/*/SKILL.md` for active vNext roles as needed
- `.agents/skills/*/agents/openai.yaml` as needed
- `.codex/agents/*.toml` for active vNext roles as needed
- relevant `.codex/contracts/*` only if role contracts require sync

### Out Of Scope

- product code
- adding new agents
- broad rewrite of all prompts
- Cursor workspace or raw Cursor command adoption

### Checklist

- [x] Maestro: compactly add owner/Maestro split, adaptive delegation, UX/product
      return points, FE tool policy, no fixed chains.
- [x] Mason: reinforce project architecture reads, scoped implementation,
      changed files/checks/residual risks, and fix-mode as implementation, not a
      separate debugger persona.
- [x] Scout: reinforce diagnose/verify boundary, checks/evidence, no broad
      fixing, FE evidence as supplement not final UI/UX ownership.
- [x] Lens: reinforce findings-first review, acceptance/evidence/security risk,
      missing tests/evidence.
- [x] Grant: reinforce plan/brief/risk/acceptance audit, no approval authority.
- [x] Charlie: reinforce facts vs inference, exact file/symbol refs,
      recommended next action.
- [x] Scribe: reinforce compact closeout only when durable record is useful.
- [x] Archivist: reinforce docs/memory drift audit and no product ownership.
- [x] Release: reinforce release approval before production-impacting action.
- [x] Avoid adding large generic standards text into every prompt.

### Acceptance Criteria

- Each role has clearer professional boundaries.
- Prompts stay compact and lazy-read deeper standards instead of embedding them.
- No role implies an automatic chain.
- Outsourced capabilities are considered without becoming mandatory for every
  task.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- focused `rg` for fixed-chain language and stale Browser Use policy

### Stop Conditions

- Stop if hardening turns into a broad prompt rewrite.
- Stop if a role needs a new agent; record as hiring discussion instead.

### Execution Evidence

- Status: `completed`
- Changed:
  - `.agents/skills/maestro/SKILL.md`
  - `.agents/skills/{charlie,grant,mason,scout,lens,release,scribe,archivist}/SKILL.md`
  - `.agents/skills/*/agents/openai.yaml`
  - `.codex/agents/{maestro_vnext,research_charlie,audit_grant,implementation_mason,verification_scout,review_lens,release_manager,closeout_scribe,memory_archivist}.toml`
  - `maestro/docs/adaptive-loop-contract.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/prompt-hardening.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/project-architecture-intake.md`
- Decisions:
  - No new role was created. Debugging remains Mason fix mode after a concrete
    diagnostic report.
  - No `.codex/contracts/*` schema changes were needed; role output contracts
    already support the strengthened boundaries.
  - No `.codex/standards/engineering/project-architecture.md` was created.
    Maestro and Mason now point to existing lane AGENTS, memory packs,
    canonical contracts, and standards instead.
  - `maestro/docs/adaptive-loop-contract.md` was updated only to remove stale
    Browser Use policy that would conflict with hardened prompts.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - `.codex/agents/*.toml` parsed with Python `tomllib`.
  - `.agents/skills/*/agents/openai.yaml` parsed with Ruby YAML.
  - Focused runtime-only `rg` across `.agents/skills`, `.codex/agents`, and
    `maestro/docs` found no stale "Browser Use by default", old owner/Maestro
    responsibility wording, or active fixed-chain requirement. The only runtime
    hit is a prohibition against fixed chains in Maestro's skill.
  - Broader artifact search still finds old audit/provenance quotes and
    checklist text; those are not active runtime guidance.

## Slice 5: Durable Decisions Promotion

### Goal

Promote only accepted long-term operating decisions into durable memory and
clean obvious decisions-log issues without dumping planning artifacts wholesale.

### In Scope

- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/durable/current-state.md` if needed
- `maestro/memory/durable/repo-map.md` if Slice 1 left follow-ups
- `maestro/memory/modules/**` only if a durable module/workflow rule changed

### Out Of Scope

- full historical rewrite of decisions-log
- deleting large blocks without replacement/supersession
- product code

### Checklist

- [x] Prepare compact promotion list from accepted planning artifacts.
- [x] Add decisions only for durable strategy, standards, operating rules, or
      future-impacting development decisions.
- [x] Do not promote brainstorming, rejected options, temporary plans, or full
      artifact text.
- [x] Fix duplicate `DEC-049` handling.
- [x] Supersede or compact stale active retired-runtime decisions identified in
      `decisions-log-audit.md`.
- [x] Update stale source paths where current canonical docs exist.
- [x] Compact migration-ledger noise only when safe.
- [x] Update `current-state.md` only for active current-state facts, not every
      planning detail.

### Acceptance Criteria

- New durable memory is compact and future-useful.
- Decisions-log remains historically useful but less misleading.
- No planning artifact is copied wholesale into durable memory.
- Current-state remains a snapshot, not a changelog.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- focused `rg` for stale retired-runtime active decisions and duplicate DEC IDs

### Stop Conditions

- Stop if decisions-log cleanup becomes a large archival rewrite.
- Stop if a decision is not clearly accepted by owner.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/memory/durable/decisions-log.md`
  - `maestro/memory/durable/current-state.md`
  - `maestro/memory/START_HERE.md`
  - `maestro/memory/agent-workflow.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/memory-update-policy.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/decisions-log-audit.md`
- Decisions promoted:
  - `DEC-089` human-agent responsibility split.
  - `DEC-090` Maestro-owned UI/UX judgment and FE browser/desktop evidence.
  - `DEC-091` adaptive agent selection, no fixed chains, no new role by default.
  - `DEC-092` risk-based Definition of Done and evidence budget.
  - `DEC-093` durable memory promotion policy.
  - `DEC-094` Maestro/Mason coding intake using existing architecture sources.
- Cleanup:
  - Historical duplicate `DEC-049` handled by normalizing the backend docs entry
    to `DEC-049B` without renumbering stable later IDs.
  - `DEC-019`, `DEC-071`, `DEC-077`, and `DEC-087` were refreshed to current
    runtime wording.
  - `DEC-055`, `DEC-078`, and `DEC-086` were marked superseded by the native
    Maestro artifact/runtime model.
  - Full migration-ledger compaction and broad source refresh for older product
    decisions were deliberately deferred to avoid a large archival rewrite.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - Focused `rg` found no duplicate `DEC-049` exact heading. Remaining
    `maestro/memory/runs/active` references are inside superseded decisions.

## Slice 6: Final Consistency Review

### Goal

Verify all updated runtime/docs/memory/skill surfaces agree and no planning-only
direction leaked incorrectly.

### In Scope

- all files changed in Slices 1-5
- planning artifacts for source comparison
- runtime read surfaces referenced by `AGENTS.md`

### Out Of Scope

- new behavior changes
- product code

### Checklist

- [x] Verify source order and read paths.
- [x] Verify no active doc says fixed chains are required.
- [x] Verify FE tool policy is consistent everywhere.
- [x] Verify owner/Maestro split is consistent everywhere.
- [x] Verify agent role boundaries are consistent.
- [x] Verify no time-based greeting rule remains.
- [x] Verify `brief_auditor` naming.
- [x] Verify docs/memory checks pass.
- [x] Optional: ask Lens or Archivist for targeted review only if the diff is
      large enough to justify independent review.

### Acceptance Criteria

- Runtime docs, memory, skills, and agent configs do not contradict each other.
- Final implementation evidence is short and clear.
- Remaining risks are named explicitly.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- `scripts/ai/preflight.sh` if implementation touched non-trivial runtime docs
  or scripts
- focused `rg` suite for stale terms

### Stop Conditions

- Stop if consistency review finds policy conflict requiring owner decision.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/evidence.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/closeout.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/implementation-plan.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/work.md`
- Review:
  - Source-order and lazy-read checks found no hot-path conflict. The broad
    source-of-truth lists remain repo guidance, while Maestro skill/config now
    lazy-read schemas and templates by route.
  - Fixed-chain checks found no active required specialist chain. Remaining
    hits are prohibitions, retired compatibility pointers, or internal intake
    wording.
  - FE policy checks found consistent Browser Use, Computer Use, Build Web Apps,
    Scout, and Maestro UI/UX ownership boundaries.
  - Owner/Maestro responsibility split is consistent across runtime docs,
    memory, skills, and agent configs.
  - Time-based greetings remain cancelled and appear only in planning/audit
    artifacts, not as active runtime behavior.
  - `brief_auditor` naming is current for legacy continuation; old `auditor`
    wording was not found as an active role name.
  - Duplicate decision ID checks found no duplicate `DEC-049` heading after the
    `DEC-049B` normalization.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - `.codex/agents/*.toml` parsed with Python `tomllib`.
  - `.agents/skills/*/agents/openai.yaml` parsed with Ruby YAML.
  - `scripts/ai/preflight.sh` passed in lite mode.
- Specialist decision: no Lens or Archivist subagent was launched. The final
  review was bounded, checks passed, and no unresolved policy conflict required
  independent review.

## Slice 7: Post-Review FE Policy Alignment

### Goal

Close the concrete propagation gaps found in the post-Slice-6 review before
committing the runtime cleanup.

### In Scope

- `platform/frontend/AGENTS.md`
- `maestro/memory/modules/frontend/build-web-apps-review.md`
- final artifact closeout/evidence wording

### Out Of Scope

- product code
- broad `decisions-log.md` rewrite
- lazy-read conversion for all specialist helpers
- semantic contract/template audit
- new agent hiring

### Checklist

- [x] Align frontend visual review loop with Maestro-owned UI/UX judgment.
- [x] Align frontend visual review loop with Browser Use structured evidence
      and Computer Use external Chrome escalation.
- [x] Align Build Web Apps bridge with the same FE evidence policy.
- [x] Add context compaction continuity policy to future topics, not current
      implementation scope.
- [x] Keep this slice small and avoid expanding into a new runtime project.

### Acceptance Criteria

- FE lane guidance no longer sounds older than Maestro runtime guidance.
- Build Web Apps bridge no longer treats Computer Use only as a fallback when
  final desktop UX judgment needs external Chrome.
- Future unresolved topics are listed explicitly for later owner discussion.

### Execution Evidence

- Status: `completed`
- Changed:
  - `platform/frontend/AGENTS.md`
  - `maestro/memory/modules/frontend/build-web-apps-review.md`
  - this work artifact closeout/evidence/plan
- Decision: context compaction continuity is important but not implemented in
  this slice. It is recorded as a future topic.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - `.codex/agents/*.toml` parsed with Python `tomllib`.
  - `.agents/skills/*/agents/openai.yaml` parsed with Ruby YAML.
  - `maestro/contracts/*.json` and `.codex/contracts/**/*.json` parsed with
    Python `json`; 45 files.
  - `scripts/ai/preflight.sh` passed in lite mode.

## Future Topics

These topics are intentionally left out of the current commit-sized cleanup:

- full semantic rewrite of `maestro/memory/durable/decisions-log.md`;
- lazy-read conversion for all helper agents;
- semantic audit of `maestro/contracts/**` and `maestro/templates/**`;
- agent hiring/new-role decision after repeated evidence that current roles are
  insufficient;
- context compaction continuity policy: define what Maestro must preserve and
  restore when the system automatically compacts conversation context, including
  latest owner request, active/archived artifact path, current scope, gates,
  changed files, evidence/check status, unresolved owner decisions, and next
  action.

## Completed Execution

All seven approved slices are complete. The next useful step is preparing a
single commit for owner review.
