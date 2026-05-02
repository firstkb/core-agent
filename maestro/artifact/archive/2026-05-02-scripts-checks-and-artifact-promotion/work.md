# Work

- Work ID: `2026-05-02-scripts-checks-and-artifact-promotion`
- Status: `closed`
- Owner goal: Rename root check scripts from `scripts/ai/**` to clearer
  repo-level paths and codify when Maestro creates or promotes work artifacts.
- Mode: execution
- Scope: script paths, active runtime/docs/memory references, Maestro artifact
  creation policy.
- Out of scope: product FE/BE code, broad legacy archive rewrites, commit unless
  owner asks.

## Owner Decisions

- Approved new script structure:
  - `scripts/preflight.sh`
  - `scripts/checks/docs_memory_check.py`
  - `scripts/checks/check_env_policy.py`
  - `scripts/checks/runtime_drift_check.py`
- Approved artifact promotion wording:
  - Maestro does not create artifacts for every chat turn.
  - Maestro creates or promotes to a work artifact as soon as continuity,
    evidence, future resume, multi-step execution, owner decision, or
    file-change accountability matters.

## Plan

1. Move the scripts and update internal calls.
2. Update active hot-path docs and examples from `scripts/ai/**` to the new
   paths.
3. Add the artifact promotion rule to Maestro runtime hot paths.
4. Run docs preflight and targeted checks.

## Notes

- Historical archived evidence can keep old command paths unless it is part of
  this active work record.
- If active docs mention old paths as historical provenance, keep the historical
  context clear instead of rewriting history into a false present.

## Result

- Moved repo check tooling to:
  - `scripts/preflight.sh`
  - `scripts/checks/docs_memory_check.py`
  - `scripts/checks/check_env_policy.py`
  - `scripts/checks/runtime_drift_check.py`
- Updated active docs, memory, examples, CI workflow paths, and validator
  internals to use the new layout.
- Retired `scripts/ai/**` as an active checks folder and added a docs-memory
  guard so it does not reappear.
- Added the approved artifact promotion rule to Maestro skill,
  `runtime-contract.md`, and `START_HERE.md`.
- Recorded the durable workflow decisions as DEC-096 and DEC-097.
- Repeat scripts-link audit found and fixed one missed active reference in
  root `README.md`; no active old command path references remain.

## Checks

- `scripts/preflight.sh --docs` passed.
- `python3 scripts/checks/runtime_drift_check.py --self-test` passed.
- `python3 -m py_compile scripts/checks/docs_memory_check.py scripts/checks/check_env_policy.py scripts/checks/runtime_drift_check.py` passed.
- `git diff --check` passed.
- Repeat scripts-link audit passed after the README fix. Remaining
  `scripts/ai/**` mentions are guard/provenance references only.
