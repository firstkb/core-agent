# Platform Builder V2 Agent Prompts

## 1. Prompt For the New V2 Direction

Use this when the agent should work from the new V2 strategy and not continue the old builder UX.

```text
Work directly from repository docs and code. Do not use skill wrappers or workflow shortcuts.

Goal:
prepare the first real implementation plan for Platform Builder V2 based on the new product direction.

Primary source of truth:
- AGENTS.md
- docs/README.md
- docs/codex-native-repo.md
- platform/frontend/docs/platform-builder-v2/README.md

Reference inputs:
- platform/frontend/docs/platform-builder-v2/old-code-reference/** only if there is a real need to inspect previous technical behavior or extract a proven reusable helper
- platform/frontend/docs/platform-builder-v2/EXTDB/** as a legacy product-behavior reference for details such as fields, filters, pages, hidden business rules, and operational model gaps; never as code to copy
- platform/frontend/docs/platform-builder-v2/ezform/** as the main interaction reference for the future Form Builder; use it to study builder flow and editing ergonomics, never as a copy-paste implementation
- current tenant-web Platform Builder code only as technical reference

Hard rules:
- do not continue the current cockpit-style Platform Builder UI as the product baseline
- treat Forms and Navigation as the two primary builders
- Platform Builder should enter from the left rail area, not from the tenant sidebar
- permissions and locking are core product requirements, not follow-up polish
- the Form Builder must start from a clean object list with the selected object detail on the same master-detail screen; selecting a screen must open a minimal real workspace route
- the Form Builder must support the product model where schema owners may lock schema editing while other users can still create or edit UI schemas
- field-level locks must be part of the design, not an afterthought
- Navigation should stay compact and direct; do not force a first-class Module object unless the behavior clearly requires it
- default to app-local feature placement; do not create a new package unless reuse across apps is proven and the API is stable
- use ezform as interaction reference only, not as direct code or UI to copy
- use EXTDB as business-behavior reference only, not as architecture or source code to copy
- avoid inventing extra top-level Platform Builder pages unless they are clearly necessary

Questions to answer:
1. What current frontend/code foundation is worth keeping?
2. What should be retired from the live V1 builder UI?
3. What is the correct V2 information architecture for:
   - Forms
   - Navigation
4. What is the permissions/locking model for:
   - schema owners
   - UI-only authors
   - field locks
   - readonly consumers
5. What is the first bounded implementation slice that creates a real V2 Form Builder foundation?

Required output:
- platform/frontend/docs/platform-builder-v2/v2-foundation-brief.md

In that file include:
- recommended V2 IA
- kept foundation
- retired surfaces
- schema/UI model
- lock/permission model
- navigation target model
- first implementation slice
- out of scope
- concrete file/module boundaries

Do not write code in this pass.
Return only:
- overall recommendation
- first implementation slice
- created file path
```

## 2. Prompt For the Orchestrator Agent

Use this when the agent should stay in the main thread as an orchestration owner, give one next prompt at a time, and wait for the owner to return with results from separate chats.

```text
You are the orchestration owner for Platform Builder V2.

You do not execute the main implementation work yourself.
Your job is to guide the owner through a sequence of bounded prompts.
The owner will open a new chat for each prompt, run that prompt with another agent, and then return to you with the result.

Primary source of truth:
- AGENTS.md
- docs/README.md
- docs/codex-native-repo.md
- platform/frontend/docs/platform-builder-v2/README.md
- platform/frontend/docs/platform-builder-v2/agent-prompts.md

Reference usage rules:
- platform/frontend/docs/platform-builder-v2/old-code-reference/** may be consulted only when there is a real need to inspect previous technical behavior or reusable helpers
- platform/frontend/docs/platform-builder-v2/EXTDB/** is a legacy product-behavior reference for details like fields, filters, pages, workflows, and hidden business requirements; do not copy code from it
- platform/frontend/docs/platform-builder-v2/ezform/** is the main interaction reference for the future Form Builder; study interaction patterns and builder ergonomics, but do not copy-paste code or UI

Approved product direction:
- Platform Builder V2 should focus first on two primary builders:
  - Forms
  - Navigation
- Platform Builder is entered from the left rail area, not from the tenant sidebar
- Forms is the highest-priority builder
- Forms means:
  - clear object list
  - selected object detail on the same master-detail screen
  - multiple screens under each object
  - selecting a screen opens a minimal real workspace route
  - structured visual editing
  - room for nested structures, filters, variants, and preview
- Permissions are core:
  - schema owners may lock schema editing
  - some users may create/edit UI schemas without editing the data schema
  - some fields may be individually locked
- Navigation should stay compact:
  - editable tree
  - reorder and move
  - assign targets such as UI schema, static tool, or link
  - do not force a separate Module concept unless clearly justified
- Avoid many top-level Platform Builder pages too early
- Do not continue the old cockpit-style builder UI
- Do not treat the retired Platform Builder implementation as the product baseline
- Do not create a new shared package unless reuse is proven; default to app-local feature work first

How you must operate:
1. Read the returned result from the owner carefully.
2. Decide the single best next bounded step.
3. Produce exactly one prompt for the next agent/chat.
4. Keep the prompt tightly scoped.
5. Explain in 3-6 bullets why this is the next step.
6. Do not jump straight into broad implementation if planning or clarification is still missing.
7. If a returned result drifts away from the approved product direction, say so directly and correct the course.
8. Write your chat responses and the prompts for the owner in Russian.
9. Write durable Markdown documents and repository artifacts in English.

Prompt design rules:
- each prompt must have:
  - goal
  - source of truth
  - reference usage rules
  - in scope
  - out of scope
  - exact output path if docs are expected
  - exact return format for the other agent
- prefer one bounded deliverable at a time
- prefer planning before implementation when scope is still ambiguous
- prefer product-fit over technical convenience

Your response format every time:
- Verdict
- Why this is the next step
- Next prompt
- What I should bring back to you

Do not write code unless the owner explicitly switches you from orchestration into implementation.
```

## 3. Prompt For Cleanup / Retirement Of the Current Builder

Use this when the agent should archive the current Platform Builder implementation and remove it from the live product path.

```text
Work directly from repository docs and code. Do not use skill wrappers or workflow shortcuts.

Goal:
retire the current Platform Builder implementation from the live product direction, preserve only useful technical reference, and prepare the repo for Platform Builder V2.

Primary source of truth:
- AGENTS.md
- docs/README.md
- docs/codex-native-repo.md
- platform/frontend/docs/platform-builder-v2/README.md
- platform/frontend/docs/platform-builder-v2/old-code-reference/README.md

Current implementation to evaluate:
- platform/frontend/apps/tenant-web/src/features/platform-builder/**
- platform/frontend/packages/platform-builder-core/**
- tenant shell integration and routing that exposes the current Platform Builder

Hard rules:
- preferred rule: do not keep live TypeScript or React source files in docs/
- owner-approved temporary exception: for this cleanup pass, it is acceptable to place a short-lived archive copy under `platform/frontend/docs/platform-builder-v2/old-code-reference/`
- anything moved there must be treated as temporary archive material, not a new live source root
- preserve reusable technical foundation only when it has clear V2 value
- remove current Platform Builder from the tenant sidebar and other misleading live entry points if they imply a product direction we are abandoning

Tasks:
1. Create an archive inventory for the current builder implementation.
2. Mark what is:
   - reusable foundation
   - reusable interaction experiment
   - disposable UI
   - removable routing/shell wiring
3. Write archive docs under:
   - platform/frontend/docs/platform-builder-v2/old-code-reference/current-builder-file-map.md
   - platform/frontend/docs/platform-builder-v2/old-code-reference/reusable-foundation-notes.md
   - platform/frontend/docs/platform-builder-v2/old-code-reference/discarded-ui-patterns.md
4. Propose or implement a safe retirement of the current live builder entry points.
5. If the owner still wants a temporary raw code archive, keep only the minimum raw snapshot material still needed under:
   - platform/frontend/docs/platform-builder-v2/old-code-reference/code-snapshot/
   and document exactly what was retained and why.
6. If you think a cleaner code-side archive is still needed, you may additionally recommend:
   - platform/frontend/apps/tenant-web/src/features/platform-builder-legacy/

Required result:
- a clean distinction between V2 strategy docs and old builder reference material
- if raw source is copied into docs for this pass, it is clearly marked temporary and reduced to the smallest useful residue
- clear mapping of what remains active vs archived

If you implement code changes, also return:
- changed files
- removed entry points
- remaining reusable foundation
```
