# Project Architecture Intake

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `implemented_in_slice_4`
- Purpose: Define how Maestro and Mason should understand project structure,
  module boundaries, services, packages, and FE/BE implementation lanes without
  stuffing that knowledge into long agent prompts.

## Current Answer

This repository already has most of the needed architecture guidance. The
problem is not absence of rules. The problem is that the rules are distributed
across AGENTS files, memory, standards, and canonical FE/BE docs. Maestro and
Mason need a compact read decision and checklist before programming work.

## Existing Active Sources

### Platform-Level

- `platform/AGENTS.md`: product invariants, read order, high-risk changes,
  memory update rules, and development workflow.
- `maestro/memory/durable/platform-contract.md`: compact product, backend,
  frontend, Platform Studio, tenancy, auth, and docs contract.
- `maestro/memory/durable/module-index.md`: route map for domain/frontend/backend
  module packs.
- `maestro/memory/durable/repo-map.md`: compact repository shape, but currently
  needs refresh.

### Frontend

- `platform/frontend/AGENTS.md`: frontend app/package rules, shared UI boundary,
  auth/transport rules, layout defaults, visual review loop, file-size
  guardrails, commands, and docs update rules.
- `platform/frontend/docs/contracts/workspace.md`: active frontend apps and
  shared package list.
- `platform/frontend/docs/contracts/package-boundaries.md`: app/package import
  rules and promotion rules.
- `platform/frontend/docs/contracts/app-surfaces.md`: `platform-admin-web` vs
  `tenant-web` ownership.
- `platform/frontend/docs/contracts/ui-kit.md`: shared UI Kit promotion and
  primitive governance.

### Backend

- `platform/backend/AGENTS.md`: backend runtime roots, architecture rules,
  handler/service/repository split, tenant/auth invariants, file-size
  guardrails, commands, and docs update rules.
- `platform/backend/docs/modules/runtime.md`: backend modular monolith shape and
  runtime responsibilities.
- `platform/backend/docs/contracts/runtime-wiring.md`: runtime composition,
  wiring files, route registration, constructors, and responsibility split.
- `platform/backend/docs/contracts/schema-tenancy.md`: master/tenant schema,
  tenant isolation, table placement, and naming rules.
- `platform/backend/docs/contracts/migrations.md`: migration ownership and
  schema change rules when schema work is involved.

### Cross-Cutting Standards

- `.codex/standards/backend/go.md`: backend design expectations.
- `.codex/standards/frontend/react.md`: React frontend expectations.
- `.codex/standards/library/public-api.md`: public package/API stability.
- `.codex/standards/engineering/testing.md`: testing priority and shape.
- `.codex/standards/shared/security.md`: security baseline.
- `.codex/standards/runtime/repository.md`: active runtime/source-of-truth
  boundary.

## Cursor Reference Comparison

`reference-code/.cursor/skills/architecture-principles/SKILL.md` uses a generic
architecture playbook:

- SOLID;
- separation of concerns;
- repository/service/factory/strategy patterns;
- dependency injection;
- centralized error handling;
- feature-based vs layer-based structure.

Useful from Cursor:

- the shape of a compact architecture checklist;
- forcing role agents to read architecture principles before major design work;
- anti-pattern language such as god module, circular dependency, premature
  optimization, and misplaced responsibilities.

Not useful as-is:

- generic layered advice is weaker than this repo's FE/BE contracts;
- it does not know tenant isolation, Platform Studio, UI Kit, package boundary,
  auth/session, runtime wiring, or migration rules;
- it should not become another default read file.

## Recommended Practice

Do not duplicate architecture rules in every agent prompt. Instead:

1. Keep prompts compact and make them point to the right active source.
2. Add a small coding-task intake rule for Maestro and Mason:
   - classify lane: frontend, backend, cross-stack, docs/memory, release;
   - read the compact platform contract and relevant lane AGENTS;
   - read exact module pack from `maestro/memory/modules/**`;
   - read exact canonical FE/BE contract for the affected boundary;
   - then inspect implementation files.
3. Use `.codex/standards/**` for reusable engineering principles.
4. Use `platform/*/AGENTS.md` and canonical docs for repo-specific structure.
5. Use `maestro/memory/**` for compact routing and current state.
6. Avoid a new heavy architecture prompt unless repeated mistakes prove it is
   needed.

## Proposed Coding Intake Checklist

Before non-trivial programming, Maestro or Mason should answer internally:

1. Which lane is this?
   - frontend app;
   - frontend shared package;
   - backend runtime;
   - backend module;
   - backend schema/migration;
   - cross-stack contract;
   - docs/memory/runtime.
2. Which boundary owns the change?
   - app vs package;
   - handler vs service vs repository;
   - master DB vs tenant DB;
   - UI Kit vs app composition;
   - Form Builder vs planned Platform Studio tool;
   - admin vs tenant.
3. Which source must be read?
   - `platform/AGENTS.md`;
   - lane AGENTS;
   - relevant module memory pack;
   - exact canonical contract doc;
   - relevant `.codex/standards/**`.
4. What must not be touched?
   - high-risk auth/tenant/migration/release paths without approval;
   - app/package boundaries not in scope;
   - unrelated shared primitives;
   - stale/deleted legacy docs.
5. What evidence proves correctness?
   - targeted tests/build/typecheck;
   - browser/Storybook evidence for visible UI;
   - migration smoke for schema work;
   - review/security evidence for high-risk changes.

## Proposed FE Read Matrix

| Task Type | Minimum Reads |
|---|---|
| Frontend app screen | `platform/AGENTS.md`, `platform/frontend/AGENTS.md`, relevant app/module memory, `app-surfaces.md`, implementation files |
| Shared package change | `platform/frontend/AGENTS.md`, `package-boundaries.md`, relevant package/module memory, `.codex/standards/library/public-api.md` |
| UI Kit/shared primitive | `platform/frontend/AGENTS.md`, `ui-kit.md`, UI Kit memory, Storybook/UI Lab docs if needed |
| Auth/session frontend | `platform/frontend/AGENTS.md`, auth/session memory, `auth-runtime.md`, backend auth contract if cross-stack |
| Visible UI/UX | Above plus Browser Use for structured route/state evidence; Computer Use + external Chrome for final desktop visual/UX acceptance when Codex width could bias judgment; Build Web Apps considered when available |

## Proposed BE Read Matrix

| Task Type | Minimum Reads |
|---|---|
| Backend endpoint/handler | `platform/AGENTS.md`, `platform/backend/AGENTS.md`, relevant backend module memory, runtime/module docs, implementation files |
| Backend service/repository | `platform/backend/AGENTS.md`, relevant module memory, `.codex/standards/backend/go.md`, exact module contract |
| Runtime wiring | `platform/backend/AGENTS.md`, `runtime-wiring.md`, `modules/runtime.md`, target `cmd/<app>/internal/server` files |
| Schema/migration | `platform/backend/AGENTS.md`, schema/tenancy memory, `schema-tenancy.md`, `migrations.md`, migration files |
| Auth/tenant/security | `platform/backend/AGENTS.md`, auth/session or schema/tenancy memory, relevant contracts, `.codex/standards/shared/security.md` |

## Where This Should Live

Similar guidance already exists. It is distributed across platform memory,
lane-specific AGENTS files, `.codex/standards`, and canonical FE/BE contracts.
Do not create a new file by default unless repeated work shows that agents miss
the right source.

Use this placement rule:

- `maestro/memory/**`: routing, compact current state, module ownership,
  durable decisions, and "which docs to read".
- `.codex/standards/**`: normative engineering rules that agents should follow
  while coding/reviewing regardless of current memory state.
- `platform/*/AGENTS.md`: lane-specific operating rules and active product
  invariants.
- `platform/*/docs/contracts/**`: canonical FE/BE product/runtime contracts.

Why `.codex/standards/engineering/project-architecture.md` was suggested:

- It would be a coding standard, not product memory.
- It would tell Maestro/Mason how to approach programming tasks before editing.
- It would point to existing memory and canonical docs instead of duplicating
  them.

Why memory alone is not ideal for this:

- `maestro/memory/` is retrieval and durable state, not the primary place for
  stable coding rules.
- Memory can route agents to the right docs, but code-quality expectations and
  implementation discipline belong in `.codex/standards` or lane AGENTS.

Why a new standard may still be unnecessary:

- `platform/AGENTS.md`, `platform/frontend/AGENTS.md`, and
  `platform/backend/AGENTS.md` already contain most architecture intake rules.
- `maestro/memory/durable/platform-contract.md` already compresses platform
  shape and FE/BE contracts.
- Canonical FE/BE contracts already own the detailed boundaries.

## Revised Recommendation

Do not create `.codex/standards/engineering/project-architecture.md` immediately.
First, harden Maestro/Mason prompts to read existing active sources:

- `platform/AGENTS.md`;
- relevant lane AGENTS;
- relevant memory module pack;
- exact FE/BE canonical contract;
- relevant `.codex/standards/**`.

Create a new `.codex/standards/engineering/project-architecture.md` only if
future work shows repeated missed boundaries or source-selection friction.

If that happens, the file should stay compact:

- one-page coding architecture intake;
- lane classification;
- FE/BE read matrix;
- ownership/boundary checklist;
- evidence expectations;
- pointers to existing canonical docs instead of copying them.

Then update:

- Mason prompt: "For non-trivial programming, read project architecture standard
  and relevant lane docs before editing."
- Maestro prompt: "Classify lane and enforce architecture intake before
  programming or assigning Mason."

Do not create a new orchestration layer. This is a compact engineering standard
and read matrix, not a workflow engine.

## Slice 4 Implementation Note

Slice 4 implemented this recommendation by adding compact coding-intake language
to Maestro and Mason prompts/configs. No new project-architecture standard was
created. Create one later only if repeated programming work shows that agents
still miss lane ownership, source selection, or FE/BE boundary reads.
