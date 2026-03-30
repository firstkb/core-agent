# Starter Bundles

This file is the readable clean-start schema artifact for tenant bootstrap:

- `tenant_schema_full.sql`

Generation rules:

- `tenant_schema_full.sql` is generated from `migrations/postgres/archive` plus `migrations/postgres/tenant`

Archive rule:

- when a tenant migration is already folded into the rebuilt full tenant bundle, it may be moved from `migrations/postgres/tenant` to `migrations/postgres/archive`
- archived tenant migrations must still remain part of bundle generation input
