# Build Web Apps Review Bridge

Status: active frontend workflow memory  
Scope: Maestro use of official Build Web Apps capabilities for this repository

## Purpose

Use this bridge when Maestro, Charlie, Mason, Scout, or Lens are doing
frontend-heavy product work and official Build Web Apps capabilities are
available in the current Codex environment.

Do not hard-code local plugin cache paths. Plugin cache hashes and installation
locations may change between sessions. Discover active skills through the
current Codex skill/tool surface first. If discovery is unavailable, use this
document as the repo-local fallback checklist.

## Repository Priority

Repository rules and product contracts stay higher priority than Build Web Apps
defaults:

- `@platform/ui-kit` and UI Lab are the primary component/design system.
- `@platform/forms`, `@platform/collection-table`, and app packages must keep
  their package boundaries.
- Tenant/admin app route composition stays in app packages unless a shared
  package contract already exists.
- Backend writes, migrations, auth/grants, payments, and data contracts remain
  gated by normal Maestro approval/risk rules.

## Relevant Build Web Apps Capabilities

- `react-best-practices`: use for React state/effects, render performance,
  bundle/import, data-fetching, and component review on React code changes.
- `frontend-app-builder`: use for frontend app design/implementation QA and
  browser verification. For small slices inside existing UI Kit surfaces, use it
  as a review checklist rather than forcing ImageGen concept generation.
- `shadcn-best-practices`: use only when a surface actually uses shadcn/ui or
  the owner explicitly asks for shadcn. Do not introduce shadcn into this repo
  when UI Kit is the intended system.
- `stripe-best-practices`: use only for Stripe/payment integration decisions or
  migrations.
- `supabase-best-practices` / Supabase Postgres guidance: use only for
  Supabase/Postgres schema/query/config work. Do not use it as a generic backend
  substitute for platform runtime contracts.

## Frontend Slice Review Checklist

For visible frontend implementation or review, include the relevant subset:

- React pass: state ownership, effects, timers, stale closures, derived state,
  callback behavior, and unnecessary rerenders.
- Boundary pass: shared packages do not import app code; apps own route/API
  composition; public entrypoints expose only intended surfaces.
- UI Kit pass: existing primitives/tokens/classes are preferred over new
  component systems; UI Lab visual language remains intact.
- Accessibility pass: labels, required markers, error messages, readonly values,
  radio/checkbox groups, focusable controls, and button semantics.
- Browser pass: verify the rendered workflow with Browser Use or the built-in
  browser when available; record fallback if unavailable.
- No-write pass: for frontend-only slices, verify there are no hidden API calls,
  backend mutations, migrations, or grant changes.
- Evidence pass: record the Build Web Apps skills used, skipped skills with
  reason, checks run, visual route/state inspected, and residual risks.

## Visual Verification Standard

Use this standard for UI-visible frontend work unless the owner asks for a
different surface.

- Default interactive smoke: use the Codex Browser Use plugin/in-app browser for
  local product routes when the dev stack is running. This is the preferred
  agent surface because it provides DOM inspection and screenshot evidence
  inside Codex.
- Chrome/Computer Use: use only as a fallback or secondary check when Browser
  Use is unavailable, mismatched with the task, or the owner explicitly wants
  the real Chrome window/profile checked.
- Current-width screenshots: acceptable only as quick smoke evidence. Do not
  treat the current Codex browser panel width as desktop or mobile responsive
  evidence, because the panel can be resized by the owner or app shell.
- Fixed viewport evidence: when claiming responsive behavior, use a browser
  runner/tool that can set an explicit viewport. If no fixed-viewport tool is
  available in the session, record the gap and do not overstate the evidence.

Required viewport matrix for non-trivial visible UI work:

- Desktop: `1440x900`.
- Mobile portrait: `390x844`.
- Add tablet/narrow desktop `768x1024` when the change touches shell layout,
  sidebars, sticky toolbars, dense grids, or breakpoint-sensitive controls.

Evidence for each checked viewport should name the route/state, tool surface,
viewport label and dimensions, and auth context. Use `current viewport smoke`
when the screenshot came from the current in-app browser size rather than a
fixed viewport.

## Fallback Rule

If official Build Web Apps skills are not available in the session, say so in
evidence and run the repo-local checklist above. Do not block a normal product
slice solely because the plugin is absent.
