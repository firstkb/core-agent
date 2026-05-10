# Work

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `active`
- Owner goal: Stabilize Form Builder; remove Form Builder control over View Active/Inactive, retire `isActive` from Form Builder view config, and add the static Projects model/view.

## Understanding

The owner found multiple Form Builder defects while working on runtime display of forms created in Form Builder. The analysis artifact classified the problems and proposed implementation slices. Slices 1-6 and follow-ups are implemented and verified. On 2026-05-06 the owner requested removing View Active/Inactive UI from Form Builder and retiring `isActive` from Form Builder view config because Navigation Builder owns sidebar/runtime exposure. On 2026-05-07 the owner approved implementation of a static Projects Form Builder model/view backed by the existing `projects` table plus new `industry_size` and `industry_type` lookup tables. Follow-up runtime testing exposed an authoring save rejection for underscore static model ids and duplicate empty Projects tab containers; both are now treated as Project static model correction scope. On 2026-05-10 the owner started the lookup settings slice for the first three generic DB lookup fields.

## Agreed Scope

- In: remove Form Builder View Active/Inactive status/control UI; retire `isActive` from Form Builder view config/new `ps_view.definition_json` payloads; add tenant migration/static metadata/views for `Projects`, `industry_size`, and `industry_type`.
- Out: backend/runtime grants, Navigation Builder ACL, Action Builder, Access List / `projectsaccess` UI, release/deploy work, and unrelated artifact changes.

## Continuity Snapshot

- Latest owner correction: use `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md` as the input file and create a separate artifact folder.
- Current phase: `Project static model implementation`
- Artifact path: `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/`
- Gates / approvals: owner approved Slice 4 on 2026-05-03. Owner approved dropping old `projects.size` / `projects.type` in favor of `industry_size_id` / `industry_type_id` on 2026-05-07. No release/deploy gate is in scope.
- Evidence status: Slice 1, Slice 2, Slice 3, Slice 4, Slice 5, Slice 6, Slice 6 follow-ups, View drift warning, View Active/Inactive UI, Project static model, Project correction, and first generic DB lookup filter checks are recorded in `evidence.md`.
- Unresolved owner decisions: whether ready-made `radio_group` / `checkbox_group` should also default to horizontal; whether Grid visible-only filter should ever be persisted as a preference.
- Next allowed action: owner manual test that Form Builder still loads/saves views normally and no longer exposes or writes View Active/Inactive as authoring config.

## Decisions

- Treat `source-findings.md` as an input snapshot copied from the foreign artifact. Do not mutate the source artifact in this analysis slice.
- Keep resolved findings out of the implementation backlog except where they expose contract/doc drift.
- Start implementation with grid/scope persistence and sorting constraints before runtime Subform work.
- Treat `subformScopes[].viewSettings.list.columns` as the canonical Subform Grid storage surface; node-level `childGridColumns` is legacy compatibility only.
- Preserve transient canvas navigation in the working document after save, while keeping saved baselines normalized for dirty checks.
- Keep drift reconciliation visible as unsaved work by separating the server baseline document from the reconciled working document.
- Draft save model+view persistence must not partially update the model before a stale view conflict is detected.
- For Slice 3, change only base choice field templates to horizontal orientation; do not infer the same default for ready-made radio/checkbox presets.
- Keep the Grid visible-only switch transient UI state so it cannot mutate or drop hidden column metadata.
- For Slice 4, accepted choice button option style variants are `default`, `primary`, `secondary`, `info`, `success`, `warning`, and `danger`.
- `default` is represented by no persisted style entry; raw `backgroundColor`, `textColor`, and `borderColor` are not runtime contract and are ignored during normalization.
- Runtime single/multi-select buttons map option variants to forms package CSS classes backed by product tokens, without expanding the shared `ui-kit` Toggle API for per-item variants.
- Pause decision: do not archive or close this artifact yet; keep it active for resume.
- For Slice 5, Subform View edits the user-facing parent `Subform` node `title`; `schemaScopeId`, `tableKey`, runtime table/view names, and route identity are not renamed from this UI field.
- For Slice 6, the accepted schema flag is `uniqueValue?: boolean`; Form Builder persists only `true`, omits disabled/false values, and does not implement runtime uniqueness enforcement in this slice.
- Slice 6 follow-up scope: `Unique value` is allowed for plain `short_text`, ready-made `Email`/`Phone`, and `short_text` fields validated as email/phone; specialized text presets such as URL and suggest text remain excluded.
- Subform attention markers must propagate across scope boundaries through `subformScopes[].parentSubformNodeId`.
- View-list yellow triangle is a model-topology drift signal only. Field settings and layout-only `layoutBlueprint` edits must not advance `modelStructureVersion`.
- Form Builder does not own View Active/Inactive publication controls. `isActive` is retired from Form Builder view config and new `ps_view.definition_json` payloads. Keep backend `ps_view.is_active` / API summary values only as deprecated compatibility metadata until a later cleanup.
- Projects static model decision: use model id/storage `projects`, view title `Projects`, default grid sort `project_number asc`, Main/Details tabs, `contract_value` as Project Value currency, status options `Active`, `Completed`, `100%`, `Cancelled`, and Active as boolean.
- Project lookup decision: `company_id` is Business Unit, `contractor_company_id` is CM, `subcontractor_company_id` is GC, `contact_id` points to `users` with label `first_name + last_name`, `state_id` points to `state`, and industry fields point to new global lookup tables `industry_size` / `industry_type`.
- Project schema decision: replace old text columns `projects.size` / `projects.type` with canonical lookup columns `industry_size_id` / `industry_type_id`; backfill known legacy text values before dropping the old columns.
- Correction after owner review: `industry_size` and `industry_type` are new tenant tables and must include `guid`, `created_at`, `updated_at`, and the shared `set_updated_at()` trigger.
- Correction after owner runtime test: static model authoring save compares normalized payload ids to normalized path ids so `industry_type` and `industry_size` do not fail as `invalid payload`; static seeded UI container nodes must carry explicit `containerKey` values that match `layoutBlueprint`.
- First generic DB lookup filter decision: use future-shaped `lookupConfig.filters[]`; current UI exposes only an `Only active records` shortcut for `DB lookup`, `DB lookup value`, and `DB lookup multi`, saved as `{ field: "active", operator: "eq", value: true }` when the source has a boolean `active` field.

## Plan

1. Preserve the source findings in this artifact.
2. Classify the findings into resolved, blocker, reliability, authoring UX, and contract-definition work.
3. Record concrete solution proposals with code touch points and evidence expectations.
4. Implement Slice 1 grid/sorting correctness.
5. Implement Slice 2 draft hydration/save reliability.
6. Implement Slice 3 authoring quality-of-life follow-ups.
7. Implement Slice 4 choice button semantic option style contract.
8. Pause without closing and record completed work/future lookup work in the source findings file.
9. Implement Slice 5 Subform View title editing.
10. Implement Slice 6 `uniqueValue` authoring flag for email/phone text fields.
11. Implement Slice 6 follow-up for plain `short_text` unique support and Subform attention propagation.
12. Implement View drift warning topology-only structure comparison.
13. Remove Form Builder View Active/Inactive status/control UI.
14. Retire `isActive` from Form Builder view config/new `ps_view.definition_json` payloads while leaving DB/API compatibility metadata in place.
15. Add static Projects Form Builder model/view plus `industry_size` and `industry_type` lookup tables, metadata, runtime views, docs, bundle, and migration evidence.
16. Correct `industry_size` and `industry_type` audit columns/triggers after owner review.
17. Correct static Projects authoring metadata and static underscore model save validation after owner runtime test.
18. Add first generic DB lookup `lookupConfig.filters[]` authoring for the active-record shortcut.

## Risks / Gates

- Runtime grants and Navigation Builder ACL are out of scope.
- The Project migration intentionally drops old `projects.size` / `projects.type` after backfilling canonical lookup ids per owner approval.
- Dropping `ps_view.is_active` or removing API summary/request fields requires a separate cleanup/migration slice after Navigation Builder exposure lands.
- Browser/visual smoke is useful for final visual acceptance of semantic button variants if the local dev stack is running.

## Agent / Tool Notes

- Maestro worked inline. No specialist agents were spawned.
- Existing uncommitted changes were observed in the source 2026-04-30 artifact; they must not be reverted or included unless explicitly requested.

## Evidence

- See `evidence.md`.

## Next Action

Run final local checks for the first generic DB lookup filter authoring, then commit the slice. Owner manual testing should confirm the DB lookup source picker can save the `Only active records` filter for the first three generic lookup fields.
