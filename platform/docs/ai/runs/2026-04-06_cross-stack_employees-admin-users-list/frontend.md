---
template_id: lane-report
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-06
---

# LANE FILE

## Metadata
- task_id: 2026-04-06_cross-stack_employees-admin-users-list
- lane: frontend
- status: closed
- report_time: 2026-04-06 21:42:36 -0400
- prompt_version: 1.1.0
- control_prompt_version: 1.4.0
- author: Atlas

## Launch Metadata
- base_prompt_file: platform/docs/ai/prompts/frontend-prompt-v1.md
- base_prompt_version: 1.1.0
- prompt_variant: full
- launch_prompt_status: skipped-inline

## Ready Chat Launch Prompt
```text
No separate frontend lane chat was opened. Atlas executed the frontend slice inline in the control thread.
```

## Control Packet Snapshot
- assigned_goal: Add `/admin/employees` as a real collection-table page and make it the second admin-app consumer through a shared frontend package instead of a second page copy.
- why_now: Employees needed a working list UI immediately, and the owner explicitly wanted the universal page to live in a package with thin page wrappers.
- allowed_scope: `platform-admin-web` route wiring and thin page wrappers; `packages/collection-table`; admin collection client helper
- likely_files_or_modules: `packages/collection-table/*`; `src/app/private-app.tsx`; `src/pages/modules-list/page.tsx`; `src/pages/employees-list/page.tsx`; `src/shared/admin-collection-table-client.ts`
- locked_constraints: Keep API URLs and route paths host-owned; do not pull auth/session into the shared package; preserve generic runtime/state/render contracts.
- out_of_scope: package extraction, tenant app reuse, employee edit/create flows, or design-system changes
- required_reads: collection-table runtime/state/render; module-registry page; admin shell routes; navigation memory
- required_checks: admin-web `npm exec tsc -- --noEmit`; targeted `vitest` suites for collection-table runtime/state/render and navigation
- expected_report_path: platform/docs/ai/runs/2026-04-06_cross-stack_employees-admin-users-list/frontend.md
- memory_delta_expectation: propose shared-memory deltas only; Atlas finalizes

## Analysis Snapshot
- locked_invariants: shared runtime stays generic; host pages own auth/session, navigation, and URL knowledge; the package must not import app code.
- confirmed_facts: The old module-registry page already contained the reusable collection-table host logic. Admin shell route resolution already trusted backend navigation for `/admin/*`, so adding an explicit `/admin/employees` route was sufficient for the new surface.
- assumptions: Employees list does not need row actions, bulk actions, export, or create in this rollout because backend meta does not expose them.
- change_classification: shared frontend package extraction plus thin host-page wrappers

## Lane Return Report
- touched_files: `platform/frontend/packages/collection-table/*`; `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`; `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`; `platform/frontend/apps/platform-admin-web/src/pages/employees-list/page.tsx`; `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-client.ts`; `platform/frontend/apps/platform-admin-web/src/shared/navigation.ts`; `platform/frontend/apps/platform-admin-web/package.json`
- summary_of_changes: Moved the generic collection-table runtime/page host into `@platform/collection-table`, collapsed admin transport to one shared helper, kept Module Registry and Employees as thin host pages, added `/admin/employees` and `/admin/users` compatibility routes, and normalized legacy `Users / List of users` labels to `Employees / List of Employees` until the migration lands.
- checks_run: `npm exec tsc -- --noEmit`; `npm exec vitest run src/shared/collection-table-runtime.test.ts src/shared/collection-table-state.test.ts src/shared/collection-table-render.test.tsx src/shared/navigation.test.ts`
- checks_still_needed: manual UI pass after the backend migration is applied and `api-admin` is serving the new routes
- blockers: none
- unresolved_risks: Employees currently proves reuse only inside the admin app; no cross-app consumer has been added yet; backend data labels still depend on the migration.
- contract_drift: no
- proposed_memory_deltas: Collection-table now has a second admin-app consumer and a real frontend package; admin pages are thin wrappers over the shared package.
- next_lane_step: close the run and use the same host for the next admin-app collection-table consumer if needed

## Reconciliation Readiness
- ready_for_reconciliation: yes
- ready_for_closeout: yes
- recommended_next_control_action: Close the run and hand back migration + manual verification follow-up
