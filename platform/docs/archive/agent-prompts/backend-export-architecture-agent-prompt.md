# Backend Export Architecture Agent Prompt

Use this prompt in a new Codex chat when the task is to design and implement a reusable export architecture for backend collection surfaces.

## Prompt

You are working in:

- `repo root`

Primary target:

- `platform/backend`

Current backend/frontend context:

- Admin collection table already has a real backend surface for `Module registry`.
- Current export endpoint:
  - `POST /app/admin/module-registry/list/export-xls`
- Current frontend contract expects export to eventually open a downloadable file.
- Current frontend behavior:
  - calls export endpoint
  - expects `{ downloadUrl: string }` when export is ready
  - currently receives `{ ok: true }`, so nothing useful happens
- Current hard-limit decision:
  - export must never exceed `5000` rows
  - if more than `5000` rows match, backend must truncate to `5000`
  - backend should log a `warn`
  - backend should not fail the export just because more than `5000` rows matched

Important product direction:

- This should not solve only `xlsx` for one module.
- We want a future-ready export architecture that can later support:
  - `xlsx`
  - `csv`
  - `pdf`
- We also need a clean answer for:
  - sync vs async export
  - how frontend knows when export is ready
  - when frontend can safely open `/open/.../<token>`
  - where files are stored:
    - local/dev
    - S3/object storage
    - future production storage

Current design preferences already discussed:

- A single shared export-job model is preferred over per-module export tables.
- The open/public download URL should not be the place where business query execution happens.
- Preferred flow:
  1. authenticated app endpoint receives export request
  2. backend resolves query and prepares export artifact
  3. backend returns a `downloadUrl` only when artifact is actually ready
  4. public/open tokenized download endpoint only downloads a ready artifact
- If async is chosen, we need an explicit readiness/status strategy for frontend.

What you need to do:

1. Audit the current backend and frontend export surfaces.
2. Explain clearly what is wrong with the current `export-xls` flow.
3. Propose a reusable export architecture for admin and tenant collection surfaces.
4. Decide and justify:
   - sync first vs async first
   - export job table shape
   - download-token strategy
   - local filesystem vs S3 abstraction
   - how `xlsx`, `csv`, and future `pdf` fit the same model
5. Define the frontend/backend contract for:
   - export request
   - export accepted/in-progress state
   - export ready state
   - download URL handling
   - status polling or callback strategy if async
6. Recommend a phased rollout:
   - Phase 1: smallest working solution
   - Phase 2: reusable/shared architecture
   - Phase 3: async/storage hardening
7. If implementation is reasonable in scope, implement Phase 1 foundation in code.

Non-negotiable constraints:

- Keep existing collection-table architecture in mind.
- Reuse shared backend layers where sensible.
- Do not introduce a one-off hack only for `Module registry`.
- Hard limit remains `5000`.
- If export is truncated, log a warning.
- Favor stable backend contracts over temporary UI hacks.

Expected output in your response:

1. Findings:
   - what exists now
   - what is broken
   - what risks exist
2. Proposed architecture:
   - export job model
   - storage model
   - token/download model
   - sync/async recommendation
3. API contract:
   - endpoints
   - sample request/response shapes
4. Rollout plan:
   - what to implement now
   - what to defer
5. If you implement code:
   - list changed files
   - explain how to verify it

Repository hints:

- Current collection-table shared types:
  - `platform/backend/modules/shared/collectiontable`
- Current `Module registry` list backend:
  - `platform/backend/modules/admin/moduleregistrylist`
- Current admin API routes:
  - `platform/backend/cmd/api-admin/internal/server`
- Current frontend collection-table docs:
  - `platform/frontend/docs/collection-table-backend-integration-contract.md`
  - `platform/frontend/docs/collection-table-runtime-contract.md`
- Current admin frontend consumer:
  - `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`
  - `platform/frontend/apps/platform-admin-web/src/shared/admin-module-registry-client.ts`

Use a pragmatic engineering approach:

- do not overbuild
- but do not lock the platform into a dead-end `xlsx-only` design
- optimize for a clean Phase 1 that can grow into shared export infrastructure
