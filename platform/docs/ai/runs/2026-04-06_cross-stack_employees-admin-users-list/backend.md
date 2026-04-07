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
- lane: backend
- status: closed
- report_time: 2026-04-06 21:42:36 -0400
- prompt_version: 1.1.0
- control_prompt_version: 1.4.0
- author: Atlas

## Launch Metadata
- base_prompt_file: platform/docs/ai/prompts/backend-prompt-v1.md
- base_prompt_version: 1.1.0
- prompt_variant: full
- launch_prompt_status: skipped-inline

## Ready Chat Launch Prompt
```text
No separate backend lane chat was opened. Atlas executed the backend slice inline in the control thread.
```

## Control Packet Snapshot
- assigned_goal: Make Employees visible to root navigation and provide collection-table endpoints backed by `admin_user`.
- why_now: The module was marked active by the owner but still could not appear in navigation without access-policy coverage and a live route family.
- allowed_scope: `api-admin` wiring, employees list module, access-policy matrix/tests, master migration, and related admin navigation constraints.
- likely_files_or_modules: `cmd/api-admin/internal/server/*`; `modules/admin/employeeslist/*`; `modules/admin/accesspolicy/*`; `migrations/postgres/master/110_admin_employees_rollout.sql`
- locked_constraints: Keep technical keys `users` and `list_of_users`; keep Employees root-only; use platform admin users from master DB; do not touch tenant runtime.
- out_of_scope: tenant users, non-root grants, employee mutations, or tenant API changes
- required_reads: navigation repository/service; access-policy matrix; module-registry list pattern; master migrations
- required_checks: `go test ./modules/admin/employeeslist ./modules/admin/accesspolicy ./modules/admin/navigation ./cmd/api-admin/internal/server`
- expected_report_path: platform/docs/ai/runs/2026-04-06_cross-stack_employees-admin-users-list/backend.md
- memory_delta_expectation: propose shared-memory deltas only; Atlas finalizes

## Analysis Snapshot
- locked_invariants: Employees stays root-only; source table is `admin_user`; route family is `/app/admin/employees/list/*`; navigation gating stays backend-owned.
- confirmed_facts: Root navigation requires active module/section rows plus route-path and access-policy coverage. `users/list_of_users` already existed in baseline data. Existing module-registry list code provided a valid collection-table endpoint pattern to copy.
- assumptions: The initial Employees directory only needs list/search/favorite/saved-filter behavior.
- change_classification: additive admin API rollout plus migration-backed label/route correction

## Lane Return Report
- touched_files: `platform/backend/migrations/postgres/master/110_admin_employees_rollout.sql`; `platform/backend/modules/admin/employeeslist/*`; `platform/backend/modules/admin/accesspolicy/matrix.go`; `platform/backend/modules/admin/accesspolicy/matrix_test.go`; `platform/backend/cmd/api-admin/internal/server/{server.go,bootstrap.go,routes.go,wiring_employees_list.go,routes_employees_list.go,access_policy_test.go}`
- summary_of_changes: Added a root-only Employees list module backed by `admin_user`, wired new `api-admin` collection-table endpoints under `/app/admin/employees/list/*`, added access-policy coverage for `users/list_of_users`, and added a migration that renames/activates the existing `users` module rows as `Employees` / `List of Employees` with route `/admin/employees`.
- checks_run: `go test ./modules/admin/employeeslist ./modules/admin/accesspolicy ./modules/admin/navigation ./cmd/api-admin/internal/server`
- checks_still_needed: apply `110_admin_employees_rollout.sql` in target environments
- blockers: none
- unresolved_risks: Employees remains root-only and read-only; real runtime visibility depends on migration application.
- contract_drift: no
- proposed_memory_deltas: Admin control plane now includes a root-only Employees directory backed by platform admin users; decisions log should lock technical key vs user-facing title.
- next_lane_step: frontend can now consume `/admin/employees` as a real table route

## Reconciliation Readiness
- ready_for_reconciliation: yes
- ready_for_closeout: yes
- recommended_next_control_action: Reconcile frontend host reuse and close the run
