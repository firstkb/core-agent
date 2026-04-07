# FINAL CLOSEOUT

## Metadata
- task_id: 2026-04-06_cross-stack_employees-admin-users-list
- status: closed
- created_at: 2026-04-06 21:42:36 -0400
- updated_at: 2026-04-06 22:01:00 -0400
- skill_name: ramp-conductor
- skill_display_name: Atlas
- skill_version: 1.4.0
- control_prompt_version: 1.4.0

## Reconciliation
- summary: Completed the Employees rollout for platform admin users. Backend now exposes a root-only Employees collection-table surface under `/app/admin/employees/list/*`, access policy covers `users/list_of_users`, and a migration renames/activates the existing module rows as `Employees` / `List of Employees` with route `/admin/employees`. Frontend now uses the shared `@platform/collection-table` package for both Module Registry and Employees, with thin admin-app wrappers and compatibility for legacy `/admin/users` while old DB data is still present.
- contract_drift_found: no
- checks_summary: `go test ./modules/admin/employeeslist ./modules/admin/accesspolicy ./modules/admin/navigation ./cmd/api-admin/internal/server` passed; `npm exec tsc -- --noEmit` passed in `platform/frontend/apps/platform-admin-web`; targeted `vitest` collection-table + navigation suites passed with 4 files / 22 tests
- shared_memory_updates_applied: `platform/docs/ai/current-state.md`; `platform/docs/ai/decisions-log.md`; `platform/docs/ai/modules/collection-table.md`; `platform/docs/ai/modules/admin-control-plane.md`; `platform/docs/ai/modules/admin-module-registry.md`
- unresolved_risks: target environments still need migration `110_admin_employees_rollout.sql`; Employees has no create/edit flows yet; cross-app consumer proof beyond the admin app is still pending
- archive_recommendation: keep this run as the implementation reference until the next Employees-management or collection-table packaging task supersedes it
- next_exact_step: apply `platform/backend/migrations/postgres/master/110_admin_employees_rollout.sql`, start `api-admin` and `platform-admin-web`, then verify that root sees `Employees` in the menu and that `/admin/employees` lists platform admin users
