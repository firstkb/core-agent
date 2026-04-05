---
template_id: lane-report
template_version: 1.2.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# LANE FILE

## Metadata
- task_id: 2026-04-05_frontend_workspace-shell-collapsed-hover-preview
- lane: frontend
- status: done
- report_time: 2026-04-05 18:47:24 -0400
- prompt_version: 1.1.0
- control_prompt_version: 1.3.0
- author: Codex FE lane

## Control Packet Snapshot
- assigned_goal: Add a desktop-only hover preview for the collapsed `WorkspaceShell` rail sidebar, behind an opt-in prop, without mutating pinned collapse state.
- why_now: The shared shell already supports pinned collapse, but users need temporary access to navigation from the collapsed rail without changing mobile UX or the meaning of the collapse toggle.
- allowed_scope:
  - `platform/frontend/packages/app-shell/**`
  - explicit `WorkspaceShell` consumer wiring in admin and tenant only if needed for opt-in rollout
  - local docs/comments directly tied to the public API change
- likely_files_or_modules:
  - `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - `platform/frontend/packages/app-shell/src/styles.css`
  - `platform/frontend/packages/app-shell/src/index.ts`
  - `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`
  - `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - a new package test file if state logic tests are added
- locked_constraints:
  - shared solution only, not an admin-only workaround
  - desktop only, `layout="rail"` only, truly pinned-collapsed state only
  - preview state must not change persistent pinned collapse state
  - collapse toggle semantics remain pinned-state only
  - open/close delay should stay in the ~120-180ms range
  - preview trigger comes only from the rail / collapsed shell area
  - keyboard navigation and click navigation must keep working
  - mobile sidebar behavior must remain unchanged
  - default behavior must stay non-breaking until the prop is enabled
- out_of_scope:
  - mobile UX changes
  - backend or navigation payload changes
  - unrelated shell cleanup
  - left-edge hover behavior
- required_reads:
  - `platform/AGENTS.md`
  - `platform/docs/ai/current-state.md`
  - `platform/docs/ai/modules/admin-control-plane.md`
  - `platform/frontend/AGENTS.md`
  - `platform/frontend/docs/README.md`
  - `platform/frontend/docs/package-boundaries.md`
  - `platform/frontend/docs/layout-baseline.md`
  - `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - `platform/frontend/packages/app-shell/src/styles.css`
  - admin and tenant `private-app.tsx` `WorkspaceShell` callsites
- required_checks:
  - `pnpm --filter @platform/app-shell lint`
  - `pnpm --filter @platform/app-shell typecheck`
  - targeted tests if new tests are added
  - targeted app typecheck if app opt-in callsites change
- expected_report_path: `platform/docs/ai/runs/2026-04-05_frontend_workspace-shell-collapsed-hover-preview/frontend.md`
- memory_delta_expectation: propose shared-memory deltas only; Atlas finalizes

## Restate
Implement a shared `WorkspaceShell` desktop hover preview for pinned-collapsed rail mode, behind an opt-in prop, without changing the meaning of pinned collapse or touching mobile drawer behavior.

## Locked Invariants
- Preview stays inside shared shell scope.
- Preview is desktop-only and applies only to `layout="rail"` when the shell is already pinned-collapsed.
- Hover preview must not mutate persistent collapse state.
- Collapse toggle semantics remain pinned-state only.
- Hover enters from the rail / collapsed shell area only.
- Keyboard navigation, click navigation, and mobile sidebar behavior stay intact.

## Confirmed Facts
- `WorkspaceShell` now derives collapsed rail state through a dedicated helper in `platform/frontend/packages/app-shell/src/workspace-shell-sidebar-state.ts`.
- Hover preview uses a separate ephemeral state with a `140ms` open delay and `160ms` close delay.
- Preview visibility is gated by a new opt-in prop `enableCollapsedRailHoverPreview`, defaulting to `false`.
- Admin and tenant `WorkspaceShell` callsites explicitly opt in.
- Route selection and shell close actions clear the preview state without changing pinned collapse.
- Mobile behavior remains on the existing `isSidebarOpen` flow because hover handlers only attach when the shell is pinned-collapsed on desktop.

## Assumptions
- Pointer-driven hover is the intended trigger; focus alone should not open the preview.
- `140ms` / `160ms` stays within the packet's acceptable delay window.
- No durable shared memory update is needed yet beyond this lane report unless Atlas decides the new prop is now part of the long-term shell contract.

## Boundary Classification
- shared runtime
- public API change
- interaction-state change
- non-transport-coupled

## Plan
- Add an opt-in shared prop and keep preview state separate from pinned collapse state.
- Use the collapsed rail as the only hover trigger and render the preview as an overlay panel so layout width stays pinned-collapsed.
- Close the preview on navigation and shell dismissal paths.
- Add a practical package-level state test for the derived sidebar state.

## Implementation
- Added `enableCollapsedRailHoverPreview?: boolean` to `WorkspaceShellProps`, default `false`.
- Added `platform/frontend/packages/app-shell/src/workspace-shell-sidebar-state.ts` to derive `shellIsSidebarCollapsed`, preview eligibility, and preview visibility without overloading the pinned collapse flag.
- Added `platform/frontend/packages/app-shell/src/workspace-shell-sidebar-state.test.ts` with four state-logic tests covering classic layout, mobile rail, opt-out behavior, and opt-in pinned-collapsed behavior.
- Updated `platform/frontend/packages/app-shell/src/workspace-shell.tsx` to:
  - track preview open/close separately from pinned collapse
  - attach delayed hover enter/leave only while pinned-collapsed desktop rail preview is enabled
  - clear preview on navigation, backdrop close, sidebar close, and header open-navigation actions
- Updated `platform/frontend/packages/app-shell/src/styles.css` so preview-capable collapsed rails keep layout width pinned to the rail while the panel opens as an overlay, with pointer-events still disabled when hidden.
- Follow-up visual polish adjusted the hover preview overlay to sit slightly to the right of the rail, raised its stacking above page content, switched the preview background to `color-bg-canvas`, and hid the sidebar footer/user panel while the temporary preview is open.
- Removed native browser `title` tooltips from rail buttons that already use shared `Tooltip`, so rail hover now shows only one informational bubble.
- Enabled the prop in both shared rail consumers:
  - `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`
  - `platform/frontend/apps/tenant-web/src/app/private-app.tsx`

## Frontend Checks
- `pnpm --filter @platform/app-shell lint`
- `pnpm --filter @platform/app-shell typecheck`
- `pnpm exec vitest run src/workspace-shell-sidebar-state.test.ts` in `platform/frontend/packages/app-shell`
- `pnpm --filter @platform/platform-admin-web typecheck`
- `pnpm --filter @platform/tenant-web typecheck`

## Risks / Blockers
- blockers: none
- residual risk: the overlay preview should still get a quick manual desktop smoke check in both apps for hover feel and stacking against real route content, but the scoped code path is stable and checked.

## Proposed Memory Deltas
- none proposed by lane
- if Atlas wants this prop treated as a durable shared shell contract, document it in frontend shell docs later; otherwise the lane report is sufficient

## Lane Report Summary
- touched_files:
  - `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - `platform/frontend/packages/app-shell/src/styles.css`
  - `platform/frontend/packages/app-shell/src/workspace-shell-sidebar-state.ts`
  - `platform/frontend/packages/app-shell/src/workspace-shell-sidebar-state.test.ts`
  - `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`
  - `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - `platform/docs/ai/runs/2026-04-05_frontend_workspace-shell-collapsed-hover-preview/frontend.md`
- changed_files_for_user:
  - `platform/frontend/packages/app-shell/src/workspace-shell.tsx`
  - `platform/frontend/packages/app-shell/src/styles.css`
  - `platform/frontend/packages/app-shell/src/workspace-shell-sidebar-state.ts`
  - `platform/frontend/packages/app-shell/src/workspace-shell-sidebar-state.test.ts`
  - `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`
  - `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
- checks_run:
  - `pnpm --filter @platform/app-shell lint`
  - `pnpm --filter @platform/app-shell typecheck`
  - `pnpm exec vitest run src/workspace-shell-sidebar-state.test.ts`
  - `pnpm --filter @platform/platform-admin-web typecheck`
  - `pnpm --filter @platform/tenant-web typecheck`
- contract_drift: no

## Reconciliation Readiness
- ready_for_reconciliation: yes
- ready_for_closeout: no
- recommended_next_control_action: Reconcile the FE lane, run a quick desktop hover smoke check in admin and tenant if desired, then close out unless Atlas wants a durable shared-shell doc update.
