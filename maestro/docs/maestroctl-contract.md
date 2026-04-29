---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: cli_driver_contract
lang: en
---

# Maestroctl Driver Contract

## Purpose

`maestroctl` is the proposed local driver for Codex and local agents working
with Maestro Cockpit.

Agents can technically call `GET` and `POST` HTTP endpoints, but the preferred
Phase 1 interface is:

```text
agent -> maestroctl -> Maestro API -> DB/artifacts
```

## Why A Driver Exists

`maestroctl` should:

- hide API URL, auth, and local workspace discovery;
- validate request JSON before sending it to the API;
- normalize repo-relative artifact paths;
- attach files and evidence consistently;
- add actor, reason, and idempotency metadata;
- return stable JSON to agents;
- support local development before a cloud worker exists.

## Command Shape

Recommended command groups:

```text
maestroctl workspace get
maestroctl repository get

maestroctl work list
maestroctl work get <work-id>
maestroctl work create --from packet.json
maestroctl work update <work-id> --from update.json
maestroctl work transition <work-id> --command <command> --reason "<reason>"

maestroctl feature list --work <work-id>
maestroctl feature create --work <work-id> --from feature.json
maestroctl feature update <feature-id> --from update.json

maestroctl task list --work <work-id>
maestroctl task get <task-id>
maestroctl task create --from task.json
maestroctl task update <task-id> --from update.json
maestroctl task transition <task-id> --command <command> --reason "<reason>"
maestroctl task dependency add <task-id> <dependency-id>
maestroctl task dependency remove <task-id> <dependency-id>

maestroctl stage list --task <task-id>
maestroctl stage start <stage-id>
maestroctl stage pause <stage-id>
maestroctl stage resume <stage-id>
maestroctl stage cancel <stage-id>
maestroctl stage submit-handoff <stage-id> --handoff handoff.json --readme README.md
maestroctl stage review <stage-id> --decision <accept|revise|block|cancel> --reason "<reason>"

maestroctl agent-run pause <agent-run-id> --reason "<reason>"
maestroctl agent-run resume <agent-run-id> --reason "<reason>"
maestroctl agent-run cancel <agent-run-id> --reason "<reason>"
maestroctl agent-run heartbeat <agent-run-id> --checkpoint <checkpoint>
maestroctl agent-run checkpoint <agent-run-id> --checkpoint <checkpoint>

maestroctl evidence attach --task <task-id> --attempt <attempt-id> --file <path> --type <type>
maestroctl approval request --task <task-id> --type <type> --reason "<reason>"
maestroctl approval decide <approval-id> --decision <approved|rejected> --reason "<reason>"

maestroctl artifacts import --path <path>
maestroctl artifacts export --work <work-id>
maestroctl artifacts validate --path <path>
```

## Output Shape

All commands should return machine-readable JSON:

```json
{
  "ok": true,
  "command": "task transition",
  "idempotency_key": "generated-key",
  "writes": [],
  "state": {
    "task_id": "task-build-chat-shell",
    "status": "in_progress"
  },
  "next_allowed_actions": [
    "stage_submit_handoff"
  ]
}
```

Errors should also be structured:

```json
{
  "ok": false,
  "error": {
    "code": "approval_required",
    "message": "High-risk implementation requires owner approval before start.",
    "required_approval": "high_risk_implementation"
  }
}
```

## Driver Boundary

`maestroctl` is not the source of truth.

It must not:

- mutate artifact state without API acknowledgement;
- bypass approval gates;
- keep hidden process memory that changes lifecycle behavior;
- invent status transitions that the API does not support.
