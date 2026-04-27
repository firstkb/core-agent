import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldHint,
  FieldLabel,
  Slider,
  Switch,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";
import { SliderValueRow } from "./interactive-previews";

export function renderCheckboxDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>Checkbox stays compact, explicit, and useful for forms and bulk selection patterns.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <label className="ui-lab-page__inline-control">
              <Checkbox name="ui-lab-checkbox-unchecked" />
              <span>Unchecked</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Checkbox defaultChecked name="ui-lab-checkbox-checked" />
              <span>Checked</span>
            </label>
          </ShowcaseRow>
          <ShowcaseRow label="Advanced">
            <label className="ui-lab-page__inline-control">
              <Checkbox indeterminate name="ui-lab-checkbox-indeterminate" />
              <span>Indeterminate</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Checkbox defaultChecked disabled name="ui-lab-checkbox-disabled" />
              <span>Disabled</span>
            </label>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Checkbox often needs context copy next to it, not around it.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Consent" stacked>
            <Field>
              <label className="ui-lab-page__inline-control">
                <Checkbox defaultChecked name="ui-lab-checkbox-consent" />
                <span>Notify tenant owners about configuration changes</span>
              </label>
              <FieldHint>Useful where the control and its explanation must stay together.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Checkbox should stay explicit, compact, and closely coupled to its adjacent descriptive text.",
        [
          "The primitive is a checkbox control paired with nearby supporting text, often wrapped by a label.",
          "Indeterminate remains a first-class state for table and tree selection patterns.",
          "Field-level helper text can surround a checkbox group without changing the checkbox contract itself.",
        ],
        [
          "`defaultChecked`, `checked`, `indeterminate`, and `disabled` are the key stable state controls.",
          "Wrap checkbox with a text label when the hit target and explanation need to move together.",
          "Keep product-specific grouping logic outside the checkbox primitive itself.",
        ],
        [
          "Every checkbox needs a visible text label or an equivalent accessible naming relationship.",
          "Indeterminate state should still have clear surrounding copy so its meaning is not purely visual.",
          "Use checkbox for binary participation in a set, not for immediate on/off system settings better served by switch.",
        ],
      )}
    </div>
  );
}

export function renderSwitchDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>Switch scale should stay balanced with form density and supporting copy.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Pill">
            <Switch aria-label="Small pill switch preview" defaultChecked name="ui-lab-switch-pill-sm" size="sm" />
            <Switch aria-label="Medium pill switch preview" defaultChecked name="ui-lab-switch-pill-md" size="md" />
            <Switch aria-label="Large pill switch preview" defaultChecked name="ui-lab-switch-pill-lg" size="lg" />
          </ShowcaseRow>
          <ShowcaseRow label="Square">
            <Switch
              aria-label="Small square switch preview"
              defaultChecked
              name="ui-lab-switch-square-sm"
              shape="square"
              size="sm"
            />
            <Switch
              aria-label="Medium square switch preview"
              defaultChecked
              name="ui-lab-switch-square-md"
              shape="square"
              size="md"
            />
            <Switch
              aria-label="Large square switch preview"
              defaultChecked
              name="ui-lab-switch-square-lg"
              shape="square"
              size="lg"
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>Boolean controls need both affordance clarity and disabled-state restraint.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <label className="ui-lab-page__inline-control">
              <Switch name="ui-lab-switch-default-off" />
              <span>Off</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Switch defaultChecked name="ui-lab-switch-default-on" />
              <span>On</span>
            </label>
          </ShowcaseRow>
          <ShowcaseRow label="Disabled">
            <label className="ui-lab-page__inline-control">
              <Switch disabled name="ui-lab-switch-disabled-off" />
              <span>Unavailable</span>
            </label>
            <label className="ui-lab-page__inline-control">
              <Switch defaultChecked disabled name="ui-lab-switch-disabled-on" />
              <span>Locked on</span>
            </label>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Switch documents the shared on/off control for immediate boolean settings where the state should read as enabled or disabled.",
        [
          "The stable anatomy is track, thumb, and adjacent descriptive label outside the control.",
          "Shape and size change density without changing the boolean meaning of the primitive.",
          "Switch stays small and composable rather than carrying field copy or workflow logic internally.",
        ],
        [
          "`size`, `shape`, `defaultChecked`, `checked`, and `disabled` define the current stable surface.",
          "Use external label text to explain the setting rather than putting prose inside the control.",
          "Keep domain-specific automation or side-effect logic outside the switch primitive.",
        ],
        [
          "Use switch where the user expects an immediate on/off setting, not checklist-style selection.",
          "Pair the control with visible text so the current state is understandable without color or motion alone.",
          "Disabled switches still need surrounding context that explains why the setting is unavailable.",
        ],
      )}
    </div>
  );
}

export function renderSliderDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Range states</CardTitle>
          <CardDescription>Slider should stay a calm single-value range control for measured adjustments, not a full chart or range-builder.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <div className="ui-lab-page__slider-stack">
              <SliderValueRow
                ariaLabel="Rollout threshold"
                defaultValue={35}
                label="Rollout threshold"
                name="ui-lab-slider-rollout-threshold"
              />
              <SliderValueRow
                ariaLabel="Signal sensitivity"
                defaultValue={60}
                label="Signal sensitivity"
                name="ui-lab-slider-signal-sensitivity"
              />
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Step and disabled" stacked>
            <div className="ui-lab-page__slider-stack">
              <SliderValueRow
                ariaLabel="Seat multiplier"
                defaultValue={4}
                label="Seat multiplier"
                max={10}
                min={0}
                name="ui-lab-slider-seat-multiplier"
                step={2}
              />
              <SliderValueRow
                ariaLabel="Locked value"
                defaultValue={70}
                disabled
                label="Locked value"
                name="ui-lab-slider-locked-value"
              />
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Slider should still compose inside shared field structure when the adjustment needs label and helper text.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Field" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-slider-retention">Retention window</FieldLabel>
              <Slider defaultValue={45} id="ui-lab-slider-retention" max={90} min={0} step={5} />
              <FieldHint>Use slider for bounded continuous values that benefit from direct adjustment.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared single-value slider API used by bounded adjustments.", [
        { name: "value / defaultValue", type: "number", notes: "Controlled or uncontrolled current value for the single-thumb slider." },
        { name: "onValueChange", type: "(value: number) => void", notes: "Emits the resolved numeric value whenever the user changes the thumb position." },
        { name: "min / max / step", type: "number", notes: "Defines the numeric range and stepping behavior for the control." },
        { name: "disabled", type: "boolean", notes: "Suppresses interaction while preserving the same slider footprint and structure." },
      ])}

      {renderReferenceNotesCard(
        "Slider should stay a calm single-value adjustment primitive until a stronger need for multi-thumb range sliders exists.",
        [
          "The stable anatomy is one linear track plus one thumb for a bounded numeric value.",
          "Supporting copy and numeric interpretation belong outside the primitive so the slider itself stays generic.",
          "The current stable contract is intentionally single-value rather than a range-builder.",
        ],
        [
          "Use slider where direct bounded adjustment is clearer than free text entry or a select list.",
          "Keep numeric context nearby so the chosen value remains understandable.",
          "Treat multi-thumb or graph-like range editing as a separate future contract if the need becomes real.",
        ],
        [
          "The slider needs an accessible label because the track alone does not expose the meaning of the value.",
          "Do not rely only on position and color to communicate what the current value means.",
          "Step values and min/max bounds should remain explicit through nearby copy when they matter to interpretation.",
        ],
      )}

      {renderUsageReviewCard(
        "Slider works best for bounded single-value adjustments where users benefit from direct manipulation instead of text entry.",
        [
          "A setting has a finite numeric range and users can benefit from dragging to an approximate or stepped value.",
          "The control should make relative increase or decrease immediately visible.",
        ],
        [
          "Use slider for bounded measured adjustments with clear nearby labels and context.",
          "Keep the track single-purpose and the surrounding copy explicit about what is being changed.",
          "Prefer small step values or a select/input when exact precision matters more than direct manipulation.",
        ],
        [
          "Do not use slider for values where precision entry is more important than range scanning.",
          "Do not overload the shared primitive with multi-thumb, chart, or dashboard semantics prematurely.",
          "Do not hide the meaning of the current value behind position alone.",
        ],
      )}
    </div>
  );
}
