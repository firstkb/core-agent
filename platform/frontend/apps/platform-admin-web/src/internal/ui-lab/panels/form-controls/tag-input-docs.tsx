import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  FormGrid,
  TagInput,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";
import {
  HybridTagInputPreview,
  PresetTagInputPreview,
  TagInputPreview,
  predefinedTagOptions,
} from "./interactive-previews";

export function renderTagInputDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Entry variants</CardTitle>
          <CardDescription>Tag input should cover free-form entry, strict dictionary selection, and a hybrid choose-or-create mode without changing the basic string-array contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Free-form" stacked>
            <TagInputPreview />
          </ShowcaseRow>
          <ShowcaseRow label="Preset-only" stacked>
            <PresetTagInputPreview />
          </ShowcaseRow>
          <ShowcaseRow label="Hybrid" stacked>
            <HybridTagInputPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Density and validation</CardTitle>
          <CardDescription>Tag entry should align with the same spacing and validation rules as input, not create a parallel form language.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-default">Default</FieldLabel>
                <TagInput
                  defaultValue={["regional", "needs-review"]}
                  id="ui-lab-tag-input-default"
                  inputAriaLabel="Default tag input"
                  mode="freeform"
                  placeholder="Add tags"
                />
                <FieldHint>Press Enter or comma to commit a tag inside the same control surface.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-tag-input-invalid">Invalid</FieldLabel>
                <TagInput
                  defaultValue={["draft"]}
                  id="ui-lab-tag-input-invalid"
                  inputAriaLabel="Invalid tag input"
                  invalid
                  mode="freeform"
                  placeholder="Add labels"
                />
                <FieldError>Remove unapproved labels before publishing.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-preset">Preset-only</FieldLabel>
                <TagInput
                  defaultValue={["Enterprise", "Needs review"]}
                  id="ui-lab-tag-input-preset"
                  inputAriaLabel="Preset-only tag input"
                  mode="preset"
                  placeholder="Choose preset labels"
                  suggestions={predefinedTagOptions}
                />
                <FieldHint>Users can search the predefined tags, but cannot create values outside that list.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-hybrid">Hybrid</FieldLabel>
                <TagInput
                  defaultValue={["Enterprise", "Late payer"]}
                  id="ui-lab-tag-input-hybrid"
                  inputAriaLabel="Hybrid tag input"
                  mode="hybrid"
                  placeholder="Choose or create labels"
                  suggestions={predefinedTagOptions}
                />
                <FieldHint>Suggestions stay searchable, but callers may still accept additional custom tags.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-disabled">Disabled</FieldLabel>
                <TagInput
                  defaultValue={["enterprise", "signed-contract"]}
                  disabled
                  id="ui-lab-tag-input-disabled"
                  inputAriaLabel="Disabled tag input"
                  mode="freeform"
                />
                <FieldHint>Disabled tags should remain visible but not editable.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-tag-input-compact">Compact</FieldLabel>
                <TagInput
                  defaultValue={["trial", "watchlist"]}
                  id="ui-lab-tag-input-compact"
                  inputAriaLabel="Compact tag input"
                  mode="hybrid"
                  placeholder="Add compact tags"
                  size="sm"
                  suggestions={predefinedTagOptions}
                />
                <FieldHint>Compact tagging should still fit dense filter or metadata rails.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderUsageReviewCard(
        "Tag input is a review-stage free-form label helper, not a replacement for canonical enums or searchable single-select choice.",
        [
          "Use tag input for lightweight labels, ad-hoc metadata, or draft categorization that callers own as string arrays.",
          "Use `mode=\"preset\"` when users may pick multiple labels, but only from an approved tag dictionary.",
          "Use `mode=\"hybrid\"` when suggestions should guide selection but callers may still accept custom labels.",
          "Use combobox or stable select when the user must choose from a canonical option list.",
          "Use tag input when inline removable pills communicate the resulting state more clearly than a plain textarea or comma-separated text field.",
        ],
        [
          "Keep tags short and human-readable so the inline pill surface stays legible.",
          "Let the caller own persistence, normalization, and any domain-level validation rules.",
          "Prefer `mode` to make intent explicit; `allowCustomValues` remains only as backward-compatible fallback wiring.",
          "Keep the shared contract string-array based until a stronger multi-surface need proves richer token objects.",
        ],
        [
          "Do not turn tag input into a hidden taxonomy browser or route-specific filter runtime.",
          "Do not overload it with remote search, grouped results, or large controlled menus.",
          "Do not use tags where a stable enum should stay explicit through select, checkbox, or combobox.",
        ],
      )}

      {renderPropsApiCard("Review-stage free-form tag entry contract for compact metadata lists.", [
        { name: "value / onValueChange", type: "string[]", notes: "Keeps the committed tag array caller-owned rather than hiding persistence inside the control." },
        { name: "mode", type: "\"freeform\" | \"preset\" | \"hybrid\"", notes: "Makes tag behavior explicit: create only, choose only, or choose from suggestions while still allowing new values." },
        { name: "placeholder", type: "string", notes: "Guides free-form entry without adding a second visible label layer." },
        { name: "separators", type: "string[]", notes: "Controls which keyboard separators commit a tag; comma remains the default donor pattern." },
        { name: "suggestions / allowCustomValues", type: "string[] / boolean", notes: "Adds local suggestion picking; `allowCustomValues` stays as legacy compatibility when `mode` is omitted." },
        { name: "addOnBlur / allowDuplicates / maxTags", type: "boolean / boolean / number", notes: "Keeps commit and validation rules explicit while the component is still under review." },
        { name: "size / invalid / disabled", type: "\"sm\" | \"md\" | \"lg\" / boolean / boolean", notes: "Aligns the control with the same shared form density and validation language." },
      ])}

      {renderReferenceNotesCard(
        "Tag input stays intentionally narrow so it can validate as a reusable metadata-entry surface before any richer taxonomy workflows are considered.",
        [
          "The shared structure is one bordered input shell with inline committed tags and a single text cursor.",
          "Committed tags stay string-based and removable inside the same control surface.",
          "Suggestion lists may support strict dictionary selection or hybrid choose-or-create flows while the contract still remains string-array based and lightweight.",
        ],
        [
          "`value`, `onValueChange`, `placeholder`, and `separators` define the main review API.",
          "`mode` and `suggestions` define whether the control is free-form, preset-only, or hybrid without promoting a heavier tokenized multi-select runtime.",
          "`addOnBlur`, `allowDuplicates`, and `maxTags` tune commit rules without turning the helper into workflow logic.",
          "Use `invalid` and `disabled` the same way as other form controls rather than creating new status props.",
        ],
        [
          "The inner text input still needs a visible field label or explicit input aria label.",
          "Remove buttons should expose the tag name so assistive tech understands what will be deleted.",
          "Do not rely only on color or chip styling to explain whether a tag is editable.",
        ],
      )}
    </div>
  );
}
