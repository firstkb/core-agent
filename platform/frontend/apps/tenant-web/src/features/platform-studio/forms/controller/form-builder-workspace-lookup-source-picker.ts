import {
  type LookupSourceModelOption,
} from "./form-builder-workspace-lookup-options";
import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";

export type FormBuilderLookupSourcePickerState = {
  fieldId: string;
  modelId: string;
  selectedFieldKeys: ReadonlyArray<string>;
  sortFieldKey: string;
};

type ApplyLookupSourcePickerSelectionInput = {
  field: FormsPlaceholderField;
  picker: FormBuilderLookupSourcePickerState;
  sourceModel: LookupSourceModelOption;
};

export function applyLookupSourcePickerSelectionToField({
  field,
  picker,
  sourceModel,
}: ApplyLookupSourcePickerSelectionInput): FormsPlaceholderField | null {
  if (field.kind !== "db_lookup") {
    return null;
  }

  const selectedFieldSet = new Set(picker.selectedFieldKeys);
  const effectiveDisplayFields = sourceModel.fields
    .filter((sourceField) => selectedFieldSet.has(sourceField.key))
    .map((sourceField) => sourceField.key);

  if (effectiveDisplayFields.length === 0) {
    return null;
  }

  const nonStoredDisplayFields = effectiveDisplayFields.filter(
    (fieldKey) => fieldKey !== sourceModel.storedValueField,
  );
  const nextGroupByField = nonStoredDisplayFields[0] ?? effectiveDisplayFields[0];
  const nextItemLabelFields = nonStoredDisplayFields.slice(1);

  return {
    ...field,
    displayFields: effectiveDisplayFields,
    lookupConfig: {
      ...field.lookupConfig,
      groupByField: field.preset === "db_lookup_value"
        ? undefined
        : field.lookupConfig?.displayMode === "catalog_modal"
          ? nextGroupByField
          : undefined,
      itemLabelFields: field.preset === "db_lookup_value"
        ? undefined
        : field.lookupConfig?.displayMode === "catalog_modal" && nextItemLabelFields.length > 0
          ? nextItemLabelFields
          : undefined,
      searchFields: [...effectiveDisplayFields],
      sortField: picker.sortFieldKey || sourceModel.defaultSortField,
      sourceModel: sourceModel.id,
      storedTextFields: field.preset === "db_lookup_value" ? [...effectiveDisplayFields] : undefined,
      storedValueField: field.preset === "db_lookup_value" ? undefined : sourceModel.storedValueField,
    },
    sourceLabel: sourceModel.label,
  };
}
