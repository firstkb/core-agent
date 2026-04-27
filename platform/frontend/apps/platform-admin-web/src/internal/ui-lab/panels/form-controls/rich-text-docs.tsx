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
  RichTextEditor,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard } from "../../components/docs-cards";
import {
  RichTextEditorPreview,
  RichTextReadonlyPreview,
} from "./interactive-previews";

export function renderRichTextEditorDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Editable foundation</CardTitle>
          <CardDescription>Rich text should feel closer to an editorial surface than a dressed-up textarea, while still staying inside a disciplined first-slice contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Editorial surface" stacked>
            <RichTextEditorPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readonly renderer</CardTitle>
          <CardDescription>Stored HTML must also have a simple shared rendering contract for summaries, readonly fields, and content blocks.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Sanitized HTML display" stacked>
            <RichTextReadonlyPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field-level validation matrix</CardTitle>
          <CardDescription>Rich text should still read like part of the shared form-entry family, not like an isolated product-specific editor.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Matrix" stacked>
            <FormGrid columns={2}>
              <Field>
                <FieldLabel htmlFor="ui-lab-rich-text-editor-field-default">Default</FieldLabel>
                <RichTextEditor
                  defaultValue="<h3>Operator notes</h3><p>Operator notes can use <strong>emphasis</strong> and lists without reaching for a full document editor.</p>"
                  id="ui-lab-rich-text-editor-field-default"
                  placeholder="Write operator notes..."
                />
                <FieldHint>Keep the first slice intentionally small: emphasis, lists, links, undo, and redo.</FieldHint>
              </Field>
              <Field invalid>
                <FieldLabel htmlFor="ui-lab-rich-text-editor-field-invalid">Invalid</FieldLabel>
                <RichTextEditor
                  defaultValue="<p>This example stays editable while the field shell carries the invalid state.</p>"
                  id="ui-lab-rich-text-editor-field-invalid"
                  invalid
                />
                <FieldError>Remove unsupported formatting before saving this field.</FieldError>
              </Field>
            </FormGrid>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Stable first-slice reference for the shared rich-text editor surface.", [
        { name: "value / defaultValue", type: "string", notes: "HTML string contract for controlled and uncontrolled usage." },
        { name: "onChange", type: "(value: string) => void", notes: "Returns normalized HTML with empty content represented as an empty string." },
        { name: "disabled", type: "boolean", notes: "Disables editing while preserving the shared rich-text surface." },
        { name: "invalid", type: "boolean", notes: "Lets field-shell validation color and focus treatment stay consistent." },
        { name: "placeholder", type: "string", notes: "Provides first-slice empty-state guidance inside the editor body." },
        { name: "toolbarPreset", type: "\"basic\"", notes: "First slice keeps one toolbar preset until richer editor profiles are approved." },
      ])}

      {renderReferenceNotesCard(
        "Rich text should be a shared editor foundation, not a one-off screen-owned exception.",
        [
          "Use one editor primitive in `ui-kit` and prove it in `ui-lab` before wiring product flows.",
          "Store sanitized HTML as the first-slice persisted value shape.",
          "Keep the toolbar limited to the approved first-slice formatting set.",
        ],
        [
          "Prefer `Tiptap OSS` as the shared editor foundation.",
          "Ship a separate readonly renderer for stored HTML instead of keeping editor chrome mounted everywhere.",
          "Keep collaboration, embeds, images, and advanced document tooling out of the initial contract.",
        ],
        [
          "Do not replace rich text with textarea plus raw HTML entry.",
          "Do not let the shared editor define storage semantics on its own.",
          "Do not pull paid or cloud-coupled extensions into the first slice.",
        ],
      )}
    </div>
  );
}
