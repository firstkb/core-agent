---
doc_status: current
doc_scope: canonical
doc_type: repo_runtime
lang: en
---

# Repository Runtime Layout

This document defines the live repository layout and source-of-truth boundary for
the VSM (Virtual Safety Manager) v1.0.0 product workspace and Codex-native
agent runtime.

## Active Source Of Truth

Use these surfaces as the active runtime source of truth:

- `AGENTS.md` - repo-wide agent guidance.
- `platform/AGENTS.md` - platform product guidance and AI memory read order.
- `platform/frontend/AGENTS.md` - frontend workspace rules.
- `platform/backend/AGENTS.md` - backend workspace rules.
- `maestro/memory/START_HERE.md` - first compact product-memory read after instructions.
- `maestro/memory/index/read-routes.yaml` - route-specific memory/doc read sets.
- `maestro/memory/modules/**` - compact durable module packs.
- `maestro/memory/durable/**` - durable decisions, current state, canonical docs, and migrated legacy memory summaries.
- `.agents/skills/*/SKILL.md` - active local skill behavior.
- `.codex/**` - Codex-native config, native agents, contracts, standards, and templates.
- `maestro/**` - Maestro vNext native orchestration contracts, templates, examples, and flat work artifacts.
- `.agent-cli/**` - typed lifecycle gateway for legacy module/feature/stage artifacts.
- `platform/frontend/docs/**` and `platform/backend/docs/**` - canonical product docs.

Use `maestro/memory/index/memory-index.yaml` only when broader routing is needed.

## Runtime Layout

```text
AGENTS.md
README.md

maestro/memory/
  START_HERE.md
  agent-workflow.md
  atlas/
  docs/
  durable/
  index/
  modules/
  runs/

platform/
  AGENTS.md
  frontend/
    AGENTS.md
    docs/
    apps/
    packages/
  backend/
    AGENTS.md
    docs/
    cmd/
    internal/
    modules/
    migrations/

maestro/
  README.md
  docs/
  contracts/
  templates/
  examples/
  artifact/

.agents/
  skills/
    maestro/
    charlie/
    grant/
    mason/
    scout/
    lens/
    release/
    scribe/
    archivist/
    atlas/

.agent-cli/
.codex/
.github/workflows/
docs/
artifacts/
reference-code/
scripts/
```

## Role Of Each Surface

### `platform/`

Product code root.

- `platform/frontend/` owns the frontend workspace, apps, shared packages, FE docs, Caddy local dev proxy, and frontend CI surface.
- `platform/backend/` owns Go runtimes, backend modules, migrations, seed/bootstrap flow, BE docs, and backend CI surface.
- `platform/docs/ai/**` is retired and must not be reintroduced.

### `maestro/`

Maestro vNext native-first orchestration surface.

- `maestro/docs/runtime-contract.md` defines the compact canonical vNext behavior.
- `maestro/docs/**` documents orchestration, agent roles, artifacts, and transition policy.
- `maestro/contracts/**` defines portable schemas for plans, packets, handoffs, evidence, approvals, and closeout.
- `maestro/templates/**` defines Markdown templates for intent, plans, packets, approvals, evidence, release, and closeout.
- `maestro/artifact/**` stores flat active and archived Maestro work records.

New Maestro-routed work should prefer `maestro_vnext` and the flat artifact model under `maestro/artifact/`. Legacy `module_orchestrator`, `research_codebase`, and `brief_auditor` remain available only for old `artifacts/<module>/...` continuation.

### `maestro/memory/`

Compact operational memory for AI agents.

- `START_HERE.md` is the first compact read.
- `index/read-routes.yaml` selects focused read sets.
- `modules/**` stores durable module facts, not copied docs.
- `durable/**` stores current state, decisions, canonical-doc routing, and migrated legacy-memory summaries.
- `atlas/**` stores Atlas prompt contracts, templates, automation metadata, and workflow notes.
- `runs/active/**` and `runs/archive/**` are execution artifacts, not canonical product truth.

### `.agents/skills/`

Repo-local Codex skills.

Current important skills include:

- `maestro` - owner-facing adaptive orchestration.
- `charlie` - read-only research.
- `grant` - plan/risk/acceptance audit.
- `mason` - scoped implementation.
- `scout` - verification and evidence.
- `lens` - read-only review.
- `release` - release/deploy after approval.
- `scribe` - closeout and evidence summary.
- `archivist` - semantic docs/memory drift auditor.
- `atlas` - transitional independent helper.

Skill bodies are active runtime instructions when invoked.

### `.agent-cli/`

Typed lifecycle gateway and validation surface for legacy module, feature, and
stage artifacts under `artifacts/`.

For new Maestro vNext work, use `maestro/artifact/active/` and the contracts in
`maestro/contracts/`. For legacy module-orchestrator continuation, the CLI owns
mutable JSON lifecycle state. AI authors Markdown briefs and stage attempt
reports; CLI commands own typed state transitions.

### `.codex/`

Codex-native runtime wiring:

- repo-scoped config
- native agent configs
- contracts
- standards
- templates

### `docs/`

Small repo-level docs index.

- `docs/codex-native-repo.md` is this runtime layout document.
- `docs/ref/**` contains stable opt-in reference metadata.
- `docs/archive/**` contains retired planning material outside the default read path.

### `reference-code/`

Local-only raw reference-code packs. This directory is ignored and not product
truth. Use stable aliases from `docs/ref/reference-code.md` instead of reading
raw packs by default.

### `artifacts/`

Persisted agent lifecycle artifacts. These are runtime outputs, not design-time
source of truth.

## Retired Surfaces

The former `platform/docs/ai/**` memory layer has been migrated into
`maestro/memory/` and physically deleted. Use:

- `maestro/memory/durable/legacy-memory-import.md`
- `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`
- git history only for explicit provenance recovery

Do not recreate `platform/docs/ai/**`.

## Compatibility Command

```bash
node .agent-cli/bin/agent-stack.mjs render-runtimes --check
```

This command is retained only as a compatibility health check while old generated
runtime adapters remain retired. It does not define active runtime behavior.
