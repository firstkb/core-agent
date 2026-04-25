# Retired Platform AI Memory

Status: retired legacy memory pointer

This folder is no longer the active platform memory or Atlas workflow surface.

Active replacements:

- memory routing: `ai-memory/index/memory-index.yaml`
- task read routing: `ai-memory/index/read-routes.yaml`
- durable state: `ai-memory/durable/current-state.md`
- decisions: `ai-memory/durable/decisions-log.md`
- canonical docs registry: `ai-memory/durable/canonical-docs.md`
- module memory: `ai-memory/modules/**`
- Atlas workflow: `ai-memory/atlas/**`
- active Atlas runs: `ai-memory/runs/active/**`

Historical contents in this folder may still be useful for provenance,
conflict resolution, or final migration, but they are not part of the default
agent read path.

Do not write new prompts, templates, run artifacts, or memory updates here.

Top-level durable memory files in this folder are compatibility pointers only.
Legacy module memory files under `modules/` are compatibility pointers only.
Legacy prompt/template files and `automation-manifest.json` are compatibility
pointers only.
Use git history if historical payload text is required.

Read the retirement plan before deleting or compacting this folder:

- `ai-memory/atlas/platform-docs-ai-retirement-plan.md`
