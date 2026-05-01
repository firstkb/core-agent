# Evidence

- Work ID: `2026-05-01-agent-memory-continuity-improvements`
- Status: `completed`
- Scope: agent, memory, contract/template, and context continuity improvements.

## Slice 1: Context Compaction Continuity Runtime

### Summary

Implemented Maestro runtime continuity behavior for automatic context
compaction, resume, and interruption without making artifacts mandatory for T0
work.

### Changed Files

- `maestro/docs/runtime-contract.md`
- `.agents/skills/maestro/SKILL.md`
- `.codex/agents/maestro_vnext.toml`
- `maestro/templates/work.md.tmpl`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/context-continuity-policy.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`

### Checks

| Check | Status | Notes |
|---|---|---|
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | Docs/memory policy check. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | Env policy check. |
| `git diff --check` | `passed` | Diff hygiene. |
| `.codex/agents/*.toml` parse with Python `tomllib` | `passed` | Agent config syntax. |
| Focused `rg` for compaction/T0/T1/approval/archive wording | `passed` | Checked changed runtime surfaces. |
| `scripts/ai/preflight.sh` | `passed` | Lite mode. |

### Skipped Checks

- Browser/visual checks: not applicable; no product UI changed.
- Product tests/builds: not applicable; no product code changed.

### Residual Risks

- Helper lazy-read cleanup was completed in Slice 2.
- Contracts/templates audit was completed in Slice 3, with follow-up
  implementation in Slice 6.

## Slice 2: Helper Agent Lazy-Read

### Summary

Reduced helper-agent hot-path schema loading while keeping exact
machine-readable contracts available when assignments require durable handoffs,
structured evidence, approval validation, or release/closeout records.

### Changed Files

- `.codex/agents/research_charlie.toml`
- `.codex/agents/audit_grant.toml`
- `.codex/agents/implementation_mason.toml`
- `.codex/agents/verification_scout.toml`
- `.codex/agents/review_lens.toml`
- `.codex/agents/release_manager.toml`
- `.agents/skills/charlie/SKILL.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`

### Checks

| Check | Status | Notes |
|---|---|---|
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | Docs/memory policy check. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | Env policy check. |
| `git diff --check` | `passed` | Diff hygiene. |
| `.codex/agents/*.toml` parse with Python `tomllib` | `passed` | Agent config syntax. |
| `.agents/skills/*/agents/openai.yaml` parse with Ruby YAML | `passed` | Launch prompt syntax. |
| Focused `rg` for eager schema reads and lazy-read wording | `passed` | Verified strict exceptions for Scribe/Release. |
| `scripts/ai/preflight.sh` | `passed` | Lite mode. |

### Skipped Checks

- Browser/visual checks: not applicable; no product UI changed.
- Product tests/builds: not applicable; no product code changed.

### Residual Risks

- Contracts/templates audit was completed in Slice 3, with follow-up
  implementation in Slice 6.
- `decisions-log.md` restructuring was planned in Slice 4 and implemented in
  Slice 5 after owner instruction.

## Slice 3: Contracts/Templates Semantic Audit

### Summary

Audited Maestro vNext contracts and templates for drift, legacy assumptions,
fixed-chain orchestration pressure, packet/handoff ceremony, active role naming,
adaptive delegation support, gates, evidence, and closeout semantics.

### Changed Files

- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/contracts-templates-semantic-audit.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`

### Checks

| Check | Status | Notes |
|---|---|---|
| JSON parse for `maestro/contracts/*.json` and `.codex/contracts/**/*.json` | `passed` | Contract syntax. |
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | Docs/memory policy check. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | Env policy check. |
| `git diff --check` | `passed` | Diff hygiene. |
| Focused `rg` for fixed-chain, legacy naming, artifact paths, required packet/handoff wording, approval, and recommendation semantics | `passed` | Audit search coverage. |
| `scripts/ai/preflight.sh` | `passed` | Lite mode. |

### Skipped Checks

- Browser/visual checks: not applicable; no product UI changed.
- Product tests/builds: not applicable; no product code changed.

### Residual Risks

- Audit follow-up schema/template corrections were implemented in Slice 6.
- `decisions-log.md` restructuring was planned in Slice 4 and implemented in
  Slice 5 after owner instruction.

## Slice 4: Decisions Log Restructure Plan

### Summary

Planned a low-bureaucracy restructuring of `decisions-log.md` into a lightweight
index plus topic files, without moving or rewriting decision content in this
slice.

### Changed Files

- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/decisions-log-restructure-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`

### Checks

| Check | Status | Notes |
|---|---|---|
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | Docs/memory policy check. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | Env policy check. |
| `git diff --check` | `passed` | Diff hygiene. |
| Focused `rg` for decision IDs, duplicate headings, legacy references, and routing references | `passed` | Planning audit coverage. |
| `scripts/ai/preflight.sh` | `passed` | Lite mode. |

### Skipped Checks

- Browser/visual checks: not applicable; no product UI changed.
- Product tests/builds: not applicable; no product code changed.

### Residual Risks

- The split was implemented mechanically in Slice 5 after owner instruction.
- Semantic decision pruning remains intentionally out of scope for this
  workstream.

## Plan Adjustment After Slice 4

### Summary

Owner cancelled the prior Slice 5 agent hiring criteria review and requested a
new implementation slice before contracts/templates follow-up to execute the
accepted Slice 4 `decisions-log.md` restructure plan.

### Changed Files

- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/open-questions-prep.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`

### Result

- Slice 5 is now `Decisions Log Restructure Implementation`.
- Contracts/templates follow-up remains Slice 6.
- Final consistency review remains Slice 7.
- Agent hiring criteria review is cancelled for this workstream unless the
  owner reopens it.
- Older topic-file wording in `open-questions-prep.md` now points to the
  accepted Slice 4 plan to avoid conflicting split structures.

## Slice 5: Decisions Log Restructure Implementation

### Summary

Implemented the accepted `decisions-log.md` split as a mechanical docs/memory
change: compact index plus four topic files, without semantic rewriting,
renumbering, or changing the default memory baseline.

### Changed Files

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
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`

### Checks

| Check | Status | Notes |
|---|---|---|
| Decision ID coverage script | `passed` | 96 index rows, 96 topic entries, no duplicate IDs, no missing IDs, `DEC-049B` present in both. |
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | Docs/memory policy check, including new decision topic provenance allowance. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | Env policy check. |
| `git diff --check` | `passed` | Diff hygiene. |
| `scripts/ai/preflight.sh` | `passed` | Lite mode. |

### Skipped Checks

- Browser/visual checks: not applicable; no product UI changed.
- Product tests/builds: not applicable; no product code changed.

### Residual Risks

- This slice intentionally did not semantically rewrite decision text; old
  provenance references remain inside decision topic files.
- Contracts/templates semantic follow-up was handled in Slice 6 below.

## Slice 6: Contracts/Templates Follow-Up Improvements

### Summary

Implemented the focused schema/template corrections from the Slice 3 audit:
packet output modes, optional handoff expectations, helper default-vs-machine
readable invocation, approval mapping, and non-authoritative handoff
recommendations.

### Changed Files

- `maestro/contracts/task-packet.schema.json`
- `maestro/templates/packet.md.tmpl`
- `maestro/contracts/stage-handoff.schema.json`
- `maestro/contracts/approval.schema.json`
- `maestro/contracts/orchestration-plan.schema.json`
- `maestro/contracts/README.md`
- `maestro/templates/approval.md.tmpl`
- `maestro/docs/runtime-contract.md`
- `maestro/docs/routing-tier-contract.md`
- `.codex/contracts/research_charlie/contract.json`
- `.codex/contracts/audit_grant/contract.json`
- `.codex/contracts/implementation_mason/contract.json`
- `.codex/contracts/verification_scout/contract.json`
- `.codex/contracts/review_lens/contract.json`
- `.codex/contracts/release_manager/contract.json`
- `.codex/contracts/closeout_scribe/contract.json`
- `.codex/contracts/memory_archivist/contract.json`
- `.codex/contracts/maestro_vnext/contract.json`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`

### Checks

| Check | Status | Notes |
|---|---|---|
| JSON parse for `maestro/contracts/*.json`, `.codex/contracts/**/*.json`, and `maestro/examples/**/*.json` | `passed` | 47 JSON files parsed. |
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | Docs/memory policy check. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | Env policy check. |
| `git diff --check` | `passed` | Diff hygiene. |
| Focused `rg` for handoff/output/approval/default invocation terms | `passed` | Verified expected terms and removed active `approve` handoff enum. |
| `scripts/ai/preflight.sh` | `passed` | Lite mode. |

### Skipped Checks

- Full JSON Schema validation: skipped because Python `jsonschema` is not
  installed locally.
- Browser/visual checks: not applicable; no product UI changed.
- Product tests/builds: not applicable; no product code changed.

### Residual Risks

- The schema now adds `output_mode` to machine-readable task packets. No current
  persisted packet JSON exists in the active artifact tree, so compatibility
  risk is low.
- Full schema validation can be added later if the project adds a local
  JSON Schema validator dependency.

## Slice 7: Final Consistency Review

### Summary

Reviewed the completed slices for source-of-truth conflicts, duplicated policy,
stale status wording, unwanted ceremony, decision coverage, role roster drift,
and closeout readiness.

### Changed Files

- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/implementation-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/evidence.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-continuity-improvements/closeout.md`

### Checks

| Check | Status | Notes |
|---|---|---|
| Active skill directory inventory | `passed` | Exactly nine expected roles: archivist, charlie, grant, lens, maestro, mason, release, scout, scribe. |
| Decision ID coverage script | `passed` | 96 index rows, 96 topic entries, no duplicate IDs, no missing IDs, `DEC-049B` present in both. |
| JSON parse for `maestro/contracts/*.json`, `.codex/contracts/**/*.json`, and `maestro/examples/**/*.json` | `passed` | 47 JSON files parsed. |
| `.codex/agents/*.toml` parse with Python `tomllib` | `passed` | Agent config syntax. |
| `.agents/skills/*/agents/openai.yaml` parse with Ruby YAML | `passed` | Launch prompt syntax. |
| Focused `rg` consistency scan | `passed` | Confirmed compact/default invocation, approval mapping, `gate_ready`, and no active `stage-handoff` `approve` enum. |
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | Docs/memory policy check. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | Env policy check. |
| `git diff --check` | `passed` | Diff hygiene. |
| `scripts/ai/preflight.sh` | `passed` | Lite mode. |

### Skipped Checks

- Browser/visual checks: not applicable; no product UI changed.
- Product tests/builds: not applicable; no product code changed.
- Full JSON Schema validation: skipped because Python `jsonschema` is not
  installed locally.

### Residual Risks

- Full JSON Schema validation remains unavailable until a local validator
  dependency is added.
- Future semantic pruning of decision text should be a separate owner-approved
  slice, not part of this mechanical restructuring.
