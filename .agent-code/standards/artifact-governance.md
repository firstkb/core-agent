# Artifact governance

## Ownership

- Maestro may write only module-root artifacts and feature seed packs.
- Charlie may write only the research artifact pair.
- Do not modify application source code, tests, or unrelated docs during Maestro or Charlie runs unless a later workflow explicitly expands scope.

## Path model

- Module root: `artifacts/<module>/`
- Feature root: `artifacts/<module>/<feature>/`
- Stage root: `artifacts/<module>/<feature>/<stage>/`

## Persistence

- Persisted artifacts stay in English.
- Keep machine-readable state in `status.json`.
- Keep detailed rationale and evidence in Markdown artifacts.
- If a template exists for an artifact, preserve its headings verbatim and put extras under `## Additional Notes`.

## Validation

Validate normalized input before creating downstream artifacts.
Validate stage artifacts after writing them.
Validate Maestro modules after module-root or feature-root changes.
