# Platform Docs AI Retirement Readiness

Status: final readiness audit
Last audited: 2026-04-25

This audit records whether `platform/docs/ai/**` can be physically removed or
must remain as compatibility pointers.

## Verdict

Hot-read retirement: pass.

Physical deletion: owner-gated.

`platform/docs/ai/**` is no longer an active memory or Atlas workflow source.
Active retrieval and workflow now live under `ai-memory/**`.

Full physical deletion should not happen until the remaining legacy run payload
decision is approved.

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
- No legacy run id is referenced outside `platform/docs/ai/runs/**` except the compact triage summary and current-state risk notes.
- Archive docs still contain historical references to old paths; those are provenance and not active runtime blockers.

## Remaining Tracked Surface

Current tracked legacy surface:

- `69` tracked files under `platform/docs/ai/**`.
- `34` non-run pointer files, `721` lines total.
- `35` run files, `3011` lines total.

Non-run files are compatibility pointers only:

- top-level durable/governance/changelog markdown files,
- `modules/*.md`,
- `prompts/*.md`,
- `templates/*.md`,
- `automation-manifest.json`.

## Run Payload Decision

Run payloads are the only remaining reason not to delete the whole tree.

Current run triage:

- `8` runs are `archive-summary`: durable outcomes are already compacted.
- `1` run is `keep-provenance`: `2026-04-13_cross-stack_form-builder-three-schema-stabilization`.
- `1` run is `delete-after-owner-confirm`: `2026-04-16_cross-stack_admin-tenant-list-navigation`.

Decision:

- Do not keep raw run payloads under `platform/docs/ai/runs/**` long-term.
- Keep no new run artifacts under `platform/docs/ai/runs/**`.
- Before deletion, resolve the one `keep-provenance` run by confirming it is superseded or by migrating any unresolved Form Builder stabilization item into a new active task.
- Delete the empty/draft admin tenant list navigation run only after owner confirms it is unnecessary.

## Recommended Physical Cleanup Plan

Preferred final plan:

1. Keep pointer directories until owner approves run cleanup.
2. Delete `archive-summary` run folders after accepting `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` as the durable summary.
3. Resolve or migrate the `keep-provenance` Form Builder stabilization run.
4. Delete the `delete-after-owner-confirm` draft run after owner approval.
5. After run folders are gone, choose one final compatibility mode:
   - conservative: keep only `platform/docs/ai/README.md` plus short subdirectory README pointers for one more cycle,
   - clean: delete `platform/docs/ai/**` entirely and update remaining active references to say historical payload exists only in git history plus `ai-memory/durable/legacy-memory-import.md`.

## Do Not Do

- Do not physically delete `platform/docs/ai/runs/**` without owner approval.
- Do not restore old payload text into pointer files.
- Do not use old prompts/templates/manifest as active Atlas workflow.
- Do not create new runs under `platform/docs/ai/runs/**`.

## Next Gate

Owner decision needed:

- Delete old run payloads after summary acceptance, or move them to an archive path for raw provenance retention.
- Confirm whether `2026-04-13_cross-stack_form-builder-three-schema-stabilization` can be superseded or must become a new active Form Builder task.
- Confirm whether `2026-04-16_cross-stack_admin-tenant-list-navigation` can be deleted as an empty draft scaffold.
