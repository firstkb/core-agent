# UI Quality Pack

Status: active optional Maestro pack
Scope: visible frontend quality, UI review, state coverage, and targeted fix pass

The UI Quality Pack is a repository-local quality accelerator for visible
frontend work. It distills the useful parts of the local Open Design inspired
prompt pack without making that raw reference folder part of the active runtime.

It is not a Build Web Apps replacement by default. It is the local fallback and
quality checklist Maestro can use when a UI task needs product-grade taste,
state coverage, accessibility, critique, or a targeted polish pass.

## Invocation

Use this pack when the owner says any of:

- `UI Quality Pack`
- `ui-quality`
- `anti-AI-slop`
- `five-axis critique`
- `state coverage`
- `visual review rubric`

Also consider it for non-trivial visible UI work when Build Web Apps is not
needed, unavailable, or would be heavier than the task.

## Priority

Apply this priority order:

1. Owner product decision and accepted product strategy.
2. `AGENTS.md`, Maestro runtime, lane `AGENTS.md`, and approval gates.
3. Existing product code, UI Kit, design tokens, app shell, and canonical FE/BE docs.
4. Relevant module memory and route-specific contracts.
5. This pack.
6. Raw optional reference folders.

If this pack conflicts with repository rules, repository rules win. In
particular, do not introduce visual tokens, component systems, font stacks,
negative letter spacing, gradients, or new dependencies when local frontend
rules or UI Kit contracts say otherwise.

## Lazy Read Map

Read only what the task needs:

- Planning or implementation: `workflow.md`
- Screen type choice: `archetypes.md`
- Final implementation check: `checklists/implementation-checklist.md`
- Generic AI UI prevention: `checklists/anti-ai-slop.md`
- States/accessibility: `checklists/state-accessibility.md`
- UI review: `checklists/visual-review-rubric.md`
- Owner-ready prompts: `templates/*.md`
- Provenance and raw reference status: `sources.md`

Do not read `reference-code/**` unless the owner explicitly asks to inspect the
raw pack or this pack is insufficient for the task.

## Role Usage

- Maestro owns UI/UX judgment, product fit, and decision to use this pack.
- Mason may use the implementation checklist and workflow for assigned UI work.
- Scout may use the state/accessibility checklist as evidence guidance.
- Lens may use the visual review rubric for read-only review.
- Archivist may audit this pack for drift, but should not move raw references
  into hot memory.

## Output Expectations

For meaningful visible UI work, the final answer or evidence should mention:

- which UI Quality Pack files were used;
- state coverage or why a state was not applicable;
- browser/visual evidence when available;
- P0/P1 fixes applied and remaining risk;
- whether Build Web Apps was used, skipped, or replaced by this local pack.
