---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: artifact_root
lang: en
---

# Maestro Artifact Root

This directory is the proposed native Maestro work-record surface.

It is intentionally flat and owner-readable. It is not a database, queue,
runtime, or project-management system.

## Layout

```text
maestro/artifact/
  active/
    YYYY-MM-DD-<work-slug>/
      intent.md
      plan.md
      task.md
      packet.md
      handoff-<role>-001.json
      evidence.md
      closeout.md
  archive/
    YYYY-MM-DD-<work-slug>/
      ...
```

`active/` may contain multiple concurrent work folders. Each active folder is a
compact working record for one owner request or work slice.

`archive/` stores completed, cancelled, or frozen work folders. A work folder
should keep the same name when moved from `active/` to `archive/`.

## Naming

Preferred folder name:

```text
YYYY-MM-DD-<work-slug>
```

Use a plain `<work-slug>` only for short-lived local work where date-based
archiving adds no value.

## Rules

- Keep the folder one level deep under `active/` or `archive/`.
- Add only files that help the next decision, handoff, evidence, or closeout.
- Do not store secrets, tokens, cookies, private URLs, or credential-bearing
  logs.
- Do not turn this folder into a Cockpit replacement.
- Use `maestro/archive/` only for retired role/skill provenance; it is separate
  from `maestro/artifact/archive/`.
