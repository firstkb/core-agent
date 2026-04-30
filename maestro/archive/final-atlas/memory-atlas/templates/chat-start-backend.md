# Chat Start Prompt — Backend Addendum

Append this block to the shared chat-start prompt when the task is backend-local.

```text
Backend-local addendum:
- Read `platform/backend/AGENTS.md` and `platform/backend/docs/README.md` before changing backend code.
- Default canonical backend doc clusters are:
  - workspace/runtime shape
  - auth/session
  - admin control plane
  - admin module-registry control-plane surface
  - schema/tenancy
- Keep generic shared collection-table helper work separate from module-registry business rules.
- Require extra care for auth/session, tenant isolation, grants/roles, migrations, seeds, exports, and destructive admin actions.
- Prefer service/repository separation and keep SQL out of handlers.
- If schema or migration behavior changes, update both code and the canonical schema docs.
- End your response with backend-specific checks run or still required.
```
