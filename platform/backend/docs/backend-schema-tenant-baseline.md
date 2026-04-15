# Tenant Schema Baseline

Status: current working baseline  
Date: 2026-04-15

## Scope

This document describes the current canonical tenant baseline implemented by:

- `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`
- `platform/backend/bundle/tenant_schema_full.sql`

It replaces the older legacy-prefixed tenant baseline.

## Current Baseline Tables

Canonical business and reference tables:

- `state`
- `timezone`
- `companytype`
- `jobtype`
- `company`
- `users`
- `projects`
- `projectsaccess`
- `events`
- `mails`

Tenant runtime support tables:

- `public_code`
- `notification_template`
- `ps_model`
- `ps_view`

## Naming And Freshness Rules

- canonical tenant columns use lowercase `snake_case`
- no runtime support for legacy `<table_name>_<field_name>` names
- legacy `rowstamp` is removed
- canonical freshness is `updated_at`
- mutable tables attach shared `set_updated_at()`

## Tenant Isolation

Tenant-owned mutable tables use:

- `tenant_id`
- row-level security
- tenant-scoped indexes where relevant

Global reference tables in the current baseline:

- `state`
- `timezone`

## Important Data Decisions

- `state.id` preserves legacy ids `1..51`
- `timezone` is a new seeded reference table
- `users.password` remains in the DB auth surface
- Form Builder contracts may exclude sensitive columns such as `users.password`, but the baseline DB keeps them if runtime auth still depends on them
- `events` and `mails` remain tenant-local tables pending separate admin/read-model review before backend query refactor

## Related Contracts

Use these together:

- `backend-tenant-canonical-refactor-contract-v1.md`
- `backend-tenant-canonical-field-mapping-v1.md`
- `backend-tenant-import-module-boundary-v1.md`
