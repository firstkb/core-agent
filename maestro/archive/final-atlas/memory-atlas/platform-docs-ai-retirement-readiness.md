# Platform Docs AI Retirement Readiness

Status: final deletion audit
Last audited: 2026-04-25

This audit records the final physical removal of `platform/docs/ai/**`.

## Verdict

Hot-read retirement: pass.

Run payload cleanup: pass.

Physical deletion: pass.

`platform/docs/ai/**` is no longer an active memory or Atlas workflow source.
Active retrieval and workflow now live under `maestro/memory/**`.

Raw legacy run payloads have been deleted after compact summary acceptance.
The remaining compatibility pointer files have also been deleted after active
reference checks.

## Reference Scan Summary

Audit commands:

```bash
rg -n "platform/docs/ai" AGENTS.md platform .agents scripts maestro/memory docs --glob '!platform/docs/ai/**'
rg -n "platform/docs/ai" AGENTS.md platform/README.md platform/AGENTS.md platform/backend/AGENTS.md platform/frontend/AGENTS.md .agents/skills/atlas/SKILL.md scripts maestro/memory/index maestro/memory/README.md maestro/memory/agent-workflow.md docs/README.md docs/codex-native-repo.md
for d in platform/docs/ai/runs/20*; do rg -n "$(basename "$d")" AGENTS.md platform .agents scripts maestro/memory docs --glob '!platform/docs/ai/runs/**'; done
```

Results:

- Active AGENTS, runtime scripts, `maestro/memory/index/*`, and workflow docs do not route agents to read or write `platform/docs/ai/**`.
- No active script reads `platform/docs/ai/automation-manifest.json`; version sync uses `maestro/memory/atlas/automation-manifest.json`.
- No legacy run id requires a working-tree `platform/docs/ai/runs/**` file; compact summaries and git history own old provenance.
- Archive docs still contain historical references to old paths; those are provenance and not active runtime blockers.

## Remaining Tracked Surface

Current tracked legacy surface:

- `0` files remain in the working tree under `platform/docs/ai/**`.
- Raw legacy run payload files were deleted.
- Pointer README files and `.gitkeep` were deleted after active reference checks.

Former non-run files were compatibility pointers only before deletion:

- top-level durable/governance/changelog markdown files,
- `modules/*.md`,
- `prompts/*.md`,
- `templates/*.md`,
- `automation-manifest.json`.

## Run Payload Decision

Run payload cleanup is complete.

Final run triage:

- `9` runs were deleted after compact summary acceptance.
- `1` empty draft scaffold was deleted as low-value.
- No legacy run remains marked for special provenance retention.

Decision:

- Do not keep raw run payloads under `platform/docs/ai/runs/**`.
- Use `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md` as the durable archive summary.
- Use git history only when exact old run text is required.
- Keep no new run artifacts under `platform/docs/ai/runs/**`.

## Physical Cleanup Result

- Clean mode was selected by owner decision.
- `platform/docs/ai/**` was deleted entirely.
- Active references now point to `maestro/memory/durable/legacy-memory-import.md`, compact archive summaries, and git history for provenance.

## Do Not Do

- Do not restore old payload text into pointer files.
- Do not use old prompts/templates/manifest as active Atlas workflow.
- Do not create new runs under `platform/docs/ai/runs/**`.

## Next Gate

No remaining gate for `platform/docs/ai/**`.
