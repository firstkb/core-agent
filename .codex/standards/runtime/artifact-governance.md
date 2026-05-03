# Artifact Governance Standard

## Ownership

- Maestro owns the active vNext work record and decides the smallest useful
  artifact shape.
- Specialists may write assigned notes, evidence, or handoffs only when Maestro
  assigns that output.
- Product code, tests, and unrelated docs are changed only when the owner task
  or Maestro assignment explicitly includes that scope.
- Owner approval records are created only for real gates: high-risk
  implementation, production impact, migrations, tenant/auth/security,
  release, destructive actions, runtime restore, memory root moves, or archive
  decisions that need owner confirmation.

## Active Path Model

New Maestro-routed work uses the flat vNext artifact model:

- active root: `maestro/artifact/active/YYYY-MM-DD-<work-slug>/`
- archive root: `maestro/artifact/archive/YYYY-MM-DD-<work-slug>/`
- normal files: `work.md`, `evidence.md`, `closeout.md`
- optional escalation files: `agent-<role>-NNN.md`, `packet.md`,
  `approval-*.json`, `handoff-<stage>-<role>-NNN.json`

## Persistence

- Persisted artifacts stay in English.
- Use `work.md` as the T1+ continuity anchor.
- Use `evidence.md` for compact checks, browser/visual evidence, skipped
  checks, and residual risk.
- Use `closeout.md` when the result, evidence, and follow-ups need a durable
  summary.
- Use optional `findings.md` when owner manual testing or review surfaces
  several related defects/observations that need stable IDs, status, fixed
  commit, and verification without bloating `work.md`.
- Use machine-readable packets or handoffs only when delegation, auditability,
  resume, release evidence, or accountability genuinely needs them.
- Do not create artifacts that will not help a new chat continue the work,
  review evidence, preserve a real decision, or close the task.

## Validation

- Validate JSON records against the relevant schema when they are created or
  changed.
- Validate Markdown artifact files by preserving required headings from the
  selected template when a template is used.
- Do not treat chat summaries, specialist recommendations, or compaction
  summaries as owner approval.
- Do not invent a second lifecycle state outside the active vNext artifact
  model.

## Legacy Compatibility

The legacy `artifacts/<module>/...` tree is for old module-orchestrator
continuation only. Do not start new Maestro vNext work there, and do not convert
old module artifacts into vNext folders unless the owner explicitly asks for
historical reconstruction.
