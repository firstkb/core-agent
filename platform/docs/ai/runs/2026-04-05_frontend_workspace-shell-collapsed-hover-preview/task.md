---
template_id: control-task
template_version: 1.2.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-05_frontend_workspace-shell-collapsed-hover-preview
- title: Collapsed sidebar hover preview in shared shell
- status: reconciled
- created_at: 2026-04-05 18:20:44 -0400
- updated_at: 2026-04-05 18:54:03 -0400
- created_by: Atlas
- skill_name: ramp-conductor
- skill_display_name: Atlas
- skill_version: 1.3.0
- control_prompt_version: 1.3.0
- frontend_prompt_version: 1.1.0
- backend_prompt_version: 1.1.0

## Routing Decision
- run_required: yes
- primary_mode: FE_ONLY
- recommended_chat_topology: CONTROL_PLUS_FE
- active_lanes: frontend
- execution_order: single lane
- scaffolder_action: created via new-run 1.2.0
- run_artifact_scope: platform/docs/ai/runs/2026-04-05_frontend_workspace-shell-collapsed-hover-preview/

## Goal
- goal: Add desktop-only hover preview for collapsed rail sidebar without changing pinned collapse state
- why_now: Shared shell behavior must support temporary desktop preview while preserving mobile UX and pinned collapse semantics
- business_or_technical_value: Improve discoverability and navigation speed from a collapsed rail without silently re-pinning the sidebar or regressing mobile behavior.

## Scope
- in_scope:
  - shared `WorkspaceShell` support for a temporary desktop hover preview while pinned collapsed
  - a public opt-in prop such as `allowCollapsedHoverPreview` with a safe default
  - derived preview/effective-expanded state that does not mutate pinned collapse state
  - rail-only mouse enter/leave lifecycle with a short open/close delay
  - click navigation from the preview without breaking existing route handling
  - CSS/layering/pointer-events updates needed for hover preview behavior
  - targeted tests for state logic if practical in the current package setup
  - nearby docs/comments sync if the public shell API is documented locally
- out_of_scope:
  - admin-only CSS hacks
  - mobile sidebar UX changes
  - left-edge or screen-edge hover triggers
  - backend or navigation payload contract changes
  - unrelated shell refactors

## Locked Invariants
- locked_invariants:
  - shared-level solution in `platform/frontend/packages/app-shell`, not an admin-only override
  - preview works only for `layout="rail"`, desktop viewport, and truly pinned-collapsed state
  - preview must not change persistent `isSidebarCollapsed`
  - explicit `Collapse navigation` continues to control pinned state only
  - preview closes on mouse leave with a small delay in the ~120-180ms range
  - trigger area is the rail / collapsed shell area only, never the left screen edge
  - keyboard navigation must remain intact; hover is an added pointer affordance, not a keyboard dependency
  - click navigation from preview must keep normal `onNavigate` / `href` behavior
  - mobile drawer behavior must remain unchanged
  - current admin behavior must not change unless the new prop is explicitly enabled

## Confirmed Shared Contract
- confirmed_shared_contract:
  - `WorkspaceShell` is a shared public export from `platform/frontend/packages/app-shell/src/index.ts`
  - pinned collapse state is currently owned by `isSidebarCollapsed`
  - mobile drawer visibility is currently owned by `isSidebarOpen`
  - effective collapsed styling currently derives from `shellIsSidebarCollapsed = layout === "rail" && !isMobileViewport && isSidebarCollapsed`
  - collapsed rail CSS currently hides the panel via `0fr`, `opacity: 0`, `visibility: hidden`, and `pointer-events: none`
  - both `platform-admin-web` and `tenant-web` currently use `layout="rail"` and `showRailCollapse`
  - rail navigation in collapsed/expanded sidebar mode still routes through `SidebarNav` and `activateNavigationItem`

## Facts and Assumptions
- code_confirmed_facts:
  - `WorkspaceShell` lives in `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - collapsed rail behavior is styled in `platform/frontend/packages/app-shell/src/styles.css`
  - `platform-admin-web` and `tenant-web` both consume `WorkspaceShell` with `layout="rail"`
  - no package-local tests were found under `platform/frontend/packages/app-shell`
- doc_confirmed_facts:
  - `app-shell` owns shared layout shell, navigation scaffolds, and shared app chrome
  - frontend docs require updates when shell or navigation behavior changes across more than one surface
- inferred_facts:
  - a separate temporary preview state is safer than mutating pinned collapse state or reusing mobile drawer state
  - prop-gated rollout is the safest path because the change sits on a shared public shell surface
- assumptions:
  - preview should open only for pointer-driven desktop hover, not merely from keyboard focus
  - FE lane may need to opt in one or both app callsites after validating desired rollout scope in code

## Lane Plan
- lane_plan: mode=FE_ONLY; lanes=frontend
- fe_goal: Implement prop-gated desktop hover preview for the collapsed rail sidebar in `WorkspaceShell` without changing pinned collapse state or mobile behavior.
- fe_allowed_scope:
  - `platform/frontend/packages/app-shell/**`
  - explicit `WorkspaceShell` callsites in `platform-admin-web` and `tenant-web` only if opt-in wiring is approved and necessary
  - nearby frontend docs/comments directly coupled to the public API change
- fe_likely_files_or_modules:
  - `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - `platform/frontend/packages/app-shell/src/styles.css`
  - `platform/frontend/packages/app-shell/src/index.ts`
  - `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`
  - `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - a new `packages/app-shell` test file if state logic tests are added
- fe_locked_constraints:
  - keep admin/tenant semantics explicit
  - do not change backend or navigation payload contracts
  - do not let preview state leak into persistent pinned state
  - do not break mobile open/close behavior
  - do not break keyboard navigation or click navigation
  - do not trigger preview from outside the rail/collapsed shell area
- fe_required_reads:
  - `platform/AGENTS.md`
  - `platform/docs/ai/current-state.md`
  - `platform/docs/ai/modules/admin-control-plane.md`
  - `platform/frontend/AGENTS.md`
  - `platform/frontend/docs/README.md`
  - `platform/frontend/docs/package-boundaries.md`
  - `platform/frontend/docs/layout-baseline.md`
  - `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - `platform/frontend/packages/app-shell/src/styles.css`
  - consuming `private-app.tsx` files for admin and tenant
- fe_required_checks:
  - `pnpm --filter @platform/app-shell lint`
  - `pnpm --filter @platform/app-shell typecheck`
  - targeted frontend tests if new tests are added
  - targeted app typecheck if app-level opt-in wiring changes
- fe_expected_report_path: platform/docs/ai/runs/2026-04-05_frontend_workspace-shell-collapsed-hover-preview/frontend.md
- be_goal:
- be_allowed_scope:
- be_likely_files_or_modules:
- be_locked_constraints:
- be_required_reads:
- be_required_checks:
- be_expected_report_path:

## Memory and Risk
- memory_sources_read:
  - `platform/AGENTS.md`
  - `platform/docs/ai/README.md`
  - `platform/docs/ai/current-state.md`
  - `platform/docs/ai/canonical-docs.md`
  - `platform/docs/ai/modules/admin-control-plane.md`
  - `platform/frontend/AGENTS.md`
  - `platform/frontend/docs/README.md`
  - `platform/frontend/docs/package-boundaries.md`
  - `platform/frontend/docs/layout-baseline.md`
  - `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - `platform/frontend/packages/app-shell/src/styles.css`
  - admin and tenant `private-app.tsx` `WorkspaceShell` callsites
- memory_update_targets: likely none in `platform/docs/ai/*` unless the shared shell behavior becomes a durable contract; local frontend docs/comments may need sync if the public API text changes
- approvals_required: none for FE implementation inside current workspace scope
- risks:
  - hover timer cleanup may get out of sync during fast pointer enter/leave transitions
  - layering or pointer-event changes may accidentally block content or prevent close-on-leave
  - tying preview state to the wrong state source may break keyboard navigation or mobile behavior
  - default prop behavior must stay non-breaking for current admin and tenant shells

## Control Progress
- next_control_step: Reconciliation complete. Optional next step is a quick desktop hover smoke check in admin and tenant before commit/publish.
- checkpoint_notes: FE lane delivered the shared shell implementation, explicit app opt-ins, state tests, and targeted type/lint checks. Control verified the diff and re-ran the targeted automated checks successfully.

## Final Closeout
- final_status: reconciled
- shared_memory_updates_applied: none
- unresolved_items:
  - optional manual desktop smoke check for hover feel, stacking, and leave-close behavior in both apps
- archive_recommendation: archive only after closeout and inactivity
