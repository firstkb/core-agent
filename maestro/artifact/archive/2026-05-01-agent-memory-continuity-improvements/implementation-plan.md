# Implementation Plan

- Status: `completed`
- Work ID: `2026-05-01-agent-memory-continuity-improvements`
- Scope: agent, memory, contract/template, and context continuity improvements
- Date: 2026-05-01

## Goal

Implement the next round of Maestro/team reliability and performance
improvements without creating bureaucracy or duplicating policy across runtime
surfaces.

The work should improve:

- continuity after automatic context compaction;
- helper-agent hot-path performance;
- semantic correctness of Maestro contracts/templates;
- durability and retrieval shape of `decisions-log.md`;
- mechanical implementation of the accepted `decisions-log.md` split plan.

## Global Rules

- Keep slices small and reviewable.
- Do not change product code.
- Do not add new agents unless repeated failures justify it.
- Do not split or rewrite `decisions-log.md` outside the dedicated
  owner-approved implementation slice.
- Do not duplicate Maestro policy in lane `AGENTS.md` files.
- Preserve T0 as lightweight current-chat work.
- Promote to T1 only when continuity, risk, owner value, or evidence requires
  it.
- Run targeted docs/memory checks after each docs/memory slice.

## Slice Status

| Slice | Name | Status | Risk |
|---|---|---|---|
| 1 | Context Compaction Continuity Runtime | `completed` | medium |
| 2 | Helper Agent Lazy-Read | `completed` | medium |
| 3 | Contracts/Templates Semantic Audit | `completed` | medium |
| 4 | Decisions Log Restructure Plan | `completed` | medium |
| 5 | Decisions Log Restructure Implementation | `completed` | medium |
| 6 | Contracts/Templates Follow-Up Improvements | `completed` | medium |
| 7 | Final Consistency Review | `completed` | low |

## Slice 1: Context Compaction Continuity Runtime

### Goal

Make Maestro's behavior after automatic context compaction recoverable without
turning every small task into an artifact.

### In Scope

- `maestro/docs/runtime-contract.md`
- `.agents/skills/maestro/SKILL.md`
- `.codex/agents/maestro_vnext.toml`
- `maestro/templates/work.md.tmpl` if stronger continuity fields are needed
- current work artifact evidence/status

### Out Of Scope

- helper-agent lazy-read changes
- decisions-log restructuring
- contracts/templates semantic audit beyond `work.md.tmpl`
- product code

### Checklist

- [x] Add T0 post-compaction behavior:
      reconstruct latest owner request from summary/current message, reread
      memory baseline for repo/product work, continue only when scope and next
      action are clear.
- [x] Add T0 -> T1 promotion triggers for continuity-sensitive work.
- [x] Add T1+ resume behavior:
      reread `work.md`, relevant evidence/gates/handoffs, verify latest owner
      message, update stale work state before acting.
- [x] Add explicit anti-rules:
      compaction summary is not approval; do not continue high-risk work until
      gates/scope are revalidated; do not reopen archives accidentally.
- [x] Keep T0 lightweight and avoid mandatory artifacts for harmless work.
- [x] Update `work.md.tmpl` only if the existing template cannot reliably carry
      continuity fields.

### Acceptance Criteria

- Runtime docs and Maestro skill agree on T0/T1 compaction behavior.
- Maestro can recover from compaction without over-creating artifacts.
- T1+ tasks have a clear `work.md` continuity anchor.
- High-risk/gated work cannot continue after compaction without revalidation.
- No new memory layer is introduced.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- `git diff --check`
- focused `rg` for `compaction`, `work.md`, `T0`, `T1`, `approval`, and
  archived artifact wording

### Stop Conditions

- Stop if continuity policy would require a new memory root or always-on
  artifact for T0 work.
- Stop if runtime wording could treat thread summaries as approval.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/docs/runtime-contract.md`
  - `.agents/skills/maestro/SKILL.md`
  - `.codex/agents/maestro_vnext.toml`
  - `maestro/templates/work.md.tmpl`
  - this work artifact
- Result:
  - T0 remains artifact-free by default.
  - T0 promotes to T1 only when work becomes continuity-sensitive.
  - T1+ uses `work.md` as the continuity anchor.
  - Thread summaries and compaction summaries are explicitly not approvals.
  - High-risk/gated work must revalidate gates and scope after compaction.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - `scripts/ai/preflight.sh` passed in lite mode.
  - `.codex/agents/*.toml` parsed with Python `tomllib`.
  - Focused `rg` verified compaction/T0/T1/approval/archive wording in the
    changed runtime surfaces.
  - `scripts/ai/preflight.sh` passed in lite mode.

## Slice 2: Helper Agent Lazy-Read

### Goal

Reduce helper-agent hot-path context load while preserving contracts when
machine-readable handoffs or evidence are actually needed.

### In Scope

- `.agents/skills/{charlie,grant,mason,scout,lens,release,scribe,archivist}/SKILL.md`
- `.codex/agents/{research_charlie,audit_grant,implementation_mason,verification_scout,review_lens,release_manager,closeout_scribe,memory_archivist}.toml`
- launch prompts under `.agents/skills/*/agents/openai.yaml` only if wording
  needs sync

### Out Of Scope

- Maestro lazy-read changes already completed unless consistency requires a
  tiny patch
- contract/template semantic changes
- decisions-log restructuring
- product code

### Checklist

- [x] Identify required reads that are only needed for durable handoff,
      evidence, approval, closeout, or release records.
- [x] Convert non-essential schema/template reads to lazy-read language.
- [x] Keep Scribe/Release stricter when record creation is the core job.
- [x] Preserve role boundaries and evidence expectations.
- [x] Avoid weakening assignment constraints.
- [x] Keep prompts compact.

### Acceptance Criteria

- Helper agents no longer default-read schemas/templates that are unnecessary
  for ordinary bounded assignments.
- Machine-readable outputs remain available when requested.
- Role behavior remains consistent with `runtime-contract.md`.
- No helper prompt becomes broader or more generic.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- `git diff --check`
- TOML parse for `.codex/agents/*.toml`
- YAML parse for `.agents/skills/*/agents/openai.yaml`
- focused `rg` for `Read and follow`, `task-packet.schema`,
  `stage-handoff.schema`, `evidence.schema`, and lazy-read wording

### Stop Conditions

- Stop if a helper would lose required assignment constraints.
- Stop if lazy-read wording makes durable handoff format ambiguous.

### Execution Evidence

- Status: `completed`
- Changed:
  - `.codex/agents/research_charlie.toml`
  - `.codex/agents/audit_grant.toml`
  - `.codex/agents/implementation_mason.toml`
  - `.codex/agents/verification_scout.toml`
  - `.codex/agents/review_lens.toml`
  - `.codex/agents/release_manager.toml`
  - `.agents/skills/charlie/SKILL.md`
  - this work artifact
- Result:
  - Charlie, Grant, Mason, Scout, and Lens no longer default-read
    `task-packet` / `stage-handoff` schemas for ordinary bounded assignments.
  - Scout no longer default-reads `evidence.schema.json`; it lazy-reads the
    schema only when structured evidence or exact output shape is required.
  - Release still default-reads `approval.schema.json` and
    `stage-handoff.schema.json` because approval validation and release records
    are core release work; only `task-packet.schema.json` became lazy-read.
  - Scribe remains stricter for closeout template/schema because closeout record
    creation is its core role.
  - Charlie's skill Source Of Truth now matches the lazy-read policy.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - `.codex/agents/*.toml` parsed with Python `tomllib`.
  - `.agents/skills/*/agents/openai.yaml` parsed with Ruby YAML.
  - Focused `rg` verified schema references moved behind lazy-read wording,
    with Scribe/Release intentionally stricter.
  - `scripts/ai/preflight.sh` passed in lite mode.

## Slice 3: Contracts/Templates Semantic Audit

### Goal

Audit Maestro contracts and templates for semantic drift before changing their
structure.

### In Scope

- `maestro/contracts/**`
- `maestro/templates/**`
- related `.codex/contracts/**` only when needed for comparison
- audit artifact under this work root

### Out Of Scope

- broad schema rewrites
- product code
- decisions-log restructuring

### Checklist

- [x] Check for fixed-chain or classical orchestration assumptions.
- [x] Check whether packets/handoffs are required where compact `work.md` or
      `evidence.md` should be enough.
- [x] Check active role naming, including `brief_auditor` legacy naming.
- [x] Check support for adaptive delegation, inline work, optional handoffs,
      gates, evidence, and closeout.
- [x] Check whether `work.md`/evidence templates preserve owner intent, scope,
      gates, evidence status, unresolved owner decisions, and next action.
- [x] Produce a concise audit with recommended changes split by severity.

### Acceptance Criteria

- Audit names concrete contracts/templates and the issue or confirms no issue.
- Recommended changes are separated from observations.
- No schema/template rewrite happens without a follow-up implementation slice.

### Checks

- JSON parse for `maestro/contracts/*.json` and `.codex/contracts/**/*.json`
- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- focused `rg` for fixed-chain, legacy naming, artifact paths, and required
  packet/handoff wording

### Stop Conditions

- Stop if audit reveals a high-risk contract change that needs owner decision
  before editing.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/contracts-templates-semantic-audit.md`
  - this work artifact
- Result:
  - Active vNext contracts/templates are usable and mostly aligned.
  - No active role naming drift found in `maestro/contracts/**` or
    `maestro/templates/**`.
  - Legacy `.codex/contracts/module_orchestrator`, `research_codebase`, and
    `brief_auditor` are correctly isolated as legacy surfaces.
  - Main follow-up risks are packet/handoff optionality, helper contract
    default-vs-machine-readable invocation wording, approval enum alignment,
    and `approve` recommendation authority.
- Checks:
  - JSON parse for `maestro/contracts/*.json` and
    `.codex/contracts/**/*.json` passed.
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - Focused `rg` for fixed-chain, legacy naming, artifact paths, required
    packet/handoff wording, approval, and recommendation semantics completed.
  - `scripts/ai/preflight.sh` passed in lite mode.

## Slice 4: Decisions Log Restructure Plan

### Goal

Design a safe, low-bureaucracy way to make `decisions-log.md` lighter without
breaking decision IDs, source refs, or retrieval.

### In Scope

- `maestro/memory/durable/decisions-log.md` analysis
- proposed topic-file structure under `maestro/memory/durable/decisions/`
- read-route and memory-index implications
- planning artifact only unless owner approves implementation

### Out Of Scope

- actual split/rewrite of `decisions-log.md`
- mass historical cleanup
- deleting decision history
- product code

### Checklist

- [x] Inventory active/superseded/archive decision groups.
- [x] Propose final `decisions-log.md` index shape.
- [x] Propose small topic-file split.
- [x] Define source-ref update rules.
- [x] Define migration strategy and rollback/readability risk.
- [x] Decide whether implementation should be one slice or staged by topic.

### Acceptance Criteria

- Owner can choose whether to split the file.
- Plan preserves stable IDs.
- Plan avoids one file per decision by default.
- Plan names read-route and memory-index updates if needed.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- focused `rg` for decision IDs and duplicate headings

### Stop Conditions

- Stop before moving decision content without explicit owner approval.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/decisions-log-restructure-plan.md`
  - this work artifact
- Result:
  - Current `decisions-log.md` has 1172 lines and 96 decision headings.
  - Status inventory: 86 active, 9 superseded, 1 historical.
  - No duplicate `### DEC-*` headings were found.
  - `DEC-049B` remains an intentional stable-ID normalization.
  - Recommended shape keeps `decisions-log.md` as a lightweight index and
    moves full details into four topic files:
    `product-platform.md`, `docs-memory-routing.md`,
    `agent-runtime-workflow.md`, and
    `legacy-retirement-provenance.md`.
  - Implementation should be a dedicated mechanical move slice after owner
    approval, not a semantic rewrite mixed into other work.
- Checks:
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - Focused `rg` verified decision IDs, duplicate headings, legacy references,
    and routing references.
  - `scripts/ai/preflight.sh` passed in lite mode.

## Slice 5: Decisions Log Restructure Implementation

### Goal

Implement the Slice 4 `decisions-log.md` restructure plan as a mechanical
docs/memory split, without semantic decision rewrites.

### In Scope

- `maestro/memory/durable/decisions-log.md`
- new topic files under `maestro/memory/durable/decisions/`
- `maestro/memory/START_HERE.md` only if the index/append wording needs
  clarification
- `maestro/memory/index/read-routes.yaml` only for route-specific topic reads
- `maestro/memory/index/memory-index.yaml` only if topic files become useful
  retrieval targets
- current work artifact evidence/status

### Out Of Scope

- semantic rewrite of decision text
- deleting superseded or historical decisions
- renumbering decisions
- one file per decision
- product code
- agent hiring criteria

### Checklist

- [x] Create `maestro/memory/durable/decisions/`.
- [x] Move full decision bodies into topic files:
      `product-platform.md`, `docs-memory-routing.md`,
      `agent-runtime-workflow.md`, and
      `legacy-retirement-provenance.md`.
- [x] Replace `decisions-log.md` with lightweight index/table and next-ID note.
- [x] Preserve every `DEC-*` ID and keep `DEC-049B` explicit.
- [x] Preserve deleted legacy source paths as provenance, not active read
      targets.
- [x] Update memory routes only where topic files add useful retrieval value.
- [x] Verify each decision appears exactly once in the index and exactly once
      in a topic file.

### Acceptance Criteria

- `decisions-log.md` is a compact index/append point.
- Full decision details are grouped into the four topic files from Slice 4.
- No decision IDs are changed or deleted.
- `DEC-049B` remains stable and documented.
- No semantic decision text rewrite is mixed into the mechanical split.
- The default memory baseline does not gain a new always-read file.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- `git diff --check`
- focused `rg` for `DEC-*`, `DEC-049B`, duplicate headings,
  `platform/docs/ai`, and topic-file references
- script or shell verification that every decision ID appears once in the
  index and once in topic details
- `scripts/ai/preflight.sh`

### Stop Conditions

- Stop if the split would require semantic rewriting to keep decisions coherent.
- Stop if an ID collision or missing decision appears during verification.
- Stop if route updates would make topic files part of the always-read baseline.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/memory/durable/decisions-log.md`
  - `maestro/memory/durable/decisions/product-platform.md`
  - `maestro/memory/durable/decisions/docs-memory-routing.md`
  - `maestro/memory/durable/decisions/agent-runtime-workflow.md`
  - `maestro/memory/durable/decisions/legacy-retirement-provenance.md`
  - `maestro/memory/START_HERE.md`
  - `maestro/memory/agent-workflow.md`
  - `maestro/memory/index/read-routes.yaml`
  - `maestro/memory/index/memory-index.yaml`
  - `maestro/memory/durable/current-state.md`
  - `maestro/memory/durable/repo-map.md`
  - `scripts/ai/docs_memory_check.py`
  - this work artifact
- Result:
  - `decisions-log.md` is now a compact index and append point.
  - Full decision bodies are grouped into the four accepted topic files.
  - `Next decision ID` is `DEC-096`.
  - `DEC-049B` remains explicit in the index and topic details.
  - The default memory baseline remains unchanged; topic files are only
    route-specific deeper reads.
  - Docs/memory check now treats decision topic files as decision provenance
    for retired names and invocation references.
- Checks:
  - ID verification passed: 96 decisions in the index, 96 in topic files, no
    duplicate IDs, no missing IDs, and `DEC-049B` present in both.
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.

## Slice 6: Contracts/Templates Follow-Up Improvements

### Goal

Implement the small semantic corrections recommended by Slice 3 without a broad
schema/template rewrite.

### In Scope

- `maestro/contracts/task-packet.schema.json`
- `maestro/contracts/stage-handoff.schema.json`
- `maestro/contracts/approval.schema.json`
- `maestro/contracts/orchestration-plan.schema.json` only if T0 wording needs
  clarification
- `maestro/contracts/README.md`
- `maestro/templates/packet.md.tmpl`
- `.codex/contracts/*/contract.json` only for default-vs-machine-readable
  invocation wording
- current work artifact evidence/status

### Out Of Scope

- changing role roster
- broad schema rewrite
- deleting legacy `.codex/contracts/module_orchestrator`,
  `.codex/contracts/research_codebase`, or `.codex/contracts/brief_auditor`
- product code

### Checklist

- [x] Make packet/handoff expectations explicitly optional except when durable
      machine-readable continuity is required.
- [x] Clarify helper contract default invocation versus machine-readable
      invocation.
- [x] Align or document approval requirement names versus approval record
      `approval_type`.
- [x] Rename or constrain `stage-handoff` recommendation `approve` so helper
      agents cannot appear to approve owner gates.
- [x] Update `maestro/contracts/README.md` to match lazy-read policy.
- [x] Preserve compatibility for current release/closeout evidence paths.

### Acceptance Criteria

- Contracts no longer imply JSON packet/handoff for ordinary low-risk helper
  work.
- Release remains stricter where durable evidence is required.
- Owner approval remains distinct from specialist recommendations.
- Legacy contracts remain available only for old module-orchestrator runs.

### Checks

- JSON parse for `maestro/contracts/*.json` and `.codex/contracts/**/*.json`
- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- `git diff --check`
- focused `rg` for `handoff_expectations`, `approve`,
  `approval_type`, `default_invocation`, and lazy-read wording
- `scripts/ai/preflight.sh`

### Stop Conditions

- Stop if compatibility would require changing existing persisted artifact
  records.
- Stop if approval enum changes require owner decision before implementation.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/contracts/task-packet.schema.json`
  - `maestro/templates/packet.md.tmpl`
  - `maestro/contracts/stage-handoff.schema.json`
  - `maestro/contracts/approval.schema.json`
  - `maestro/contracts/orchestration-plan.schema.json`
  - `maestro/contracts/README.md`
  - `maestro/templates/approval.md.tmpl`
  - `maestro/docs/runtime-contract.md`
  - `maestro/docs/routing-tier-contract.md`
  - `.codex/contracts/{research_charlie,audit_grant,implementation_mason,verification_scout,review_lens,release_manager,closeout_scribe,memory_archivist,maestro_vnext}/contract.json`
  - this work artifact
- Result:
  - Task packets now require an explicit `output_mode`.
  - `handoff_expectations` can be empty for compact output modes and is
    required only for `handoff_json`.
  - Release packets remain stricter: release assignments require
    `output_mode: handoff_json`, handoff expectations, and
    `owner_release_approval`.
  - Active helper contracts now distinguish default compact invocation from
    machine-readable packet/handoff invocation.
  - `stage-handoff` uses `gate_ready` instead of ambiguous `approve`.
  - Approval requirement names now map explicitly to approval record
    `approval_type` values, including `owner_archive_approval` -> `archive`.
- Checks:
  - JSON parse for `maestro/contracts/*.json`, `.codex/contracts/**/*.json`,
    and `maestro/examples/**/*.json` passed.
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - `scripts/ai/preflight.sh` passed in lite mode.
  - Focused `rg` verified `handoff_expectations`, `output_mode`,
    `gate_ready`, approval mapping, and default/machine-readable invocation
    wording.
  - `jsonschema` package was not installed locally, so full schema validation
    beyond JSON parse was not run.

## Slice 7: Final Consistency Review

### Goal

Verify the new continuity/performance/memory planning and runtime changes do
not conflict with the previous human-agent symbiosis cleanup.

### In Scope

- files changed in Slices 1-6
- current work artifacts
- runtime docs, skills, memory route surfaces affected by this work

### Out Of Scope

- new feature work
- product code

### Checklist

- [x] Verify context continuity policy does not require artifacts for all T0
      work.
- [x] Verify helper lazy-read does not remove required constraints.
- [x] Verify contracts/templates audit recommendations are not accidentally
      implemented without approval.
- [x] Verify decisions-log plan is planning-only unless implementation was
      explicitly approved.
- [x] Verify no new agents were added without owner approval.
- [x] Verify contracts/templates follow-up, if implemented, matches Slice 3
      recommendations and does not revive ceremony.
- [x] Update evidence/closeout.

### Acceptance Criteria

- All accepted slices have evidence.
- Remaining risks and next recommended work are explicit.
- Active artifact status is accurate.

### Checks

- `python3 scripts/ai/docs_memory_check.py --check`
- `python3 scripts/ai/check-env-policy.py --check`
- `git diff --check`
- parse TOML/YAML/JSON when those surfaces changed
- `scripts/ai/preflight.sh` for non-trivial runtime docs/memory changes

### Stop Conditions

- Stop if final review finds a source-of-truth conflict requiring owner
  decision.

### Execution Evidence

- Status: `completed`
- Changed:
  - `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
  - `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
  - `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`
  - `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/closeout.md`
- Result:
  - T0 remains artifact-free by default; T1 promotion is continuity/risk driven.
  - Helper lazy-read preserves role constraints and keeps Release/Scribe stricter
    where durable records are core work.
  - Decisions-log split was owner-approved before implementation and preserves
    all 96 decisions.
  - No new active agent roles were added.
  - Contracts/templates follow-up implements the Slice 3 recommendations without
    reviving fixed-chain packet/handoff ceremony.
  - No source-of-truth conflict requiring owner decision was found.
- Checks:
  - Active skill directory inventory confirmed the nine expected roles:
    archivist, charlie, grant, lens, maestro, mason, release, scout, scribe.
  - Decision ID verification passed: 96 decisions in the index, 96 in topic
    files, no duplicate IDs, no missing IDs, and `DEC-049B` present in both.
  - JSON parse for `maestro/contracts/*.json`, `.codex/contracts/**/*.json`,
    and `maestro/examples/**/*.json` passed.
  - TOML parse for `.codex/agents/*.toml` passed.
  - YAML parse for `.agents/skills/*/agents/openai.yaml` passed.
  - Focused `rg` verified no active `stage-handoff` `approve` enum remains,
    compact/default invocation wording is present, and approval mapping is
    explicit.
  - `python3 scripts/ai/docs_memory_check.py --check` passed.
  - `python3 scripts/ai/check-env-policy.py --check` passed.
  - `git diff --check` passed.
  - `scripts/ai/preflight.sh` passed in lite mode.

## Suggested Next Step

Stage and commit this completed work when the owner is ready.
