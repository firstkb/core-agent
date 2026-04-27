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
  Label,
  Textarea,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";

export function renderLabelDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Label should stay calm and readable whether it carries primary control naming or quieter supporting text.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Primary" stacked>
            <FormGrid columns={2}>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-primary">Tenant display name</Label>
                <Input defaultValue="Aurora Commerce" id="ui-lab-label-primary" name="ui-lab-label-primary" />
              </div>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-owner">Owner email</Label>
                <Input defaultValue="owner@platform.local" id="ui-lab-label-owner" name="ui-lab-label-owner" />
              </div>
            </FormGrid>
          </ShowcaseRow>
          <ShowcaseRow label="Secondary" stacked>
            <FormGrid columns={2}>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-host" variant="secondary">
                  Optional rollout note
                </Label>
                <Input defaultValue="Preview text only" id="ui-lab-label-host" name="ui-lab-label-host" readOnly />
              </div>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-slug" variant="secondary">
                  Supporting field text should remain calmer than the primary field label.
                </Label>
                <Input defaultValue="aurora-platform" id="ui-lab-label-slug" name="ui-lab-label-slug" readOnly />
              </div>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Control usage</CardTitle>
          <CardDescription>Standalone label should support simple control rows when a full `Field` shell would be excessive.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Inline control" stacked>
            <FormGrid columns={2}>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-inline-name">Workspace slug</Label>
                <Input defaultValue="aurora-platform" id="ui-lab-label-inline-name" name="ui-lab-label-inline-name" />
              </div>
              <div className="ui-lab-page__label-stack">
                <Label htmlFor="ui-lab-label-inline-host" variant="secondary">
                  Preview host
                </Label>
                <Input defaultValue="demo.platform.localhost" id="ui-lab-label-inline-host" name="ui-lab-label-inline-host" readOnly />
              </div>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the standalone label primitive used when the heavier field shell is unnecessary.", [
        { name: "variant", type: "\"primary\" | \"secondary\"", notes: "Controls whether the label reads as primary control naming or calmer supporting label text." },
        { name: "htmlFor", type: "string", notes: "Connects the label to its target control using standard browser semantics." },
        { name: "children", type: "ReactNode", notes: "Visible label text for a control, grouped setting, or compact helper row." },
        { name: "native label props", type: "LabelHTMLAttributes<HTMLLabelElement>", notes: "Keeps the primitive semantic and light instead of growing a custom API." },
      ])}

      {renderReferenceNotesCard(
        "Label should stay a small semantic primitive for standalone control naming and supporting label rows.",
        [
          "The stable anatomy is a single label element with calm typographic treatment.",
          "Primary and secondary variants adjust emphasis only; they do not turn label into a field shell.",
          "Use standalone label where the full `Field` wrapper would add unnecessary structure.",
        ],
        [
          "Use `htmlFor` and the matching control `id` to keep the label semantic and clickable.",
          "Prefer `FieldLabel` inside the field shell and `Label` for lighter control compositions outside it.",
          "Keep label copy concise and let hint or error messaging live in the appropriate surrounding contract.",
        ],
        [
          "Every standalone label should still be connected to the correct form control or setting.",
          "Do not rely on visual proximity alone if `htmlFor` and `id` can provide a stronger association.",
          "Secondary labels should remain readable and not collapse into decorative muted text.",
        ],
      )}

      {renderUsageReviewCard(
        "Label works best for simple control rows and standalone form semantics where a full field wrapper is not needed.",
        [
          "A control needs semantic naming but does not need hint, error, and surrounding field structure.",
          "The surface needs a lightweight form row or settings item with calm typographic hierarchy.",
        ],
        [
          "Use primary labels for the main control name and secondary labels for calmer supporting label rows.",
          "Keep label copy short and attach it semantically through `htmlFor` when possible.",
          "Escalate to `Field` only when the surface needs full hint, error, or validation structure.",
        ],
        [
          "Do not duplicate `FieldLabel` and `Label` on the same control row without a clear reason.",
          "Do not use Label as a general text-style utility detached from form or control meaning.",
          "Do not hide essential control meaning in a muted secondary label without a stronger primary name.",
        ],
      )}
    </div>
  );
}

export function renderTextareaDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Default and resize</CardTitle>
          <CardDescription>Textarea should stay visually aligned with the shared entry family while remaining useful for longer notes and reviews.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Vertical" stacked>
            <Textarea
              aria-label="Vertical textarea"
              defaultValue="Aurora rollout notes stay in one shared textarea contract instead of drifting into screen-owned long-form fields."
              id="ui-lab-textarea-vertical"
              name="ui-lab-textarea-vertical"
              rows={4}
            />
          </ShowcaseRow>
          <ShowcaseRow label="No resize" stacked>
            <Textarea
              aria-label="No resize textarea"
              defaultValue="Use no-resize only when the surrounding layout already provides the right amount of room."
              id="ui-lab-textarea-no-resize"
              name="ui-lab-textarea-no-resize"
              resize="none"
              rows={4}
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Textarea should preserve the same field semantics as other entry controls, including helper copy, invalid state, and required emphasis.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-textarea-default">Default</FieldLabel>
                <Textarea
                  defaultValue="Customer-facing summary for the selected tenant."
                  id="ui-lab-textarea-default"
                  rows={4}
                />
                <FieldHint>Neutral helper copy should stay calm and short.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-textarea-invalid">Invalid</FieldLabel>
                <Textarea
                  defaultValue="Webhook notes exceed the current length rules for this environment."
                  id="ui-lab-textarea-invalid"
                  invalid
                  rows={4}
                />
                <FieldError>Keep the note under 160 characters for this review surface.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ui-lab-textarea-disabled">Disabled</FieldLabel>
                <Textarea
                  defaultValue="This note is locked while the environment remains archived."
                  disabled
                  id="ui-lab-textarea-disabled"
                  rows={4}
                />
                <FieldHint>Disabled textarea should keep the same rhythm and height expectations.</FieldHint>
              </Field>
              <Field required>
                <FieldLabel htmlFor="ui-lab-textarea-required">Required</FieldLabel>
                <Textarea
                  defaultValue="State the owner-facing reason for the rollout exception."
                  id="ui-lab-textarea-required"
                  required
                  rows={4}
                />
                <FieldHint>Required textarea fields reuse the same left accent as input and select.</FieldHint>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsive inline field</CardTitle>
          <CardDescription>Longer textarea labels should still align cleanly when the shared field layout moves the label to the left on desktop.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Inline field" stacked>
            <Field layout="responsive-inline" required>
              <FieldLabel htmlFor="ui-lab-textarea-inline">
                Operator notes for the next rollout review window
              </FieldLabel>
              <Textarea
                defaultValue="Keep this explanation concise enough for reviewers to scan, but long enough to explain why the tenant remains queued."
                id="ui-lab-textarea-inline"
                rows={5}
              />
              <FieldHint>Desktop keeps the label in a left column; mobile returns it above the control.</FieldHint>
            </Field>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable reference for the shared multi-line text-entry contract.", [
        { name: "invalid", type: "boolean", notes: "Applies the same invalid treatment used by the rest of the shared entry family." },
        { name: "resize", type: "\"vertical\" | \"none\"", notes: "Controls whether the browser resize affordance stays available without creating separate textarea variants." },
        { name: "rows", type: "number", notes: "Defines the initial vertical footprint while preserving the same control contract." },
        { name: "disabled / readOnly / required", type: "native textarea props", notes: "Use native semantics while the field wrapper handles label, hint, error, and required emphasis." },
        { name: "native textarea props", type: "TextareaHTMLAttributes<HTMLTextAreaElement>", notes: "Use standard props for value, defaultValue, name, placeholder, and input semantics." },
      ])}

      {renderReferenceNotesCard(
        "Textarea should document the shared long-form entry contract separately from product-specific comment modules or rich editing surfaces.",
        [
          "The stable anatomy is a single multi-line text control that may live bare or inside a `Field` wrapper.",
          "Resize behavior remains a small control-level option instead of a separate screen-specific variant.",
          "Required, hint, and error semantics still come from the surrounding field shell.",
        ],
        [
          "`invalid`, `resize`, `rows`, and standard textarea props define the stable control-level API.",
          "Use `Field` to carry label, hint, error, and required semantics instead of inventing textarea-specific wrapper APIs.",
          "Keep textarea focused on plain multi-line entry, not rich formatting or workflow-owned editing patterns.",
        ],
        [
          "Textarea still needs a visible label or equivalent accessible name beyond placeholder text.",
          "Helper and error copy should remain connected through the field layer so validation is not color-only.",
          "Do not rely on placeholder copy as the primary instruction for longer-form entry.",
        ],
      )}

      {renderUsageReviewCard(
        "Textarea is appropriate when users need plain multi-line input that is still short enough to stay inside the shared entry contract.",
        [
          "A form needs notes, summaries, descriptions, or review comments longer than a single text line.",
          "The surface still benefits from the same lightweight field and validation structure used by other form controls.",
        ],
        [
          "Keep labels explicit and helper copy concise.",
          "Use textarea for plain multi-line entry before reaching for a richer editor or screen-specific note component.",
          "Let the field shell own validation messaging and required emphasis.",
        ],
        [
          "Do not treat textarea as a rich text editor or markdown surface.",
          "Do not build bespoke note-card controls when the shared multi-line contract is sufficient.",
          "Do not overload the control with screen-specific formatting helpers that belong outside the base primitive.",
        ],
      )}
    </div>
  );
}
