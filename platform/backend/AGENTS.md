# backend/AGENTS.md

## Backend focus
This directory is for **foundation-stage Go backend work**.

Primary approved work:
- Control Plane API skeleton
- Tenant Data API skeleton
- Jobs / Runtime skeleton
- AUTH API
- `/profile` endpoint
- auth middleware / session / refresh integration
- tenant context resolution
- first reference entity CRUD
- migrations and seed for local development

## Expected backend shape
Preserve clear separation between:
- transport / handlers
- service / use-case
- repository / storage

Do not place SQL or storage details in handlers.
Do not leak transport DTOs directly into repository logic.

## Security and tenancy rules
- identity must come from trusted auth/session context
- tenant scope must not be accepted from untrusted input when it should come from token/session
- Admin and Tenant semantics must remain explicit
- call out any ambiguity around root/admin scope or tenant isolation
- do not add privileged bypasses without explicit authorization

## Migrations
- use the approved migrations path and tool only
- no ad-hoc schema edits
- note rollback implications whenever a migration is added

## DTO and error rules
- keep request/response DTOs distinct from storage models
- follow the repo-standard error shape
- do not invent a new error contract unless the task requires it
- for `/profile`, return only the current principal and only the approved fields

## Required tests
For non-trivial backend work, cover as applicable:
- unit/service tests
- handler/API tests
- auth negative case
- permission negative case
- tenant-scope negative case
- migration smoke or seed validation if schema changed

## Backend commands
Replace these placeholders with real repo commands:
- BACKEND_TEST = <replace me>
- BACKEND_BUILD = <replace me>
- BACKEND_LINT = <replace me>
- BACKEND_MIGRATE = <replace me>
- BACKEND_SEED = <replace me>

## Backend summary format
- Goal
- Target app/service
- Changed packages/files
- API changes
- DB/migration changes
- Auth/tenant implications
- Tests run
- Risks / follow-ups
