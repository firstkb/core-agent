# Maestro Backend

Phase 1 backend foundation for Maestro Cockpit.

## Stack

- Go
- PostgreSQL
- HTTP JSON API
- File artifacts indexed by DB state

## Environment

```text
MAESTRO_DATABASE_URL=postgres://user:password@localhost:5432/maestro?sslmode=disable
MAESTRO_ARTIFACT_ROOT=../artifacts/current
MAESTRO_HTTP_ADDR=127.0.0.1:8787
MAESTRO_MIGRATIONS_DIR=migrations
MAESTRO_RUN_MIGRATIONS=false
```

## Commands

Run migrations:

```bash
go run ./cmd/migrate
```

Start API:

```bash
go run ./cmd/api
```

Run tests:

```bash
go test ./...
```

## Health

```text
GET /status
GET /healthz
GET /readyz
GET /api/health
```
