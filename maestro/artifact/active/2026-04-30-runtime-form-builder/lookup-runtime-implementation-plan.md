# Lookup Runtime Implementation Plan

- Work ID: `2026-04-30-runtime-form-builder`
- Plan scope: Form render support for `db_lookup`, `db_lookup_value`, `db_lookup_multi`, and preset lookup shortcuts through the tenant dictionary endpoint.
- Status: first `search_select` implementation slice completed; staged work remains below.

## Owner Decisions

- `search_select` is the first fully implemented lookup display mode.
- `catalog_modal` is staged. The first slice renders a clear trigger/fallback button; the full modal with columns, pagination, search, grouping, and selection is a later slice.
- Ordinary DB lookup fields use `lookupConfig` as the authoritative generic dictionary source. Contact/Company/Project preset shortcuts use named dictionaries in runtime form rendering.
- `db_lookup_value` stores the selected source text value, not a relation id.
- `db_lookup_multi` stores an array of selected stored values.
- Dynamic lookup filters need code verification before implementation. Static `lookupConfig.filters[]` are supported by the current dictionary endpoint; token/form-value driven filters are not treated as complete until proven by current schema/runtime code.

## Implemented First Slice

- `@platform/forms` now keeps lookup metadata app-agnostic and renders `search_select` lookup fields through the existing UI Kit `Combobox` remote hooks:
  - controlled search;
  - `filterMode = "none"`;
  - loading/loading-more state;
  - dropdown scroll load-more;
  - lazy option loading after the user activates the dropdown;
  - selected-value hydration through `ids` after activation, not on initial form render;
  - option descriptions as second-line metadata.
- `tenant-web` now adapts runtime lookup metadata to `createTenantDictionaryClient(...).loadOptions(...)`:
  - `lookupConfig.sourceModel` uses generic POST;
  - preset Contact/Company/Project shortcuts use named dictionaries;
  - static `lookupConfig.filters[]` pass through;
  - `db_lookup_value` uses stored text/display fields as the saved value source.
- Runtime mutation requests now accept display-only `lookupLabels` so multivalue lookup rows can persist labels in generated multivalue storage without making labels authoritative.
- `platformstudioformruntime` now supports managed `db_lookup_multi`/`selectionMode = multiple` as multivalue fields and stores lookup multivalue rows with `value_kind = "lookup"`.
- `db_lookup_value` runtime normalization now treats the selected value as text instead of forcing integer id parsing.
- `catalog_modal` remains staged and intentionally renders as a fallback trigger, not as a fake search-select.

## Code Verification Notes

- Current source-picker code writes static active filters into `lookupConfig.filters[]`.
- Dynamic/token filter types exist in Form Builder filter-rule state, but they are not implemented as runtime lookup dependency filters in this first slice.
- Browser smoke confirmed runtime preset Contact/Company/Project shortcuts must be treated as named dictionaries, even when authored schema contains preset lookup metadata that resembles a generic source model.
- No broad `platformstudioformbuilder` writes were needed for this slice.

## Existing Baseline

- Shared dictionary endpoints already exist:
  - named dictionaries: `GET /app/dictionaries/{dictionaryKey}/options`;
  - generic model-backed lookup: `POST /app/dictionaries/options/query`.
- Frontend API client already routes dictionary requests by shape:
  - `sourceModel` present means generic POST;
  - only `dictionary` means named GET.
- `platformstudioformruntime` currently hydrates selected labels only for single-value `contact_lookup` fields by appending the current option to `dataSchema.rootScope.fields[].options`.
- Form Builder runtime apply already creates generated multivalue storage and aggregate grid outputs for `db_lookup` with `selectionMode = multiple`.
- Form runtime currently disables `db_lookup` multiple fields in the runtime field plan, so BE runtime create/edit/load must be fixed before FE multi lookup can be accepted.
- Form runtime currently normalizes all `db_lookup` mutation values as integer ids; `db_lookup_value` needs a text-storage exception.

## First Slice Contract

### Field Semantics

- `db_lookup`
  - single selected stored value;
  - saves the selected option `value`;
  - hydrates selected labels through dictionary `ids`;
  - renders selected label, not raw id.
- `db_lookup_multi`
  - selected stored values array;
  - saves `string[]`;
  - hydrates all selected labels through dictionary `ids`;
  - supports add/remove selections through the same remote Combobox behavior.
- `db_lookup_value`
  - single selected text value;
  - FE saves only the selected text value;
  - no relation-key semantics and no lookup-derived output columns.
- Presets:
  - `contact_lookup`, `company_lookup`, and `project_lookup` use named dictionaries (`contacts`, `companies`, `projects`) in runtime form rendering.
  - These preset shortcuts must not be sent as generic `sourceModel` POST requests because the backend generic dictionary route expects a Form Builder model id, while named shortcuts are dictionary keys/aliases.
  - Ordinary `db_lookup` fields still use generic lookup metadata when `lookupConfig.sourceModel` is present.

### Option Loading

- Load first page with `pageSize = 10`.
- Do not load lookup options when the form first renders. Start loading only when the user activates the dropdown by click or keyboard.
- Debounce search by `300 ms`.
- Use backend search, not client-side full-table loading.
- Load more when the dropdown scroll reaches the bottom.
- Existing edit forms should receive current selected options in the form payload so selected labels render immediately without frontend lookup calls.
- Hydrate selected values with `ids` lazily after the field is activated only when the runtime form response did not already supply labels/options.
- Render two-line options: `label` plus optional `description`.
- Cache loaded/hydrated options per form session enough to avoid duplicate hydration calls for the same field/value set.

### Label Handling

- Preserve the existing single `contact_lookup` form-read hydration behavior as backward-compatible fallback.
- For generic lookup display, the runtime form read should add selected labels through the server-side dictionary contract when possible, while FE lazy hydration remains available after activation.
- For `db_lookup_multi` generated grid aggregates, `value_label` in the multivalue table needs a reliable label source.
- First implementation decision:
  - prefer backend-side label resolution from the same dictionary/generic lookup contract when feasible without coupling `platformstudioformruntime` back to Form Builder authoring internals;
  - if backend-side resolution would overgrow the slice, extend mutation payload with a display-only lookup label map and store it as `value_label`, while still treating selected values as authoritative.
- Display labels are not access-control data. Do not use client-sent labels for authorization, filtering, or lookup identity.

## Backend Work

- Extend `runtimeFieldPlan` with lookup metadata needed by runtime:
  - `SelectionMode`;
  - `DisplayFields`;
  - `LookupConfig` essentials: `sourceModel`, `displayFields`, `searchFields`, `sortField`, `storedValueField`, `filters`, `displayMode`, `storedTextFields`.
- Enable `db_lookup` with `selectionMode = multiple` in `platformstudioformruntime` as a supported multivalue field for managed runtime scopes.
- Store lookup multi values in the generated multivalue table using lookup-specific semantics:
  - `value_kind = "lookup"`;
  - `value_key = selected stored value`;
  - `value_label = hydrated/resolved label when available`;
  - `lookup_target_id` only when the stored value is a numeric target id and that mapping is valid.
- Load `db_lookup_multi` values as `string[]`.
- Make `db_lookup_value` normalize and persist text, not integer.
- Keep `Finish` and workflow status behavior unchanged.
- Keep lookup access/action behavior out of `platformstudioformbuilder`.

## Frontend Package Work

- Keep `@platform/forms` app-agnostic. It must not import `tenant-web` or `@platform/api-client`.
- Extend runtime form schema/types with lookup metadata and an async lookup loading callback contract.
- Add lookup-aware field renderer behavior:
  - `search_select` single;
  - `search_select` multi;
  - `catalog_modal` staged trigger/fallback.
- Reuse UI Kit `Combobox` with:
  - `filterMode = "none"`;
  - controlled `searchValue`;
  - `loading`, `loadingMore`, `hasMoreOptions`, `onLoadMore`;
  - `description` for the second option line.
- Preserve existing validation, required-field reveal, active tab reveal, create-after-required, autosave-on-blur, and subform behavior.

## Tenant Web Adapter Work

- Instantiate `createTenantDictionaryClient(runtimeConfig.tenantApiUrl)` in the runtime form page or a narrow lookup adapter module.
- Build dictionary requests from runtime field metadata:
  - generic request from `lookupConfig.sourceModel`;
  - named fallback for supported preset dictionaries only when generic config is unavailable.
- Pass static `lookupConfig.filters[]` through to generic POST.
- Do not implement dynamic token/form-value filters in the first runtime lookup slice unless current schema shape proves they are already canonical in `lookupConfig.filters[]`.
- Normalize selected values as strings before passing them to the renderer and dictionary hydration.
- For `db_lookup_value`, save selected text value according to the field contract.
- If using display-only mutation labels, add the smallest compatible request extension and keep existing `values` shape stable.

## Staged Work

- Full `catalog_modal` display mode:
  - modal;
  - columns;
  - search;
  - pagination;
  - grouping via `groupByField`;
  - item labels via `itemLabelFields`;
  - keyboard and mobile behavior.
- Dynamic lookup filters:
  - current user tokens;
  - current form field dependencies;
  - parent/subform context values;
  - invalidation when dependency fields change.
- Backend-authoritative lookup label resolution if the first slice uses client display hints.
- Dictionary-specific access rules.
- Lookup-aware View filters and derived-output filter UX.

## Acceptance

- Single generic `db_lookup` opens with selected label hydrated and can search/select/save a new value.
- Preset single lookup fields still display selected labels and remain editable unless view/schema marks them readonly.
- `db_lookup_multi` opens with selected labels hydrated, can add/remove values, and saves/reloads as an array.
- `db_lookup_value` saves text and reloads that text.
- `catalog_modal` fields do not silently render as the wrong control; they show the staged trigger/fallback.
- Backend is not spammed while typing; search is debounced and load-more is explicit on dropdown scroll.
- No lookup implementation imports app-specific APIs into `@platform/forms`.
- Existing short text, choice, ready-made, unique-value, root/subform create/edit/autosave/finish flows continue to pass targeted tests.

## Verification Plan

- Backend:
  - `go test ./modules/tenant/dictionary`;
  - `go test ./modules/tenant/platformstudioformruntime`;
  - `go test ./cmd/api-tenant/internal/server`;
  - targeted create/edit/load tests for `db_lookup`, `db_lookup_value`, and `db_lookup_multi`.
- Frontend:
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`;
  - `pnpm -C platform/frontend --filter @platform/forms lint`;
  - `pnpm -C platform/frontend --filter @platform/forms test`;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`;
  - `pnpm -C platform/frontend --filter @platform/tenant-web lint`;
  - `pnpm -C platform/frontend --filter @platform/tenant-web test`.
- Repository:
  - `git diff --check`;
  - `scripts/preflight.sh`.
- Browser Use evidence:
  - root form edit with single lookup;
  - root form new with required lookup when applicable;
  - subform edit/new with lookup field if test schema has one;
  - desktop `1440x900`;
  - mobile `390x844`.

## Stop Conditions

- Stop before product code writes if lookup filter schema shape requires an owner decision.
- Stop before broad `platformstudioformbuilder` edits unless the issue is proven to be authoring-schema corruption rather than runtime rendering.
- Stop before adding new storage tables or migrations.
- Stop if dictionary access rules are required for correctness rather than only future hardening.
