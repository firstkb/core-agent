import { useState } from "react";

import {
  RichTextContent,
  RichTextEditor,
  TagInput,
} from "@platform/ui-kit";

export function RichTextEditorPreview() {
  const [value, setValue] = useState(
    "<h2>Getting started</h2><p>Use one shared rich-text surface when stored narrative needs lightweight formatting instead of plain textarea notes.</p><p><strong>Keep the first slice focused</strong> on common writing needs that appear in forms, review notes, and stored instructions.</p><ul><li>Headings for structure</li><li>Lists for scanability</li><li><a href='https://tiptap.dev/'>Links</a> for references</li></ul>",
  );

  return (
    <div className="ui-lab-page__stack">
      <RichTextEditor
        id="ui-lab-rich-text-editor-default"
        onChange={setValue}
        placeholder="Write rollout guidance..."
        value={value}
      />
      <p className="ui-lab-page__muted">Current HTML length: {value.length} characters.</p>
    </div>
  );
}

export function RichTextReadonlyPreview() {
  return (
    <RichTextContent
      className="ui-lab-page__surface-card ui-lab-page__surface-card--soft"
      html="<h3>Readonly output</h3><p><strong>Readonly rendering</strong> should reuse the same HTML contract without keeping editor chrome mounted.</p><p><a href='https://example.com'>Reference links</a>, headings, and list structure must remain predictable.</p><ol><li>Store sanitized HTML</li><li>Render through one shared surface</li></ol>"
    />
  );
}

export function TagInputPreview() {
  const [tags, setTags] = useState(["enterprise", "priority-support"]);

  return (
    <div className="ui-lab-page__stack">
      <TagInput
        id="ui-lab-tag-input-preview-freeform"
        inputAriaLabel="Tenant labels"
        mode="freeform"
        onValueChange={setTags}
        placeholder="Add tenant labels"
        value={tags}
      />
      <p className="ui-lab-page__muted">
        Current tags: {tags.length > 0 ? tags.join(", ") : "No tags yet"}.
      </p>
    </div>
  );
}

export const predefinedTagOptions = [
  "Enterprise",
  "Growth",
  "Trial",
  "Needs review",
  "Escalated",
  "Priority support",
  "Compliance hold",
  "Regional rollout",
] as const;

export function PresetTagInputPreview() {
  const [tags, setTags] = useState(["Enterprise", "Priority support"]);

  return (
    <div className="ui-lab-page__stack">
      <TagInput
        id="ui-lab-tag-input-preview-preset"
        inputAriaLabel="Preset tenant labels"
        mode="preset"
        onValueChange={setTags}
        placeholder="Choose existing labels"
        suggestions={predefinedTagOptions}
        value={tags}
      />
      <p className="ui-lab-page__muted">
        Preset-only mode lets users choose only from the predefined tag dictionary: {tags.join(", ")}.
      </p>
    </div>
  );
}

export function HybridTagInputPreview() {
  const [tags, setTags] = useState(["Enterprise", "Priority support", "Late payer"]);

  return (
    <div className="ui-lab-page__stack">
      <TagInput
        id="ui-lab-tag-input-preview-hybrid"
        inputAriaLabel="Flexible tenant labels"
        mode="hybrid"
        onValueChange={setTags}
        placeholder="Choose or create labels"
        suggestions={predefinedTagOptions}
        value={tags}
      />
      <p className="ui-lab-page__muted">
        Hybrid mode lets users start from the predefined dictionary and still add custom labels: {tags.join(", ")}.
      </p>
    </div>
  );
}
