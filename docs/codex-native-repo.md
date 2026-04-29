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
- `ai-memory/START_HERE.md` - first compact product-memory read after instructions.
- `ai-memory/index/read-routes.yaml` - route-specific memory/doc read sets.
- `ai-memory/modules/**` - compact durable module packs.
- `ai-memory/durable/**` - durable decisions, current state, canonical docs, and migrated legacy memory summaries.
- `.agents/skills/*/SKILL.md` - active local skill behavior.
- `.codex/**` - Codex-native config, native agents, contracts, standards, and templates.
- `.agent-cli/**` - typed lifecycle gateway for module/feature/stage artifacts.
- `platform/frontend/docs/**` and `platform/backend/docs/**` - canonical product docs.

Use `ai-memory/index/memory-index.yaml` only when broader routing is needed.

## Runtime Layout

```text
AGENTS.md
README.md

ai-memory/
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

.agents/
  skills/
    atlas/
    archivist/
    ...

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

Proposed Maestro Cockpit and Maestro vNext foundation surface.

- `maestro/docs/**` defines the target orchestration, agent role, artifact, and
  state models.
- `maestro/contracts/**` defines proposed portable schemas for task packets,
  stage handoffs, evidence, and orchestration plans.
- `maestro/templates/**` defines proposed Markdown templates for tasks,
  attempts, and closeout records.

This directory does not replace the current live `module_orchestrator` runtime
until explicitly promoted. The current live runtime remains under
`docs/maestro/module-orchestrator-v2-spec-pack/`, `.codex/contracts/`,
`.codex/templates/`, and `.agents/skills/`.

### `ai-memory/`

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

- `atlas` - Atlas, the default intake/routing/orchestration layer for platform work.
- `archivist` - semantic docs/memory drift auditor.

Other skills may exist for specialized workflows. Skill bodies are active
runtime instructions when invoked.

### `.agent-cli/`

Typed lifecycle gateway and validation surface for module, feature, and stage
artifacts under `artifacts/`.

The CLI owns mutable JSON lifecycle state. AI authors Markdown briefs and stage
attempt reports; CLI commands own typed state transitions.

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
`ai-memory/` and physically deleted. Use:

- `ai-memory/durable/legacy-memory-import.md`
- `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md`
- git history only for explicit provenance recovery

Do not recreate `platform/docs/ai/**`.

## Compatibility Command

```bash
node .agent-cli/bin/agent-stack.mjs render-runtimes --check
```

This command is retained only as a compatibility health check while old generated
runtime adapters remain retired. It does not define active runtime behavior.
