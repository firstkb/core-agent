# Decisions Log Audit

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `partially_implemented_in_slice_5`
- Target: `maestro/memory/durable/decisions-log.md`
- Purpose: Check whether current durable decisions are still useful or whether the log contains garbage, stale decisions, or compaction candidates.

## Summary

`decisions-log.md` is still valuable. It contains durable product, architecture,
docs-routing, memory, CI, and agent-runtime decisions that future agents should
not rediscover from scratch.

It is not clean enough to treat as fully current without semantic caution. The
file has numbering drift, stale active decisions from the retired runtime era,
duplicate source references, old deleted source paths, and many migration
mechanics entries that now read more like an operational ledger than durable
decision memory.

Recommendation: do not delete wholesale. Perform a focused compaction pass after
the human-agent symbiosis policy is accepted.

## Mechanical Findings

- File length: 1063 lines.
- Decision headings present: `DEC-001` through `DEC-088`.
- Actual entries: 89, because `DEC-049` is duplicated.
- Status counts:
  - `active`: 82
  - `superseded`: 6
  - `historical`: 1
- Mechanical docs checks pass, but they do not catch all semantic drift.

## Problems To Fix

### Duplicate Decision ID

`DEC-049` appears twice:

- `DEC-049 Form Builder Exact-Detail Docs Require Extraction Before Deletion`
- `DEC-049 Backend Operational, Proposal, And Import Docs Use Target Folders`

This should be fixed before new durable decisions are added. Since there are no
observed external references to these IDs outside `decisions-log.md`, a cleanup
can either:

- renumber the second `DEC-049` and subsequent entries, then update any internal
  references found during that cleanup; or
- keep existing IDs stable and add an explicit errata/normalization note.

Preferred cleanup: do a deliberate memory compaction pass rather than a casual
one-line renumber.

### Stale Active Decisions

These entries should probably be marked superseded or replaced by a compact
native Maestro decision:

| Entry | Issue | Recommendation |
|---|---|---|
| `DEC-019` | Mentions only early Codex-native skill set and does not reflect the full active vNext team | Supersede with current Maestro vNext runtime/team source-of-truth decision |
| `DEC-055` | Says retired runtime uses `maestro/memory/retired-runtime` and `maestro/memory/runs/active`, but those surfaces are no longer active | Supersede by `DEC-088` |
| `DEC-077` | Points to retired-runtime evidence template path; current closeout template is `maestro/templates/evidence.md.tmpl` | Supersede or replace with current evidence-template decision |
| `DEC-078` | Defines retired runtime direct no-run behavior and `maestro/memory/runs/active` artifacts | Supersede by native Maestro current-chat / `maestro/artifact/active` model |
| `DEC-086` | Requires `maestro/memory/runs/active` closure policy, but active task state moved to `maestro/artifact/active` | Supersede by `DEC-088` or new artifact lifecycle decision |
| `DEC-071` | Says Archivist role was formerly named Scribe; current active team has both Scribe and Archivist as separate roles | Clarify to avoid role confusion |
| `DEC-087` | Says Browser Use is preferred local app visual-smoke tool when requested; current planning now separates Browser Use structured checks from external Chrome final desktop UX acceptance | Update after owner accepts outsourced capability policy |

### Stale Sources

Many active early decisions still cite deleted `platform/docs/ai/**` paths.
That is acceptable for provenance only when the decision is explicitly about the
deleted legacy layer. It is weak for active product decisions.

Examples:

- `DEC-004` through `DEC-018` still cite old `platform/docs/ai/**` module memory
  or old exact-detail frontend docs.
- Several active docs migration decisions cite deleted old pointer paths as
  sources.
- `DEC-019`, `DEC-077`, `DEC-078`, `DEC-083`, `DEC-085`, and `DEC-086` cite
  retired-runtime paths that are no longer present in the active tree.

Recommendation: active decisions should cite current canonical docs/memory first
and use `git history` or `legacy-memory-import.md` only for historical
provenance.

### Over-Granular Migration History

The cluster `DEC-026` through `DEC-054`, plus `DEC-058` through `DEC-069`, is
mostly documentation relocation, pointer deletion, and old-path retirement
history.

These were useful during migration. As durable memory, they are now too
fine-grained for the hot decision log. Most future agents need the current route
rule, not every migration slice.

Recommendation: compact these into fewer durable decisions:

- active FE docs use target folders and doc maps;
- active BE docs use target folders and doc maps;
- old `platform/docs/ai/**` and old pointer paths are historical/git-history
  only;
- Form Builder exact-detail docs are retained opt-in references with deletion
  gates.

Keep detailed migration archaeology in existing doc maps, consolidation audits,
`legacy-memory-import.md`, or git history.

## Decisions That Should Stay

The following categories are still high-value and should remain in durable
memory, though some sources should be refreshed:

- product/runtime identity and active app direction;
- auth/session and tenant isolation decisions;
- admin access and Module Registry ownership;
- Collection Table ownership and package boundary;
- Platform Studio taxonomy and Form Builder boundaries;
- Form Builder schema, runtime naming, export/import, and per-view runtime
  decisions;
- reference-code opt-in policy;
- online web first / PWA-mobile deferred policy;
- memory first-read and maintenance rules;
- local dev `.platform.localhost` decision;
- frontend/backend file maintainability guardrails;
- minimal product CI gates;
- VSM v1.0.0 product identity;
- retired runtime provenance outside active tree.

## Cleanup Plan

Do not edit `decisions-log.md` casually during this planning discussion.

Recommended future cleanup slice:

1. Freeze current file with an audit note or artifact reference.
2. Fix duplicate `DEC-049` with an explicit normalization decision.
3. Mark stale retired-runtime decisions superseded by `DEC-088`.
4. Replace stale evidence/run/artifact entries with current native Maestro
   `maestro/artifact/active` and `maestro/templates/evidence.md.tmpl` policy.
5. Refresh sources for active product decisions to current canonical docs and
   memory modules.
6. Compact migration-history clusters into fewer current routing decisions.
7. Add new human-agent symbiosis decisions only after the owner accepts the
   final planning packet.
8. Run `docs_memory_check.py --check` and `check-env-policy.py --check`.
9. Consider Archivist review because this is semantic memory surgery.

## Immediate Recommendation

No urgent deletion.

The urgent blocker was the duplicate `DEC-049` and stale active
retired-runtime entries. Slice 5 handled those before adding new decisions.
New durable decisions now start at `DEC-089`.

## Slice 5 Implementation Note

Slice 5 addressed the immediate blockers:

- normalized the duplicate backend docs entry to `DEC-049B` without renumbering
  stable later IDs;
- refreshed current runtime wording for `DEC-019`, `DEC-071`, `DEC-077`, and
  `DEC-087`;
- marked stale retired-runtime entries `DEC-055`, `DEC-078`, and `DEC-086` as
  superseded;
- added new durable decisions `DEC-089` through `DEC-094`.

The broader migration-history compaction and old product-decision source refresh
remain deliberately deferred because they would be a larger archival rewrite.
