---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-06
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-06_cross-stack_employees-admin-users-list
- title: Employees admin users list rollout
- status: closed
- created_at: 2026-04-06 21:42:36 -0400
- updated_at: 2026-04-06 22:01:00 -0400
- created_by: Atlas
- skill_name: ramp-conductor
- skill_display_name: Atlas
- skill_version: 1.4.0
- control_prompt_version: 1.4.0
- frontend_prompt_version: 1.1.0
- backend_prompt_version: 1.1.0

## Routing Decision
- run_required: yes
- primary_mode: CROSS_STACK_SEQUENTIAL
- recommended_chat_topology: CONTROL_PLUS_FE_AND_BE
- active_lanes: frontend, backend
- execution_order: control-defined sequence
- scaffolder_action: created via new-run 1.3.0
- run_artifact_scope: platform/docs/ai/runs/2026-04-06_cross-stack_employees-admin-users-list/

## Goal
- goal: Rename the control-plane module to Employees, surface it in admin navigation, and add a collection-table consumer for platform admin users
- why_now: This becomes the second real collection-table consumer and unblocks the Employees control-plane rollout
- business_or_technical_value: Root admins need a first-class Employees directory backed by platform admin users, and collection-table needs a second real admin-app consumer before any shared-package decision can mature.

## Scope
- in_scope: Admin module/section rollout rename and activation; access-policy coverage for Employees; `api-admin` Employees list collection endpoints backed by `admin_user`; admin-web route and table surface for `/admin/employees`; durable memory updates for the new control-plane state.
- out_of_scope: Tenant users, non-root Employees rollout, employee create/edit flows, package extraction, tenant-app reuse, or new grant semantics.

## Locked Invariants
- locked_invariants: Technical module key stays `users`; user-facing labels become `Employees` and `List of Employees`; source of truth is platform `admin_user`, not tenant users; Employees remains root-only; collection-table package code stays generic while auth/session and route prefixes stay host-owned.

## Confirmed Shared Contract
- confirmed_shared_contract: Backend list endpoints follow the existing admin collection-table contract shape (`meta`, `query`, `search-suggestions`, `favorite/toggle`, `saved-filters`). Frontend reuse now happens through the shared `@platform/collection-table` runtime/page package plus host-owned admin collection clients.

## Facts and Assumptions
- code_confirmed_facts: Root navigation only shows active sections with a route path and access-policy coverage. The baseline module key `users` and section key `list_of_users` already exist in migrations/tests. Platform admin users live in master-db table `admin_user`. Admin app already maps `users` icon tokens. Collection-table runtime/state/render code was already shared inside admin-web and module registry was the first consumer.
- doc_confirmed_facts: Collection-table memory requires a second real consumer before package promotion. Admin-control-plane memory keeps root-only boundaries explicit and keeps non-root rollout separate.
- inferred_facts: The safe implementation path was backend-first for navigation visibility, then frontend package extraction so the second consumer reused the same generic page instead of a second large page copy.
- assumptions: `Employees` is intended as a read-only directory for platform admins in this rollout and does not need create/edit actions yet.

## Lane Plan
- lane_plan: mode=CROSS_STACK_SEQUENTIAL; backend-first, frontend-second; executed inline by Atlas in this chat
- fe_goal: Reuse collection-table as a second admin-app consumer at `/admin/employees` through a shared frontend package and thin host pages
- fe_allowed_scope: `platform-admin-web` page wrappers + route wiring and `packages/collection-table`
- fe_likely_files_or_modules: `packages/collection-table/*`; `src/app/private-app.tsx`; `src/pages/modules-list/page.tsx`; `src/pages/employees-list/page.tsx`; `src/shared/admin-collection-table-client.ts`
- fe_locked_constraints: Keep runtime generic and keep auth/session plus routes/transport host-owned
- fe_required_reads: admin navigation shell route wiring; collection-table runtime/state/render; module-registry page; collection-table module memory
- fe_required_checks: admin-web `tsc --noEmit`; targeted Vitest collection-table and navigation suites
- fe_expected_report_path: platform/docs/ai/runs/2026-04-06_cross-stack_employees-admin-users-list/frontend.md
- be_goal: Make Employees visible to root navigation and provide collection-table endpoints backed by `admin_user`
- be_allowed_scope: `api-admin` wiring, access-policy coverage, Employees module package, master migration, targeted tests
- be_likely_files_or_modules: `cmd/api-admin/internal/server/*`; `modules/admin/employeeslist/*`; `modules/admin/accesspolicy/*`; `migrations/postgres/master/110_admin_employees_rollout.sql`
- be_locked_constraints: Keep Employees root-only; keep technical keys stable; use collectionprefs admin repository; do not touch tenant runtime
- be_required_reads: admin navigation repository/service; access-policy matrix; master migrations; existing module-registry list pattern
- be_required_checks: targeted `go test` for employees list, access-policy, navigation, and `api-admin` server wiring
- be_expected_report_path: platform/docs/ai/runs/2026-04-06_cross-stack_employees-admin-users-list/backend.md

## Prompt Delivery
- prompt_delivery_status: skipped-inline
- frontend_launch_prompt_path: platform/docs/ai/runs/2026-04-06_cross-stack_employees-admin-users-list/frontend.md#ready-chat-launch-prompt
- backend_launch_prompt_path: platform/docs/ai/runs/2026-04-06_cross-stack_employees-admin-users-list/backend.md#ready-chat-launch-prompt
- direct_launch_prompt_required: no
- prompt_delivery_notes: No secondary lane chats were opened. Atlas executed backend then frontend work inline in the control thread and wrote lane reports after reconciliation.

## Memory and Risk
- memory_sources_read: platform/AGENTS.md; platform/docs/ai/current-state.md; platform/docs/ai/decisions-log.md; platform/docs/ai/modules/collection-table.md; platform/docs/ai/modules/admin-control-plane.md; platform/docs/ai/modules/admin-module-registry.md; admin navigation/access-policy/backend server wiring; collection-table runtime/state/render; admin shell route wiring
- memory_update_targets: current-state.md | decisions-log.md | relevant modules/*.md | canonical-docs.md if authority changed
- approvals_required: No extra owner approval beyond task confirmation was needed because the work stayed inside admin runtime boundaries and app-local reuse.
- risks: Migration `110_admin_employees_rollout.sql` must be applied before backend data labels/route are corrected in a real environment. Employees remains root-only and read-only in this rollout. Cross-app adoption still is not solved by the new frontend package alone.

## Control Progress
- next_control_step: Close the run and hand the implementation summary back to the owner
- checkpoint_notes: Completed backend-first rollout, then moved the generic table host/runtime into `@platform/collection-table` with thin admin-app wrappers for Module Registry and Employees plus compatibility for legacy `/admin/users`.

## Final Closeout
- final_status: closed
- shared_memory_updates_applied: current-state.md; decisions-log.md; modules/collection-table.md; modules/admin-control-plane.md; modules/admin-module-registry.md
- unresolved_items: no employee create/edit workflow yet; no non-root Employees rollout; no cross-app consumer yet
- archive_recommendation: keep as implementation reference until the next collection-table packaging or Employees management task supersedes it
