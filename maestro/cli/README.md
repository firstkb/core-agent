# Maestro CLI

`maestroctl` is the local driver for Phase 1 Maestro Cockpit work.

It talks to the Maestro API and prints stable JSON for agents and humans.

## Environment

```text
MAESTRO_API_URL=http://127.0.0.1:8787
```

`--api-url` overrides the environment value for one command.

For local API smoke runs, use the repository-level runner:

```bash
node maestro/scripts/smoke-local.mjs --env maestro/env/local.env
```

## Commands

```bash
maestroctl work list
maestroctl work create --from work.json
maestroctl work update <work-id> --from patch.json --reason "Owner clarified scope"

maestroctl task list --work <work-id>
maestroctl task create --from task.json
maestroctl task update <task-id> --from patch.json

maestroctl stage list --task <task-id>
maestroctl stage create --task <task-id> --name implementation --agent-role mason
maestroctl stage start <stage-id> --reason "Implementation is approved"
maestroctl stage review <stage-id> --decision accept --reason "Evidence satisfies acceptance"
maestroctl stage submit-handoff <attempt-id> --handoff handoff.json --readme README.md --summary "Done"

maestroctl attempt create --task <task-id> --stage <stage-id> --agent-role mason
maestroctl attempt submit <attempt-id> --handoff handoff.json --readme README.md

maestroctl evidence attach --task <task-id> --file go-test.log --type test
maestroctl evidence attach --attempt <attempt-id> --uri artifact://current/path --type note

maestroctl approval request --task <task-id> --type execution --reason "High-risk gate"
maestroctl approval decide <approval-id> --decision approved --reason "Approved by owner"

maestroctl agent-run create --agent-role mason --task <task-id> --stage <stage-id>
maestroctl agent-run start <agent-run-id>
maestroctl agent-run checkpoint <agent-run-id> --checkpoint before-tests
```

## Output

Successful commands:

```json
{
  "ok": true,
  "command": "stage start",
  "request": {
    "method": "POST",
    "path": "/api/stages/stage-1/start"
  },
  "writes": [],
  "state": {},
  "next_allowed_actions": []
}
```

Failed commands:

```json
{
  "ok": false,
  "command": "stage start",
  "error": {
    "code": "approval_required",
    "message": "Approved high-risk execution gate is required."
  }
}
```

## Validation

- `--from` files must be valid JSON.
- `--handoff` files must be valid JSON.
- `--file` evidence payloads are sent to the API for artifact storage.
