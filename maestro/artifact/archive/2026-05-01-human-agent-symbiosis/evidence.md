# Evidence

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `completed`
- Scope: Maestro runtime/docs/memory/skill cleanup only. Product code was not touched.

## Summary

The seven approved slices aligned Maestro's memory retrieval, runtime docs, doc
classification, active skill prompts, agent configs, durable decisions, and
frontend policy propagation around the human-agent symbiosis model.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| `python3 scripts/ai/docs_memory_check.py --check` | `passed` | local run | Docs/memory policy checks passed. |
| `python3 scripts/ai/check-env-policy.py --check` | `passed` | local run | Environment policy checks passed. |
| `git diff --check` | `passed` | local run | No whitespace/error markers in the diff. |
| `.codex/agents/*.toml` parse with Python `tomllib` | `passed` | local run | Active agent TOML files parsed. |
| `.agents/skills/*/agents/openai.yaml` parse with Ruby YAML | `passed` | local run | Active skill launch YAML files parsed. |
| `maestro/contracts/*.json` and `.codex/contracts/**/*.json` parse with Python `json` | `passed` | local run | 45 JSON contract/schema files parsed. |
| `scripts/ai/preflight.sh` | `passed` | local run | Lite preflight passed. |

## Consistency Review

- Source order and read paths: no conflict found. Broad source-of-truth lists
  remain repo guidance; Maestro now lazy-reads schemas/templates by route.
- Fixed chains: no active doc requires a fixed specialist chain. Remaining hits
  are prohibitions, retired compatibility pointers, or internal intake wording.
- FE tool policy: Browser Use, Computer Use, Build Web Apps, Scout, and Maestro
  UI/UX ownership are consistent across active surfaces.
- Owner/Maestro split: consistent across runtime docs, memory, skills, and agent
  configs.
- Role boundaries: active role prompts and docs agree that specialists improve
  correctness, focus, evidence, or review; they do not own final product taste.
- Time-based greetings: not promoted into active runtime behavior.
- Legacy naming: `brief_auditor` is current for legacy continuation.
- Decision IDs: duplicate `DEC-049` heading was normalized to `DEC-049B`; no
  exact duplicate heading remains.
- Slice 7 FE propagation: `platform/frontend/AGENTS.md` and
  `maestro/memory/modules/frontend/build-web-apps-review.md` now match the
  final Maestro FE evidence policy.
- Artifact closure: active work folder was moved to
  `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/`, and durable
  decision source paths were updated to the archive path.

## Changed File Groups

- Maestro runtime docs under `maestro/docs/**`
- Durable memory under `maestro/memory/**`
- Active role skills under `.agents/skills/**`
- Active agent configs under `.codex/agents/**`
- Frontend lane guidance in `platform/frontend/AGENTS.md`
- Build Web Apps bridge memory under `maestro/memory/modules/frontend/build-web-apps-review.md`
- AGENTS responsibility boundaries in root/platform/lane AGENTS files and
  `.codex/standards/runtime/repository.md`
- Planning and closeout artifacts under this work root

## Browser / Visual Evidence

- Skipped. This was a runtime/docs/memory/prompt cleanup with no product UI
  behavior or frontend rendering change.

## Review Evidence

- No independent Lens or Archivist subagent was launched. The final review was
  bounded, targeted checks passed, and no unresolved policy conflict required
  escalation.

## Skipped Checks

- Full product preflight: skipped because the work did not touch product code,
  backend/frontend runtime behavior, migrations, or release surfaces.
- Browser/Computer Use visual QA: skipped because there was no visible product
  UI change.

## Residual Risks

- Some older historical decisions still cite retired provenance paths. They are
  not active runtime guidance and were not broadly rewritten in this cleanup.
- Retired and audit/provenance docs intentionally preserve some old language for
  history; current runtime routing points to updated active docs.
- Future work should define a context compaction continuity policy for what
  Maestro must preserve and restore after automatic context compaction.
