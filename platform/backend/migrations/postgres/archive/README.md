# Archived tenant migrations

This directory is part of the active migration layout.

Purpose:

- store future tenant migrations that were already folded into the current full tenant bundle
- keep the active `tenant/` directory focused on the current forward migration chain
- remain part of the tenant bundle input when `bundle/tenant_schema_full.sql` is regenerated

Rules:

- new tenant migrations are created in `../tenant/`
- after a tenant migration is included in the approved full tenant build and no longer needs to run incrementally on live environments, it may be moved here
- this directory must stay empty or near-empty at the clean-start phase

Important:

- this is not the legacy SQL dump storage
- old historical SQL reference was moved to `platform/backend/docs/archive/postgres-archive/`
- only future archive-worthy tenant migrations should live here
