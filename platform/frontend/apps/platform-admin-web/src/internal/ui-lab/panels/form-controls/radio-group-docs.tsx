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
  RadioGroup,
  RadioGroupItem,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";

export function renderRadioGroupDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Orientation and sizes</CardTitle>
          <CardDescription>Radio group should stay compact, explicit, and clearly separate from checkbox or select.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Vertical" stacked>
            <RadioGroup>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem defaultChecked name="ui-lab-radio-density" value="balanced" />
                <span className="ui-lab-page__radio-copy">
                  <span className="ui-lab-page__radio-label">Balanced rollout</span>
                  <span className="ui-lab-page__radio-description">Default operational path for seeded tenant onboarding.</span>
                </span>
              </label>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem name="ui-lab-radio-density" value="strict" />
                <span className="ui-lab-page__radio-copy">
                  <span className="ui-lab-page__radio-label">Strict review</span>
                  <span className="ui-lab-page__radio-description">Requires explicit approval before plan or access changes are applied.</span>
                </span>
              </label>
            </RadioGroup>
          </ShowcaseRow>

          <ShowcaseRow label="Horizontal" stacked>
            <RadioGroup orientation="horizontal">
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem defaultChecked name="ui-lab-radio-size" size="sm" value="sm" />
                <span className="ui-lab-page__radio-label">Small</span>
              </label>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem name="ui-lab-radio-size" value="md" />
                <span className="ui-lab-page__radio-label">Medium</span>
              </label>
              <label className="ui-lab-page__radio-option">
                <RadioGroupItem name="ui-lab-radio-size" size="lg" value="lg" />
                <span className="ui-lab-page__radio-label">Large</span>
              </label>
            </RadioGroup>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Radio group should fit the same field shell and validation model used by the rest of the form layer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Required" stacked>
            <Field required>
              <FieldLabel>Provisioning mode</FieldLabel>
              <RadioGroup>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem defaultChecked name="ui-lab-radio-provisioning" value="self-serve" />
                  <span className="ui-lab-page__radio-copy">
                    <span className="ui-lab-page__radio-label">Self-serve</span>
                    <span className="ui-lab-page__radio-description">Tenant teams can trigger provisioning without platform review.</span>
                  </span>
                </label>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem name="ui-lab-radio-provisioning" value="managed" />
                  <span className="ui-lab-page__radio-copy">
                    <span className="ui-lab-page__radio-label">Managed rollout</span>
                    <span className="ui-lab-page__radio-description">Platform operations owns rollout sequencing and recovery.</span>
                  </span>
                </label>
              </RadioGroup>
              <FieldHint>Use radio when the user should compare a small set of explicit options directly.</FieldHint>
            </Field>
          </ShowcaseRow>

          <ShowcaseRow label="Invalid" stacked>
            <Field invalid>
              <FieldLabel>Escalation policy</FieldLabel>
              <RadioGroup>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem invalid name="ui-lab-radio-escalation" value="email" />
                  <span className="ui-lab-page__radio-label">Email only</span>
                </label>
                <label className="ui-lab-page__radio-option">
                  <RadioGroupItem invalid name="ui-lab-radio-escalation" value="pager" />
                  <span className="ui-lab-page__radio-label">Pager and email</span>
                </label>
              </RadioGroup>
              <FieldError>Select one escalation path before saving the workflow.</FieldError>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable single-choice reference for the shared radio-group contract.", [
        { name: "orientation", type: "\"vertical\" | \"horizontal\"", notes: "Controls layout density without changing the underlying selection contract." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts the radio control itself while leaving labels and descriptions compositional." },
        { name: "invalid", type: "boolean", notes: "Applies a visible invalid treatment when validation needs to surface on the control." },
        { name: "name / value / checked", type: "native radio props", notes: "Use native radio semantics so only one option stays selected in the same group." },
      ])}

      {renderReferenceNotesCard(
        "Radio group should stay the lightest single-choice primitive between select and checkbox.",
        [
          "The contract is a group wrapper plus individual radio items, with option labels and descriptions composed outside the input itself.",
          "Options may stay simple inline labels or grow into label-description rows without changing the primitive.",
          "Hint and error content belong to the surrounding field shell, not bespoke radio variants.",
        ],
        [
          "`orientation` belongs to the group; `size` and `invalid` belong to the radio item.",
          "Use native radio props such as `name`, `value`, `checked`, and `defaultChecked` for selection state.",
          "Keep richer comparison layouts outside `ui-kit` until a reusable option-card contract is approved.",
        ],
        [
          "Every radio in one choice set needs the same `name` so keyboard and screen-reader behavior stays correct.",
          "Wrap each radio in a label or connect it through `htmlFor` so the hit-area stays usable.",
          "Reserve radio for short, explicit option sets that benefit from direct comparison.",
        ],
      )}

      {renderUsageReviewCard(
        "Radio group works best for small explicit choices that should stay visible during comparison.",
        [
          "The user needs to pick exactly one option from a short list and benefits from seeing the options directly.",
          "Each option may need a short supporting description without hiding the alternatives.",
        ],
        [
          "Use radio when the choices are stable and should remain visible on the page.",
          "Keep copy concise and make one default option explicit when the product genuinely has a recommended path.",
          "Pair radio groups with field-level hint or error copy instead of embedding validation into each option row.",
        ],
        [
          "Do not replace large searchable option sets that belong in select or command-style surfaces.",
          "Do not turn each option into a bespoke card until a stable reusable card-choice contract exists.",
          "Do not mix many independent radio names in one compact row where keyboard focus becomes unclear.",
        ],
      )}
    </div>
  );
}
