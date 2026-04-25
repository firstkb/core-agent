# Legacy Runs Triage

Status: active triage record
Last updated: 2026-04-25

This record tracks the retirement state for old Atlas runs under
`platform/docs/ai/runs/**`.

Compact archive summary:

- `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md`

## Result

- 8 legacy runs are `archive-summary`: durable outcomes are already captured in
  current `ai-memory` and tracked FE/BE docs.
- 1 legacy run is `keep-provenance`: Form Builder three-schema stabilization
  contains unresolved frontend stabilization state and should not be deleted yet.
- 1 legacy run is `delete-after-owner-confirm`: admin tenant list navigation is
  an empty draft scaffold and needs owner confirmation before removal.

## Do Not Do

- Do not move or delete old run folders as part of this triage record alone.
- Do not use old run files as active task state.
- Do not create new runs under `platform/docs/ai/runs/**`.

## Deletion Gate

Final deletion or movement of old run payload requires:

- owner approval,
- reference scan for the exact run id,
- confirmation that durable facts are present in `ai-memory` or tracked docs,
- no active task depending on the old run folder.
