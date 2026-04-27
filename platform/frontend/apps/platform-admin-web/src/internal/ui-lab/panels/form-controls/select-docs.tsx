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
  Select,
} from "@platform/ui-kit";

import { inputSizes } from "../../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard } from "../../components/docs-cards";

export function renderSelectDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>Select should stay visually aligned with input sizing across dense form layouts.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {inputSizes.map((size) => (
            <ShowcaseRow key={size} label={size.toUpperCase()}>
              <Select
                aria-label={`${size} select`}
                defaultValue="growth"
                id={`ui-lab-select-size-${size}`}
                name={`ui-lab-select-size-${size}`}
                size={size}
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </ShowcaseRow>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Select should preserve field semantics even before any advanced menu behavior is introduced.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-default">Default</FieldLabel>
                <Select defaultValue="enterprise" id="ui-lab-select-matrix-default">
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Default field with section-neutral helper text.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-select-matrix-invalid">Invalid</FieldLabel>
                <Select defaultValue="starter" id="ui-lab-select-matrix-invalid" invalid>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldError>Select a plan tier before saving.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-disabled">Disabled</FieldLabel>
                <Select defaultValue="growth" disabled id="ui-lab-select-matrix-disabled">
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Disabled keeps the same label and hint treatment.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-size">Compact</FieldLabel>
                <Select defaultValue="growth" id="ui-lab-select-matrix-size" size="sm">
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Smaller density should still read as the same contract.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-select-matrix-required">Required</FieldLabel>
                <Select defaultValue="growth" id="ui-lab-select-matrix-required" required>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Required select fields reuse the same left accent as text fields.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field usage</CardTitle>
          <CardDescription>Select remains product-safe when reviewed inside a stable field shell.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Field" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-select-doc-plan">Plan tier</FieldLabel>
              <Select defaultValue="growth" id="ui-lab-select-doc-plan">
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
              <FieldHint>Choose the reusable contract, not a screen-specific dropdown treatment.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision matrix</CardTitle>
          <CardDescription>Side-by-side field examples make validation, density, and helper copy easier to compare.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Review" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-select-matrix-region">Region</FieldLabel>
                <Select defaultValue="us-east" id="ui-lab-select-matrix-region">
                  <option value="us-east">US East</option>
                  <option value="eu-west">EU West</option>
                  <option value="ap-south">AP South</option>
                </Select>
                <FieldHint>Field-level hint should stay calm and short.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-select-matrix-owner">Owner assignment</FieldLabel>
                <Select defaultValue="" id="ui-lab-select-matrix-owner" invalid>
                  <option value="">Select owner</option>
                  <option value="ops">Operations</option>
                  <option value="success">Customer Success</option>
                </Select>
                <FieldError>Select one owner group before continuing.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable choice-entry reference for the shared select contract while advanced custom menu behavior remains out of scope.", [
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Matches the same density scale used by input so form rows stay visually aligned." },
        { name: "invalid", type: "boolean", notes: "Exposes the shared invalid treatment when the field should visibly fail validation." },
        { name: "disabled", type: "boolean", notes: "Uses native disabled select semantics while preserving the shared surface rhythm." },
        { name: "children", type: "ReactNode (<option /> ...)", notes: "Keeps option content native and lightweight in the first stable shared contract." },
        { name: "native select props", type: "SelectHTMLAttributes<HTMLSelectElement>", notes: "Use standard value, defaultValue, name, and form semantics rather than custom API layers." },
      ])}

      {renderReferenceNotesCard(
        "Select remains the shared choice primitive while advanced menu behavior stays outside the stable contract.",
        [
          "The stable structure is visible label, native select control, and optional hint or error through `Field`.",
          "Option sets stay native in the first shared contract so choice behavior is predictable and light-weight.",
          "Density and validation are reviewed at the field level, not through custom dropdown shells.",
        ],
        [
          "`size`, `invalid`, and `disabled` form the core styling API for the shared select contract.",
          "Required emphasis is inherited from the surrounding `Field` so the same signal works across all base form controls.",
          "Use native option lists and value/defaultValue semantics instead of custom item renderers in the stable layer.",
          "Keep placeholder-like behavior explicit with an empty option rather than inventing a separate prop.",
        ],
        [
          "Select still needs a visible label that explains the choice, even when the current value is obvious.",
          "Validation and helper text should be exposed through the field wrapper so the state is announced consistently.",
          "Do not rely on the first option alone to act as hidden instructional text.",
        ],
      )}
    </div>
  );
}
