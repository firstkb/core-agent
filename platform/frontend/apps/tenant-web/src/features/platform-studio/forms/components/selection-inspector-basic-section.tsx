import { type ReactNode } from "react";

import {
  Input,
  Label,
  RichTextEditor,
  Select,
  Switch,
  Textarea,
} from "@platform/ui-kit";

import { FormBuilderElementIcon } from "../forms-builder-icons";
import { type FormBuilderNode } from "../forms-builder-state";

type SelectionInspectorBasicLabels = {
  hiddenVisibility: string;
  lockedHint: string | null;
  noAdvancedSettings: string;
  nodeText: string;
  nodeTitle: string;
  nodeVisibility: string;
  readonlyText: string;
  readonlyVisibility: string;
  required: string;
  viewOnlyBinding: string;
  viewOnlyBindingEmpty: string;
  viewOnlyBindingPending: string;
  viewOnlyFieldSection: string;
  visibleVisibility: string;
};

type SelectionInspectorViewOnlyBindingOption = {
  bindingId: string;
  label: string;
};

type SelectionInspectorPersistedField = {
  label: string;
  storageKey: string;
};

type SelectionInspectorBasicSectionProps = {
  canEdit: boolean;
  children?: ReactNode;
  iconKey: string;
  labels: SelectionInspectorBasicLabels;
  meta: string;
  nodeRequired: boolean;
  nodeText: string;
  nodeTitle: string;
  nodeType: FormBuilderNode["type"];
  nodeVisibility: FormBuilderNode["visibility"];
  onRequiredChange: (checked: boolean) => void;
  onRichTextChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onTitleChange: (title: string) => void;
  onViewOnlyBindingChange: (bindingId: string) => void;
  onVisibilityChange: (visibility: FormBuilderNode["visibility"]) => void;
  persistedField: SelectionInspectorPersistedField | null;
  selectedViewOnlyBindingId: string;
  title: string;
  titleDisabled: boolean;
  viewOnlyBindingOptions: ReadonlyArray<SelectionInspectorViewOnlyBindingOption>;
};

export function SelectionInspectorBasicSection({
  canEdit,
  children,
  iconKey,
  labels,
  meta,
  nodeRequired,
  nodeText,
  nodeTitle,
  nodeType,
  nodeVisibility,
  onRequiredChange,
  onRichTextChange,
  onTextChange,
  onTitleChange,
  onViewOnlyBindingChange,
  onVisibilityChange,
  persistedField,
  selectedViewOnlyBindingId,
  title,
  titleDisabled,
  viewOnlyBindingOptions,
}: SelectionInspectorBasicSectionProps) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-inspector-head tenant-web__platform-studio-inspector-head--selection">
        <span className="tenant-web__platform-studio-item-icon">
          <FormBuilderElementIcon iconKey={iconKey} />
        </span>
        <div className="tenant-web__platform-studio-inspector-head-copy">
          <p className="tenant-web__platform-studio-inspector-title">{title}</p>
          <p className="tenant-web__platform-studio-inspector-meta">{meta}</p>
        </div>
      </div>

      {persistedField ? (
        <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
          <div className="tenant-web__platform-studio-compact-row">
            <div className="tenant-web__platform-studio-compact-row-main">
              <span className="tenant-web__platform-studio-compact-row-title-wrap">
                <span className="tenant-web__platform-studio-compact-row-label">
                  <DatabaseFieldIcon />
                  {" "}
                  {persistedField.label}
                </span>
              </span>
              <span className="tenant-web__platform-studio-compact-row-summary">
                {persistedField.storageKey}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {canEdit ? (
        <div className="tenant-web__platform-studio-form">
          {nodeType === "field" ? (
            <>
              <NodeTitleControl
                disabled={titleDisabled}
                label={labels.nodeTitle}
                onTitleChange={onTitleChange}
                value={nodeTitle}
              />
              <NodeVisibilityControl
                label={labels.nodeVisibility}
                labels={labels}
                onVisibilityChange={onVisibilityChange}
                value={nodeVisibility}
              />
              <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
                <span className="tenant-web__platform-studio-form-inline-label">
                  {labels.required}
                </span>
                <Switch
                  checked={nodeRequired}
                  onCheckedChange={onRequiredChange}
                  size="sm"
                />
              </div>
              {children}
            </>
          ) : nodeType === "view_only_field" ? (
            <>
              <NodeTitleControl
                label={labels.nodeTitle}
                onTitleChange={onTitleChange}
                value={nodeTitle}
              />
              <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                  <span>{labels.viewOnlyFieldSection}</span>
                </div>

                <div className="tenant-web__platform-studio-form-group">
                  <Label htmlFor="tenant-platform-studio-view-only-binding">
                    {labels.viewOnlyBinding}
                  </Label>
                  <Select
                    id="tenant-platform-studio-view-only-binding"
                    onChange={(event) => onViewOnlyBindingChange(event.target.value)}
                    value={selectedViewOnlyBindingId}
                  >
                    <option value="">{labels.viewOnlyBindingPending}</option>
                    {viewOnlyBindingOptions.map((option) => (
                      <option key={option.bindingId} value={option.bindingId}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {viewOnlyBindingOptions.length === 0 ? (
                  <p className="tenant-web__platform-studio-inline-help">
                    {labels.viewOnlyBindingEmpty}
                  </p>
                ) : null}
              </div>
            </>
          ) : nodeType === "text" ? (
            <>
              <NodeTitleControl
                label={labels.nodeTitle}
                onTitleChange={onTitleChange}
                value={nodeTitle}
              />
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor="tenant-platform-studio-node-text">
                  {labels.nodeText}
                </Label>
                <Textarea
                  id="tenant-platform-studio-node-text"
                  onChange={(event) => onTextChange(event.target.value)}
                  rows={5}
                  value={nodeText}
                />
              </div>
            </>
          ) : nodeType === "rich_text" ? (
            <>
              <NodeTitleControl
                label={labels.nodeTitle}
                onTitleChange={onTitleChange}
                value={nodeTitle}
              />
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor="tenant-platform-studio-node-rich-text">
                  {labels.nodeText}
                </Label>
                <RichTextEditor
                  aria-label={labels.nodeText}
                  id="tenant-platform-studio-node-rich-text"
                  onChange={onRichTextChange}
                  value={nodeText}
                />
              </div>
            </>
          ) : nodeType === "divider" || nodeType === "spacer" ? (
            <p className="tenant-web__platform-studio-inline-help">
              {labels.noAdvancedSettings}
            </p>
          ) : (
            <NodeTitleControl
              label={labels.nodeTitle}
              onTitleChange={onTitleChange}
              value={nodeTitle}
            />
          )}

          {nodeType !== "divider" && nodeType !== "field" ? (
            <NodeVisibilityControl
              label={labels.nodeVisibility}
              labels={labels}
              onVisibilityChange={onVisibilityChange}
              value={nodeVisibility}
            />
          ) : null}

          {labels.lockedHint ? (
            <p className="tenant-web__platform-studio-inline-help">
              {labels.lockedHint}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="tenant-web__platform-studio-inline-help">
          {labels.readonlyText}
        </p>
      )}
    </div>
  );
}

function NodeTitleControl({
  disabled = false,
  label,
  onTitleChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onTitleChange: (title: string) => void;
  value: string;
}) {
  return (
    <div className="tenant-web__platform-studio-form-group">
      <Label htmlFor="tenant-platform-studio-node-title">
        {label}
      </Label>
      <Input
        disabled={disabled}
        id="tenant-platform-studio-node-title"
        onChange={(event) => onTitleChange(event.target.value)}
        value={value}
      />
    </div>
  );
}

function NodeVisibilityControl({
  label,
  labels,
  onVisibilityChange,
  value,
}: {
  label: string;
  labels: Pick<SelectionInspectorBasicLabels, "hiddenVisibility" | "readonlyVisibility" | "visibleVisibility">;
  onVisibilityChange: (visibility: FormBuilderNode["visibility"]) => void;
  value: FormBuilderNode["visibility"];
}) {
  return (
    <div className="tenant-web__platform-studio-form-group">
      <Label htmlFor="tenant-platform-studio-node-visibility">
        {label}
      </Label>
      <Select
        id="tenant-platform-studio-node-visibility"
        onChange={(event) => onVisibilityChange(event.target.value as FormBuilderNode["visibility"])}
        value={value}
      >
        <option value="visible">{labels.visibleVisibility}</option>
        <option value="readonly">{labels.readonlyVisibility}</option>
        <option value="hidden">{labels.hiddenVisibility}</option>
      </Select>
    </div>
  );
}

function DatabaseFieldIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 20 20"
    >
      <ellipse cx="10" cy="5" rx="5.5" ry="2.5" />
      <path d="M4.5 5v4c0 1.4 2.46 2.5 5.5 2.5s5.5-1.1 5.5-2.5V5" />
      <path d="M4.5 9v4c0 1.4 2.46 2.5 5.5 2.5s5.5-1.1 5.5-2.5V9" />
    </svg>
  );
}
