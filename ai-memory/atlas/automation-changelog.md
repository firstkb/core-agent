# Atlas Automation Changelog

Status: active operational changelog

This changelog starts at the `ai-memory/atlas` cutover.
Earlier Atlas automation history remains in
`platform/docs/ai/automation-changelog.md` as legacy provenance only.

## 2026-04-25 - v1.5.0

- Moved active Atlas operational surfaces to `ai-memory/atlas/`.
- Changed Atlas default memory reads from `platform/docs/ai/**` to `ai-memory/index/*`, `ai-memory/durable/*`, and targeted module packs.
- Changed run scaffolding target from `platform/docs/ai/runs/<task-id>/` to `ai-memory/runs/active/<task-id>/`.
- Kept `platform/docs/ai/**` as legacy import/provenance until final retirement.
