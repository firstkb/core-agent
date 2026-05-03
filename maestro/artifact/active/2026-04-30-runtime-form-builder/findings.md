# Findings

This file tracks owner-discovered issues and observations from manual testing
around the runtime form builder, Form Builder views, and runtime list surfaces.
Only items explicitly selected for the current slice should be pulled into the
implementation plan.

Statuses:

- `triage`: recorded, not yet scoped.
- `current-slice`: approved for the active implementation slice.
- `next-slice`: accepted follow-up, not part of the active slice.
- `blocked`: waiting on an owner decision or prerequisite.
- `resolved`: fixed and verified.

## FB-RT-001 - Sorting field picker should use grid output fields

- Area: Form Builder View tab, Sorting, Sort field.
- URL: `https://demo.platform.localhost/builder/forms/test-inspection/views/view-test-inspection-copy`
- Model/View: `test-inspection` / `view-test-inspection-copy`
- Symptom: The Sort field picker can select fields that are not included in the current grid output.
- Expected: The Sort field picker should show only fields that are included in the current Grid output for that view.
- Actual: A non-grid-output field can be selected for sorting, which can later produce runtime/backend mismatch behavior.
- Evidence: Owner manual testing in Form Builder on 2026-05-03.
- Priority: open.
- Status: triage.
- Owner decision: Sorting UX should be constrained by fields included in Grid output.
- Fixed in: pending.
- Verification: pending.

## FB-RT-002 - View resave warning no longer preloads pending field changes

- Area: Form Builder, Default View change propagation to other views.
- URL: `https://demo.platform.localhost/builder/forms/test-inspection/views/view-test-inspection-copy`
- Model/View: `test-inspection` / affected non-default views after Default View field changes.
- Symptom: After adding, changing, or deleting a field in Default View, other views show the yellow warning triangle that indicates the view needs to be opened and resaved, but opening the view no longer highlights newly added fields or enables Save automatically.
- Expected: When a view requires resave after Default View field changes, opening that view should immediately show the pending added/changed fields and enable Save, matching the previous behavior.
- Actual: The warning appears, but the view does not present the pending changes or activate Save automatically.
- Evidence: Owner manual testing in Form Builder on 2026-05-03.
- Priority: open.
- Status: triage.
- Owner decision: Restore the previous resave workflow so pending propagated field changes are visible and saveable when the affected view is opened.
- Fixed in: pending.
- Verification: pending.

## FB-RT-003 - Preview runtime list suppressed selection and bulk actions

- Area: Form Builder preview runtime list and runtime list metadata.
- URL: `https://demo.platform.localhost/app/platform-studio/forms/users/views/view-accounts`
- Model/View: `users` / `view-accounts`
- Symptom: The preview runtime list shows the `active` column but does not show row-selection checkboxes or `Active` / `No active` / `Delete` bulk actions.
- Expected: Form Builder preview should expose the same selection and bulk actions as the runtime list when the view/table supports them.
- Actual: `LoadRuntimeViewListMeta` built bulk actions in the service, but commit `2552b2d` made `Handler.LoadRuntimeViewListMeta` clear `BulkActions` and set `Selection.Enabled=false` for `/app/platform-studio/forms/.../runtime/*` requests. The same commit also disabled frontend `runBulkAction` when `routeContext === "preview"`.
- Evidence: Owner BE response on 2026-05-03 shows `selection.enabled=false` and `bulkActions=[]` despite `active` being present in `fields` and `columns`. Browser Use smoke: `/app/forms/users/views/view-accounts` shows checkboxes and, after selecting rows, `Active` / `No active` / `Delete`; `/app/platform-studio/forms/users/views/view-accounts` shows no checkboxes.
- Priority: high.
- Status: resolved.
- Owner decision: Preview should keep the previously working selection/bulk-action behavior.
- Fixed in: working tree after `2552b2d`; pending commit.
- Verification: `go test ./modules/tenant/platformstudioformbuilder ./modules/tenant/platformstudioformruntime` passed; `go test ./cmd/api-tenant/internal/server` passed; `pnpm -C platform/frontend --filter @platform/tenant-web typecheck` passed; `pnpm -C platform/frontend --filter @platform/tenant-web lint` passed; `pnpm -C platform/frontend --filter @platform/tenant-web test` passed; `scripts/preflight.sh` passed. Browser verification on the live preview route still needs api-tenant restarted on this code.
