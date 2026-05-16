import type {
  TenantDictionaryFilter,
  TenantDictionaryOptionsRequest,
} from "@platform/api-client";
import type {
  RuntimeFormLookupDefinition,
  RuntimeFormLookupFilter,
  RuntimeFormLookupOptionsRequest,
  RuntimeFormValue,
} from "@platform/forms";

export function lookupOutputValueKey(sourceFieldId: string, outputKey: string) {
  return `${sourceFieldId}::lookup_output::${outputKey}`;
}

export function selectedLookupRuntimeValues(value: RuntimeFormValue | undefined) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}

function dictionaryKeyForLookupPreset(preset: string | undefined) {
  switch (preset) {
    case "company_lookup":
      return "companies";
    case "contact_lookup":
      return "contacts";
    case "project_lookup":
      return "projects";
    default:
      return undefined;
  }
}

function lookupUsesNamedPresetDictionary(lookup: RuntimeFormLookupDefinition) {
  return Boolean(dictionaryKeyForLookupPreset(lookup.preset));
}

function storedValueFieldForLookup(lookup: RuntimeFormLookupDefinition) {
  if (lookup.valueMode === "text") {
    return lookup.storedValueField;
  }
  return lookup.storedValueField;
}

function isLookupFilterValueArray(
  value: RuntimeFormLookupFilter["value"],
): value is ReadonlyArray<string | number | boolean> {
  return Array.isArray(value);
}

function tenantDictionaryFilters(filters: ReadonlyArray<RuntimeFormLookupFilter> | undefined): TenantDictionaryFilter[] | undefined {
  return filters?.map((filter): TenantDictionaryFilter => {
    const value = filter.value;
    return {
      field: filter.field,
      operator: filter.operator,
      value: isLookupFilterValueArray(value) ? [...value] : value,
    };
  });
}

export function buildRuntimeLookupDictionaryRequest(
  request: RuntimeFormLookupOptionsRequest,
): TenantDictionaryOptionsRequest | null {
  const { lookup } = request;
  const useNamedPresetDictionary = lookupUsesNamedPresetDictionary(lookup);
  const dictionary = useNamedPresetDictionary
    ? dictionaryKeyForLookupPreset(lookup.preset)
    : lookup.sourceModel
      ? lookup.dictionary
      : lookup.dictionary;
  const sourceModel = useNamedPresetDictionary ? undefined : lookup.sourceModel;

  if (!sourceModel && !dictionary) {
    return null;
  }

  return {
    dictionary,
    displayFields: sourceModel && lookup.displayFields ? [...lookup.displayFields] : undefined,
    filters: tenantDictionaryFilters(lookup.filters),
    ids: request.ids ? [...request.ids] : undefined,
    page: request.page,
    pageSize: request.pageSize,
    search: request.search,
    searchFields: sourceModel && lookup.searchFields ? [...lookup.searchFields] : undefined,
    sortField: sourceModel ? lookup.sortField : undefined,
    sourceModel,
    storedValueField: sourceModel ? storedValueFieldForLookup(lookup) : undefined,
  };
}

export function hasLookupLabels(labels: Record<string, Record<string, string>>) {
  return Object.values(labels).some((fieldLabels) => Object.keys(fieldLabels).length > 0);
}

export function cloneLookupLabels(labels: Record<string, Record<string, string>>) {
  return Object.fromEntries(
    Object.entries(labels).flatMap(([fieldId, fieldLabels]) => {
      const entries = Object.entries(fieldLabels).filter(([value, label]) => value.trim() && label.trim());
      return entries.length > 0 ? [[fieldId, Object.fromEntries(entries)]] : [];
    }),
  );
}

export function mergeLookupLabels(
  target: Record<string, Record<string, string>>,
  fieldId: string,
  labels: Record<string, string> | undefined,
) {
  if (!labels || Object.keys(labels).length === 0) {
    return;
  }
  target[fieldId] = {
    ...target[fieldId],
    ...labels,
  };
}

export function mergeLookupLabelMaps(
  left: Record<string, Record<string, string>>,
  right: Record<string, Record<string, string>>,
) {
  const out: Record<string, Record<string, string>> = cloneLookupLabels(left);
  Object.entries(right).forEach(([fieldId, labels]) => {
    mergeLookupLabels(out, fieldId, labels);
  });
  return out;
}

export function lookupLabelsForChangedValues(
  changedValues: Record<string, unknown>,
  labels: Record<string, Record<string, string>>,
) {
  return Object.fromEntries(
    Object.keys(changedValues).flatMap((fieldId) => {
      const fieldLabels = labels[fieldId];
      return fieldLabels && Object.keys(fieldLabels).length > 0 ? [[fieldId, fieldLabels]] : [];
    }),
  );
}
