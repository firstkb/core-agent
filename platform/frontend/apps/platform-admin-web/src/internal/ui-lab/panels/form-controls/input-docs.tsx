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
  Input,
  InputAddon,
  InputGroup,
} from "@platform/ui-kit";

import { inputSizes } from "../../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard } from "../../components/docs-cards";

export function renderInputDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>Input sizing should stay compact enough for dense admin forms without hurting readability.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {inputSizes.map((size) => (
            <ShowcaseRow key={size} label={size.toUpperCase()}>
              <Input
                aria-label={`Input ${size}`}
                id={`ui-lab-input-size-${size}`}
                name={`ui-lab-input-size-${size}`}
                placeholder={`Input ${size}`}
                size={size}
              />
            </ShowcaseRow>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Input should stay predictable when wrapped in field-level label, hint, error, and disabled semantics.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-matrix-default">Default</FieldLabel>
                <Input defaultValue="demo.platform.localhost" id="ui-lab-input-matrix-default" />
                <FieldHint>Neutral field with helper text.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-input-matrix-invalid">Invalid</FieldLabel>
                <Input defaultValue="demo platform" id="ui-lab-input-matrix-invalid" invalid />
                <FieldError>Use a valid host or slug format.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-matrix-readonly">Read only</FieldLabel>
                <Input defaultValue="platform-admin-web" id="ui-lab-input-matrix-readonly" readOnly />
                <FieldHint>Read-only keeps the same field structure.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-matrix-disabled">Disabled</FieldLabel>
                <Input defaultValue="Unavailable in this environment" disabled id="ui-lab-input-matrix-disabled" />
                <FieldHint>Disabled should still preserve spacing and hierarchy.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-input-matrix-required">Required</FieldLabel>
                <Input defaultValue="aurora.platform.localhost" id="ui-lab-input-matrix-required" required />
                <FieldHint>Required fields get the shared left accent without changing the rest of the input contract.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grouped entry</CardTitle>
          <CardDescription>Grouped patterns stay local to the text entry contract and do not imply a full product layout.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Hostname" stacked>
            <InputGroup>
              <InputAddon>https://</InputAddon>
              <Input
                aria-label="Hostname"
                defaultValue="demo.platform.localhost"
                id="ui-lab-input-group-hostname"
                name="ui-lab-input-group-hostname"
              />
            </InputGroup>
          </ShowcaseRow>
          <ShowcaseRow label="Tenant slug" stacked>
            <InputGroup>
              <Input
                aria-label="Tenant slug"
                defaultValue="aurora"
                id="ui-lab-input-group-slug"
                name="ui-lab-input-group-slug"
              />
              <InputAddon>.platform.localhost</InputAddon>
            </InputGroup>
          </ShowcaseRow>
          <ShowcaseRow label="Field usage" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-input-doc-email">Owner email</FieldLabel>
              <Input defaultValue="owner@platform.local" id="ui-lab-input-doc-email" />
              <FieldHint>Input remains the base contract even when placed in a field shell.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field shell examples</CardTitle>
          <CardDescription>Input should read consistently inside real field wrappers, not only as a bare control preview.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Identity" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-input-field-name">Tenant display name</FieldLabel>
                <Input defaultValue="Aurora Commerce" id="ui-lab-input-field-name" />
                <FieldHint>Preferred public label shown in shared admin surfaces.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-input-field-host">Primary host</FieldLabel>
                <Input defaultValue="aurora platform local" id="ui-lab-input-field-host" invalid />
                <FieldError>Use a valid host format such as `aurora.platform.localhost`.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
          <ShowcaseRow label="Responsive inline" stacked>
            <Field layout="responsive-inline">
              <FieldLabel htmlFor="ui-lab-input-field-inline-owner">Owner email</FieldLabel>
              <Input defaultValue="owner@aurora.platform.localhost" id="ui-lab-input-field-inline-owner" />
              <FieldHint>Desktop keeps the label in a left column; mobile returns the same field to the default stacked reading flow.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Wrapped label" stacked>
            <Field layout="responsive-inline">
              <FieldLabel htmlFor="ui-lab-input-field-inline-rollout">
                Primary rollout owner email for review notifications
              </FieldLabel>
              <Input defaultValue="review@aurora.platform.localhost" id="ui-lab-input-field-inline-rollout" />
              <FieldHint>Longer labels should still align cleanly against the control on desktop and wrap naturally back above it on mobile.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable text-entry reference for the shared input contract before any app-owned wrappers are introduced.", [
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Controls control density while keeping the same visual grammar and field contract." },
        { name: "invalid", type: "boolean", notes: "Applies the shared invalid surface treatment when validation should be visible on the control itself." },
        { name: "readOnly", type: "boolean", notes: "Uses native read-only behavior while preserving the same field layout and hierarchy." },
        { name: "disabled", type: "boolean", notes: "Disables interaction while keeping spacing and form rhythm stable." },
        { name: "native input props", type: "InputHTMLAttributes<HTMLInputElement>", notes: "Use standard props for value, name, autocomplete, placeholder, and input semantics." },
      ])}

      {renderReferenceNotesCard(
        "Input should document the base text-entry contract separately from field wrappers and grouped add-ons.",
        [
          "The base control is a single text-entry surface that can live alone or inside `Field` and `InputGroup` wrappers.",
          "Add-ons stay outside the input itself so prefixes and suffixes remain compositional rather than hard-coded.",
          "Shared field wrappers may place the label above by default or move it into a left desktop column through the responsive-inline field layout.",
          "Longer labels should still read cleanly when they wrap in the left column instead of forcing a separate field variant.",
          "Hint and error content belong to the surrounding field shell, not to bespoke input variants.",
        ],
        [
          "`size`, `invalid`, `readOnly`, and `disabled` cover the stable visual contract.",
          "Required field emphasis comes from the shared `Field` wrapper so the same accent can be reused across input, select, and textarea.",
          "Use native input props for value, defaultValue, placeholder, name, and autocomplete behavior.",
          "Grouped host or slug entry should be composed with `InputGroup` and `InputAddon`, not with screen-specific input variants.",
        ],
        [
          "Every input still needs a visible label or an equivalent accessible name outside placeholder text.",
          "Validation messaging should be connected through the field layer so error text is not color-only.",
          "Read-only and disabled states must remain visually distinct without breaking reading order.",
        ],
      )}
    </div>
  );
}
