import { type useTranslation } from "@platform/i18n";

import { getLookupPresetFromField } from "../components/lookup-filter-editor-helpers";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";

type Translate = ReturnType<typeof useTranslation>["t"];

export type LookupSourceFieldOption = {
  key: string;
  kind?: string;
  label: string;
};

export type LookupSourceModelOption = {
  activeFilterField: string;
  defaultDisplayFields: ReadonlyArray<string>;
  defaultSortField: string;
  defaultSearchFields: ReadonlyArray<string>;
  fields: ReadonlyArray<LookupSourceFieldOption>;
  id: string;
  label: string;
  storedValueField: string;
};

const rootRecordLookupSourceField = {
  key: "doc_id",
  label: "Doc.id",
} as const satisfies LookupSourceFieldOption;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildLookupSourceFieldOptions(
  fields: ReadonlyArray<{
    displayName?: string;
    id?: string;
    kind?: string;
    label?: string;
    storageKey?: string;
  }>,
) {
  const seen = new Set<string>();
  const out: LookupSourceFieldOption[] = [];

  const appendField = (key: string | undefined, label: string | undefined, kind?: string) => {
    const normalizedKey = key?.trim();
    if (!normalizedKey || seen.has(normalizedKey)) {
      return;
    }

    seen.add(normalizedKey);
    out.push({
      key: normalizedKey,
      kind: kind?.trim() || undefined,
      label: label?.trim() || normalizedKey,
    });
  };

  appendField(rootRecordLookupSourceField.key, rootRecordLookupSourceField.label);
  fields.forEach((field) => {
    appendField(field.storageKey ?? field.id, field.displayName ?? field.label ?? field.storageKey ?? field.id, field.kind);
  });

  return out;
}

export function buildLookupSourceModelOption(
  modelId: string,
  modelLabel: string,
  fields: ReadonlyArray<{
    displayName?: string;
    id?: string;
    label?: string;
    storageKey?: string;
  }>,
): LookupSourceModelOption {
  const normalizedFields = buildLookupSourceFieldOptions(fields);
  const dataFields = normalizedFields.filter((field) => field.key !== rootRecordLookupSourceField.key);
  const defaultDisplayFields = dataFields.length > 0
    ? [dataFields[0].key]
    : [rootRecordLookupSourceField.key];
  const defaultSortField = dataFields[0]?.key ?? rootRecordLookupSourceField.key;
  const activeFilterField = dataFields.find((field) => field.key === "active" && field.kind === "boolean")?.key ?? "";

  return {
    activeFilterField,
    defaultDisplayFields,
    defaultSearchFields: normalizedFields.map((field) => field.key),
    defaultSortField,
    fields: normalizedFields,
    id: modelId,
    label: modelLabel.trim() || modelId,
    storedValueField: rootRecordLookupSourceField.key,
  };
}

export function buildLookupSourceModelFromPlaceholderModel(
  model: Pick<FormsPlaceholderModel, "displayName" | "fields" | "id" | "title">,
) {
  return buildLookupSourceModelOption(
    model.id,
    model.displayName?.trim() || model.title,
    model.fields.map((field) => ({
      displayName: field.displayName,
      id: field.id,
      kind: field.kind,
      label: field.label,
      storageKey: field.storageKey,
    })),
  );
}

export function buildLookupSourceModelFromDraft(
  model: Pick<FormsPlaceholderModel, "displayName" | "fields" | "id" | "title">,
  draftModel: Record<string, unknown>,
) {
  const dataSchema = isRecord(draftModel.dataSchema) ? draftModel.dataSchema : null;
  const rootScope = dataSchema && isRecord(dataSchema.rootScope) ? dataSchema.rootScope : null;
  const rootFields = Array.isArray(rootScope?.fields)
    ? rootScope.fields.flatMap((entry) => {
      if (!isRecord(entry)) {
        return [];
      }

      return [{
        displayName: typeof entry.displayName === "string" ? entry.displayName : undefined,
        id: typeof entry.fieldId === "string"
          ? entry.fieldId
          : typeof entry.id === "string"
            ? entry.id
            : undefined,
        kind: typeof entry.kind === "string" ? entry.kind : undefined,
        label: typeof entry.label === "string" ? entry.label : undefined,
        storageKey: typeof entry.storageKey === "string" ? entry.storageKey : undefined,
      }];
    })
    : [];

  if (rootFields.length === 0) {
    return buildLookupSourceModelFromPlaceholderModel(model);
  }

  return buildLookupSourceModelOption(
    model.id,
    model.displayName?.trim() || model.title,
    rootFields,
  );
}

export function getLookupSourceModelById(
  sourceModels: ReadonlyArray<LookupSourceModelOption>,
  modelId: string | null | undefined,
) {
  if (!modelId) {
    return null;
  }

  return sourceModels.find((model) => model.id === modelId) ?? null;
}

export function getLookupModelFieldLabel(
  model: LookupSourceModelOption | null,
  fieldKey: string | null | undefined,
) {
  if (!model || !fieldKey) {
    return fieldKey ?? "";
  }

  return model.fields.find((field) => field.key === fieldKey)?.label ?? fieldKey;
}

export function getLookupModelFieldLabels(
  model: LookupSourceModelOption | null,
  fieldKeys: ReadonlyArray<string> | undefined,
) {
  return (fieldKeys ?? []).map((fieldKey) => getLookupModelFieldLabel(model, fieldKey));
}

export function getLookupSourceSummary(
  field: FormsPlaceholderField,
  t: Translate,
) {
  const preset = getLookupPresetFromField(field);

  if (preset === "contact_lookup") {
    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.presetSource"),
      summary: field.sourceLabel?.trim() || "users",
    };
  }

  if (preset === "company_lookup") {
    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.presetSource"),
      summary: field.sourceLabel?.trim() || "company",
    };
  }

  if (preset === "project_lookup") {
    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.presetSource"),
      summary: field.sourceLabel?.trim() || "projects",
    };
  }

  return {
    label: t("tenant.platformStudio.forms.builder.fieldSettings.sourceModel"),
    summary: field.lookupConfig?.sourceModel?.trim() || t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
  };
}

export function getLookupStoredValueSummary(
  field: FormsPlaceholderField,
  sourceModel: LookupSourceModelOption | null,
  t: Translate,
) {
  if (field.preset === "db_lookup_value") {
    const storedTextFields = field.lookupConfig?.storedTextFields?.length
      ? field.lookupConfig.storedTextFields
      : field.displayFields;

    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.storedValue"),
      summary: storedTextFields?.length
        ? getLookupModelFieldLabels(sourceModel, storedTextFields).join(", ")
        : t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
    };
  }

  return {
    label: t("tenant.platformStudio.forms.builder.fieldSettings.displayFields"),
    summary: field.displayFields?.length
      ? getLookupModelFieldLabels(sourceModel, field.displayFields).join(", ")
      : t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields"),
  };
}

export function getLookupSortFieldSummary(
  field: FormsPlaceholderField,
  sourceModel: LookupSourceModelOption | null,
  t: Translate,
) {
  const sortField = field.lookupConfig?.sortField || sourceModel?.defaultSortField;

  return {
    label: t("tenant.platformStudio.forms.builder.fieldSettings.sortBy"),
    summary: getLookupModelFieldLabel(sourceModel, sortField)
      || t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
  };
}
