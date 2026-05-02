---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: template_schema_mapping
lang: en
---

# Template Schema Mapping

This note keeps Markdown templates and JSON schemas aligned without turning
owner-readable artifacts into mandatory machine records.

## Rules

- Markdown templates are compact human-readable forms for normal work.
- JSON schemas are used when gates, release evidence, machine-readable handoff,
  resume, auditability, or validation require strict records.
- Intentional asymmetry is allowed only when this file states the reason.
- Large logs, screenshots, raw command output, local auth details, and secrets
  must not be copied into Markdown templates or JSON metadata.

## Current Mapping

| Surface | JSON schema | Markdown template | Mapping |
|---|---|---|---|
| Evidence | `maestro/contracts/evidence.schema.json` | `maestro/templates/evidence.md.tmpl` | JSON schema is one evidence item. Markdown template is an aggregate evidence log for a work artifact. |
| Closeout | `maestro/contracts/closeout.schema.json` | `maestro/templates/closeout.md.tmpl` | Markdown mirrors the required owner-visible fields, including `owner_input_required`. |
| Packet | `maestro/contracts/task-packet.schema.json` | `maestro/templates/packet.md.tmpl` | Markdown includes the packetable stage enum. `intake` is excluded. `approval` and `archive` are lifecycle stages used only for bounded Maestro/gated records. |
| Review | `maestro/contracts/stage-handoff.schema.json` | `maestro/templates/review.md.tmpl` | Review verdict is the review subset: `continue`, `revise`, `block`, `request_owner_decision`. Release/archive/close recommendations belong in handoff or closeout records. |
| Release handoff | `maestro/contracts/stage-handoff.schema.json` | release docs and release skill | Canonical handoff ids use `handoff-<stage>-<role>-NNN`; release therefore uses `handoff-release-release-NNN`. |

## Evidence Metadata

`evidence.schema.json` allows only scalar metadata values. Metadata is for
filtering and compact context, not payload storage. Use `source.artifact_ref`,
`source.path`, or a separate evidence item for large or structured details.

## Stage Role Constraints

Release stage-to-role binding is schema-hard because release/deploy work always
requires release approval and durable release evidence.

Other specialist stage-to-role pairings remain adaptive at the schema layer so
Maestro can handle safe inline work, planning notes, combined low-risk T0/T1
work, or bounded Maestro assignments without creating invalid packets. The
stage contract remains the policy source for normal specialist routing.
