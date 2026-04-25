# Report Builder

Status: planned tool
Last compacted: 2026-04-25

## Expected Ownership

- Report definitions.
- Analytical/read-only reporting outputs.
- Query, grouping, filtering, and presentation settings for reports.
- Report export behavior when it is report-specific rather than generic table export.

## Current Integration Point

- Form Builder managed/static runtime data can become report input.
- Collection Table saved filters/favorites may influence UX patterns, but they do not define the Report Builder contract.

## Guardrails

- Do not equate `Export data` with Report Builder.
- Decide whether a feature is a generic table export, a Form Builder managed data export, or a report artifact before building it.
- Keep report definitions stable and separate from mutable Form Builder view layout.
