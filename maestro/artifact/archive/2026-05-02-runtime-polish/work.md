# Work

- Work ID: `2026-05-02-runtime-polish`
- Status: `closed`
- Owner goal: Apply one small cleanup slice after the external audit review,
  focused on residual wording and example drift rather than new architecture.
- Mode: execution
- Scope: root/runtime docs, Maestro artifact README, memory read wording,
  examples, `.gitignore`.
- Out of scope: new agents, snapshot mode, major validator rewrite, product
  FE/BE code, commit unless owner asks.

## Plan

1. Clarify legacy `artifacts/<module>` wording in root read policy.
2. Update `maestro/artifact/README.md` so `work.md` is the normal baseline.
3. Clarify broad `platform/**` read avoidance without blocking exact target
   files.
4. Refresh stale T1/T2 examples against current templates.
5. Fix minor path/noise issues in `maestro/docs/README.md` and `.gitignore`.
6. Run targeted docs/runtime checks and close the artifact.

## Result

- Clarified root `AGENTS.md` so `artifacts/<module>` is explicit legacy
  module-orchestrator continuation only.
- Updated `maestro/artifact/README.md` to make `work.md` the normal continuity
  anchor and packets/handoffs/approvals optional escalation files.
- Reworded memory read guidance to avoid broad `platform/**` globs without
  blocking exact target files and routed canonical docs.
- Refreshed T1/T2 examples to current `work.md`, evidence, and closeout shapes.
- Fixed `maestro/docs/README.md` path ambiguity and removed stale plural
  `maestro/artifacts` ignore rules.

## Checks

- `scripts/preflight.sh --docs` passed.
- `python3 scripts/checks/runtime_drift_check.py --self-test` passed.
- `python3 -m py_compile scripts/checks/docs_memory_check.py scripts/checks/check_env_policy.py scripts/checks/runtime_drift_check.py` passed.
- JSON parse passed for 22 example/contract files.
- `git diff --check` passed.
