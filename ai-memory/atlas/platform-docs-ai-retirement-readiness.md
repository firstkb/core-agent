# Platform Docs AI Retirement Readiness

Status: final readiness audit
Last audited: 2026-04-25

This audit records whether `platform/docs/ai/**` can be physically removed or
must remain as compatibility pointers.

## Verdict

Hot-read retirement: pass.

Run payload cleanup: pass.

Remaining physical deletion: pointer-directory decision.

`platform/docs/ai/**` is no longer an active memory or Atlas workflow source.
Active retrieval and workflow now live under `ai-memory/**`.

Raw legacy run payloads have been deleted after compact summary acceptance.
The remaining `platform/docs/ai/**` files are compatibility pointers only.

## Reference Scan Summary

Audit commands:

```bash
rg -n "platform/docs/ai" AGENTS.md platform .agents scripts ai-memory docs --glob '!platform/docs/ai/**'
rg -n "platform/docs/ai" AGENTS.md platform/README.md platform/AGENTS.md platform/backend/AGENTS.md platform/frontend/AGENTS.md .agents/skills/ramp-conductor/SKILL.md scripts ai-memory/index ai-memory/README.md ai-memory/agent-workflow.md docs/README.md docs/codex-native-repo.md
for d in platform/docs/ai/runs/20*; do rg -n "$(basename "$d")" AGENTS.md platform .agents scripts ai-memory docs --glob '!platform/docs/ai/runs/**'; done
```

Results:

- Active AGENTS, runtime scripts, `ai-memory/index/*`, and workflow docs mention `platform/docs/ai/**` only as legacy/provenance, migration scope, or avoid-by-default.
- No active script reads `platform/docs/ai/automation-manifest.json`; version sync uses `ai-memory/atlas/automation-manifest.json`.
- No legacy run id is referenced outside `platform/docs/ai/runs/**` except the compact triage summary and cleanup notes.
- Archive docs still contain historical references to old paths; those are provenance and not active runtime blockers.

## Remaining Tracked Surface

Current tracked legacy surface:

- `36` files remain in the working tree under `platform/docs/ai/**`.
- `34` non-run pointer files remain.
- `2` run-directory pointer files remain: `README.md` and `.gitkeep`.
- Raw legacy run payload files were deleted.

Non-run files are compatibility pointers only:

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
- Use `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` as the durable archive summary.
- Use git history only when exact old run text is required.
- Keep no new run artifacts under `platform/docs/ai/runs/**`.

## Recommended Physical Cleanup Plan

Preferred final plan:

1. Keep pointer directories until the next compatibility decision.
2. Choose one final compatibility mode:
   - conservative: keep only `platform/docs/ai/README.md` plus short subdirectory README pointers for one more cycle,
   - clean: delete `platform/docs/ai/**` entirely and update remaining active references to say historical payload exists only in git history plus `ai-memory/durable/legacy-memory-import.md`.

## Do Not Do

- Do not restore old payload text into pointer files.
- Do not use old prompts/templates/manifest as active Atlas workflow.
- Do not create new runs under `platform/docs/ai/runs/**`.

## Next Gate

Next owner decision needed:

- Keep the remaining `platform/docs/ai/**` pointer directories for one more cycle, or remove them entirely.
