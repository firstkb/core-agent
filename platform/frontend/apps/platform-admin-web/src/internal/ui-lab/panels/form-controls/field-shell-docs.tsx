import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  FormGrid,
  FormSection,
  FormSectionDescription,
  FormSectionHeader,
  FormSectionTitle,
  FormShell,
  Input,
  Select,
  Textarea,
} from "@platform/ui-kit";

import { ShowcaseRow, renderReferenceNotesCard } from "../../components/docs-cards";

export function renderFieldDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Base layouts</CardTitle>
          <CardDescription>Field should keep two stable label placements: stacked by default and responsive inline where desktop can carry the label on the left.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-field-name">Tenant name</FieldLabel>
              <Input defaultValue="Aurora Commerce" id="ui-lab-field-name" />
              <FieldHint>Used across listings, detail views, and admin forms.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Read only" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-field-slug">Slug</FieldLabel>
              <Input defaultValue="aurora-commerce" id="ui-lab-field-slug" readOnly />
              <FieldHint>Read-only fields should still preserve the same label and helper structure.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Responsive inline" stacked>
            <Field layout="responsive-inline">
              <FieldLabel htmlFor="ui-lab-field-host-inline">Primary host</FieldLabel>
              <Input defaultValue="aurora.platform.localhost" id="ui-lab-field-host-inline" />
              <FieldHint>Desktop keeps the label on the left; mobile stacks the same field back above the control.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation</CardTitle>
          <CardDescription>Hint and error states should stay explicit and not rely on product-specific surrounding copy.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Hint" stacked>
            <Field>
              <FieldLabel htmlFor="ui-lab-field-owner">Owner email</FieldLabel>
              <Input defaultValue="owner@platform.local" id="ui-lab-field-owner" />
              <FieldHint>Use helper text when the field needs setup guidance, not validation.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Error" stacked>
            <Field invalid>
              <FieldLabel htmlFor="ui-lab-field-webhook">Webhook URL</FieldLabel>
              <Input defaultValue="not-a-url" id="ui-lab-field-webhook" invalid />
              <FieldError>Enter a valid HTTPS endpoint.</FieldError>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Required accent" stacked>
            <FormGrid columns={1}>
              <Field required>
                <FieldLabel htmlFor="ui-lab-field-required-input">Tenant name</FieldLabel>
                <Input defaultValue="Aurora Commerce" id="ui-lab-field-required-input" required />
                <FieldHint>Input inherits the required accent from the field wrapper.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-field-required-select">Plan tier</FieldLabel>
                <Select defaultValue="growth" id="ui-lab-field-required-select" required>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
                <FieldHint>Select uses the same required accent without needing a separate select-specific variant.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-field-required-textarea">Internal notes</FieldLabel>
                <Textarea
                  defaultValue="Required field styling should remain shared across base form controls."
                  id="ui-lab-field-required-textarea"
                  required
                  rows={3}
                />
                <FieldHint>Textarea follows the same required signal as the rest of the base field layer.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Field is the smallest reusable wrapper for label, control, and supporting copy across the shared form layer.",
        [
          "A field groups one label, one control slot, and optional hint or error messaging.",
          "The wrapper keeps spacing and message hierarchy stable across text, select, checkbox, and textarea controls.",
          "Two base layouts are allowed: default stacked labels and responsive inline labels that move left on desktop and return above on mobile.",
          "Read-only and invalid examples are expressed by combining field semantics with the child control state.",
        ],
        [
          "Use the `invalid` field state when the wrapper needs to reflect validation along with the child control.",
          "Use `required` on the field wrapper when the whole field should expose the shared required accent across base controls.",
          "Use `layout=\"responsive-inline\"` only when the form benefits from a left label on desktop without introducing a separate screen-specific layout shell.",
          "Choose `FieldHint` or `FieldError` based on whether the message is advisory or corrective.",
          "Keep field composition generic so workflow-specific copy remains outside the shared form contract.",
        ],
        [
          "Every field should expose a clear label-to-control relationship through `htmlFor` and matching control `id`.",
          "Helper and error text should stay concise so screen-reader output remains understandable.",
          "Do not rely on color changes alone to distinguish hint from validation states.",
        ],
      )}
    </div>
  );
}

export function renderFormShellDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Section composition</CardTitle>
          <CardDescription>Form shell should provide spacing, section rhythm, and safe composition without forcing one label placement across every form.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Single section" stacked>
            <FormShell>
              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Workspace settings</FormSectionTitle>
                  <FormSectionDescription>
                    Section titles and descriptions should stay calmer than page headers and only frame the local group.
                  </FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={2}>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-workspace">Workspace</FieldLabel>
                    <Input defaultValue="Aurora" id="ui-lab-formshell-workspace" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-plan">Plan</FieldLabel>
                    <Select defaultValue="growth" id="ui-lab-formshell-plan">
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="enterprise">Enterprise</option>
                    </Select>
                  </Field>
                </FormGrid>
              </FormSection>
            </FormShell>
          </ShowcaseRow>
          <ShowcaseRow label="Responsive inline labels" stacked>
            <FormShell>
              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Operator settings</FormSectionTitle>
                  <FormSectionDescription>
                    Shared form shell should support the desktop-left/mobile-top label pattern without a different shell primitive.
                  </FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={1}>
                  <Field layout="responsive-inline">
                    <FieldLabel htmlFor="ui-lab-formshell-inline-owner">Owner email</FieldLabel>
                    <Input defaultValue="owner@aurora.platform.localhost" id="ui-lab-formshell-inline-owner" />
                    <FieldHint>Use when wider desktop forms benefit from a calmer left column for labels.</FieldHint>
                  </Field>
                  <Field invalid layout="responsive-inline">
                    <FieldLabel htmlFor="ui-lab-formshell-inline-webhook">Webhook URL</FieldLabel>
                    <Input defaultValue="not-a-url" id="ui-lab-formshell-inline-webhook" invalid />
                    <FieldError>Enter a valid HTTPS endpoint.</FieldError>
                  </Field>
                </FormGrid>
              </FormSection>
            </FormShell>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-section layout</CardTitle>
          <CardDescription>Multi-section forms need clear rhythm and should still read well when one section becomes denser than another.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Two sections" stacked>
            <FormShell>
              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Identity</FormSectionTitle>
                  <FormSectionDescription>Core naming and addressing fields for the entity.</FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={2}>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-name">Tenant name</FieldLabel>
                    <Input defaultValue="Nova Labs" id="ui-lab-formshell-name" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-host">Host</FieldLabel>
                    <Input defaultValue="nova.platform.localhost" id="ui-lab-formshell-host" />
                  </Field>
                </FormGrid>
              </FormSection>

              <FormSection>
                <FormSectionHeader>
                  <FormSectionTitle>Behavior</FormSectionTitle>
                  <FormSectionDescription>Boolean and narrative settings should still live inside the same shell rhythm.</FormSectionDescription>
                </FormSectionHeader>
                <FormGrid columns={1}>
                  <Field>
                    <label className="ui-lab-page__inline-control">
                      <Checkbox defaultChecked name="ui-lab-formshell-rollout-banner" />
                      <span>Expose rollout banner to tenant admins</span>
                    </label>
                    <FieldHint>Small control groups should still align with section spacing and section semantics.</FieldHint>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ui-lab-formshell-notes">Notes</FieldLabel>
                    <Textarea
                      defaultValue="Form shell should organize the sections, not decide product-specific form behavior."
                      id="ui-lab-formshell-notes"
                      rows={3}
                    />
                  </Field>
                </FormGrid>
              </FormSection>
            </FormShell>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Form shell should document layout rhythm and section composition without hard-coding product workflow decisions.",
        [
          "The stable hierarchy is shell, section, section header, section copy, and field grid.",
          "Sections can hold mixed control types while preserving the same spacing and title rhythm.",
          "Form shell can host both stacked and responsive-inline fields without becoming a separate screen-specific layout system.",
          "The shell organizes form structure, not submit logic, side effects, or product-specific progression.",
        ],
        [
          "Use `FormSection`, `FormSectionHeader`, `FormSectionTitle`, `FormSectionDescription`, and `FormGrid` compositionally.",
          "Adjust density through field and grid choices instead of inventing new form-shell variants for each screen.",
          "Leave action bars and workflow sequencing outside the shared shell unless they become a proven cross-surface contract.",
        ],
        [
          "Keep section headings semantically ordered so form structure is navigable by assistive technology.",
          "Do not split related fields across distant sections if the reading flow becomes harder to follow.",
          "Ensure dense multi-column layouts still collapse into a readable order on smaller screens.",
        ],
      )}
    </div>
  );
}
