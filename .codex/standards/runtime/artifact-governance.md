# Artifact Governance Standard

## Ownership

- Maestro may author only module-root artifacts and feature seed packs.
- Charlie may author only the research artifact pair.
- Grant may return reviewer-note content but must not own lifecycle state or write repository artifacts directly.
- CLI owns mutable JSON state and lifecycle transitions.
- Do not modify product code, tests, or unrelated docs during orchestration or research flows unless the task explicitly expands scope.

## Path model

- Module root: `artifacts/<module>/`
- Feature root: `artifacts/<module>/features/<feature>/`
- Stage root: `artifacts/<module>/features/<feature>/stages/<stage>/`

## Persistence

- Persisted artifacts stay in English.
- Keep machine-readable state in `status.json`.
- Keep rationale, facts, and evidence in Markdown artifacts.
- If a template exists for an artifact, preserve its headings and append extras under an explicit additional-notes section when needed.

## Validation

- Validate lifecycle transitions at the CLI write boundary.
- Validate machine-readable stage handoff files when they are submitted.
- Do not invent sidecar lifecycle or review state outside the typed CLI surface.
