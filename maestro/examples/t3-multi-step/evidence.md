# Evidence

- Work ID: `example-t3-runtime-cleanup`
- Shape: aggregate Markdown evidence log; individual machine-readable evidence
  items use `maestro/contracts/evidence.schema.json`.

## Summary

Example aggregate evidence for a multi-step runtime cleanup.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| runtime drift check | passed | `evidence-command-001.json` | Validator passed after cleanup. |

## Changed Files

- `maestro/docs/runtime-contract.md`
- `scripts/ai/runtime_drift_check.py`

## Browser / Visual Evidence

- Skipped; docs/runtime cleanup only.

## Review Evidence

- Manual Maestro diff review.

## Skipped Checks

- Product frontend/backend checks skipped; no product code changed.

## Residual Risks

- None for product runtime; example fixture only.
