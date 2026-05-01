# Work

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `completed`
- Owner goal: Define the operating philosophy for human-agent symbiosis in this repository and refine Maestro's team, tool, UI/UX, and responsibility boundaries.

## Understanding

The owner wants Maestro to become a practical engineering partner for building an ambitious application, not a generic workflow manager.

The intended split is:

- Owner: product strategy, business/domain direction, taste, priorities, and final product decisions.
- Maestro: high-quality code, user-friendly interface, fast development help, team coordination, evidence, and safe execution.

The owner also wants clearer responsibility boundaries between internal agents and outsourced tools/plugins. In particular, UI/UX quality should be owned by Maestro personally because usability, desktop/mobile behavior, and product feel are strategic product concerns, not only verification mechanics.

Clarification: Maestro should return to the owner for disputed or material
UX/product decisions. Maestro owns UI/UX analysis, evidence, and recommendations,
but the owner owns strategic product taste and final product direction.

## Agreed Scope

- In: Analyze and refine the Maestro operating model, role boundaries, outsourced tool/plugin usage, UI/UX ownership, and current problem areas.
- In: Keep a planning artifact that can drive and record approved updates to `.agents/skills/**`, `.codex/agents/**`, `maestro/docs/**`, `maestro/contracts/**`, and `maestro/memory/**`.
- In: After owner approval, implement the accepted runtime/docs/memory/skill cleanup in slices with evidence.
- Out: Product code, commits, PR publishing, release/deploy work, and broad historical rewrites.

## Current Phase

The approved six-slice implementation is complete. Runtime docs, memory docs,
active skill prompts, and active agent configs were updated inside the accepted
scope. Product code, commits, PR publishing, release/deploy work, and broad
historical rewrites remained out of scope.

## Current Problem Areas

- UI/UX ownership is not sharp enough. Current contracts allow Scout to use Browser Use for UI verification, but the owner wants Maestro to personally own UI/UX analysis because usability and product feel require product judgment, not only test evidence.
- Browser Use, Computer Use, and Build Web Apps are not described as outsourced specialist capabilities in the Maestro team model. They are mentioned as tools/plugins, but their relationship to the core team should be clearer.
- Scout's role may be too broad if it includes browser/visual checks by default. It should probably focus on command/test/build/CI/security evidence unless Maestro explicitly assigns a narrow technical visual smoke.
- Build Web Apps capabilities should be mandatory consideration for frontend work when available, especially for frontend implementation quality, React review, and UI polish. Existing repo contracts and UI Kit still outrank plugin defaults.
- Role boundaries need a durable responsibility matrix so Maestro can route work faster without launching unnecessary agents or asking the owner to manage specialists.
- Legacy and hidden/adjacent agents should not blur the vNext team. The active team should stay explicit, while legacy agents remain only for old artifacts.

## Initial Runtime Issues Found

These issues were found during the initial read-only analysis of Maestro's skill,
runtime contracts, agent configuration, and memory routing files. They are not
yet accepted changes; they are candidate improvements for the next planning
step.

1. Compress Maestro's hot path.
   Current `maestro` intake asks Maestro to read all `maestro/contracts/*.json`
   and `maestro/templates/*.tmpl` from `.agents/skills/maestro/SKILL.md`. This
   is heavy for every entrypoint. Proposed direction: define a smaller mandatory
   read set, then lazy-read the specific schema or template required by the
   current mode, route, or artifact shape. Expected benefit: faster intake and
   less context pollution.

2. Split the always-read memory route map.
   The baseline read of `maestro/memory/START_HERE.md` and
   `maestro/memory/index/read-routes.yaml` is correct, but `read-routes.yaml` is
   already large and product-route heavy. For runtime/meta tasks, the full
   product route map is often unnecessary. Proposed direction: add a compact
   `read-routes.hot.yaml` or a runtime-only hot section, then read the full route
   map only for product-domain work.
   Status: defer. The idea is valid, but it creates a new routing artifact and
   should not be the first optimization. Prefer lazy-read for schemas/templates
   and refresh stale `repo-map.md` first. Split the memory route map only if
   repeated work shows real context bloat from the current baseline.

3. Fix legacy naming drift.
   Active repo guidance and `.codex/config.toml` name the legacy audit agent
   `brief_auditor`, but some Maestro docs still refer to `auditor`. This should
   be normalized to `brief_auditor` to avoid wrong routing or unclear legacy
   continuation behavior.

4. Refresh `maestro/memory/durable/repo-map.md`.
   The repo map is stale: it shows only `archivist/` under `.agents/skills/` and
   describes Maestro as an owner-facing module orchestration workflow. The
   active vNext team has nine skills and Maestro is now the native-first
   solution architect, not the legacy module-orchestrator surface. This matters
   because the repo map is a retrieval shortcut.

5. Relax reassignment rules before durable assignment exists.
   Current Maestro rules say that if work is assigned to a role, Maestro must
   ask the owner before substituting itself or another role. This is safe after a
   durable packet, approval, or explicit owner-assigned executor exists, but it
   can slow down early planning or tiny execution. Proposed direction: allow
   Maestro to execute inline and record the actual executor when no durable
   packet exists and the owner did not explicitly approve a named executor.
   Owner approval remains required after persisted assignment, approval gates,
   or high-risk scope.
   Status: conceptually accepted by owner direction. Maestro may call internal
   specialists or outsourced capabilities when useful for the concrete task, and
   does not need the owner to manually select the executor before a durable
   assignment, approval gate, or explicit owner-named executor exists. Maestro
   remains accountable for the final owner-facing result.

6. Formalize agent selection thresholds.
   The current delegation rules are mostly qualitative. Proposed direction: add
   a short selection matrix, for example Charlie when data flow is unknown or
   many connected files are involved; Grant for auth, tenant, migration, unclear
   acceptance, or high-risk plan review; Scout for command/test/build/CI/security
   evidence; Lens for high-risk diff or incomplete evidence; Scribe only for
   persisted closeout; Archivist only for docs, memory, or source-of-truth drift.

## Proposed Philosophy

Human-agent symbiosis:

- The owner defines the product direction, strategic taste, priorities, and acceptance decisions.
- Maestro translates that intent into the smallest useful engineering path, manages specialists/tools, protects quality gates, and keeps momentum.
- Maestro returns to the owner for disputed UX/product decisions, strategic product tradeoffs, or product taste decisions that materially affect acceptance.
- Specialists exist to increase correctness, context isolation, or evidence, not to create ceremony.
- Outsourced tools/plugins are capabilities that Maestro may hire for a task, but they do not own architecture, product taste, or final acceptance.
- Maestro may call an internal specialist from the team or an outsourced capability/subagent whenever it is useful for the concrete task. The owner should not have to manually request the right agent; Maestro chooses and manages the team.
- Delegation is adaptive, not automatic. Maestro should call specialists when they improve quality, speed, context isolation, implementation, verification, review, or evidence, and should keep work inline when delegation would add delay or ceremony.
- Maestro remains accountable for the final owner-facing result even when work is delegated.
- For visible product work, "done" means functional, usable, visually coherent, responsive across desktop/mobile, and supported by evidence.

## Governing Constraints

These constraints should control all future Maestro/team prompt-hardening work:

- Do not create bureaucracy. Artifacts, roles, and checks exist only when they
  improve speed, quality, evidence, or continuation.
- Do not call subagents by default. Call them only when they are useful for the
  concrete task.
- Do not overload agents with excessive prompt text. Strengthen prompts with
  compact, role-relevant instructions and lazy-read deeper material only when
  needed.
- Do not build classical orchestration. The goal is a convenient, fast,
  high-quality jet: a human-agent symbiosis where Maestro adapts per slice.
- Do not forget outsourced capabilities. Browser Use, Computer Use, Build Web
  Apps, and other available tools can be hired when they improve the outcome,
  while Maestro stays responsible for final owner-facing quality.
- Prefer the smallest useful process that preserves product quality, UX,
  correctness, safety, and evidence.

## Proposed Responsibility Matrix

| Role or Capability | Proposed Responsibility | Should Not Own |
|---|---|---|
| Owner | Product strategy, taste, priorities, business/domain decisions, final acceptance | Agent routing, routine checks, implementation mechanics |
| Maestro | Solution architecture, execution path, code quality ownership, UI/UX judgment, team/tool coordination, evidence reconciliation, final closeout | Broad product decisions without owner input, high-risk action without approval |
| Charlie | Read-only code/docs research, facts, dependencies, risk discovery, change-point mapping | Product decisions, implementation, lifecycle ownership |
| Grant | Independent audit of plan, scope, risk, dependencies, acceptance, and gates | Approval, implementation, routine review ceremony |
| Mason | Scoped implementation inside assigned paths and constraints | Product strategy, scope expansion, release/deploy, unapproved high-risk edits |
| Scout | Tests, builds, CI, security checks, migration dry runs, command evidence | Final UI/UX judgment, product feel, broad fixes |
| Lens | Read-only diff/evidence/security/acceptance review | Implementation, approval, product ownership |
| Release | Release packaging/deploy/promotion only after explicit approval | Any production-impacting action without approval |
| Scribe | Durable closeout/evidence summary when persisted records are useful | Product implementation, memory audit |
| Archivist | Docs/memory/source-of-truth drift audit | Product implementation, ordinary closeout |
| Browser Use | Outsourced structured in-Codex browser automation for FE smoke, route interaction, screenshots, DOM, and developer evidence, directed by Maestro | Product taste, final desktop visual acceptance when Codex width may bias judgment |
| Computer Use | Outsourced external Chrome/desktop capability for final desktop visual/UX acceptance independent of Codex width, wide viewport review, OS/app interaction, or cases Browser Use cannot cover | Product taste, routine structured FE checks when Browser Use is enough |
| Build Web Apps | Outsourced frontend expertise for design quality, React/frontend best practices, browser-oriented frontend review, and specialized guidance | Repo source of truth, UI Kit replacement, product acceptance |

## Draft Agent Selection Thresholds

These thresholds should help Maestro decide faster without making the owner
manage agent routing. They are intended as defaults, not rigid rules.

| Situation | Default Move | Escalate / Delegate When | Keep Inline When |
|---|---|---|---|
| Tiny obvious task | Maestro inline | It touches auth, tenant isolation, migrations, release, or production config | One low-risk file or answer; checks are trivial |
| Unknown code path or data flow | Charlie | Ownership, dependencies, API/data flow, or touched files are unclear; likely more than 3 connected files or more than 1 package/app boundary | The exact file/symbol is already known |
| Product/implementation plan has risk | Grant | Scope may be too broad; acceptance is unclear; auth/tenant/migration/backend writes/package boundaries are involved; owner approval may be needed | Plan is small, reversible, and acceptance is obvious |
| Scoped implementation | Mason | Work is bounded by allowed paths and acceptance checks; separate implementation context improves speed or focus | Tiny direct fix or Maestro must make tightly coupled product judgments while editing |
| Verification evidence | Scout | Tests/build/CI/security/migration dry run evidence is needed; independent verification reduces risk | A single local check is enough and Maestro can run it directly |
| UI/UX and browser-visible quality | Maestro + Browser Use for structured FE smoke; Computer Use + external Chrome for final desktop visual/UX acceptance when Codex width could bias judgment; Build Web Apps when frontend-heavy | Visible product work, responsive desktop/mobile claims, interaction flows, frontend-heavy implementation, React/design quality concerns | Text-only or non-visible change |
| Diff/evidence review | Lens | High-risk diff, security/tenant/auth implications, incomplete evidence, or significant implementation | Low-risk small change with direct evidence |
| Durable closeout | Scribe | Persisted T2+ or T3/T4 work needs a compact closeout/evidence record | Tiny T0/T1 closeout fits in final response or `work.md` |
| Docs/memory/source-of-truth drift | Archivist | Large docs/memory/runtime changes, source-of-truth consistency, AGENTS/Maestro/memory alignment | Ordinary product code change with no durable docs/memory impact |
| Release/deploy | Release | Release packaging, deploy, workflow dispatch, promotion, rollback notes after explicit approval | No release or production-impacting action is requested |
| Real desktop/app automation | Computer Use | Final desktop visual/UX acceptance independent of Codex width is needed, Browser Use cannot cover the target, owner asks for real desktop/profile, wide desktop Chrome is specifically needed, or macOS app interaction is required | Fast structured smoke is enough through Browser Use |

Working rule: delegate when it improves correctness, speed, context isolation,
implementation focus, verification, review, or evidence. Keep work inline when
delegation adds ceremony, hides product judgment, or would slow the next useful
action.

## Cursor Reference Prompt Analysis

Owner asked Maestro to inspect `reference-code/.cursor` from another project as
donor prompt material for strengthening Maestro's team prompts. This folder is
reference code, not source of truth. It should be mined for durable patterns and
then distilled into active Maestro/Codex surfaces; raw Cursor commands should
not become hot retrieval material.

### What The Folder Contains

- Cursor commands: `orchestrate`, `implement`, `review`, `refactor`, `audit`.
- Cursor agents: `planner`, `worker`, `test-writer`, `test-runner`,
  `debugger`, `reviewer`, `senior-reviewer`, `security-auditor`, `refactor`,
  and `documenter`.
- Cursor skills: orchestration, simple workflow, review workflow, audit
  workflow, refactor workflow, task management, code quality, architecture,
  security, docs, git helper.
- Cursor rules: testing, security, documentation, git workflow, commit
  messages.

### Useful Patterns To Reuse

- Role prompts should state professional identity, exact scope, first reads,
  step-by-step process, output format, and "what not to do".
- Every implementation or review role should have a local quality standard
  checklist before acting. Cursor uses `code-quality-standards`,
  `architecture-principles`, and `security-guidelines`; in this repo the active
  equivalents should be `.codex/standards/**`, Maestro contracts, and relevant
  canonical FE/BE docs.
- Output formats are strong. Each agent returns changed files, evidence,
  acceptance status, risks, and next role. This maps well to Maestro handoffs
  and final evidence summaries.
- Severity/action matrices are useful. Critical blocks; high fixes now or
  becomes planned work; medium/low is recorded as follow-up without derailing
  current work.
- Retry limits are useful. Cursor uses max 3 attempts for test/review loops.
  Maestro should adopt bounded retry language for Mason/Scout/Lens loops so
  agents do not churn indefinitely.
- Precondition checks are useful. Refactor requires tests or explicit risk
  acceptance; security-sensitive work requires security guidance; test-writing
  detects stack and project conventions before writing tests.
- Scope sizing is useful. Refactor/audit prompts define when a scope is too
  broad and should be split.
- Separate "diagnose" and "fix" responsibilities are useful. Scout should
  diagnose/verify; Mason should fix; Lens should review; Maestro reconciles.

### Patterns Not To Copy Directly

- Cursor commands forbid the coordinator from doing any work and force every
  step through subagents. This conflicts with Maestro's native-first adaptive
  loop. Maestro must remain able to work inline when that is the smallest useful
  path.
- Cursor workflow always runs fixed chains such as worker -> test-writer ->
  test-runner -> documenter. Maestro should not run fixed chains by default.
  Specialists should be invoked only when they improve quality, speed, context
  isolation, review, or evidence.
- Cursor uses `.cursor/workspace` and configurable `ai_docs/**` paths. This repo
  already has `maestro/artifact/active/**`, `.codex/**`, `.agents/**`, and
  `maestro/memory/**`; do not introduce the Cursor workspace or docs tree.
- Cursor's documenter updates docs after almost every change. This conflicts
  with this repo's selective memory/docs policy. Docs and memory update only
  when durable behavior, contract, source-of-truth, or reusable lesson changes.
- Cursor standards are generic. They must not override this repo's frontend,
  backend, auth, tenancy, UI Kit, or Maestro contracts.

### Mapping Cursor Roles To Maestro Team

| Cursor Role | Maestro Mapping | Recommendation |
|---|---|---|
| `planner` | Maestro | Do not hire separately. Use planning checklist ideas in Maestro intake and `work.md`. |
| `worker` | Mason | Reuse "first read standards", scoped implementation process, changed files, acceptance, and "what not to do" structure. |
| `test-writer` | Mason sub-capability, possible future role | Do not hire yet. Add stronger test authoring expectations to Mason; consider a separate Test Author only if test coverage becomes a bottleneck. |
| `test-runner` | Scout | Strong fit. Reuse diagnostician/verifier boundary: run checks, analyze, report; do not fix broad code. |
| `debugger` | Mason fix mode | Do not hire separately now. Mason can receive Scout/Lens findings and perform minimal root-cause fixes. |
| `reviewer` | Lens | Strong fit. Reuse severity categories, concrete file/line findings, and no-nitpick review posture. |
| `senior-reviewer` | Grant/Lens | Use Grant before high-risk plans; use Lens for architecture-sensitive diff review. No new role yet. |
| `security-auditor` | Grant/Lens/Scout security pass, possible future role | Do not hire immediately. Strengthen Grant/Lens prompts for auth, tenant, permissions, API, secrets, and sensitive data. Consider a dedicated Security Auditor only if security review volume grows. |
| `refactor` | Mason refactor mode, Lens pre-review | Reuse no-behavior-change, tests-first, small-scope rules. |
| `documenter` | Scribe/Archivist | Reuse report structure only. Do not auto-update docs on every change; follow repo memory/docs gates. |

### Prompt Hardening Candidates By Active Agent

- Maestro: add explicit professional standard that Maestro may work inline or
  delegate; owns UI/UX judgment; returns to owner for disputed product/UX
  choices; uses bounded retry and escalation instead of infinite loops.
- Charlie: strengthen with "observed facts vs inference", exact path/symbol
  evidence, read-scope minimization, and output sections for risk/change points.
  This is already mostly present; add sharper output format if needed.
- Grant: add severity/action framing for plan risks and gate readiness:
  continue, revise, block, or owner decision with concrete acceptance gaps.
- Mason: add "first read relevant standards", scoped implementation process,
  self-verification, test expectations, minimal root-cause fix mode, and strict
  "do not expand scope".
- Scout: add diagnostician/verifier language. Scout runs checks, browser only
  when explicitly assigned by Maestro, analyzes results, records skipped checks,
  and does not implement broad fixes.
- Lens: add reviewer severity categories, concrete file/line findings, no
  nitpicks, security/tenant/auth/regression focus, and missing-test evidence.
- Release: can reuse release precondition/report style, but current gated
  release role is already properly narrow.
- Scribe: reuse report structure for completed persisted work, but keep it lean
  and evidence-first.
- Archivist: keep as semantic source-of-truth auditor; can reuse audit report
  severity structure, not Cursor's auto-documenter behavior.

### Initial Recommendation

Use `reference-code/.cursor` as a prompt-pattern donor, not as imported runtime.
The first practical improvement should be a Maestro-team prompt hardening pass:

1. Create or update a compact active standard for role outputs and severity
   language.
2. Strengthen `.agents/skills/*/SKILL.md` and `.codex/agents/*.toml` with the
   relevant role-specific patterns above.
3. Keep delegation adaptive. Do not copy Cursor's fixed all-subagent command
   model.
4. Preserve repo-local source of truth: `.codex/standards/**`,
   `maestro/docs/runtime-contract.md`, `maestro/contracts/**`,
   `maestro/templates/**`, canonical FE/BE docs, and owner direction.

## Accepted Planning Directions

- Accepted direction: Maestro owns UI/UX analysis and final visible-product
  quality judgment.
- Accepted direction: Browser Use is a Maestro-directed structured browser
  evidence capability for UI-visible work, not the final owner of product taste
  or desktop visual acceptance.
- Accepted direction: Scout should not be the default Browser Use owner. Scout
  may collect technical evidence only when Maestro explicitly assigns a narrow
  visual smoke or when independent verification is needed.
- Accepted direction: Build Web Apps capabilities are required consideration for
  frontend work when available, but local repo contracts, UI Kit, owner taste,
  and actual browser evidence win. Actual use should be selective:
  frontend-heavy, new UI, redesign, React/Next performance, shadcn, or repeated
  FE quality issues.
- Accepted direction: FE verification should use two browser surfaces. Browser
  Use is the default structured browser automation surface for local smoke,
  route interaction, screenshots, DOM, logs, and quick state checks. Computer
  Use + external Google Chrome is the preferred final desktop visual/UX
  acceptance surface when judgment must be independent of Codex app width.
  ChatGPT Atlas is not the default FE QA browser; use it only if Atlas-specific
  behavior matters.
- Accepted direction: Do not rush into `read-routes.hot.yaml`. First improve
  lazy-read behavior for schemas/templates and update stale `repo-map.md`; split
  memory routing only if context bloat is observed in practice.
- Accepted direction: Do not adopt Cursor's classical orchestration model.
  Maestro remains the adaptive owner-facing engineering partner. Maestro divides
  larger work into slices, chooses the next useful move, and calls specialists
  only when useful for that slice.
- Accepted direction: Mason remains the implementation engineer. Mason may work
  in minimal root-cause fix mode when receiving concrete diagnostics from
  Scout/Lens/Maestro, but this is part of scoped implementation, not a separate
  Debugger role.
- Accepted direction: Future agent prompt-hardening should use the distilled
  artifact `prompt-hardening.md`; implementation should not reopen
  `reference-code/.cursor` unless a missing detail is explicitly needed.

## Prompt Hardening Artifact

- `prompt-hardening.md`: distilled role-by-role prompt strengthening plan from
  `reference-code/.cursor`, mapped onto Maestro's active team and outsourced
  capabilities.
- `project-architecture-intake.md`: distilled plan for how Maestro and Mason
  should understand project structure, FE/BE lanes, module boundaries, packages,
  services, and evidence without bloating skill prompts.
- `quality-evidence-model.md`: lightweight Definition of Done, evidence budget,
  human acceptance role, and agent hiring/firing criteria.
- `ux-product-decision-protocol.md`: lightweight protocol for when Maestro
  decides local UX/product details inline, recommends a default, or returns to
  the owner for product/taste/workflow decisions.
- `outsourced-capability-policy.md`: lightweight policy for when Maestro should
  consider or use Build Web Apps, Browser Use, Computer Use, GitHub, OpenAI
  docs, and external web/docs search.
- `memory-update-policy.md`: lightweight policy for deciding which accepted
  product/workflow/standard decisions should be promoted from artifacts into
  durable memory and which should remain artifact-only.
- `decisions-log-audit.md`: semantic audit of
  `maestro/memory/durable/decisions-log.md`, including duplicate IDs, stale
  active retired-runtime decisions, stale sources, and compaction candidates.
- `artifact-consistency-audit.md`: consistency audit across the planning
  artifact set, including conflicts found, fixes made, remaining non-blocking
  implementation risks, and source order for runtime promotion.
- `memory-folder-audit.md`: quality audit of `maestro/memory/`, covering
  structure, retrieval usefulness, stale runtime/team wording, route
  duplication, decisions-log debt, and recommended cleanup order.
- `maestro-character-audit.md`: audit of
  `maestro/docs/maestro-character.md`, confirming it is active and useful while
  identifying small alignment changes for FE visual evidence, responsibility
  split, and orchestration-heavy wording.
- `maestro-docs-audit.md`: audit of `maestro/docs/`, classifying which docs to
  keep, update, compress, retire, or move to historical/archive status.
- `implementation-plan.md`: sliced implementation plan with scope, checklists,
  acceptance criteria, checks, and stop conditions for memory cleanup, runtime
  docs, docs simplification, prompt hardening, durable decisions promotion, and
  final consistency review.

## Risks / Gates

- Current contracts explicitly mention Scout using Browser Use for UI-visible work. Updating that boundary will require coordinated docs/skill/contract changes after owner confirmation.
- The outsourced capability policy separates structured browser automation from
  final visual acceptance: Browser Use first for FE smoke/developer evidence,
  and Computer Use + external Chrome when desktop UX judgment must be
  independent of Codex width or a real desktop/app surface is needed.
- Browser Use should be understood as a separate in-Codex browser surface, not
  an external standalone Chrome window. It is strong for structured checks, but
  external Chrome via Computer Use is the clearer surface for final desktop
  product visual review.
- Installed ChatGPT Atlas should be treated as a desktop application. Browser
  Use's internal `setupAtlasRuntime` naming is not the same thing as operating
  the ChatGPT Atlas app; use Computer Use for Atlas-app interaction if needed.
- Changing agent responsibilities affects `.agents/skills/**`, `.codex/agents/**`, `maestro/docs/**`, `maestro/contracts/**`, and `maestro/memory/**`; this should be treated as Maestro runtime work, not a casual wording patch.
- If UI/UX ownership moves fully to Maestro, closeout expectations must stay realistic: Maestro can inspect and judge visible states, but browser tooling still provides evidence.
- No approval gate is required for this planning artifact. Future runtime contract edits should be explicitly approved before implementation.

## Agent / Tool Notes

- No specialists were launched for this artifact.
- This is planning-only. The artifact records owner direction and proposed model changes; it does not update the active runtime contract yet.
- `prompt-hardening.md` was added as a planning artifact so future runtime prompt
  edits can use distilled decisions without reading raw Cursor reference files.
- `project-architecture-intake.md` was added as a planning artifact for
  programming-task architecture reads and future compact standard design.
- `quality-evidence-model.md` was added as a planning artifact for Definition
  of Done, evidence budget, human product acceptance, and team hiring/firing
  criteria.
- `ux-product-decision-protocol.md` was added as a planning artifact for
  product/UX decision ownership, examples, and the "decide inline / recommend
  default / return to owner" protocol.
- `outsourced-capability-policy.md` was added as a planning artifact for
  outsourced capability thresholds, including selective Build Web Apps usage,
  Browser Use for structured FE smoke/developer evidence, and Computer
  Use/external Chrome for final desktop visual acceptance when Codex width could
  bias judgment.
- `memory-update-policy.md` was added as a planning artifact for durable memory
  promotion rules, `decisions-log.md` thresholds, artifact-only boundaries, and
  closeout wording.
- `decisions-log-audit.md` was added as a planning artifact after reviewing the
  current durable decisions log. The file is valuable but needs a focused
  cleanup before new long-term policy decisions are promoted into memory.
- `artifact-consistency-audit.md` was added after checking the planning
  artifact set for conflicting wording. FE verification surface wording and
  accepted/proposed status labels were normalized before runtime implementation.
- `memory-folder-audit.md` was added after reviewing the current
  `maestro/memory/` folder. The memory model is structurally sound, but
  `repo-map.md`, `memory-index.yaml`, FE visual-check wording, duplicate
  reference-code routes, and decisions-log debt need focused cleanup before
  durable promotion.
- `maestro-character-audit.md` was added after checking the active character
  file. The old remembered path `docs/maestro-character.md` does not exist; the
  active runtime file is `maestro/docs/maestro-character.md` and is referenced
  by the Maestro skill/config.
- `maestro-docs-audit.md` was added after reviewing `maestro/docs/`. The folder
  is conceptually strong but needs cleanup: FE visual evidence policy, legacy
  `auditor` naming, pre-persistence reassignment rules, owner/Maestro
  responsibility wording, and overly orchestration-like docs should be aligned.
- `implementation-plan.md` was added after owner accepted slicing the
  implementation into clear checklists and status-tracked work packages.
- Slice 1 (`Memory Retrieval Cleanup`) completed. It updated the compact memory
  repo map, runtime index, reference-code route dedupe, and legacy import
  provenance line without changing runtime docs, prompts, product code, FE
  visual policy, or durable decisions-log semantics.
- Added a Slice 2 requirement to make next-step recommendation explicit:
  after completing a task or slice, Maestro should propose one concrete useful
  next step when it helps momentum, without inventing fake work or dumping a
  menu unless a real owner decision is needed.
- Slice 2 (`Maestro Core Runtime Docs`) completed. It aligned the canonical
  runtime docs on owner/Maestro responsibility split, material UX/product
  return-to-owner points, `brief_auditor` legacy naming, FE visual evidence
  policy, Build Web Apps consideration, Scout UI/UX boundary, reassignment
  rule, next-step closeout behavior, character provenance, and no time-based
  greetings.
- Slice 3 (`Maestro Docs Simplification`) completed. It classified
  `maestro/docs/` into canonical, active supporting, validation, reference,
  historical, and retired pointer docs; added
  `agent-selection-thresholds.md`; retired `orchestration-contract.md` and
  `agent-sequences.md` as compatibility pointers; reclassified
  `native-first-maestro.md` as reference; marked `memory-migration-plan.md` as
  historical hot-path-excluded material; and updated the memory route so
  agent-selection and outsourced capability discussions can find the new
  threshold doc.
- Slice 4 (`Skill / Agent Prompt Hardening`) completed. It compactly hardened
  the nine active skill prompts, matching `openai.yaml` launch prompts, and
  active `.codex/agents/*.toml` role configs. Maestro now lazy-reads
  schemas/templates, owns UI/UX analysis/evidence, returns to the owner for
  material product/UX decisions, and uses coding intake before programming or
  assigning Mason. Mason now owns scoped implementation and minimal root-cause
  fix mode; Scout verifies/diagnoses without owning final UI/UX judgment; Lens,
  Grant, Charlie, Release, Scribe, and Archivist have sharper professional
  boundaries without adding new agents or fixed chains.
- Slice 5 (`Durable Decisions Promotion`) completed. It promoted the accepted
  human-agent symbiosis operating decisions into durable memory as
  `DEC-089` through `DEC-094`, refreshed baseline memory in `START_HERE.md` and
  `current-state.md`, normalized the duplicate `DEC-049` as `DEC-049B`, updated
  current runtime wording for `DEC-019`, `DEC-071`, `DEC-077`, and `DEC-087`,
  and marked stale retired-runtime active decisions `DEC-055`, `DEC-078`, and
  `DEC-086` as superseded.
- Slice 6 (`Final Consistency Review`) completed. It verified source-order and
  lazy-read behavior, fixed-chain language, FE tool policy, owner/Maestro split,
  role boundaries, cancelled time-based greetings, `brief_auditor` naming,
  duplicate decision IDs, and final docs/memory checks. Final evidence and
  closeout were recorded in `evidence.md` and `closeout.md`.
- Slice 7 (`Post-Review FE Policy Alignment`) completed. It synchronized
  `platform/frontend/AGENTS.md` and
  `maestro/memory/modules/frontend/build-web-apps-review.md` with the final
  Maestro FE evidence policy: Maestro owns UI/UX judgment; Browser Use provides
  structured evidence; Computer Use external Chrome is used when final desktop
  UX judgment must be independent of Codex width or real desktop/browser/app
  behavior matters.
- Pre-commit AGENTS responsibility adjustment completed. The FE lane no longer
  owns Maestro UI/UX evaluation or browser/desktop tool policy. Root and
  platform AGENTS now define narrow ownership boundaries for root, platform,
  frontend, backend, and Maestro runtime surfaces.

## Evidence

- Based on owner request in the current thread and prior read-only analysis of Maestro skill/runtime files.
- Relevant current surfaces include `.agents/skills/maestro/SKILL.md`, `maestro/docs/runtime-contract.md`, `.codex/config.toml`, `.codex/agents/*.toml`, `maestro/docs/agent-roles.md`, and `maestro/memory/modules/frontend/build-web-apps-review.md`.
- Memory audit covered `maestro/memory/START_HERE.md`,
  `maestro/memory/index/read-routes.yaml`,
  `maestro/memory/index/memory-index.yaml`,
  `maestro/memory/durable/current-state.md`,
  `maestro/memory/durable/repo-map.md`,
  `maestro/memory/durable/legacy-memory-import.md`, representative
  `maestro/memory/modules/**` packs, and route/drift searches.
- Character audit covered `maestro/docs/maestro-character.md`,
  `maestro/docs/operating-charter.md`, `.agents/skills/maestro/SKILL.md`, and
  `.codex/agents/maestro_vnext.toml`.
- Character provenance was checked against `https://soul.md/` and the referenced
  Richard Weiss gist. The useful idea is a compact continuity record of values,
  boundaries, and collaboration style; Maestro should adapt that into practical
  engineering behavior rather than metaphysical or theatrical identity language.
- Time-of-day greeting was considered and then cancelled by the owner because
  Maestro cannot reliably determine the owner's exact real local time. Do not
  promote task-start time-based greetings into runtime docs or skills.
- Maestro docs audit covered all 17 files under `maestro/docs/`, line counts,
  runtime references, stale-term searches, and representative normative sections
  from runtime, operating, agent, artifact, stage, security, and acceptance docs.

## Future Topics

- Full semantic rewrite of `maestro/memory/durable/decisions-log.md`.
- Lazy-read conversion for all helper agents.
- Semantic audit of `maestro/contracts/**` and `maestro/templates/**`.
- Agent hiring/new-role decision only after repeated evidence that current roles
  are insufficient.
- Context compaction continuity policy: define what Maestro must preserve and
  restore when the system automatically compacts conversation context, including
  latest owner request, active/archived artifact path, scope, gates, changed
  files, evidence/check status, unresolved owner decisions, and next action.

## Next Action

Prepare one commit for owner review.
