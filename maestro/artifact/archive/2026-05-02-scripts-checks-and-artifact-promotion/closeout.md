# Closeout

- Work ID: `2026-05-02-scripts-checks-and-artifact-promotion`
- Result: `complete`
- Owner input required: `false`
- Closed at: `2026-05-02 09:24:03 EDT`

## What Changed

- Renamed active check tooling from `scripts/ai/**` to `scripts/preflight.sh`
  plus `scripts/checks/**`.
- Updated preflight, docs-memory check, env policy check, runtime drift check,
  CI workflow paths, active docs, memory, and examples to the new paths.
- Added a guard that fails if the retired `scripts/ai` folder reappears.
- Added the approved Maestro artifact promotion rule to the skill,
  `runtime-contract.md`, and `START_HERE.md`.
- Recorded durable decisions DEC-096 and DEC-097.
- Repeat scripts-link audit found and fixed one missed active reference in
  root `README.md`.

## Evidence

- `evidence.md`

## Checks

| Check | Status | Notes |
|---|---|---|
| `scripts/preflight.sh --docs` | `passed` | Required docs/runtime checks pass with the new layout. |
| `python3 scripts/checks/runtime_drift_check.py --self-test` | `passed` | Runtime drift validator self-test passes. |
| Python compile | `passed` | All moved Python check scripts compile. |
| `git diff --check` | `passed` | No whitespace errors. |
| Repeat old-path scan | `passed` | No active old command path references remain; remaining `scripts/ai/**` mentions are guard/provenance only. |

## Approvals

- Owner explicitly approved the script layout change and artifact promotion
  rule in chat.

## Residual Risks

- Full product preflight was not run because this did not touch product FE/BE
  source code.
- Historical archive/provenance references to `scripts/ai/**` remain where they
  describe old facts.

## Follow-ups

- Stage and commit if the owner wants this slice committed now.

## Archive

- Active root:
  `maestro/artifact/active/2026-05-02-scripts-checks-and-artifact-promotion/`
- Archived to:
  `maestro/artifact/archive/2026-05-02-scripts-checks-and-artifact-promotion/`
