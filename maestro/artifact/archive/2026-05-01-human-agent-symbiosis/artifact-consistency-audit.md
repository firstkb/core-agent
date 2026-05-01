# Artifact Consistency Audit

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `draft`
- Scope: planning artifacts under `maestro/artifact/archive/2026-05-01-human-agent-symbiosis/`
- Purpose: Check the current planning artifact set for conflicts, duplicated policy language, and implementation-risk drift before runtime changes.

## Files Checked

- `work.md`
- `prompt-hardening.md`
- `project-architecture-intake.md`
- `quality-evidence-model.md`
- `ux-product-decision-protocol.md`
- `outsourced-capability-policy.md`
- `memory-update-policy.md`
- `decisions-log-audit.md`

## Result

The artifact set is now internally coherent enough to use as an implementation
planning source.

The main conflicts found were wording drift around FE verification surfaces and
decision status. They were corrected in the planning artifacts.

## Conflicts Found And Resolved

| Area | Conflict | Resolution |
|---|---|---|
| FE visual verification | Some artifacts still said only `Browser Use/visual evidence`, while later policy split structured browser checks from final desktop UX acceptance | Updated `quality-evidence-model.md` and `project-architecture-intake.md` to use Browser Use for structured route/state/DOM/smoke evidence and Computer Use + external Chrome for final desktop visual/UX acceptance when Codex width could bias judgment |
| Outsourced capability prompt hardening | `prompt-hardening.md` still said Computer Use was only fallback and not default frontend QA | Updated to say Computer Use is not default structured FE smoke, but is used for external Chrome final desktop visual/UX acceptance when needed |
| Decision status | `work.md` kept accepted owner directions under `Initial Decisions To Confirm` and `Proposed:` labels | Renamed the section to `Accepted Planning Directions` and changed relevant entries to accepted-direction wording |

## Consistency Checks

### UI/UX Ownership

Consistent:

- Maestro owns UI/UX analysis and final visible-product quality judgment.
- Owner owns product strategy, product taste, and material UX/product decisions.
- Scout does not own final UI/UX judgment.
- Browser/desktop tools provide evidence, not product acceptance.

### FE Verification Surfaces

Consistent:

- Browser Use: structured browser automation, route/state checks, DOM,
  screenshot, logs, quick smoke, current/mobile viewport evidence.
- Computer Use + external Google Chrome: final desktop visual/UX acceptance when
  the review must be independent of Codex width or needs real browser/desktop
  behavior.
- ChatGPT Atlas: not default FE QA; use only for Atlas-specific behavior or
  owner request.

### Build Web Apps

Consistent:

- Must consider for visible FE tasks.
- Should use for frontend-heavy, new visual surfaces, redesign/restyle,
  user-friendly tasks, complex UI, React/Next performance, shadcn, or repeated
  FE quality issues.
- Do not invoke the full workflow for tiny UI fixes or non-FE work.
- Does not override repo contracts, UI Kit, owner taste, or evidence.

### Agent Boundaries

Consistent:

- Maestro may work inline or delegate adaptively.
- No fixed subagent chain.
- Mason remains implementation engineer; fix mode is scoped implementation, not
  a separate Debugger role.
- Scout diagnoses/verifies; Scout does not broadly fix or own product feel.
- Lens reviews; Grant audits plans/risk; Scribe closeout; Archivist semantic
  docs/memory audit.
- New roles are hired only after repeated failure patterns or durable scope
  conflict.

### DoD And Evidence Budget

Consistent:

- Evidence scales with risk.
- T0/T1 avoid broad checks.
- UI-visible work needs visual evidence and states.
- Backend work uses targeted tests/builds unless shared behavior requires more.
- High-risk auth/tenant/security/migration/release needs approval and stronger
  evidence.

### UX/Product Decision Protocol

Consistent:

- `Decide inline` for local, reversible, conventional choices.
- `Recommend default` for reversible taste/product choices with a safer option.
- `Return to owner` for workflow, product meaning, permissions, irreversible
  actions, strategic taste, or unclear domain behavior.

### Memory Promotion

Consistent:

- Planning artifacts keep working discussion and drafts.
- `decisions-log.md` should receive accepted durable strategy, standards,
  ownership, risk, and future-development decisions.
- Promotion should happen after owner approval through a compact memory
  promotion list.
- Current `decisions-log.md` needs cleanup before or alongside new durable
  policy entries.

## Remaining Non-Blocking Risks

These are not contradictions inside the planning artifacts, but they matter
before implementation:

- Runtime docs/skills/contracts are not updated yet.
- Existing runtime surfaces may still say Scout can use Browser Use for
  UI-visible work. The implementation pass must align that boundary.
- `decisions-log.md` has duplicate `DEC-049`, stale active retired-runtime
  entries, and old sources. This should be cleaned as a separate memory
  maintenance slice.
- All new policy artifacts remain planning drafts until owner-approved
  promotion into `.agents/**`, `.codex/**`, `maestro/docs/**`,
  `maestro/contracts/**`, and `maestro/memory/**`.

## Implementation Guidance

When moving from artifacts to runtime changes, use the following source order:

1. `work.md` for accepted owner philosophy and responsibility matrix.
2. `quality-evidence-model.md` for DoD, evidence budget, and hiring/firing.
3. `ux-product-decision-protocol.md` for product/UX return points.
4. `outsourced-capability-policy.md` for Build Web Apps, Browser Use, Computer
   Use, GitHub, OpenAI docs, and web search thresholds.
5. `project-architecture-intake.md` for Maestro/Mason coding-task architecture
   read rules.
6. `prompt-hardening.md` for role-by-role prompt updates.
7. `memory-update-policy.md` and `decisions-log-audit.md` before durable memory
   promotion.

Do not copy raw discussion text into runtime docs. Distill compact accepted
rules.
