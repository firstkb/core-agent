---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: artifact_root
lang: en
---

# Maestro Artifact Root

This directory is the native Maestro work-record surface. It is intentionally
flat and owner-readable. It is not a database, queue, runtime, dashboard, or
project-management system.

## Layout

```text
maestro/artifact/
  active/
    YYYY-MM-DD-<work-slug>/
      work.md                         # normal continuity anchor
      evidence.md                     # when evidence exists
      closeout.md                     # when closed
      packet.md                       # optional specialist packet
      agent-<role>-NNN.md             # optional specialist notes
      approval-001.json               # only for real approval gates
      handoff-<stage>-<role>-NNN.json # only for delegated/staged work
  archive/
    YYYY-MM-DD-<work-slug>/
      ...
```

`active/` may contain multiple concurrent work folders. Each active folder is a
compact working record for one owner request or work slice.

Normal persisted work starts with `work.md`. Use `evidence.md` and
`closeout.md` when evidence or closeout exists. Add packets, handoffs, agent
notes, approval records, or expanded planning files only when delegation,
resume, accountability, release, or real gates make them useful.

`work.md` status values use the canonical active-queue language:
`in_progress`, `waiting_owner`, `blocked`, `close_ready`, or `archived`.
Use its `Goal Alignment` block to show why the work matters before listing
execution details.

`archive/` stores completed, cancelled, or frozen work folders. A work folder
keeps the same name when moved from `active/` to `archive/`.

## Naming

Preferred folder name:

```text
YYYY-MM-DD-<work-slug>
```

Handoff names must include stage and role:

```text
handoff-<stage>-<role>-NNN.json
```

Examples:

```text
handoff-research-charlie-001.json
handoff-implementation-mason-001.json
handoff-verification-scout-001.json
handoff-review-lens-001.json
```

## Rules

- Keep the folder one level deep under `active/` or `archive/`.
- Add only files that help the next decision, handoff, evidence, or closeout.
- Do not create `intent.md`, `plan.md`, or `task.md` as a default baseline;
  use `work.md` unless an expanded legacy-compatible shape is explicitly useful.
- Do not store secrets, tokens, cookies, private URLs, or credential-bearing logs.
- Do not overwrite previous handoffs; append a new numbered attempt.
- Markdown evidence may summarize command output, but raw sensitive logs must stay out of tracked artifacts.
- Retired role/skill provenance is owner-managed outside the active repository;
  it is separate from `maestro/artifact/archive/`.
