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

## Phase 1 API Slice

Implemented resources:

```text
GET  /api/work
POST /api/work
GET  /api/work/{id}
POST /api/work/{id}/update
GET  /api/work/{id}/evidence
POST /api/work/{id}/evidence

GET  /api/tasks
POST /api/tasks
GET  /api/tasks/{id}
POST /api/tasks/{id}/update

GET  /api/tasks/{id}/stages
POST /api/tasks/{id}/stages
GET  /api/stages/{id}
POST /api/stages/{id}/start
POST /api/stages/{id}/pause
POST /api/stages/{id}/resume
POST /api/stages/{id}/cancel
POST /api/stages/{id}/review

GET  /api/tasks/{id}/attempts
POST /api/tasks/{id}/attempts
GET  /api/attempts/{id}
POST /api/attempts/{id}/submit

GET  /api/tasks/{id}/evidence
POST /api/tasks/{id}/evidence
GET  /api/attempts/{id}/evidence
POST /api/attempts/{id}/evidence

GET  /api/tasks/{id}/approvals
POST /api/tasks/{id}/approvals
GET  /api/approvals/{id}
POST /api/approvals/{id}/decide

GET  /api/agent-runs
POST /api/agent-runs
GET  /api/agent-runs/{id}
POST /api/agent-runs/{id}/start
POST /api/agent-runs/{id}/pause
POST /api/agent-runs/{id}/resume
POST /api/agent-runs/{id}/cancel
POST /api/agent-runs/{id}/checkpoint
POST /api/agent-runs/{id}/heartbeat
```

## Artifact Payloads

Evidence endpoints accept either an existing `uri` or a file payload:

```json
{
  "type": "test",
  "title": "go test output",
  "file": {
    "name": "go-test.log",
    "content": "ok",
    "encoding": "text"
  }
}
```

Attempt submit can write handoff and README files:

```json
{
  "changes": {
    "summary": "Implementation complete.",
    "handoff_file": {
      "content": "{}"
    },
    "readme_file": {
      "content": "Done."
    }
  }
}
```

The API writes files under `MAESTRO_ARTIFACT_ROOT`, returns
`artifact://current/...` URIs, and stores those URIs in PostgreSQL. Artifact
files are portable evidence and handoff records, not live state.
