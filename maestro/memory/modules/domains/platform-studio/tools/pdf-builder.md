# PDF Builder

Status: planned tool
Last compacted: 2026-04-25

## Expected Ownership

- PDF template configuration.
- Generated document output from authored/runtime data.
- Mapping form/view data into printable or downloadable document layouts.
- PDF-specific preview and generation settings.

## Current Integration Point

- Form Builder and runtime views may provide source data.
- Collection Table also has a deferred optional row action `pdf`; that is a shared table capability and must not be confused with the full PDF Builder product tool.

## Guardrails

- Do not implement PDF generation as a Form Builder-only shortcut unless the scope is explicitly limited.
- Keep PDF template ownership separate from form schema ownership.
- Clarify whether a PDF feature is a row action, a report output, or a dedicated PDF Builder artifact before implementation.
