# Tenant Import Module Boundary v1

Status: import reference
Historical status: accepted
Date: 2026-04-15
Last audited: 2026-04-25
Canonical scope: future legacy-to-canonical tenant import module boundary

This is reference/import material.
It defines a future import boundary, not active runtime backend behavior.

Read with:

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `maestro/memory/reference-code/README.md` for `reference-pack:mssql-legacy-schema`
- `platform/backend/docs/archive/postgres-archive/README.md` only for legacy PostgreSQL archaeology

## Purpose

This document defines the boundary for the future legacy-to-canonical tenant import module.

The import module is expected to live as a separate application, and possibly in a separate repository, so that legacy ETL concerns do not become part of the runtime backend in this repository.

## Ownership Split

### This repository owns

- canonical tenant schema contract
- tenant baseline migration
- tenant schema bundle
- runtime backend queries after the canonical cutover
- Form Builder and tenant runtime behavior against canonical tables

### The import module owns

- connecting to legacy MSSQL and/or legacy PostgreSQL sources
- reading legacy rows
- transforming legacy columns into canonical rows
- lookup resolution during import
- import ordering and retry logic
- dry-run and import reporting
- reject/error ledgers for non-importable rows

## Explicit Non-Goals For This Repository

This repository should not become the permanent home for:

- direct MSSQL import jobs
- legacy ETL orchestration
- per-customer migration scripts
- data-cleansing workflows tightly coupled to a single migration run

## Source And Target

### Source systems

Supported legacy inputs:

- legacy MSSQL schema through `reference-pack:mssql-legacy-schema`
- legacy PostgreSQL tenant schema through `platform/backend/docs/archive/postgres-archive/README.md`, if needed as an intermediate migration source

### Target system

The only runtime target is the canonical tenant schema defined by:

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`

## Import Responsibilities

The import module must handle:

1. reference-table preparation
   - ensure canonical `state` and `timezone` are present
2. id-preserving import where required
   - preserve canonical `state.id`
   - preserve business ids where the canonical contract expects continuity
3. text-to-reference normalization
   - `users_title -> users.job_type_id`
   - `users_state -> users.state_id`
   - `users_TimeZone -> users.timezone_id`
   - `company_type -> company.company_type_id`
   - `company_TimeZone -> company.timezone_id`
4. field transforms
   - `events_date + events_time -> events.occurred_at`
   - JSON/text payload conversion for `events.files`, `events.urls`, `mails.files`, `mails.urls`
5. relationship resolution
   - user/company/project foreign keys
   - self-references such as supervisor chains
6. import safety
   - idempotent rerun strategy where practical
   - row counts and reconciliation reporting
   - reject ledger for rows that fail normalization

## Import Order

Recommended default order:

1. `state`
2. `timezone`
3. `companytype`
4. `jobtype`
5. `company`
6. `users`
7. `projects`
8. `projectsaccess`
9. `events`
10. `mails`

## Required Outputs

Every import run should produce:

- source row counts by table
- inserted row counts by canonical table
- skipped row counts by reason
- unresolved FK report
- field-level transform report for renamed or normalized columns

Preferred persisted artifacts:

- `mapping-manifest.json`
- `import-summary.json`
- `rejects.jsonl`

## Runtime Safety Rules

The import module must not:

- mutate runtime backend code in this repository
- redefine the canonical schema contract
- introduce shadow legacy columns into canonical tables
- force the runtime backend to support both legacy and canonical column names

## Handoff Rule

After import is complete, the runtime backend should operate only on the canonical tenant schema.

Legacy MSSQL and legacy PostgreSQL remain migration sources, not runtime dependencies.
