# Local Backend Bootstrap

Status: active local-development runbook
Date: 2026-03-29

## Target local databases

Use three PostgreSQL databases for the local example:

- `108-master`
- `108-sandbox`
- `108-demo`

Roles:

- `108-master` stores tenant registry, pools, identity, OTP, refresh tokens, and admin data
- `108-sandbox` stores shared tenant app data for sandbox tenants
- `108-demo` stores app data for an isolated dedicated demo tenant

Important:

- this is only the local example topology
- in the real model `108-master` stays the single control database
- tenant databases can be many
- the source of truth for tenant databases is the master registry tables, not a fixed hardcoded list

Current master registry tables:

- `db_instance`
- `tenant_db`
- `tenant_sandbox_pool`
- `tenant_dedicated_pool`

## Preserved legacy migration pattern

The old backend already established a useful split:

- new empty tenant databases should be bootstrapped from the bundle
- new incremental tenant migrations should then run from `migrations/postgres/tenant`
- tenant migrations already folded into the rebuilt full bundle may move to `migrations/postgres/archive`
- legacy historical SQL stays only in `docs/legacy/postgres-archive`

The current `cmd/migrate` runtime now follows that direction:

1. apply master migrations from `migrations/postgres/master`
2. bootstrap configured empty tenant databases from `bundle/tenant_schema_full.sql`
3. apply incremental tenant migrations from `migrations/postgres/tenant`

Readable starter artifacts:

- `bundle/tenant_schema_full.sql`

Tenant databases come from two places:

- primary source: `tenant_db` rows in `108-master`
- optional bootstrap override: `migrations.tenantdatabases` for empty databases that exist before tenant registration

## Env files

Use the provided templates:

- `env/auth.local.env.example`
- `env/api-admin.local.env.example`
- `env/api-tenant.local.env.example`
- `env/migrate.local.env.example`

Typical local flow:

```bash
cp env/auth.local.env.example env/auth.local.env
cp env/api-admin.local.env.example env/api-admin.local.env
cp env/api-tenant.local.env.example env/api-tenant.local.env
cp env/migrate.local.env.example env/migrate.local.env
```

Runtime mode contract:

- each runtime now declares `*_RUNTIME_ENVIRONMENT`
- local files should use `dev`
- production files should use `prod`
- `auth` in `dev` uses `AUTHAPI_AUTH_DEV_FIXEDOTP`
- `auth` in `dev` also keeps notifications in debug/no-send mode via `AUTHAPI_NOTIFY_DISABLEEXTERNAL=true`

## JWT keys for local auth

`auth` requires RSA keys.

Important:

- local keys must not be committed to git
- `platform/backend/certs/*.pem` is ignored
- generate local keys on each machine with the provided script
- full key-source setup examples live in `docs/auth/auth-key-source-configuration.md`

Example:

```bash
./scripts/generate-dev-auth-keys.sh
```

Key source contract:

- local default: `AUTHAPI_AUTH_KEYSOURCE=file`
- supported runtime sources in config: `file`, `secretsmanager`, `kms`
- current build fully supports `file` and `secretsmanager`
- `kms` is reserved in config for the future signer integration and is not yet active in this build

## Create local databases

Run:

```bash
psql -d postgres -f ./seeds/local/001_create_databases.sql
```

## Run migrations

Run:

```bash
go run ./cmd/migrate --env ./env/migrate.local.env
```

Expected result:

- `108-master` receives master schema
- `108-sandbox` is bootstrapped from `bundle/tenant_schema_full.sql`
- `108-demo` is bootstrapped from `bundle/tenant_schema_full.sql`
- `schema_migrations` exists in tenant databases with a bundle marker

In non-local environments the tenant target set should usually come from `tenant_db`, while `migrations.tenantdatabases` stays only as an early bootstrap helper.

## Apply local seed data

Run:

```bash
psql -d 108-master -f ./seeds/local/010_master_seed.sql
psql -d 108-sandbox -v tenant_id=100 -f ./seeds/local/020_sandbox_tenant_seed.sql
psql -d 108-demo -v tenant_id=101 -f ./seeds/local/021_demo_tenant_seed.sql
```

The seed creates:

- one sandbox tenant at `acme.platform.local`
- one dedicated demo tenant at `demo.platform.local`
- one sample user in each tenant
- identity and tenant membership rows required for OTP auth

If your tenant ids differ from `100` and `101`, first query them from master:

```bash
psql -d 108-master -c "select host, tenant_id from v_tenant_by_host order by host;"
```

## Start runtimes

Run in separate terminals:

```bash
go run ./cmd/auth --env ./env/auth.local.env
go run ./cmd/api-admin --env ./env/api-admin.local.env
go run ./cmd/api-tenant --env ./env/api-tenant.local.env
```

## Auth testing

### Sandbox tenant

- host: `acme.platform.local`
- db: `108-sandbox`
- sample email: `user@acme.local`

### Dedicated demo tenant

- host: `demo.platform.local`
- db: `108-demo`
- sample email: `owner@demo.local`

OTP request example:

```bash
curl -i \
  -H 'Host: demo.platform.local' \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@demo.local"}' \
  http://127.0.0.1:8082/auth/otp/request
```

The debug notify provider logs the OTP code to the auth service logs.

With the default local env template, the code is fixed to `999999`.

## Event log validation

After OTP request or verify:

```bash
psql -d 108-demo -c "select events_tenant_id, events_event, events_data, events_created_at from events order by events_created_at desc limit 10;"
psql -d 108-sandbox -c "select events_tenant_id, events_event, events_data, events_created_at from events order by events_created_at desc limit 10;"
```

Expected behavior:

- demo tenant events land in `108-demo.events`
- sandbox tenant events land in `108-sandbox.events`
- tenant rows remain isolated by `tenant_id`

## Startup rule

Do not run schema migrations inside `auth`, `api-admin`, or `api-tenant` startup.

Rule:

- `cmd/migrate` owns schema changes
- application runtimes only consume already-prepared databases
