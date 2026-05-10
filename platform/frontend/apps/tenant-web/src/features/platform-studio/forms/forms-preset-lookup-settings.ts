import type {
  FormsPlaceholderField,
  FormsPlaceholderLookupConfig,
  FormsPlaceholderLookupFilter,
} from "./forms-placeholder-data";

export type FormsPresetLookupKind = "company_lookup" | "contact_lookup" | "project_lookup";

export type FormsPresetLookupTemplateOption = {
  displayFields: ReadonlyArray<string>;
  displayTemplate: string;
  key: string;
  label: string;
  searchFields: ReadonlyArray<string>;
  sortField: string;
};

export type FormsPresetLookupFilterDefinition = {
  dictionaryKey: string;
  field: string;
  labelKey: string;
  placeholderKey: string;
};

type PresetLookupSourceDefaults = {
  sourceLabel: string;
  sourceModel: string;
  storedValueField: string;
};

const presetLookupTemplateOptions: Record<FormsPresetLookupKind, ReadonlyArray<FormsPresetLookupTemplateOption>> = {
  company_lookup: [
    {
      displayFields: ["name"],
      displayTemplate: "name",
      key: "company_name",
      label: "Company Name",
      searchFields: ["name"],
      sortField: "name",
    },
  ],
  contact_lookup: [
    {
      displayFields: ["first_name", "last_name"],
      displayTemplate: "first_name + ' ' + last_name",
      key: "contact_full_name",
      label: "First Name Last Name",
      searchFields: ["first_name", "last_name"],
      sortField: "last_name",
    },
    {
      displayFields: ["employee_number", "first_name", "last_name"],
      displayTemplate: "employee_number + ', ' + first_name + ' ' + last_name",
      key: "contact_employee_full_name",
      label: "Employee ID, First Name Last Name",
      searchFields: ["employee_number", "first_name", "last_name"],
      sortField: "employee_number",
    },
  ],
  project_lookup: [
    {
      displayFields: ["project_number", "name"],
      displayTemplate: "project_number + ', ' + name",
      key: "project_number_name",
      label: "Project #, Project Name",
      searchFields: ["project_number", "name"],
      sortField: "project_number",
    },
    {
      displayFields: ["name"],
      displayTemplate: "name",
      key: "project_name",
      label: "Project Name",
      searchFields: ["name"],
      sortField: "name",
    },
  ],
};

const presetLookupFilterDefinitions: Record<FormsPresetLookupKind, ReadonlyArray<FormsPresetLookupFilterDefinition>> = {
  company_lookup: [
    {
      dictionaryKey: "companyTypes",
      field: "company_type_id",
      labelKey: "tenant.platformStudio.forms.builder.fieldSettings.companyTypeFilter",
      placeholderKey: "tenant.platformStudio.forms.builder.fieldSettings.lookupFilterValuePlaceholder",
    },
    {
      dictionaryKey: "companies",
      field: "main_company_id",
      labelKey: "tenant.platformStudio.forms.builder.fieldSettings.mainCompanyFilter",
      placeholderKey: "tenant.platformStudio.forms.builder.fieldSettings.lookupFilterValuePlaceholder",
    },
  ],
  contact_lookup: [
    {
      dictionaryKey: "jobtypes",
      field: "job_type_id",
      labelKey: "tenant.platformStudio.forms.builder.fieldSettings.contactJobTypeFilter",
      placeholderKey: "tenant.platformStudio.forms.builder.fieldSettings.lookupFilterValuePlaceholder",
    },
    {
      dictionaryKey: "companies",
      field: "company_id",
      labelKey: "tenant.platformStudio.forms.builder.fieldSettings.businessUnitFilter",
      placeholderKey: "tenant.platformStudio.forms.builder.fieldSettings.lookupFilterValuePlaceholder",
    },
  ],
  project_lookup: [
    {
      dictionaryKey: "companies",
      field: "company_id",
      labelKey: "tenant.platformStudio.forms.builder.fieldSettings.businessUnitFilter",
      placeholderKey: "tenant.platformStudio.forms.builder.fieldSettings.lookupFilterValuePlaceholder",
    },
  ],
};

const presetLookupSourceDefaults: Record<FormsPresetLookupKind, PresetLookupSourceDefaults> = {
  company_lookup: {
    sourceLabel: "Company",
    sourceModel: "company",
    storedValueField: "doc_id",
  },
  contact_lookup: {
    sourceLabel: "Contact",
    sourceModel: "users",
    storedValueField: "doc_id",
  },
  project_lookup: {
    sourceLabel: "Project",
    sourceModel: "projects",
    storedValueField: "doc_id",
  },
};

const activeFilterField = "active";

export function getPresetLookupKind(field: FormsPlaceholderField): FormsPresetLookupKind | null {
  if (
    field.kind !== "db_lookup"
    || (
      field.preset !== "company_lookup"
      && field.preset !== "contact_lookup"
      && field.preset !== "project_lookup"
    )
  ) {
    return null;
  }

  return field.preset;
}

export function getPresetLookupTemplateOptions(
  fieldOrKind: FormsPlaceholderField | FormsPresetLookupKind,
): ReadonlyArray<FormsPresetLookupTemplateOption> {
  const kind = typeof fieldOrKind === "string" ? fieldOrKind : getPresetLookupKind(fieldOrKind);

  return kind ? presetLookupTemplateOptions[kind] : [];
}

export function getPresetLookupFilterDefinitions(
  fieldOrKind: FormsPlaceholderField | FormsPresetLookupKind,
): ReadonlyArray<FormsPresetLookupFilterDefinition> {
  const kind = typeof fieldOrKind === "string" ? fieldOrKind : getPresetLookupKind(fieldOrKind);

  return kind ? presetLookupFilterDefinitions[kind] : [];
}

export function getPresetLookupSourceDefaults(kind: FormsPresetLookupKind): PresetLookupSourceDefaults {
  return presetLookupSourceDefaults[kind];
}

export function resolvePresetLookupTemplateKey(field: FormsPlaceholderField): string {
  const options = getPresetLookupTemplateOptions(field);
  const currentTemplate = normalizeTemplate(field.lookupConfig?.displayTemplate);
  const currentFields = normalizeFieldList(field.displayFields);
  const matchingTemplate = options.find((option) => normalizeTemplate(option.displayTemplate) === currentTemplate);

  if (matchingTemplate) {
    return matchingTemplate.key;
  }

  const matchingFields = options.find((option) => normalizeFieldList(option.displayFields) === currentFields);

  return matchingFields?.key ?? options[0]?.key ?? "";
}

export function getPresetLookupFilterValueText(field: FormsPlaceholderField, filterField: string): string {
  return getPresetLookupFilterValueIds(field, filterField).join(", ");
}

export function getPresetLookupFilterValueIds(field: FormsPlaceholderField, filterField: string): ReadonlyArray<string> {
  const matchingFilter = field.lookupConfig?.filters?.find((filter) => filter.field === filterField);

  if (!matchingFilter || matchingFilter.value === undefined) {
    return [];
  }

  if (Array.isArray(matchingFilter.value)) {
    return matchingFilter.value.map(String).map((value) => value.trim()).filter(Boolean);
  }

  const value = String(matchingFilter.value).trim();
  return value ? [value] : [];
}

export function applyPresetLookupTemplate(
  field: FormsPlaceholderField,
  templateKey: string,
): FormsPlaceholderField {
  const kind = getPresetLookupKind(field);

  if (!kind) {
    return field;
  }

  const options = getPresetLookupTemplateOptions(kind);
  const option = options.find((currentOption) => currentOption.key === templateKey) ?? options[0];

  if (!option) {
    return field;
  }

  const sourceDefaults = getPresetLookupSourceDefaults(kind);

  return {
    ...field,
    displayFields: [...option.displayFields],
    lookupConfig: buildPresetLookupConfig(field.lookupConfig, kind, option),
    sourceFilters: undefined,
    sourceLabel: field.sourceLabel?.trim() ? field.sourceLabel : sourceDefaults.sourceLabel,
  };
}

export function applyPresetLookupFilterValueText(
  field: FormsPlaceholderField,
  filterField: string,
  valueText: string,
): FormsPlaceholderField {
  return applyPresetLookupFilterValues(field, filterField, parseFilterValueText(valueText));
}

export function applyPresetLookupFilterValues(
  field: FormsPlaceholderField,
  filterField: string,
  values: ReadonlyArray<string>,
): FormsPlaceholderField {
  const kind = getPresetLookupKind(field);

  if (!kind || !getPresetLookupFilterDefinitions(kind).some((definition) => definition.field === filterField)) {
    return field;
  }

  const baseField = applyPresetLookupTemplate(field, resolvePresetLookupTemplateKey(field));
  const nextFilterValues = values
    .map((value) => value.trim())
    .filter(Boolean);
  const nextManagedFilter = nextFilterValues.length > 0
    ? {
        field: filterField,
        operator: "in" as const,
        value: nextFilterValues,
      }
    : null;
  const unmanagedFilters = getUnmanagedLookupFilters(baseField.lookupConfig?.filters, filterField);
  const nextFilters = nextManagedFilter
    ? [...unmanagedFilters, nextManagedFilter]
    : unmanagedFilters;

  return {
    ...baseField,
    lookupConfig: {
      ...baseField.lookupConfig,
      filters: nextFilters.length > 0 ? nextFilters : undefined,
    },
    sourceFilters: undefined,
  };
}

export function buildDefaultPresetLookupFieldSettings(
  kind: FormsPresetLookupKind,
): Pick<FormsPlaceholderField, "displayFields" | "lookupConfig" | "sourceLabel"> {
  const option = presetLookupTemplateOptions[kind][0];
  const sourceDefaults = getPresetLookupSourceDefaults(kind);

  return {
    displayFields: [...option.displayFields],
    lookupConfig: buildPresetLookupConfig(undefined, kind, option),
    sourceLabel: sourceDefaults.sourceLabel,
  };
}

function buildPresetLookupConfig(
  currentConfig: FormsPlaceholderLookupConfig | undefined,
  kind: FormsPresetLookupKind,
  option: FormsPresetLookupTemplateOption,
): FormsPlaceholderLookupConfig {
  const sourceDefaults = getPresetLookupSourceDefaults(kind);
  const filters = getUnmanagedLookupFilters(currentConfig?.filters);

  return {
    ...currentConfig,
    displayMode: currentConfig?.displayMode ?? "search_select",
    displayTemplate: option.displayTemplate,
    filters: filters.length > 0 ? filters : undefined,
    searchBehavior: currentConfig?.searchBehavior ?? "ajax",
    searchFields: [...option.searchFields],
    sortField: option.sortField,
    sourceModel: sourceDefaults.sourceModel,
    storedValueField: currentConfig?.storedValueField ?? sourceDefaults.storedValueField,
  };
}

function getUnmanagedLookupFilters(
  filters: ReadonlyArray<FormsPlaceholderLookupFilter> | undefined,
  replacedField?: string,
): Array<FormsPlaceholderLookupFilter> {
  const managedFields = new Set([
    activeFilterField,
    replacedField,
  ].filter(Boolean));

  return filters?.filter((filter) => !managedFields.has(filter.field)) ?? [];
}

function parseFilterValueText(valueText: string): Array<string> {
  return valueText
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeTemplate(template: string | undefined): string {
  return (template ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeFieldList(fields: ReadonlyArray<string> | undefined): string {
  return (fields ?? []).map((field) => field.trim().toLowerCase()).filter(Boolean).join("|");
}
