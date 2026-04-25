# DB Instance Secret Resolution

Status: active v1
Date: 2026-03-31

## Purpose

This document defines how `db_instance.secret_name` works for tenant database placement and connection resolution.

## Current v1 rule

When loading instance connection information from master:

1. if `db_instance.secret_name` is set, backend reads the DSN from AWS Secrets Manager
2. if `db_instance.secret_name` is empty, backend uses `db_instance.dns`

This means `secret_name` has priority over `dns`.

## Secret value format

The secret value must be a plain PostgreSQL DSN string.

Recommended shape:

```text
host=db-host.example.com port=5432 user=app_user password=super-secret sslmode=require
```

Notes:

- `dbname` may be omitted
- tenant DB name is still selected from `tenant_db.db_name`
- URI DSN is also accepted if it can be parsed by backend DSN parsing

## Env contract

Optional AWS region override:

- `AUTHAPI_DB_AWSREGION`
- `ADMINAPI_DB_AWSREGION`
- `TENANTAPI_DB_AWSREGION`
- `MIGRATE_DB_AWSREGION`

If region is empty, AWS SDK default resolution is used.

## Runtime behavior

The resolver is wired into:

- `cmd/auth`
- `cmd/api-admin`
- `cmd/api-tenant`
- `cmd/migrate`

## Rotation policy

Current status:

- `restart-required v1`

Meaning:

- backend resolves `db_instance.secret_name` when the postgres client loads instances from master
- opened tenant pools remain cached in memory
- password rotation is not automatically propagated into already-open tenant pools
- after DB password rotation, runtimes must be restarted

## Why restart is required in v1

Current backend behavior:

- instance DSN is loaded into memory
- tenant pools are cached and reused
- there is no background watcher for Secrets Manager version changes
- there is no automatic pool eviction on auth failure or password rotation

Therefore:

- old connections may continue working for some time
- new connections can start failing after password change
- safest operational rule is:
  - rotate password
  - update secret value
  - restart runtimes

## What must be implemented for true rotation support

To support password rotation without restart, backend still needs:

1. instance reload trigger
- periodic refresh of `db_instance` rows and secret-backed DSN values
- or explicit admin-triggered reload endpoint/job

2. pool invalidation
- detect which `db_instance.code` changed
- close and remove cached pools for affected instance/database pairs

3. reconnect path
- after invalidation, next request should rebuild pool from fresh secret

4. better failure handling
- if authentication to Postgres fails, optionally force a one-time instance reload before returning failure

5. operational observability
- logs and metrics for:
  - secret resolution
  - pool eviction
  - reconnect success/failure

## Recommended current usage

- local dev: use `db_instance.dns`
- staging/prod: prefer `db_instance.secret_name`
- until live rotation is implemented, treat password rotation as a controlled restart procedure

## Related docs

- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/local-backend-bootstrap.md`
