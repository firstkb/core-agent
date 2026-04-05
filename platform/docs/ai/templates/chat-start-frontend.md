# Chat Start Prompt — Frontend Addendum

Append this block to the shared chat-start prompt when the task is frontend-local.

```text
Frontend-local addendum:
- Read `platform/frontend/AGENTS.md` and `platform/frontend/docs/README.md` before changing frontend code.
- Default canonical frontend doc clusters are:
  - app/package boundaries
  - auth/runtime bootstrap
  - collection-table runtime and package-promotion path
  - admin module-registry proving surface
  - visual foundation/UI contracts
  - Platform Builder V2
- Keep generic collection-table work separate from module-registry page logic.
- Require extra care for auth bootstrap, route guards, same-site `/auth/v1/*` and `/api/v1/*` assumptions, admin vs tenant route separation, and shared package boundaries.
- Prefer app-local implementation unless reuse is already proven.
- Reuse existing tokens, shell rules, and shared primitives before creating new abstractions.
- If visible behavior changes a shared contract, update the relevant canonical frontend docs.
- End your response with frontend-specific checks run or still required.
```
