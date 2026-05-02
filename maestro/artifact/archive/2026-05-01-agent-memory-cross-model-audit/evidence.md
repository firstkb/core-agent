# Evidence

- Work ID: `2026-05-01-agent-memory-cross-model-audit`

## Summary

Targeted repository reads and small machine checks verified the highest-risk claims from the two external reports. Follow-up model reviews of `final-order-plan.md` were integrated into the artifact. Current changes are limited to agent/runtime/docs infrastructure; no product FE/BE source code was changed. The work record has been closed and archived.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| Read current Maestro skill | passed | `.agents/skills/maestro/SKILL.md` | Confirmed current source-of-truth, artifact, compaction, plugin/tool, and hard-rule behavior. |
| Read runtime baseline | passed | `maestro/memory/START_HERE.md`, `maestro/memory/index/read-routes.yaml` | Confirmed memory baseline and lazy read policy. |
| Inspect registered vs present `.codex` agents | passed | Python registry diff | Found unregistered `foundation-explorer` and `foundation-reviewer`; no registered agent file missing. |
| Inspect `.codex/standards/runtime/artifact-governance.md` | passed | file read | Confirmed stale `artifacts/<module>` and CLI-owned lifecycle model. |
| Inspect standards read order | passed | `.codex/standards/README.md` | Confirmed stale artifact governance is still in active runtime read order. |
| Compare planning mode wording | passed | `maestro/docs/runtime-contract.md`, `maestro/docs/maestro-character.md`, `.agents/skills/maestro/SKILL.md` | Confirmed `maestro-character.md` says planning has no edits while runtime/skill allow lean artifacts. |
| Compare stage enums | passed | Python schema diff + targeted reads | Confirmed `intake` exists in orchestration plan and stage doc, but not task packet or handoff schema. |
| Inspect legacy contract template refs | passed | Python path resolution | Confirmed legacy contract template refs do not resolve relative to contract files or repo root. |
| Inspect approval mapping | passed | `maestro/contracts/README.md`, `approval.schema.json`, `approval.md.tmpl` | Confirmed README omits `runtime_restore` and `destructive_operation`. |
| Inspect template/schema alignment | passed | `packet.md.tmpl`, `review.md.tmpl`, `closeout.md.tmpl`, `evidence.md.tmpl`, related schemas | Confirmed several undocumented asymmetries and at least one missing closeout field. |
| Inspect decision references | passed | `decisions-log.md`, `decisions/*.md`, `START_HERE.md` | Confirmed active-looking decisions still reference removed `maestro/memory/runs/**` and `retired-runtime/**` paths. |
| Inspect frontend memory doc drift | passed | `doc-map.md`, `drift-report.md`, `target-docs-structure.md` | Confirmed doc-map read-order drift and stale `auth-runtime-followups.md` follow-up. |
| Check local browser auth tracking | passed | `git ls-files`, `git check-ignore` | Confirmed `maestro/memory/local/browser-use-auth.md` is ignored and not tracked. |
| Integrate follow-up reviews | passed | `final-order-plan.md` | Added hot-path definition, P0-A/P0-B split, validator v1/v2, traceability, per-slice DoD, owner approval boundaries, and negative acceptance criteria. |
| Docs/memory check | passed | `python3 scripts/ai/docs_memory_check.py --check` | Passed after Slice 1. |
| Env policy check | passed | `python3 scripts/ai/check-env-policy.py --check` | Passed after Slice 1. |
| Whitespace diff check | passed | `git diff --check` | Passed after Slice 1. |
| Trailing whitespace scan | passed | `rg -n '[ \\t]+$' maestro/artifact/active/2026-05-01-agent-memory-cross-model-audit scripts/ai/runtime_drift_check.py` | No trailing whitespace matches. |
| Slice 0 AGENTS line map | passed | `nl -ba AGENTS.md`, `platform/AGENTS.md`, lane `AGENTS.md`, `maestro/AGENTS.md` | Used exact line ranges to prepare `slice-0-edit-map.md`. |
| Validator surface inspection | passed | `scripts/ai/docs_memory_check.py`, `check-env-policy.py`, `preflight.sh` | Confirmed existing checks are small Python scripts plus shell preflight; validator v1 should follow this style. |
| Slice 1 validator self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Built-in known-bad cases detected expected drift categories. |
| Slice 1 validator report mode | passed | `python3 scripts/ai/runtime_drift_check.py --report` | Exited 0 and reported then-current known drift: foundation agents, legacy template paths, stale artifact governance. |
| Slice 1 validator check mode | expected_failed | `python3 scripts/ai/runtime_drift_check.py --check` | Exited 1 because P0-A drift was still present before Slice 2 cleanup. |
| Slice 1 validator syntax check | passed | `python3 -m py_compile scripts/ai/runtime_drift_check.py` | Python compile passed; generated `scripts/ai/__pycache__` was removed. |
| Slice 2 validator self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Self-test passed after P0-A cleanup. |
| Slice 2 validator report mode | passed | `python3 scripts/ai/runtime_drift_check.py --report` | Exited 0 and now reports only known P1 legacy template path drift. |
| Slice 2 validator check mode | expected_failed | `python3 scripts/ai/runtime_drift_check.py --check` | Exited 1 because P1 legacy template path drift remains intentionally unresolved in this slice. |
| Maestro contract JSON parse | passed | inline `json.loads` over `maestro/contracts/*.json` | JSON schemas parse after `intake` description updates. |
| Slice 3 responsibility scan | passed | `rg` over platform/lane/Maestro `AGENTS.md` | No lane file defines T0-T4 mechanics, browser evidence policy, or agent delegation policy; remaining mentions point ownership back to Maestro/root/runtime-contract. |
| Slice 3 validator self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Self-test passed after AGENTS responsibility cleanup. |
| Slice 3 validator report mode | passed | `python3 scripts/ai/runtime_drift_check.py --report` | Exited 0 and still reports only known P1 legacy template path drift. |
| Slice 3 validator check mode | expected_failed | `python3 scripts/ai/runtime_drift_check.py --check` | Exited 1 because P1 legacy template path drift remains intentionally unresolved until contract/template hygiene. |
| Slice 3 docs/memory check | passed | `python3 scripts/ai/docs_memory_check.py --check` | Passed after AGENTS responsibility cleanup. |
| Slice 3 env policy check | passed | `python3 scripts/ai/check-env-policy.py --check` | Passed after AGENTS responsibility cleanup. |
| Slice 3 whitespace diff check | passed | `git diff --check` | Passed after AGENTS responsibility cleanup. |
| Slice 3 trailing whitespace scan | passed | `rg -n '[ \\t]+$' ...` | No trailing whitespace matches in changed runtime/artifact files. |
| Slice 4 legacy decision cleanup | passed | `decisions-log.md`, `decisions/legacy-retirement-provenance.md`, `decisions/agent-runtime-workflow.md` | DEC-060 and DEC-062 now read as superseded by DEC-088; DEC-080 no longer points to a removed run artifact as an active source. |
| Slice 4 frontend docs cleanup | passed | `doc-map.md`, `drift-report.md`, `target-docs-structure.md` | Frontend doc-map read order now starts from START_HERE/read-routes; stale auth follow-up rewrite item removed; target docs distinguish landed slices from future-only paths. |
| Slice 4 docs/memory check | passed | `python3 scripts/ai/docs_memory_check.py --check` | Passed after legacy memory cleanup. |
| Slice 4 env policy check | passed | `python3 scripts/ai/check-env-policy.py --check` | Passed after legacy memory cleanup. |
| Slice 4 validator self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Self-test passed after legacy memory cleanup. |
| Slice 4 validator report mode | passed | `python3 scripts/ai/runtime_drift_check.py --report` | Exited 0 and still reports only known P1 legacy template path drift. |
| Slice 4 validator check mode | expected_failed | `python3 scripts/ai/runtime_drift_check.py --check` | Exited 1 because P1 legacy template path drift remains intentionally unresolved until contract/template hygiene. |
| Slice 4 route old-path scan | passed | `rg` over `START_HERE.md`, `read-routes.yaml`, and frontend docs memory files | No active read route promotes old runtime roots; remaining matches are historical/prohibition wording. |
| Slice 4 whitespace diff check | passed | `git diff --check` | Passed after legacy memory cleanup. |
| Slice 4 trailing whitespace scan | passed | `rg -n '[ \\t]+$' ...` | No trailing whitespace matches in changed artifact/memory files. |
| Slice 5 approval mapping | passed | `maestro/contracts/README.md` | Added direct `runtime_restore` and `destructive_operation` approval record type mapping. |
| Slice 5 schema/template mapping | passed | `maestro/docs/template-schema-mapping.md` | Documented evidence, closeout, packet, review, release handoff, metadata, and adaptive stage-role mapping. |
| Slice 5 legacy template path cleanup | passed | `.codex/contracts/module_orchestrator`, `.codex/contracts/research_codebase`, `.codex/contracts/brief_auditor` | Legacy template refs now resolve to `.codex/templates/**`. |
| Slice 5 validator enhancement | passed | `scripts/ai/runtime_drift_check.py` | Template path scan now includes `support_templates` maps in addition to `template` keys. |
| Slice 5 validator self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Self-test passed after validator enhancement. |
| Slice 5 validator check mode | passed | `python3 scripts/ai/runtime_drift_check.py --check` | Runtime drift check is green after contract/template hygiene. |
| Slice 5 Python compile | passed | `python3 -m py_compile scripts/ai/runtime_drift_check.py` | Compile passed; generated `scripts/ai/__pycache__` was removed. |
| Slice 5 JSON parse | passed | `python3 -c '...'` over `maestro/contracts/*.json` and `.codex/contracts/*/contract.json` | Parsed 18 JSON contract files successfully. |
| Slice 5 docs/memory check | passed | `python3 scripts/ai/docs_memory_check.py --check` | Passed after contract/template hygiene. |
| Slice 5 env policy check | passed | `python3 scripts/ai/check-env-policy.py --check` | Passed after contract/template hygiene. |
| Slice 5 whitespace diff check | passed | `git diff --check` | Passed after contract/template hygiene. |
| Slice 5 trailing whitespace scan | passed | `rg -n '[ \\t]+$' ...` | No trailing whitespace matches in changed artifact/contract/template/doc files. |
| Slice 6 validator v2 self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Self-test now covers nickname ambiguity, openai.yaml shape, route drift, template refs, local auth tracking, orphan agents, missing contracts, and old lifecycle terms. |
| Slice 6 validator check mode | passed | `python3 scripts/ai/runtime_drift_check.py --check` | Runtime drift check passes with v2 checks enabled. |
| Slice 6 preflight docs mode | passed | `scripts/ai/preflight.sh --docs` | Preflight now runs docs/memory, env policy, and runtime drift checks. |
| Slice 6 Python compile | passed | `python3 -m py_compile scripts/ai/runtime_drift_check.py` | Compile passed; generated `scripts/ai/__pycache__` was removed. |
| Slice 6 JSON parse | passed | `python3 -c '...'` over `maestro/contracts/*.json` and `.codex/contracts/*/contract.json` | Parsed 18 JSON contract files successfully after validator v2 changes. |
| Slice 6 whitespace diff check | passed | `git diff --check` | Passed after validator v2 and preflight wiring. |
| Slice 6 changed-file trailing whitespace scan | passed | `rg -n '[ \\t]+$' ...` over changed files | No trailing whitespace matches in changed files. A broader repository scan found unrelated pre-existing whitespace outside this slice. |
| Slice 7 examples added | passed | `maestro/examples/t3-multi-step/**` | Added T3 continuity example with `work.md`, aggregate `evidence.md`, one evidence JSON item, and a minimal orchestration plan. |
| Slice 7 Maestro skill compaction | passed | `wc -l .agents/skills/maestro/SKILL.md` | Maestro skill compacted from 343 lines to 243 lines while preserving required hot-path rules. |
| Slice 7 helper skill review | passed | `wc -l .agents/skills/*/SKILL.md` and targeted reads | Helper skills are already compact; no new standards references were added to avoid prompt bloat. |
| Slice 7 governance rule | passed | `maestro/docs/runtime-contract.md` | Added lightweight critical runtime file owner-review expectation without adding a fixed workflow chain. |
| Slice 7 docs/memory check | passed | `python3 scripts/ai/docs_memory_check.py --check` | Passed after examples, governance rule, and skill compaction. |
| Slice 7 runtime drift check | passed | `python3 scripts/ai/runtime_drift_check.py --check` | Passed after examples, governance rule, and skill compaction. |
| Slice 7 example JSON parse | passed | `python3 -c '...'` over `maestro/examples/**/*.json` | Parsed 4 example JSON files successfully. |
| Slice 7 preflight docs mode | passed | `scripts/ai/preflight.sh --docs` | Passed after Slice 7; includes docs/memory, env policy, and runtime drift checks. |
| Slice 7 validator self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Self-test passed after Slice 7. |
| Slice 7 contract JSON parse | passed | `python3 -c '...'` over `maestro/contracts/*.json` and `.codex/contracts/*/contract.json` | Parsed 18 contract JSON files successfully after Slice 7. |
| Slice 7 whitespace diff check | passed | `git diff --check` | Passed after Slice 7. |
| Slice 7 changed-file trailing whitespace scan | passed | `rg -n '[ \\t]+$' ...` | No trailing whitespace matches in changed Slice 7 files. |
| Final P3 guardrail reconciliation | passed | `final-order-plan.md`, `START_HERE.md`, `.gitignore`, `runtime_drift_check.py` | Marked already-complete local memory/auth guardrails and added a soft current-state compaction trigger. |
| Final artifact archive | passed | `mv maestro/artifact/active/2026-05-01-agent-memory-cross-model-audit maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit` | Closed work record moved from active to archive. |
| Final preflight docs mode | passed | `scripts/ai/preflight.sh --docs` | Passed after final checklist reconciliation and archive closeout; includes docs/memory, env policy, and runtime drift checks. |
| Final validator self-test | passed | `python3 scripts/ai/runtime_drift_check.py --self-test` | Runtime drift self-test passed after final closeout edits. |
| Final whitespace diff check | passed | `git diff --check` | Passed after final closeout edits. |

## Changed Files

- `maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/work.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/report.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/evidence.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/final-order-plan.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/slice-0-edit-map.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/validator-v1-spec.md`
- `maestro/artifact/archive/2026-05-01-agent-memory-cross-model-audit/closeout.md`
- `scripts/ai/runtime_drift_check.py`
- `.codex/standards/README.md`
- `.codex/standards/runtime/artifact-governance.md`
- `maestro/AGENTS.md`
- `maestro/contracts/orchestration-plan.schema.json`
- `maestro/contracts/stage-handoff.schema.json`
- `maestro/contracts/task-packet.schema.json`
- `maestro/docs/maestro-character.md`
- `maestro/docs/stage-contract.md`
- `platform/AGENTS.md`
- `platform/frontend/AGENTS.md`
- `platform/backend/AGENTS.md`
- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/durable/decisions/legacy-retirement-provenance.md`
- `maestro/memory/durable/decisions/agent-runtime-workflow.md`
- `maestro/memory/docs/frontend/doc-map.md`
- `maestro/memory/docs/frontend/drift-report.md`
- `maestro/memory/docs/target-docs-structure.md`
- `maestro/contracts/README.md`
- `maestro/contracts/evidence.schema.json`
- `maestro/contracts/stage-handoff.schema.json`
- `maestro/contracts/task-packet.schema.json`
- `maestro/templates/evidence.md.tmpl`
- `maestro/templates/closeout.md.tmpl`
- `maestro/templates/packet.md.tmpl`
- `maestro/templates/review.md.tmpl`
- `maestro/docs/template-schema-mapping.md`
- `maestro/docs/README.md`
- `maestro/README.md`
- `maestro/docs/stage-contract.md`
- `maestro/docs/agent-contracts.md`
- `.agents/skills/release/SKILL.md`
- `.codex/contracts/module_orchestrator/contract.json`
- `.codex/contracts/research_codebase/contract.json`
- `.codex/contracts/brief_auditor/contract.json`
- `scripts/ai/preflight.sh`
- `.agents/skills/maestro/SKILL.md`
- `maestro/docs/runtime-contract.md`
- `maestro/examples/README.md`
- `maestro/memory/START_HERE.md`
- `maestro/examples/t3-multi-step/work.md`
- `maestro/examples/t3-multi-step/evidence.md`
- `maestro/examples/t3-multi-step/evidence-command-001.json`
- `maestro/examples/t3-multi-step/orchestration-plan.json`

## Removed Files

- `.codex/agents/foundation-explorer.toml`
- `.codex/agents/foundation-reviewer.toml`

## Skipped Checks

- Full `scripts/ai/preflight.sh --full`: skipped because this work changes
  agent/runtime/docs infrastructure only. `scripts/ai/preflight.sh --docs` and
  targeted runtime checks were run instead.

## Residual Risks

- The report did not audit all platform source code; that was intentionally out of scope.
- `memory-index.yaml` path validation remains deferred; Slice 6 intentionally
  implemented selective v2 checks only.
- Helper skill standard references remain deferred unless repeated misses show
  they would improve outcomes more than they increase prompt weight.
