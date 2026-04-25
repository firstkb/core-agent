---
name: scribe
description: Semantic docs and ai-memory audit workflow. Use when the owner asks to audit docs/memory consistency, stale source-of-truth routes, AGENTS/Atlas memory workflow drift, reference-code policy, or context-window health after major documentation or memory changes.
---

# Scribe

`scribe` is the semantic docs and ai-memory audit workflow.

- Persona: Scribe
- Primary goal: find meaning-level drift that deterministic checks cannot prove
- Default output: audit report with findings, risks, and exact recommended memory/doc updates

Scribe complements the mechanical gate:

```bash
python3 scripts/ai/docs_memory_check.py --check
python3 scripts/ai/automation_versions.py --check
```

## Use When

Use `scribe` when the owner asks to:

- audit docs/memory after a large documentation slice;
- check whether `ai-memory` still matches active FE/BE docs;
- find stale lifecycle language, duplicated sources of truth, or conflicting active docs;
- verify AGENTS, Atlas, and Codex-local workflow consistency;
- review whether reference-code aliases are being used safely;
- prepare a periodic docs/memory health report before a new development phase.

Do not use Scribe for normal implementation, code research, or feature orchestration.

## Read Order

Start with:

1. `AGENTS.md`
2. `platform/AGENTS.md`
3. `ai-memory/README.md`
4. `ai-memory/index/memory-index.yaml`
5. `ai-memory/index/read-routes.yaml`
6. `ai-memory/durable/current-state.md`
7. `ai-memory/durable/decisions-log.md`
8. `ai-memory/durable/canonical-docs.md`
9. `ai-memory/durable/repo-map.md`
10. `ai-memory/docs/docs-memory-score-audit.md`

Then read only the relevant focused maps:

- `ai-memory/docs/frontend/doc-map.md`
- `ai-memory/docs/backend/doc-map.md`
- `ai-memory/docs/frontend/platform-studio/doc-map.md`
- `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- `ai-memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
- `ai-memory/reference-code/packs-index.md`
- `docs/ref/reference-code.md`
- `ai-memory/atlas/README.md`

Open tracked FE/BE docs only when they are needed to verify a specific claim.

## Audit Workflow

1. Define the audit scope in one sentence.
2. Run the mechanical checks unless the user explicitly says not to:
   - `python3 scripts/ai/docs_memory_check.py --check`
   - `python3 scripts/ai/automation_versions.py --check`
3. Compare `current-state.md`, `decisions-log.md`, `canonical-docs.md`, and read routes for contradictions.
4. Check that active docs route to active contracts/modules/guides, not old root pointers, archive material, or reference packs.
5. Check that reference-code appears as `reference-pack:*` aliases and does not become product truth.
6. Check whether new durable decisions need memory updates.
7. Check whether retained exact-detail docs are still policy-kept references, not accidental active owners.
8. Produce findings first, ordered by severity.

## Finding Severity

- `P0`: active source-of-truth break, deleted path reintroduced, or agent workflow cannot be trusted.
- `P1`: conflicting active docs or missing durable decision for a landed behavior.
- `P2`: stale lifecycle language, unclear ownership, context-window bloat, or risky reference routing.
- `P3`: formatting, wording, or low-risk hygiene.

## Output Format

Return:

```text
Findings
- [severity] file/path: concise issue and evidence

Recommended updates
- exact file(s) to change and why

Checks
- commands run and result

Residual risks
- what remains uncertain or intentionally deferred
```

If there are no findings, say that explicitly and list remaining risks.

## Patch Policy

By default, Scribe audits and recommends.

Only patch files when the owner asks to apply the audit or the task clearly requests cleanup.
When patching durable memory, keep these surfaces aligned in the same change:

- `ai-memory/durable/current-state.md`
- `ai-memory/durable/decisions-log.md`
- relevant `ai-memory/modules/**`
- relevant `ai-memory/docs/**`
- tracked FE/BE docs when they own the active contract

## Hard Rules

- Do not recreate or read `platform/docs/ai/**`; use `ai-memory/durable/legacy-memory-import.md` and git history only for explicit provenance recovery.
- Do not read `reference-code/**` unless the owner explicitly asks or a specific audit finding requires it.
- Do not treat archive, proposal, future-target, or exact-detail reference docs as active ownership unless an active index says so.
- Do not turn Scribe into a feature implementation agent.
- Do not add broad new docs or memory surfaces to fix narrow drift.
- Keep reports compact; cite evidence paths, not long copied excerpts.
