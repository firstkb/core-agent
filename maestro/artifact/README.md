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
      intent.md
      plan.md
      task.md
      packet.md
      approval-001.json
      handoff-implementation-mason-001.json
      handoff-verification-scout-001.json
      evidence.md
      closeout.md
  archive/
    YYYY-MM-DD-<work-slug>/
      ...
```

`active/` may contain multiple concurrent work folders. Each active folder is a
compact working record for one owner request or work slice.

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
- Do not store secrets, tokens, cookies, private URLs, or credential-bearing logs.
- Do not overwrite previous handoffs; append a new numbered attempt.
- Markdown evidence may summarize command output, but raw sensitive logs must stay out of tracked artifacts.
- Use `maestro/archive/` only for retired role/skill provenance; it is separate from `maestro/artifact/archive/`.
