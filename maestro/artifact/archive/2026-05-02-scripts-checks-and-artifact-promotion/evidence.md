# Evidence

- Work ID: `2026-05-02-scripts-checks-and-artifact-promotion`

## Summary

Renamed the repository check tooling layout, updated active references, and
codified the owner-approved Maestro artifact promotion rule. No product FE/BE
source code was changed.

## Checks

| Check | Status | Notes |
|---|---|---|
| `scripts/preflight.sh --docs` | passed | Includes docs/memory, env policy, and runtime drift checks through the new paths. |
| `python3 scripts/checks/runtime_drift_check.py --self-test` | passed | Validator self-test passes after the path rename. |
| `python3 -m py_compile scripts/checks/docs_memory_check.py scripts/checks/check_env_policy.py scripts/checks/runtime_drift_check.py` | passed | Check scripts compile after relocation. |
| `git diff --check` | passed | No whitespace errors in the current diff. |
| Repeat old-path scan | passed | Found and fixed one missed active `README.md` reference. Remaining `scripts/ai/**` mentions are guard/provenance references only. |

## Changed Surfaces

- `scripts/preflight.sh`
- `scripts/checks/**`
- `.github/workflows/docs-memory-check.yml`
- `README.md`
- `AGENTS.md`
- `platform/AGENTS.md`
- `.agents/skills/maestro/SKILL.md`
- `maestro/docs/runtime-contract.md`
- `maestro/memory/START_HERE.md`
- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/durable/decisions/agent-runtime-workflow.md`
- `maestro/memory/durable/current-state.md`

## Skipped Checks

- Full `scripts/preflight.sh --full`: skipped because this is a runtime/docs
  tooling rename and policy update, not product FE/BE implementation.

## Residual Risks

- Historical archived evidence still contains the old command paths by design.
- Some superseded/provenance decisions still mention retired `scripts/ai/**`
  files as historical sources.
