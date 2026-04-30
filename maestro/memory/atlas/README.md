# Atlas Operational Layer

Status: active operational workflow
Scope: Atlas prompts, templates, run scaffolding, and version metadata

This folder is the active Atlas workflow surface for platform product work.
It replaced the default operational role of the former
`platform/docs/ai/prompts/**`, `platform/docs/ai/templates/**`,
`platform/docs/ai/runs/**`, and `platform/docs/ai/automation-*.json|md`
surfaces. The former `platform/docs/ai/**` directory has been migrated and
deleted; use compact import records and git history for provenance.

## Active Surfaces

- `automation-manifest.json`: version source for Atlas prompt/template/scaffolder metadata.
- `automation-changelog.md`: operational changelog for Atlas workflow changes after the cutover.
- `platform-docs-ai-retirement-plan.md`: final retirement plan for the former `platform/docs/ai/**` layer.
- `platform-docs-ai-retirement-readiness.md`: final deletion audit for the former `platform/docs/ai/**` layer.
- `legacy-runs-triage.md`: triage state for former `platform/docs/ai/runs/**` artifacts.
- `prompts/`: base prompt contracts for Atlas control, frontend lane, and backend lane.
- `templates/`: artifact templates used by the run scaffolder, handoff prompts, UI task packets, and compact agent evidence blocks.
- `../runs/active/`: active Atlas run artifacts.
- `../runs/archive/`: closed or superseded Atlas run artifacts.
- `../../scripts/ai/new-run.py`: mechanical run scaffolder.
- `../../scripts/ai/automation_versions.py`: version mirror checker/writer.

## Read Rule

For task routing, read `maestro/memory/START_HERE.md`, then
`maestro/memory/index/read-routes.yaml` before opening product docs.
Use `maestro/memory/index/memory-index.yaml` only when broader routing is needed.

Do not open or recreate the former `platform/docs/ai/**` path. Use
`maestro/memory/durable/legacy-memory-import.md`, compact archive summaries, and git
history only when:

- verifying historical provenance,
- migrating an omitted operational detail,
- resolving a conflict between legacy memory and the new memory layer.

Do not recreate `platform/docs/ai/**` for Atlas runs, prompts, templates, or manifests.
