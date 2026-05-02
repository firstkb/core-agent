# Agent Runtime Workflow Decisions

Status: durable decision topic
Last compacted: 2026-05-01
Index: `maestro/memory/durable/decisions-log.md`

## Purpose

Codex/Maestro runtime, agent/team behavior, evidence budget, engineering standards, and owner/Maestro responsibility split.

## Rules

- Decision IDs are stable and must not be renumbered.
- Preserve deleted-path sources as provenance when they explain history.
- Prefer current canonical docs or compact memory routes for active reads.
- Add new decisions through `maestro/memory/durable/decisions-log.md` first, then place details in the relevant topic file.

## Decisions

### DEC-019 Codex-Native Runtime Is Current Repo Runtime

- Date: 2026-04-24
- Status: active
- State: landed
- Decision: Root `AGENTS.md`, `.codex/`, the active nine-role `.agents/skills/**` team, `maestro/docs/**`, `maestro/contracts/**`, and `maestro/templates/**` define current repo runtime. `maestro/memory/` is the compact retrieval and durable-memory layer, not a replacement runtime source.
- Sources:
  - `AGENTS.md`
  - `.agents/skills/maestro/SKILL.md`
  - `.agents/skills/charlie/SKILL.md`
  - `.agents/skills/grant/SKILL.md`
  - `.agents/skills/mason/SKILL.md`
  - `.agents/skills/scout/SKILL.md`
  - `.agents/skills/lens/SKILL.md`
  - `.agents/skills/release/SKILL.md`
  - `.agents/skills/scribe/SKILL.md`
  - `.agents/skills/archivist/SKILL.md`
  - `maestro/docs/runtime-contract.md`
  - `.codex/standards/runtime/repository.md`

### DEC-071 Archivist Owns Semantic Docs Memory Audits

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: `Archivist` is the local semantic docs and `maestro/memory` audit skill. It is invoked as `$archivist` for periodic source-of-truth drift review after large docs/memory, AGENTS, runtime, or reference-code changes. Archivist complements mechanical checks and CI; it is not an implementation agent and should patch only when explicitly assigned. `Scribe` is a separate closeout/evidence summary role.
- Sources:
  - `.agents/skills/archivist/SKILL.md`
  - `.agents/skills/archivist/agents/openai.yaml`
  - `.agents/skills/scribe/SKILL.md`
  - `AGENTS.md`
  - `maestro/docs/agent-roles.md`

### DEC-073 Memory Maintenance Matrix Is Mandatory

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Agents must use `maestro/memory/agent-workflow.md` as the memory maintenance matrix for new durable decisions, new modules/apps/packages/runtimes, doc status changes, reference-code changes, and retired runtime/Archivist workflow changes. If no memory update is needed, the closeout should say so explicitly.
- Sources:
  - `maestro/memory/agent-workflow.md`
  - `platform/AGENTS.md`

### DEC-075 Memory Hygiene First-Read And Env Policy

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Agent product work should use `maestro/memory/START_HERE.md` as the first compact memory read after repo/platform instructions. Deleted migration and score snapshots must not own current readiness. `AGENTS_NAME.md` is non-authoritative. Local backend env files must remain untracked; only `*.env.example` files may be tracked under `platform/backend/env/`.
- Sources:
  - `maestro/memory/START_HERE.md`
  - `maestro/memory/agent-workflow.md`
  - `.gitignore`
  - `scripts/checks/check_env_policy.py`
  - `scripts/checks/docs_memory_check.py`

### DEC-076 Lightweight Local Preflight Is Manual

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: `scripts/preflight.sh` is the local/manual preflight for non-trivial implementation work. Default mode runs docs/memory and env checks. Use `scripts/preflight.sh --full` only when a broader backend/frontend sweep is needed. It does not install dependencies and is not wired as a required GitHub Actions gate.
- Sources:
  - `scripts/preflight.sh`
  - `AGENTS.md`
  - `platform/AGENTS.md`
  - `maestro/memory/START_HERE.md`

### DEC-077 Agent Evidence Template Stays Lightweight

- Date: 2026-04-26
- Status: active
- State: landed
- Decision: `maestro/templates/evidence.md.tmpl` is the compact evidence shape for non-trivial Maestro closeout or PR body text. Use it as a concise response/PR shape when useful; do not turn it into a mandatory standalone artifact for tiny tasks.
- Sources:
  - `maestro/templates/evidence.md.tmpl`
  - `AGENTS.md`
  - `.agents/skills/maestro/SKILL.md`
  - `maestro/docs/runtime-contract.md`

### DEC-080 Frontend Files Stay Agent-Maintainable

- Date: 2026-04-26
- Status: active
- State: landed
- Decision: Frontend agents should treat file size as a maintainability guardrail, not a hard CI limit. Prefer UI components, panels, dialogs, and focused helpers under roughly 300 lines. Keep route/page files orchestration-focused; if they exceed roughly 500-700 lines, propose presentational component or controller/helper extraction before adding non-trivial UI. State/runtime files may be larger only when cohesive and covered by tests; if they exceed roughly 1000-1200 lines, propose reducer/selectors/actions/test-fixture split. Agents must not keep growing large monoliths for new UI work.
- Sources:
  - `platform/frontend/AGENTS.md`
  - `maestro/memory/modules/frontend/platform-studio-ui/README.md`
  - git history for the former Form Builder workspace-decomposition run

### DEC-081 Backend Files Stay Responsibility-Focused

- Date: 2026-04-26
- Status: active
- State: landed
- Decision: Backend agents should treat file size as a maintainability signal, not a mechanical split trigger. Split by responsibility before adding non-trivial logic to large files: transport handlers/controllers, validation, authorization/tenant checks, services/use cases, repositories/queries, mappers/DTOs, and tests/fixtures should stay distinct. Prefer handlers around 300-500 lines, services around 400-700 lines, repositories/query modules around 400-800 lines, and split mixed-concern files above roughly 700-1000 lines. Declarative DTO/schema files and cohesive tests may be larger, but tests above roughly 800-1200 lines should usually be split by behavior. Do not split backend code in ways that obscure transaction boundaries, auth/tenant checks, schema ownership, or error mapping.
- Sources:
  - `platform/backend/AGENTS.md`
  - `maestro/memory/modules/backend/runtime/README.md`

### DEC-082 Minimal Product CI Gates

- Date: 2026-04-27
- Status: active
- State: landed
- Decision: Product CI starts with two focused GitHub Actions gates, not a broad CI suite. `backend-ci.yml` runs Go formatting, tests, and command builds for backend changes. `frontend-ci.yml` runs pnpm frozen install, workspace typecheck, and build for frontend changes. Frontend lint/test, security expansion, and UI visual snapshots remain deferred until their baselines are stable enough to avoid noisy mandatory gates.
- Sources:
  - `.github/workflows/backend-ci.yml`
  - `.github/workflows/frontend-ci.yml`
  - `scripts/preflight.sh`

### DEC-083 Active Agent Read Order Starts With START_HERE

- Date: 2026-04-27
- Status: active
- State: landed
- Decision: Active agent instructions, retired runtime prompts, and chat-start templates use the same default read order: `AGENTS.md`, `platform/AGENTS.md`, `maestro/memory/START_HERE.md`, `maestro/memory/index/read-routes.yaml`, relevant `maestro/memory/modules/**` pack, then relevant canonical FE/BE docs and exact code/docs. `maestro/memory/index/memory-index.yaml` is broader routing only and must not appear before `START_HERE` in active read-order surfaces. `scripts/checks/docs_memory_check.py --check` enforces this deterministic read-order policy.
- Sources:
  - `platform/AGENTS.md`
  - `platform/frontend/AGENTS.md`
  - `platform/backend/AGENTS.md`
  - `.agents/skills/retired-runtime/SKILL.md`
  - `.agents/skills/archivist/SKILL.md`
  - `maestro/memory/retired-runtime/prompts/*.md`
  - `maestro/memory/retired-runtime/templates/chat-start.md`
  - `scripts/checks/docs_memory_check.py`

### DEC-084 Root Docs Describe Product Workspace

- Date: 2026-04-27
- Status: active
- State: landed
- Decision: Root orientation docs describe this repository as the VSM (Virtual Safety Manager) v1.0.0 product workspace plus Codex-native agent runtime, not only as an agent orchestration reference scaffold. `README.md` points agents to `AGENTS.md`, `platform/AGENTS.md`, `maestro/memory/START_HERE.md`, and product roots. `AGENTS.md` remains the canonical repo runtime layout and source-of-truth boundary, including `maestro/memory/`, `platform/`, `.agents/skills/`, `.codex/`, and Maestro contracts.
- Sources:
  - `README.md`
  - `AGENTS.md`

### DEC-089 Human-Agent Symbiosis Defines Owner And Maestro Responsibilities

- Date: 2026-05-01
- Status: active
- State: owner-confirmed
- Decision: The owner owns product strategy, business/domain direction, product taste, priorities, and final product decisions. Maestro owns the engineering path, code quality, UI/UX analysis and evidence, agents/tools, checks, and safe execution. Maestro returns to the owner for material UX/product decisions, disputed taste, scope changes, strategic tradeoffs, approval gates, unclear acceptance, or choices that change business/domain behavior.
- Rationale: Future agents need this split to keep the owner focused on product direction while Maestro handles execution quality and team/tool coordination.
- Sources:
  - `maestro/docs/runtime-contract.md`
  - `.agents/skills/maestro/SKILL.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/work.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/ux-product-decision-protocol.md`

### DEC-090 Visible UI Work Uses Maestro-Owned UX Judgment And Browser Evidence

- Date: 2026-05-01
- Status: active
- State: owner-confirmed
- Decision: For visible frontend work, Maestro owns final UI/UX judgment and should use evidence rather than code inspection alone. Browser Use is the default structured in-Codex browser evidence surface for route/state/DOM/screenshot smoke. Computer Use with external Chrome is used when final desktop visual judgment must be independent of Codex width or real desktop/browser/app behavior matters. Build Web Apps must be considered for visible frontend work and used selectively when frontend-heavy expertise improves the result. Scout may supplement evidence but does not own product feel.
- Rationale: UI/UX quality is a product-quality responsibility, while browser and desktop tools provide evidence for that judgment.
- Sources:
  - `maestro/docs/runtime-contract.md`
  - `maestro/docs/agent-selection-thresholds.md`
  - `.agents/skills/maestro/SKILL.md`
  - `.agents/skills/scout/SKILL.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/outsourced-capability-policy.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/quality-evidence-model.md`

### DEC-091 Adaptive Agent Selection Replaces Fixed Chains

- Date: 2026-05-01
- Status: active
- State: landed
- Decision: Maestro uses specialists and outsourced capabilities adaptively, not through fixed chains. Delegate only when it improves correctness, speed, context isolation, implementation focus, verification, review, or evidence. Existing roles should be strengthened before hiring a new role; a new specialist is considered only after repeated failures or a durable missing professional standard.
- Rationale: This preserves the human-agent symbiosis model without turning Maestro into classical orchestration bureaucracy.
- Sources:
  - `maestro/docs/agent-selection-thresholds.md`
  - `maestro/docs/runtime-contract.md`
  - `.agents/skills/maestro/SKILL.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/quality-evidence-model.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/prompt-hardening.md`

### DEC-092 Definition Of Done And Evidence Budget Are Risk-Based

- Date: 2026-05-01
- Status: active
- State: owner-confirmed
- Decision: "Done" means the work meets the quality bar for its task type and risk level, with evidence sufficient to trust the result. Tiny work needs focused inspection or a targeted check; UI-visible work needs browser/desktop evidence for relevant routes/states/viewports; backend work needs targeted tests/builds appropriate to touched behavior; high-risk auth/tenant/security/migration/release work needs approval and stronger verification/review evidence. Avoid broad checks or subagents when focused evidence is enough.
- Rationale: Future work should be checked enough to be trusted without becoming a ceremony-heavy process.
- Sources:
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/quality-evidence-model.md`
  - `maestro/docs/runtime-contract.md`
  - `maestro/templates/evidence.md.tmpl`

### DEC-093 Durable Memory Promotes Accepted Standards, Not Working Notes

- Date: 2026-05-01
- Status: active
- State: owner-confirmed
- Decision: Durable memory records accepted decisions that affect future strategy, standards, architecture, ownership, risk, or workflow. Brainstorming, rejected options, temporary plans, one-off implementation notes, and raw evidence stay in active artifacts or chat. Non-trivial closeout should explicitly say whether memory update is not needed, proposed, or completed.
- Rationale: Memory should improve future agent decisions without becoming a task journal or copying planning artifacts wholesale.
- Sources:
  - `maestro/memory/agent-workflow.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/memory-update-policy.md`
  - `maestro/memory/START_HERE.md`

### DEC-094 Maestro And Mason Use Existing Architecture Sources Before Coding

- Date: 2026-05-01
- Status: active
- State: landed
- Decision: Before non-trivial programming, Maestro or Mason classifies the lane and reads only the relevant existing sources: `platform/AGENTS.md`, the lane `AGENTS.md`, relevant memory module pack, exact canonical FE/BE contract, relevant `.codex/standards/**`, and target implementation files. Do not create a new project-architecture standard unless repeated work shows agents still miss ownership, source selection, or FE/BE boundary reads.
- Rationale: Existing repo guidance already covers most architecture intake; prompt-level routing is enough unless repeated failures prove a new standard is needed.
- Sources:
  - `.agents/skills/maestro/SKILL.md`
  - `.agents/skills/mason/SKILL.md`
  - `.codex/standards/README.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/project-architecture-intake.md`

### DEC-095 AGENTS Files Have Narrow Ownership Boundaries

- Date: 2026-05-01
- Status: active
- State: owner-confirmed
- Decision: `AGENTS.md` files must avoid duplicated Maestro policy. Root `AGENTS.md` owns repository-wide runtime boundaries, role map, artifact model, read policy, and completion checks. `platform/AGENTS.md` owns shared platform product-development invariants, cross-stack gates, memory update rules, and workflow. Lane files such as `platform/frontend/AGENTS.md` and `platform/backend/AGENTS.md` own local implementation rules, commands, tests, and docs update expectations. Maestro runtime and memory own owner-facing workflow, UI/UX judgment, browser/desktop evidence policy, agent/tool selection, delegation, artifacts, gates, and closeout behavior.
- Rationale: Keeping AGENTS files narrow prevents multiple places from defining UI/UX acceptance, browser/tool policy, or agent-routing behavior with slightly different wording.
- Sources:
  - `AGENTS.md`
  - `platform/AGENTS.md`
  - `platform/frontend/AGENTS.md`
  - `platform/backend/AGENTS.md`
  - `.codex/standards/runtime/repository.md`
  - `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/work.md`

### DEC-096 Repo Checks Use Preflight And Checks Layout

- Date: 2026-05-02
- Status: active
- State: owner-confirmed
- Decision: Repository checks use `scripts/preflight.sh` as the stable entrypoint and `scripts/checks/**` for check implementations. The old `scripts/ai/**` folder is retired and must not be recreated for active checks.
- Rationale: `scripts/ai` was an unclear historical name. The new layout keeps the repo-level preflight visible while grouping check implementations under an explicit checks folder.
- Sources:
  - `scripts/preflight.sh`
  - `scripts/checks/docs_memory_check.py`
  - `scripts/checks/check_env_policy.py`
  - `scripts/checks/runtime_drift_check.py`
  - `AGENTS.md`
  - `maestro/artifact/archive/2026-05-02-scripts-checks-and-artifact-promotion/work.md`

### DEC-097 Maestro Artifacts Promote On Continuity Or Accountability

- Date: 2026-05-02
- Status: active
- State: owner-confirmed
- Decision: Maestro does not create artifacts for every chat turn. Maestro creates or promotes to a work artifact as soon as continuity, evidence, future resume, multi-step execution, owner decision, or file-change accountability matters.
- Rationale: This protects context compaction and future resume without turning every small exchange into a run or management artifact.
- Sources:
  - `.agents/skills/maestro/SKILL.md`
  - `maestro/docs/runtime-contract.md`
  - `maestro/memory/START_HERE.md`
  - `maestro/artifact/archive/2026-05-02-scripts-checks-and-artifact-promotion/work.md`
