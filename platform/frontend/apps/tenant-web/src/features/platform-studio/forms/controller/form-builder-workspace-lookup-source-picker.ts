import {
  type LookupSourceModelOption,
} from "./form-builder-workspace-lookup-options";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderLookupConfig,
  type FormsPlaceholderLookupFilter,
} from "../forms-placeholder-data";

export type FormBuilderLookupSourcePickerState = {
  activeFilterEnabled: boolean;
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

function isActiveLookupFilter(filter: FormsPlaceholderLookupFilter, activeField: string) {
  return filter.field === activeField && (filter.operator ?? "eq") === "eq" && filter.value === true;
}

export function hasActiveLookupFilter(
  lookupConfig: FormsPlaceholderLookupConfig | undefined,
  activeField = "active",
) {
  return lookupConfig?.filters?.some((filter) => isActiveLookupFilter(filter, activeField)) ?? false;
}

function mergeActiveLookupFilter(
  filters: ReadonlyArray<FormsPlaceholderLookupFilter> | undefined,
  activeField: string,
  enabled: boolean,
) {
  const remainingFilters = (filters ?? []).filter((filter) => !isActiveLookupFilter(filter, activeField));
  if (!enabled) {
    return remainingFilters.length > 0 ? remainingFilters : undefined;
  }

  return [
    ...remainingFilters,
    {
      field: activeField,
      operator: "eq" as const,
      value: true,
    },
  ];
}

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
  const existingFilters = field.lookupConfig?.sourceModel === sourceModel.id
    ? field.lookupConfig?.filters
    : undefined;

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
      filters: sourceModel.activeFilterField
        ? mergeActiveLookupFilter(existingFilters, sourceModel.activeFilterField, picker.activeFilterEnabled)
        : undefined,
      storedTextFields: field.preset === "db_lookup_value" ? [...effectiveDisplayFields] : undefined,
      storedValueField: field.preset === "db_lookup_value" ? undefined : sourceModel.storedValueField,
    },
    sourceLabel: sourceModel.label,
  };
}
