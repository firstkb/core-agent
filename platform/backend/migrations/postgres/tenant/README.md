# Active tenant migrations

This directory is the active source of truth for tenant SQL migrations.

Current baseline:

- empty tenant databases are bootstrapped from `bundle/tenant_schema_full.sql`
- after bundle bootstrap, new changes should be added here as incremental `.sql` files

Important:

- `../archive/` is the active archive for tenant migrations that are already folded into the current full tenant bundle
- `docs/legacy/postgres-archive` is legacy reference history only
- `bundle/tenant_schema_full.sql` must be generated from `../archive/` plus this directory
- do not move archived SQL back here just to rebuild new databases
