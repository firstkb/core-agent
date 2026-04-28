---
template_id: agent-evidence
template_version: 1.0.1
status: active
owner: vsm-v1.0.0
last_updated: 2026-04-28
---

# AGENT EVIDENCE

Use this as a compact closeout block for non-trivial agent tasks.
Paste it into the final response, PR body, or run `final.md`.
Do not create a separate persistent file unless the owner asks.

Keep it short. Omit lines that are genuinely not applicable.
Do not include secrets, bearer tokens, or raw local env values.

```md
## Agent Evidence

- Task:
- Route: direct | Atlas run | FE lane | BE lane | cross-stack
- Run folder: none | ai-memory/runs/active/<task-id>/
- Changed files:
- Docs/memory read:
- Contracts affected: none | FE | BE | shared | auth | tenancy | migration
- Checks run:
- Checks not run:
- Memory/docs updated: none | list paths
- Risks / follow-up:
```

Minimum for tiny docs-only tasks:

```md
## Agent Evidence

- Changed files:
- Checks run:
- Memory/docs updated:
- Risks / follow-up:
```
