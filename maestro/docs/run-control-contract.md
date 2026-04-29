---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: run_control_contract
lang: en
---

# Maestro Run Control Contract

## Purpose

This document defines how Maestro controls running work: pause, resume, cancel,
checkpoint, stale detection, and safe recovery.

## Core Principle

Run control is cooperative and checkpoint-based.

Maestro should not promise that an agent or worker can be frozen in the middle
of an arbitrary shell command, browser action, or file edit. Pause and cancel
requests take effect at the next safe checkpoint, then the agent or worker must
submit a handoff or partial status.

## Control Targets

Run control may target:

- work;
- task;
- stage;
- attempt;
- agent run.

Phase 1 may implement these as stage-level and agent-run-level commands only,
with work/task controls derived from the active child stages.

## Status Model

Recommended granular run statuses:

- `queued`
- `running`
- `pause_requested`
- `pausing_at_checkpoint`
- `paused`
- `resume_requested`
- `resuming`
- `cancel_requested`
- `cancelling_at_checkpoint`
- `cancelled`
- `failed`
- `completed`
- `stale`

Stage and task status may stay coarser in the UI, but the active attempt or
agent run must expose the granular run-control state when it exists.

## Commands

Canonical commands should be POST command endpoints or `maestroctl` equivalents.

Stage commands:

```text
POST /api/stages/:id/pause
POST /api/stages/:id/resume
POST /api/stages/:id/cancel
```

Agent run commands:

```text
POST /api/agent-runs/:id/pause
POST /api/agent-runs/:id/resume
POST /api/agent-runs/:id/cancel
POST /api/agent-runs/:id/heartbeat
POST /api/agent-runs/:id/checkpoint
```

Every command must include actor, reason, and expected target state.

## Checkpoints

Default safe checkpoints:

- after research summary;
- after plan or brief generation;
- before implementation starts;
- before high-risk file edits;
- before migration generation or execution;
- before destructive filesystem or git commands;
- before browser visual pass;
- before long test or CI runs;
- before release or deployment;
- before docs or memory updates;
- after handoff submission.

The task packet or stage packet may add stricter checkpoints.

## Pause

Pause request flow:

```text
running
  -> pause_requested
  -> pausing_at_checkpoint
  -> paused
```

Rules:

- pause does not discard work;
- the active agent should stop at the next checkpoint;
- partial notes and changed files must be recorded before `paused`;
- no next stage may start while the parent stage is paused;
- owner may request a handoff now instead of a normal pause.

Resume flow:

```text
paused
  -> resume_requested
  -> resuming
  -> running
```

Resume requires:

- the same task/stage context is still valid;
- no blocking approval has expired or changed;
- the repo checkout is still compatible, or the resume packet explains the new
  checkout state.

## Cancel

Cancel request flow:

```text
running
  -> cancel_requested
  -> cancelling_at_checkpoint
  -> cancelled
```

Rules:

- cancel should stop future work at the next checkpoint;
- already-written files are not automatically reverted;
- the cancelling agent must report changed files, commands run, evidence, and
  cleanup risks;
- Maestro decides whether a cleanup task is needed;
- destructive cleanup requires its own approval when it touches high-risk paths.

## Stale Runs

A run may be marked `stale` when:

- heartbeat is missing past the configured timeout;
- the process is gone but DB state says it is running;
- the workspace checkout no longer matches the run packet;
- the owner or Maestro cannot obtain a handoff from the active attempt.

Stale handling:

- do not auto-complete stale work;
- block next-stage execution until Maestro reviews the last known state;
- create a new attempt for retry;
- preserve stale run events for audit.

## Heartbeat

Future local or cloud workers should send heartbeat events with:

- agent run id;
- current checkpoint;
- current command or activity summary;
- last artifact or evidence path;
- timestamp.

Phase 1 can use manual events or CLI-submitted checkpoints instead of a
background heartbeat loop.

## Handoff On Pause Or Cancel

When pausing or cancelling, the active agent should submit a compact handoff:

- status: `paused` or `cancelled`;
- current checkpoint;
- changed files;
- commands run;
- evidence refs;
- incomplete work;
- risks;
- recommended next action.

The handoff is not a closeout. It is a recovery record.

## UI Requirements

Cockpit must show:

- current run-control status;
- requested command and requester;
- current checkpoint;
- last event time;
- stale indicator;
- next allowed action;
- whether resume, cancel, or retry is available.

The UI must not show paused work as complete.
