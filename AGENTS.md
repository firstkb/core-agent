# Repository guidance

## Runtime Source Of Truth

Read and treat these as authoritative before doing agent work:

- `AGENTS.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `.codex/config.toml`
- `.codex/agents/*`
- `.codex/contracts/*`
- `.codex/standards/*`
- `.codex/templates/*`
- `maestro/docs/runtime-contract.md`
- `maestro/contracts/**`
- `maestro/templates/**`
- `platform/AGENTS.md`
- `platform/frontend/AGENTS.md`
- `platform/backend/AGENTS.md`

Persisted run outputs under `artifacts/` are runtime artifacts, not design-time source of truth.

Retired surfaces:

- the retired pre-Codex source-of-truth layer must not be reintroduced.

Platform product memory:

- `maestro/memory/` is the compact retrieval and durable-memory layer for platform product work.
- `maestro/memory/` does not replace `.codex/`, `.agents/`, source code, or tracked canonical FE/BE docs when those surfaces own runtime behavior.
- the former `platform/docs/ai/**` layer is fully retired and deleted; use `maestro/memory/durable/legacy-memory-import.md`, compact archive summaries, and git history for provenance.

Optional Maestro packs:

- `maestro/packs/**` contains lazy-read operating packs, not durable product memory and not active agent skills.
- Packs help with specific workflows such as UI quality, but repository contracts, source code, UI Kit, memory routes, and owner decisions remain higher priority.
- Raw local reference folders may inspire packs, but agents should use the tracked pack entrypoints and not depend on `reference-code/**` being present.

## AGENTS Responsibility Boundaries

Keep each `AGENTS.md` file narrow to avoid duplicated policy and conflicting
interpretation:

- Root `AGENTS.md` owns repository-wide runtime source-of-truth boundaries,
  role map, artifact model, read policy, and completion checks.
- `platform/AGENTS.md` owns shared platform product-development invariants,
  cross-stack gates, memory update rules, and platform-level workflow.
- `platform/frontend/AGENTS.md` owns frontend workspace implementation rules:
  app/package boundaries, frontend auth/transport constraints, layout/code
  guardrails, commands, tests, and frontend docs update expectations.
- `platform/backend/AGENTS.md` owns backend workspace implementation rules:
  runtime surfaces, transport/service/repository boundaries, auth/tenant
  constraints, schema/migration guardrails, commands, tests, and backend docs
  update expectations.
- Maestro runtime and memory own owner-facing workflow, UI/UX judgment,
  browser/desktop evidence policy, agent/tool selection, delegation, artifacts,
  gates, and closeout behavior.
- `.agents/**` and `.codex/**` own role prompts, system-agent configs,
  contracts, templates, and reusable standards.

Do not duplicate Maestro UI/UX acceptance, browser/desktop tool-selection, or
agent-delegation policy inside lane `AGENTS.md` files. Lane files may require
local code quality and safety checks, but final product-quality judgment and
tool/evidence orchestration belong to Maestro.

## Docs classification

Treat:

- `AGENTS.md` and `README.md` as the live repository orientation.
- `maestro/memory/durable/repo-map.md` as the compact layout map.
- `maestro/docs/runtime-contract.md` as the live Maestro runtime contract.

Treat:

- `maestro/docs/**`
- `maestro/contracts/**`
- `maestro/templates/**`

as the active Maestro vNext foundation surface for native-first orchestration.
The legacy `module_orchestrator` runtime remains available for old `artifacts/`
runs, but new Maestro-routed work should prefer `maestro_vnext` and
`maestro/artifact/active/<work-slug>/`.

## Runtime Read Policy

Ordinary agent work should read only:

- `AGENTS.md`
- for Maestro-routed repository or product work, always read `maestro/memory/START_HERE.md` and `maestro/memory/index/read-routes.yaml` before planning, execution, or status answers
- `maestro/memory/index/memory-index.yaml` when the task needs a broader route map
- relevant `maestro/memory/modules/**` or durable memory files only when the route, product behavior, UI/runtime flow, backend/data, auth/tenant/security, architecture, or prior decisions matter
- the relevant skill body under `.agents/skills/<skill>/SKILL.md`
- relevant files under `.codex/contracts/<agent>/`, `.codex/templates/<agent>/`, and `.codex/standards/`
- relevant `maestro/docs/**`, `maestro/contracts/**`, and `maestro/templates/**` files when the task explicitly targets Maestro vNext
- relevant `maestro/packs/**` entrypoints only when the owner names a pack,
  the route points to one, or a specific workflow needs it
- `.codex/config.toml` and `.codex/agents/*` when the task depends on runtime wiring
- for explicit legacy module-orchestrator continuation only, the exact target
  files under `artifacts/<module>/...` and
  `artifacts/<module>/features/<feature>/...`; new Maestro vNext work uses
  `maestro/artifact/active/` and `maestro/artifact/archive/`
- product/runtime code and docs that materially answer the task

Do not read build or plumbing surfaces during ordinary work:

- artifact folders for other modules unless the owner explicitly asks
- deleted legacy platform memory paths from `platform/docs/ai/**`; recover exact old text from git history only for explicit historical reconstruction

You are not the build system. Do not inspect validator source, fixtures, internal CLI plumbing, or old runs to infer behavior that is already defined in the active Codex-native skill, contract, template, standard, and doc surfaces.

## Completion Checks

Before marking non-trivial implementation work complete, run:

```bash
scripts/preflight.sh
```

Use `scripts/preflight.sh --full` only when the task needs a broader
product sweep across backend/frontend checks.
If the task is docs/memory-only, the targeted docs/memory checks are enough.
If preflight cannot run or optional checks fail, state exactly which checks ran,
which did not, and why.

For non-trivial task closeout or PR text, use the compact evidence shape in
`maestro/templates/evidence.md.tmpl`. Keep it short; do not turn it into a
mandatory file for tiny changes.


## Runtime roles

### Maestro

Use Maestro as the owner-facing solution architect and engineering partner for
new engineering work. Maestro runs inline in the main thread and uses
`maestro_vnext` as the backing system agent when native delegation is available.

Maestro owns:

- owner intent clarification;
- technical direction and the smallest useful engineering path;
- internal conversation mode, route tier, and artifact shape selection;
- lean artifact creation under `maestro/artifact/active/<work-slug>/`;
- specialist assignment creation when useful;
- approval gate enforcement;
- evidence reconciliation;
- closeout and archive decisions.

Maestro must keep tiers, packets, handoffs, approvals, and specialist mechanics
internal unless they affect product, risk, timing, or evidence. Maestro must not
recursively spawn itself, bypass approval gates, guess unclear product behavior,
or turn tiny work into gated-work ceremony.

Once Maestro understands T1+ persisted work, it may create or update `work.md`
without asking for separate artifact permission. This preserves continuity and
does not authorize product-code edits or high-risk work.

### Charlie

Use Charlie for read-only codebase and documentation research when facts,
change points, dependencies, or risks are unclear.

Charlie must not implement. Charlie returns bounded research findings to
Maestro with observed facts, inference separated from evidence, and recommended
next action. Durable handoff artifacts are used only when Maestro requests them
or auditability requires them.

### Grant

Use Grant to audit a brief, plan, route, risk model, or acceptance criteria
before approval. Grant challenges ambiguity, unsupported assumptions, weak
scope, missing gates, and insufficient evidence.

Grant does not approve work and does not mutate repository artifacts directly
unless Maestro explicitly assigns a docs-only audit note or handoff.

### Mason

Use Mason for scoped implementation after Maestro has provided an assignment with
allowed paths, forbidden paths, evidence expectations, stop conditions, and any
approval references.

Mason may edit only assigned product/docs/test files and must return changed
files, checks, skipped checks, and residual risks. Durable handoff artifacts are
used only when Maestro requests them or auditability requires them.

### Scout

Use Scout for verification: tests, builds, browser/Storybook checks, CI review,
security checks, migration dry runs, or other evidence collection.

Scout should be independent from Mason when verification risk is material.

### Lens

Use Lens for read-only review of diff, evidence, security posture, acceptance,
and residual risk. Lens recommends continue, revise, block, or owner decision;
Maestro owns the lifecycle decision.

### Release

Use Release only for release packaging, deployment, production promotion,
workflow dispatch, rollback notes, or release evidence. Release requires an
explicit release approval before production-impacting action.

### Scribe

Use Scribe for durable closeout and evidence summary when persisted artifacts
are useful. Scribe writes closeout artifacts and final summaries, not product
implementation.

### Archivist

Use Archivist for semantic docs and durable memory audit when docs, source of
truth, or `maestro/memory` consistency may drift.
Archivist is an audit workflow, not a product owner.

## Naming

Active vNext skill nicknames map to Codex system agent ids as follows:

- `maestro` -> `maestro_vnext`
- `charlie` -> `research_charlie`
- `grant` -> `audit_grant`
- `mason` -> `implementation_mason`
- `scout` -> `verification_scout`
- `lens` -> `review_lens`
- `release` -> `release_manager`
- `scribe` -> `closeout_scribe`
- `archivist` -> `memory_archivist`

Legacy system agent ids remain available for old module-orchestrator runs:

- `module_orchestrator`
- `research_codebase`
- `brief_auditor`

Do not use legacy agents for new Maestro vNext work unless the owner explicitly
asks to continue an old `artifacts/<module>/...` run.

## Artifact model

For Maestro vNext work, use the flat native artifact model:

- active work root: `maestro/artifact/active/YYYY-MM-DD-<work-slug>/...`
- archived work root: `maestro/artifact/archive/YYYY-MM-DD-<work-slug>/...`
- normal files: `work.md`, `evidence.md`, `closeout.md`
- optional escalation files: `agent-<role>-NNN.md`, `packet.md`,
  `approval-*.json`, `handoff-<stage>-<role>-NNN.json`
- persisted artifacts stay in English

For legacy module-orchestrator continuation only, use the old model:

- module root: `artifacts/<module>/...`
- feature root: `artifacts/<module>/features/<feature>/...`
- stage root: `artifacts/<module>/features/<feature>/stages/<stage>/...`

## Artifact History Policy

- Treat only the exact target module and target feature artifact tree as the active run history.
- Do not read or cite artifact folders from other modules as style references, structure examples, templates, or fallback context unless the owner explicitly asks.

## Legacy Compatibility

Legacy module-orchestrator agents remain available only for old
`artifacts/<module>/...` continuation. Do not start new lifecycle work through
deleted CLI or render-managed surfaces. Active runtime behavior lives in
`.agents/skills/`, `.codex/`, `AGENTS.md`, `maestro/docs/**`, and
`maestro/contracts/**`.
