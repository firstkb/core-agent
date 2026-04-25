# Atlas Operational Layer

Status: active operational workflow
Scope: Atlas prompts, templates, run scaffolding, and version metadata

This folder is the active Atlas workflow surface for platform product work.
It replaces the default operational role of `platform/docs/ai/prompts/**`,
`platform/docs/ai/templates/**`, `platform/docs/ai/runs/**`, and
`platform/docs/ai/automation-*.json|md`.

`platform/docs/ai/**` remains available only as legacy import/provenance until it
is fully retired.

## Active Surfaces

- `automation-manifest.json`: version source for Atlas prompt/template/scaffolder metadata.
- `automation-changelog.md`: operational changelog for Atlas workflow changes after the cutover.
- `platform-docs-ai-retirement-plan.md`: retirement plan for old `platform/docs/ai/**`.
- `prompts/`: base prompt contracts for Atlas control, frontend lane, and backend lane.
- `templates/`: artifact templates used by the run scaffolder and handoff prompts.
- `../runs/active/`: active Atlas run artifacts.
- `../runs/archive/`: closed or superseded Atlas run artifacts.
- `../../scripts/ai/new-run.py`: mechanical run scaffolder.
- `../../scripts/ai/automation_versions.py`: version mirror checker/writer.

## Read Rule

For task routing, read `ai-memory/index/memory-index.yaml` and
`ai-memory/index/read-routes.yaml` before opening product docs.

Open legacy `platform/docs/ai/**` only when:

- verifying historical provenance,
- migrating an omitted operational detail,
- resolving a conflict between legacy memory and the new memory layer.

Do not write new Atlas runs or prompt/template updates into `platform/docs/ai/**`.
