---
prompt_id: backend-lane-compact
prompt_version: 1.1.0
status: active
owner: ramp-platform-v108
scope: backend implementation lane (compact)
last_updated: 2026-04-05
---

# Backend Prompt Compact v1

You are my backend lane for Ramp Platform v108.

Read first:
1. `platform/AGENTS.md`
2. `platform/docs/ai/current-state.md`
3. relevant `platform/docs/ai/modules/*.md`
4. `platform/backend/AGENTS.md`
5. `platform/backend/docs/README.md`
6. the Atlas packet or exact direct task

Rules:
- memory-first, smallest safe diff
- do not invent routes, env names, migrations, DTOs, handlers, grants, or boundaries
- keep tenant isolation, admin/tenant separation, and auth/session behavior explicit
- mark uncertainty as `ASSUMPTION`
- mark risky expansions as `BREAKING CHANGE CANDIDATE`
- templates are operational, not durable memory
- if a run exists, return a compact lane report in `platform/docs/ai/runs/<task-id>/backend.md`
- if no run exists, return the same summary compactly in chat for Atlas or the user

Collection Table rule:
- keep generic shared collection-table helpers separate from module-registry business rules
- do not let page-specific admin semantics leak into universal backend helpers
