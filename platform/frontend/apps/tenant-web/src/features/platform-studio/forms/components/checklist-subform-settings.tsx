import {
  Label,
  Select,
} from "@platform/ui-kit";

import type {
  FormBuilderChecklistGrouping,
  FormBuilderNode,
} from "../forms-builder-state";
import {
  getFormsPlaceholderFieldDisplayName,
  type FormsPlaceholderField,
} from "../forms-placeholder-data";

type ChecklistFieldOption = {
  fieldId: string;
  label: string;
};

type ChecklistSubformSettingsLabels = {
  checklist: string;
  complete: string;
  grouped: string;
  grouping: string;
  lookupField: string;
  missingLookup: string;
  missingResult: string;
  noLookupFields: string;
  noResultFields: string;
  questionOnly: string;
  resultField: string;
};

type ChecklistSubformSettingsProps = {
  fields: ReadonlyArray<FormsPlaceholderField>;
  labels: ChecklistSubformSettingsLabels;
  node: FormBuilderNode;
  onGroupingChange: (grouping: FormBuilderChecklistGrouping) => void;
  onLookupFieldChange: (fieldId: string) => void;
  onResultFieldChange: (fieldId: string) => void;
};

function getChecklistFieldOptions(
  fields: ReadonlyArray<FormsPlaceholderField>,
  schemaScopeKey: string | undefined,
  predicate: (field: FormsPlaceholderField) => boolean,
): ReadonlyArray<ChecklistFieldOption> {
  if (!schemaScopeKey) {
    return [];
  }

  return fields
    .filter((field) => (field.schemaScopeKey ?? "root") === schemaScopeKey && predicate(field))
    .map((field) => ({
      fieldId: field.id,
      label: getFormsPlaceholderFieldDisplayName(field),
    }));
}

export function ChecklistSubformSettings({
  fields,
  labels,
  node,
  onGroupingChange,
  onLookupFieldChange,
  onResultFieldChange,
}: ChecklistSubformSettingsProps) {
  const schemaScopeKey = node.tableKey ?? node.schemaScopeId;
  const lookupOptions = getChecklistFieldOptions(
    fields,
    schemaScopeKey,
    (field) => field.kind === "db_lookup" && field.selectionMode !== "multiple",
  );
  const resultOptions = getChecklistFieldOptions(
    fields,
    schemaScopeKey,
    (field) => field.kind === "single_select",
  );
  const lookupFieldId = node.checklistConfig?.lookupFieldId ?? "";
  const resultFieldId = node.checklistConfig?.resultFieldId ?? "";
  const grouping = node.checklistConfig?.grouping ?? "flat";
  const hasLookup = lookupOptions.some((option) => option.fieldId === lookupFieldId);
  const hasResult = resultOptions.some((option) => option.fieldId === resultFieldId);
  const statusText = hasLookup && hasResult
    ? labels.complete
    : [
        !hasLookup ? labels.missingLookup : "",
        !hasResult ? labels.missingResult : "",
      ].filter(Boolean).join(" ");

  return (
    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{labels.checklist}</span>
      </div>

      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor="tenant-platform-studio-checklist-lookup-field">
          {labels.lookupField}
        </Label>
        <Select
          id="tenant-platform-studio-checklist-lookup-field"
          onChange={(event) => onLookupFieldChange(event.target.value)}
          value={hasLookup ? lookupFieldId : ""}
        >
          <option value="">{lookupOptions.length > 0 ? labels.missingLookup : labels.noLookupFields}</option>
          {lookupOptions.map((option) => (
            <option key={option.fieldId} value={option.fieldId}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor="tenant-platform-studio-checklist-result-field">
          {labels.resultField}
        </Label>
        <Select
          id="tenant-platform-studio-checklist-result-field"
          onChange={(event) => onResultFieldChange(event.target.value)}
          value={hasResult ? resultFieldId : ""}
        >
          <option value="">{resultOptions.length > 0 ? labels.missingResult : labels.noResultFields}</option>
          {resultOptions.map((option) => (
            <option key={option.fieldId} value={option.fieldId}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor="tenant-platform-studio-checklist-grouping">
          {labels.grouping}
        </Label>
        <Select
          id="tenant-platform-studio-checklist-grouping"
          onChange={(event) => onGroupingChange(event.target.value as FormBuilderChecklistGrouping)}
          value={grouping}
        >
          <option value="flat">{labels.questionOnly}</option>
          <option value="by_first_display_field">{labels.grouped}</option>
        </Select>
      </div>

      <p className="tenant-web__platform-studio-inline-help">
        {statusText}
      </p>
    </div>
  );
}
