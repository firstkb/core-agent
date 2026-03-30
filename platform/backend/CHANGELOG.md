# Backend Changelog

## Unreleased

### Added

- separated runtime entrypoints for `auth`, `api-admin`, `api-tenant`, and `migrate`
- `internal/platform/*` as the active shared infrastructure layer
- local env templates for all active runtimes
- local bootstrap runbook for `108-master`, `108-sandbox`, and `108-demo`
- local seed SQL for master, sandbox, and demo databases
- explicit `runtime.environment` contract for backend runtimes
- auth dev-mode fixed OTP support via `auth.dev.fixedotp`

### Changed

- backend module path moved to `dtriton.com/platform/backend`
- `scapi` removed from the active backend tree
- auth moved to self-issued RSA tokens with JWKS and API Gateway-compatible claims
- migrate flow now separates master migrations, tenant bundle bootstrap, and incremental tenant migrations
- auth event logging now sets tenant RLS context before writing to `event_log`
- notify runtime now treats non-production local mode as debug/no-send by contract
- tenant bootstrap bundle renamed to `bundle/tenant_schema_full.sql`

### Fixed

- auth JWT issuer now uses `auth.issuer` instead of incorrectly mirroring `auth.audience`
- master migrations now enable `pgcrypto` before tables that depend on `gen_random_uuid()`
- default notification template seed is now idempotent
