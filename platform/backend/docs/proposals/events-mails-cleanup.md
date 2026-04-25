# Events/Mails Cleanup Proposal

Status: future proposal
Historical status: current audit
Date: 2026-04-15
Last audited: 2026-04-25
Canonical scope: backend events and mails overlap cleanup proposal

This is proposal scope.
Do not treat it as active runtime behavior unless an events/mail cleanup implementation slice is explicitly activated.

Read with:

- `platform/backend/docs/contracts/events-identity.md`
- `platform/backend/docs/contracts/schema-tenancy.md`

## Purpose

This audit clarifies the overlap between admin/master surfaces and tenant surfaces for `events` and `mails` before backend query refactor begins against the canonical tenant schema.

## Observed Facts

### `events`

There are currently two distinct database surfaces:

- `master.events`
- `tenant.events`

Master `events`:

- defined in `platform/backend/migrations/postgres/master/020_master_events.sql`
- current schema ownership is documented in `platform/backend/docs/contracts/schema-tenancy.md`
- actor identity ownership is documented in `platform/backend/docs/contracts/events-identity.md`
- now uses the canonical shape shared with tenant:
  - `guid`
  - `event`
  - `created_at`
- used for admin and control-plane audit

Tenant `events`:

- defined in `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`
- uses the new canonical tenant shape:
  - `guid`
  - `event`
  - `created_at`
- remains tenant-local and RLS-protected

Runtime write path:

- `platform/backend/modules/shared/audit/repository.go` writes to `events`
- it now targets the shared canonical schema in both master and tenant:
  - `tenant_id`
  - `occurred_at`
  - `event`
  - `created_at`

Conclusion:

- `events` is the real overlap surface
- shared audit writing can now stay on one common contract
- next step is broader backend query refactor against canonical `events`

### `mails`

Observed surfaces:

- `tenant.mails` exists in the canonical tenant baseline
- `master.mails` is now present in the active master migration set

Backend usage:

- no active runtime backend module currently writes canonical `mails`
- current references found are operational/configuration-level:
  - `platform/backend/modules/admin/tenantmanagement/types.go`
    - `mails` is included in `defaultCopyTables`

Conclusion:

- `mails` now exists in both tenant and master
- current runtime backend still does not actively write canonical `mails`
- `mails` is no longer a schema gap, but not yet a backend-query blocker

## Additional Findings

### Tenant bootstrap check

`platform/backend/cmd/migrate/internal/runner.go` uses `public.events` as one of the tenant bundle bootstrap presence checks.

This is acceptable, but it means:

- tenant `events` is already treated as a required starter table
- `mails` is not currently part of the bootstrap completeness check

### Tenant cloning/onboarding

`platform/backend/modules/admin/tenantmanagement/types.go` includes both:

- `events`
- `mails`

inside `defaultCopyTables`.

This means admin tenant operations are aware of those tables as tenant data surfaces, but that is not the same as master-schema overlap.

## Recommendations Before Step 4

1. Treat `events` as the first backend query refactor target because it already has a shared canonical contract.
2. Review auth and admin query surfaces that still assume prefixed `events_*` columns.
3. Keep `mails` available in both schemas and defer runtime mail-writer work until auth email delivery or Platform Builder action delivery is implemented.
