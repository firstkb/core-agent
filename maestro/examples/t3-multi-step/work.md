# Work

- Work ID: `example-t3-runtime-cleanup`
- Status: `in_progress`
- Owner goal: Clean up a runtime documentation drift without changing product code.

## Understanding

The owner wants one linear cleanup that may take several steps: inspect current
runtime docs, patch the smallest stale surfaces, verify mechanical checks, and
record what remains.

## Agreed Scope

- In: `maestro/docs/**`, `maestro/templates/**`, `scripts/checks/**`
- Out: product frontend/backend source, releases, migrations, destructive cleanup

## Continuity Snapshot

- Latest owner correction: keep this practical and avoid ceremony
- Current phase: `in_progress`
- Artifact path: `maestro/artifact/active/2026-04-30-example-t3-runtime-cleanup/`
- Gates / approvals: none
- Evidence status: targeted docs/runtime checks pending
- Unresolved owner decisions: none
- Next allowed action: run targeted validator and docs checks

## Decisions

- Use one work record for the linear cleanup; do not split into separate work
  unless owner scope changes.

## Plan

1. Inspect only the runtime surfaces named in the scope.
2. Patch stale wording and template/schema drift.
3. Run targeted validator and docs checks.
4. Close out with residual risks and one useful next step.

## Risks / Gates

- No high-risk product surfaces are in scope.

## Agent / Tool Notes

- Maestro can execute inline.
- Scout or Lens is optional only if verification or review risk becomes
  material.

## Evidence

- See `evidence.md`.

## Next Action

Run targeted checks and update evidence.
