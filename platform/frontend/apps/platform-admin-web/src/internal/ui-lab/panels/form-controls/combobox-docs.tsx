import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  FormGrid,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";
import {
  ComboboxAsyncPreview,
  ComboboxCompanyPreview,
  ComboboxLargeCompanyPreview,
  ComboboxMultiCompanyPreview,
  ComboboxMultiLargeDirectoryPreview,
  ComboboxSimplePreview,
  comboboxAssessmentTypeOptions,
  comboboxCompanyOptions,
  comboboxLargeCompanyDirectory,
} from "./interactive-previews";

export function renderComboboxDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Template variants</CardTitle>
          <CardDescription>Combobox should support plain values, stacked lookup rows, and canonical multi-selection without inventing separate components.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Simple values" stacked>
            <ComboboxSimplePreview />
          </ShowcaseRow>
          <ShowcaseRow label="Company list" stacked>
            <ComboboxCompanyPreview />
          </ShowcaseRow>
          <ShowcaseRow label="Company multi-select" stacked>
            <ComboboxMultiCompanyPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Large local directory</CardTitle>
          <CardDescription>Large local lists should not dump 1000 rows into view immediately when a smaller progressive slice is enough.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="1000 companies" stacked>
            <ComboboxLargeCompanyPreview />
          </ShowcaseRow>
          <ShowcaseRow label="1000 companies multi-select" stacked>
            <ComboboxMultiLargeDirectoryPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caller-owned async search</CardTitle>
          <CardDescription>Remote search should pass the query string out to app code instead of hiding fetch logic inside the shared primitive.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Ajax search" stacked>
            <ComboboxAsyncPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Combobox should read like the same form family as input and select, even while single and multiple search flows stay richer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-default">Default</FieldLabel>
                <Combobox
                  defaultValue="satisfactory"
                  id="ui-lab-combobox-default"
                  label="Type"
                  options={comboboxAssessmentTypeOptions}
                  placeholder="Select type"
                  triggerAriaLabel="Type"
                />
                <FieldHint>Simple enum rows should work with label-only options and no extra chrome.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-combobox-invalid">Invalid</FieldLabel>
                <Combobox
                  defaultValue={null}
                  id="ui-lab-combobox-invalid"
                  invalid
                  label="Company"
                  options={comboboxCompanyOptions}
                  placeholder="Choose company"
                  triggerAriaLabel="Company"
                />
                <FieldError>Select one company before saving this review.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-disabled">Disabled</FieldLabel>
                <Combobox
                  disabled
                  defaultValue="northstar-freight"
                  id="ui-lab-combobox-disabled"
                  label="Company"
                  options={comboboxCompanyOptions}
                  triggerAriaLabel="Locked company"
                />
                <FieldHint>Disabled state should stay aligned with the rest of the form family.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-compact">Large local list</FieldLabel>
                <Combobox
                  defaultValue="company-0004"
                  id="ui-lab-combobox-compact"
                  initialVisibleCount={10}
                  label="Company directory"
                  loadMoreStep={10}
                  options={comboboxLargeCompanyDirectory}
                  size="sm"
                  triggerAriaLabel="Company directory"
                />
                <FieldHint>Search still works across company name and company type while the list reveals rows progressively on scroll.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-combobox-multi-default">Multi-select</FieldLabel>
                <Combobox
                  defaultValue={["northstar-freight", "helio-systems"]}
                  id="ui-lab-combobox-multi-default"
                  label="Companies"
                  options={comboboxCompanyOptions}
                  placeholder="Choose companies"
                  selectionMode="multiple"
                  triggerAriaLabel="Companies"
                />
                <FieldHint>Use multi-select for canonical lookup lists when tags would hide the real source of truth.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-combobox-multi-invalid">Multi-select invalid</FieldLabel>
                <Combobox
                  defaultValue={[]}
                  id="ui-lab-combobox-multi-invalid"
                  invalid
                  label="Project reviewers"
                  options={comboboxCompanyOptions}
                  placeholder="Choose reviewers"
                  selectionMode="multiple"
                  triggerAriaLabel="Project reviewers"
                />
                <FieldError>Select at least one reviewer before continuing.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderUsageReviewCard(
        "Combobox is the review-stage answer for searchable option lists that outgrow native select without requiring a full data-grid runtime.",
        [
          "Use combobox when the option set benefits from inline search or richer option copy such as company name plus company type.",
          "Use `selectionMode=\"multiple\"` when the user must choose several canonical records from the same searchable lookup surface.",
          "Use `filterMode=\"none\"` when app code owns remote search and only passes current results into the list.",
          "Use the stable native `Select` when the option set is short, fixed, and does not need search.",
        ],
        [
          "Keep fetch, debounce, and query caching in app code; the shared helper should only render search state and options.",
          "Use label-only rows for plain enums and label-plus-description rows for richer company-style templates.",
          "Keep multi-select canonical: selected values should remain option-backed, not free-form strings.",
          "Reuse the same field shell, labels, and validation language as other form controls.",
          "Use `initialVisibleCount` and `loadMoreStep` when large local datasets should open with a smaller visible slice.",
        ],
        [
          "Do not fold arbitrary free-form creation into the combobox contract.",
          "Do not hide route-specific fetch rules or domain wording inside the shared helper.",
          "Do not replace every stable native select with combobox by default.",
        ],
      )}

      {renderPropsApiCard("Review-stage searchable select contract for local data and caller-owned async search.", [
        { name: "options", type: "Array<{ value, label, description?, meta?, disabled?, searchText? }>", notes: "Provides the rendered option list while keeping filtering and fetch ownership outside the primitive when needed." },
        { name: "selectionMode", type: "\"single\" | \"multiple\"", notes: "Keeps the same searchable combobox shell while letting callers choose one or many canonical options." },
        { name: "value / onValueChange", type: "string | null or string[]", notes: "Keeps selected value caller-owned for both single-select and multi-select flows." },
        { name: "searchValue / onSearchValueChange", type: "string", notes: "Lets app code own the search string for remote or debounced queries instead of hardwiring Ajax into `ui-kit`." },
        { name: "filterMode", type: "\"local\" | \"none\"", notes: "Uses lightweight built-in local filtering by default or skips it when the option list already comes from caller-owned async search." },
        { name: "initialVisibleCount / loadMoreStep", type: "number", notes: "Lets large local lists start with a bounded visible slice and reveal more options as the user scrolls." },
        { name: "loading / emptyLabel", type: "boolean / ReactNode", notes: "Exposes async and empty states without inventing a second overlay contract." },
        { name: "size / invalid / disabled", type: "\"sm\" | \"md\" | \"lg\" / boolean / boolean", notes: "Aligns the control with the same density and validation language used by input and select." },
      ])}

      {renderReferenceNotesCard(
        "Combobox is intentionally separate from the stable native `Select` contract because searchable lists and remote queries carry a different interaction model.",
        [
          "The core structure is trigger button, popover surface, search field, and bounded option list.",
          "Options may render as label-only rows or as stacked rows with description, while staying list-shaped and lightweight.",
          "Large local lists may open with a smaller visible slice and reveal more rows on scroll without changing the selection model.",
          "Multi-select stays in the same combobox family when the source remains canonical and searchable; tags and free-form entry still live in companion patterns.",
        ],
        [
          "`selectionMode`, `options`, `value`, and `onValueChange` form the base selection contract.",
          "`searchValue`, `onSearchValueChange`, `loading`, and `filterMode` are the review-stage hooks for remote search without embedding fetch logic.",
          "Use `searchText` when the visible template is custom JSX or when search must include extra words beyond the visible label and description.",
          "Use `placeholder`, `emptyLabel`, `size`, `invalid`, and `disabled` to align the control with field-shell needs.",
        ],
        [
          "Always provide a visible field label or an explicit trigger aria label so the picker has a stable name.",
          "Search input and list content should stay keyboard reachable without trapping users in the popover.",
          "Do not rely on placeholder text alone to explain what the option list means.",
        ],
      )}
    </div>
  );
}
