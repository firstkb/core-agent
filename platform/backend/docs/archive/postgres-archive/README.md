# Legacy PostgreSQL Archive

Status: archived SQL reference
Owner: backend
Last audited: 2026-04-25
Canonical scope: historical PostgreSQL SQL reference only

This directory contains historical PostgreSQL SQL that was removed from the active backend docs read path.
It is not an active migration source, not the tenant schema source of truth, and not a bundle generation input.

Read active schema docs first:

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/proposals/schema-drift-checks.md` when the task is about verification backlog

Active migration and bundle inputs live outside this archive:

- `platform/backend/migrations/postgres/master/`
- `platform/backend/migrations/postgres/tenant/`
- `platform/backend/migrations/postgres/archive/`
- `platform/backend/bundle/tenant_schema_full.sql`

Use this archive only when a task explicitly needs historical PostgreSQL archaeology.

## Inventory

- `010_app_template.sql`: historical app schema template for old `contacts` and `users` tables with `pgcrypto` and `citext`.
- `011_rls.sql`: historical RLS policy setup for old `users` and `contacts` tables.
- `012_email_ci.sql`: historical `users.email` `citext` conversion and tenant/email unique index.
- `015_public_code_app.sql`: historical app-database `public_code` table.
- `022_notification_templates.sql`: historical email/SMS notification template table.
- `026_event_log.sql`: historical tenant `event_log` table and RLS policy.
- `027_default_notify_template.sql`: historical default OTP email/SMS template seed.
- `MIGRATION_ARCHIVE_NOTES.md`: historical archive notes from the pre-current bundle process.

## Rules

- Do not copy SQL from this archive into active migrations without an explicit migration decision.
- Do not infer current tenant schema from this archive.
- Distill any useful historical fact into an active contract, proposal, or reference doc before implementing runtime behavior.
- For legacy MSSQL material, use `maestro/memory/reference-code/README.md` and alias `reference-pack:mssql-legacy-schema` instead.
