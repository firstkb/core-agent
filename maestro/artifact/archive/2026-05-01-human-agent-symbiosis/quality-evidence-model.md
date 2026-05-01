# Quality And Evidence Model

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `draft`
- Purpose: Define lightweight Definition of Done, evidence budgets, owner acceptance, and agent hiring/firing criteria for Maestro-led work.

## Core Principle

The goal is a fast, high-quality human-agent jet, not bureaucracy.

"Done" means the work is implemented or answered to the right standard for its
risk level, has enough evidence to trust, and has been returned to the owner
when human product judgment is required.

## Human Acceptance Role

The owner is the final judge of product strategy, taste, and material UX/product
decisions.

Maestro can and should:

- inspect the result;
- verify functionality;
- judge usability and visual coherence;
- compare desktop/mobile behavior;
- report evidence and residual risks;
- recommend accept, revise, or split follow-up.

The owner should review and accept when:

- UX/product taste is material;
- there are multiple valid product directions;
- the result affects key user workflow;
- a tradeoff changes user experience, business logic, or product strategy;
- Maestro explicitly reports uncertainty or residual product risk.

For routine low-risk engineering tasks, owner review is optional. Maestro can
close with evidence and residual risk.

## Definition Of Done By Task Type

| Task Type | Done Means | Human Acceptance Needed |
|---|---|---|
| Tiny T0 edit | Change is applied or answer is given; obvious focused check or inspection is done | Usually no |
| Small T1 implementation | Scope completed, local pattern followed, targeted check run or skipped with reason | Usually no |
| UI-visible work | Functional, usable, visually coherent, key states checked, desktop/mobile evidence captured when claimed, no obvious layout/accessibility regressions | Yes when product taste, workflow, or key screen quality matters |
| Frontend package/shared UI | Package boundary respected, public entrypoint stable, states covered, type/build/test evidence as appropriate | Yes if new shared contract or product design direction changes |
| Backend endpoint/module | Handler/service/repository boundaries respected, auth/tenant implications checked, targeted tests or build run, docs updated if contract changed | Yes if behavior/product rules are ambiguous |
| Schema/migration/tenant work | Approval present if required, migration ownership respected, tenant isolation considered, dry run/smoke evidence recorded | Yes |
| Docs/memory/runtime docs | Source-of-truth classification correct, links/routes updated, docs/memory checks run for non-trivial changes | Usually no, unless changing operating philosophy or source-of-truth |
| High-risk auth/tenant/security | Approval or explicit gate satisfied, focused implementation, targeted tests, review/security evidence, residual risk stated | Yes |
| Release/deploy | Release approval, preconditions, command/workflow evidence, result, rollback/recovery notes | Yes |

## Evidence Budget

Evidence should match risk. Do not run broad checks when a focused check proves
the change. Do not under-check high-risk work.

| Route / Risk | Minimum Evidence | Optional When Useful | Avoid |
|---|---|---|---|
| T0 tiny | Manual inspection, exact command output, or focused file check | None | Artifacts, subagents, broad test suite |
| T1 small | Targeted command/test/typecheck or clear reason not run | Compact `work.md` note if persisted | Full preflight unless risk justifies it |
| T2 staged | Targeted tests/build/browser evidence tied to acceptance | Scout or Lens when independent evidence reduces risk | Fixed agent chain by default |
| UI-visible | Browser Use structured evidence for route/state/DOM/smoke; external Chrome via Computer Use for final desktop visual/UX acceptance when Codex width could bias judgment; route/state/viewport named; desktop/mobile when responsive claim is made | Build Web Apps for frontend-heavy design/React quality; Storybook for package states | Claiming UX quality from code inspection only |
| Backend | Targeted `go test` / build for touched package or runtime; auth/tenant notes | Broader `go test ./...` when shared behavior changed | Running unrelated expensive checks by default |
| Docs/memory | `docs_memory_check.py --check` and env policy check for non-trivial docs/memory changes | Archivist after large semantic changes | Treating every wording tweak as semantic audit |
| High-risk | Approval, targeted tests, security/auth/tenant review evidence, skipped checks explained | Grant/Lens/Scout as needed | Closing without approval/evidence |
| Release | Release approval, command/workflow result, rollback/recovery path | Release specialist | Any production action without gate |

## UI Evidence Standard

For visible UI work, Maestro owns final UI/UX judgment.

Minimum evidence should name:

- route or Storybook story;
- viewport or state checked;
- auth context if relevant;
- states checked: loading, empty, error, ready, disabled/pending when applicable;
- visual/usability issues found and fixed, or residual risks.

Responsive claims require fixed viewport evidence:

- desktop: `1440x900`;
- mobile portrait: `390x844`;
- add `768x1024` when shell/sidebar/grid breakpoints matter.

Current browser panel screenshots are only current-viewport smoke. For final
desktop product judgment when Codex width can affect the result, use external
Google Chrome through Computer Use or record why it was unnecessary/unavailable.

## When To Stop And Return To Owner

Maestro should stop and return to the owner when:

- product behavior is ambiguous;
- UX/product taste is disputed or material;
- implementation uncovers a scope expansion;
- high-risk approval is missing;
- repeated repair attempts do not converge;
- evidence is incomplete and the remaining check is material;
- a new agent role may be needed.

## Agent Hiring / Firing Criteria

Default posture: strengthen existing agents before creating a new role.

Maestro should tell the owner when the current team is regularly not enough.
Then Maestro and owner decide together whether to hire a new specialist, change
prompts, or retire a role.

### Hire A New Role When

- the same class of failures repeats across multiple tasks;
- an existing role's scope becomes too broad or conflicted;
- the work requires a specialized professional standard not covered by current
  roles;
- using outsourced capabilities repeatedly reveals a durable missing internal
  responsibility;
- the new role would reduce risk or increase speed without adding bureaucracy.

Examples:

- Dedicated Security Auditor only if Grant/Lens/Scout repeatedly miss security,
  auth, tenant, API, file upload, secrets, or PII risks.
- Dedicated Test Author only if Mason/Scout repeatedly under-cover tests or test
  design becomes a bottleneck.
- Dedicated UX Reviewer only if Maestro needs a separate independent UI review
  role later; current direction is that Maestro owns UI/UX judgment.

### Do Not Hire When

- the need is one-off;
- an existing role can be strengthened with a compact prompt update;
- the role would duplicate Mason, Scout, Lens, or Grant;
- the role would push the system toward classical orchestration;
- the role adds ceremony without improving quality, speed, or evidence.

### Fire Or Retire A Role When

- it is only legacy compatibility;
- it duplicates another role;
- it is not used in real work;
- it creates confusion in routing;
- outsourced capability covers it better and more cheaply.

Legacy agents remain available only for old artifact continuation unless the
owner explicitly says otherwise.

## Practical Closeout Shape

For non-trivial work, Maestro final response should answer:

- what changed or was decided;
- evidence collected;
- checks skipped and why;
- UX/product acceptance needed or not;
- residual risks;
- next action.

Keep this compact. The goal is clarity and trust, not paperwork.
