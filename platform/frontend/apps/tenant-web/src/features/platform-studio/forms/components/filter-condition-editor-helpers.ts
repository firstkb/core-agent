import {
  type FormBuilderFilterCondition,
  type FormBuilderFilterOperator,
  type FormBuilderFilterScalar,
  type FormBuilderFilterValueSource,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderFieldKind,
} from "../forms-placeholder-data";
import {
  createDefaultLookupClause,
  getLookupClauseDefinitions,
  getLookupPresetFromField,
  isPresetLookupField,
} from "./lookup-filter-editor-helpers";

export type FormBuilderTranslationFn = (key: string) => string;

export const relativeDatePresetOptions = [
  "current_week",
  "last_week",
  "next_week",
  "current_month",
  "last_month",
  "next_month",
  "current_quarter",
  "last_quarter",
  "next_quarter",
  "current_year",
  "last_year",
  "next_year",
  "last_12_months",
  "next_3_days",
  "next_5_days",
  "next_7_days",
  "today_or_later",
  "today_or_earlier",
] as const;

export function getFilterOperatorKey(operator: FormBuilderFilterOperator) {
  return `tenant.platformStudio.forms.builder.filter.operator.${operator}`;
}

export function getRelativeDatePresetKey(preset: typeof relativeDatePresetOptions[number]) {
  return `tenant.platformStudio.forms.builder.filter.relativeDate.${preset}`;
}

export function getFieldById(
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId: string | null | undefined,
) {
  if (!fieldId) {
    return null;
  }

  return fields.find((field) => field.id === fieldId) ?? null;
}

export function getFilterOperatorOptions(
  field: FormsPlaceholderField,
): ReadonlyArray<FormBuilderFilterOperator> {
  switch (field.kind) {
    case "attachment":
    case "boolean":
      return ["eq", "neq"];
    case "currency":
    case "decimal":
    case "integer":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "between", "is_empty", "is_not_empty"];
    case "date":
    case "date_time":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "between", "relative_date", "is_empty", "is_not_empty"];
    case "db_lookup":
    case "geo_point":
    case "multi_select":
    case "signature":
    case "single_select":
      return ["eq", "neq", "in", "is_empty", "is_not_empty"];
    case "long_text":
    case "rich_text":
    case "short_text":
    default:
      return ["eq", "neq", "contains", "not_contains", "in", "is_empty", "is_not_empty"];
  }
}

function getDefaultFilterScalarValue(field: FormsPlaceholderField): FormBuilderFilterScalar {
  if (field.kind === "boolean") {
    return true;
  }

  if (field.kind === "currency" || field.kind === "decimal" || field.kind === "integer") {
    return 0;
  }

  return "";
}

export function createDefaultFilterValueSource(
  field: FormsPlaceholderField,
  operator: FormBuilderFilterOperator,
): FormBuilderFilterValueSource | undefined {
  if (operator === "is_empty" || operator === "is_not_empty") {
    return undefined;
  }

  if (operator === "between") {
    return {
      end: getDefaultFilterScalarValue(field),
      kind: "scalar_range",
      start: getDefaultFilterScalarValue(field),
    };
  }

  if (operator === "in") {
    const firstOption = field.options?.[0];

    return {
      kind: "literal_array",
      value: [firstOption ?? getDefaultFilterScalarValue(field)],
    };
  }

  if (operator === "relative_date") {
    return {
      kind: "relative_date",
      preset: "current_month",
    };
  }

  return {
    kind: "literal",
    value: getDefaultFilterScalarValue(field),
  };
}

export function createDefaultFilterCondition(
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId?: string,
): FormBuilderFilterCondition | null {
  const field = getFieldById(fields, fieldId) ?? fields[0] ?? null;
  if (!field) {
    return null;
  }

  if (isPresetLookupField(field)) {
    const lookupPreset = getLookupPresetFromField(field);
    return {
      clauses: getLookupClauseDefinitions(lookupPreset).map((definition) => createDefaultLookupClause(definition)),
      editorType: "lookup",
      fieldId: field.id,
      lookupPreset,
    };
  }

  const operator = getFilterOperatorOptions(field)[0];

  return {
    fieldId: field.id,
    operator,
    valueSource: createDefaultFilterValueSource(field, operator),
  };
}

export function parseScalarInput(
  field: FormsPlaceholderField,
  value: string,
): FormBuilderFilterScalar {
  if (field.kind === "boolean") {
    return value === "true";
  }

  if (field.kind === "currency" || field.kind === "decimal" || field.kind === "integer") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return value;
}

export function stringifyScalarValue(value: FormBuilderFilterScalar | undefined) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value ?? "";
}

export function getScalarInputType(fieldKind: FormsPlaceholderFieldKind) {
  if (fieldKind === "currency" || fieldKind === "decimal" || fieldKind === "integer") {
    return "number";
  }

  if (fieldKind === "date") {
    return "date";
  }

  if (fieldKind === "date_time") {
    return "datetime-local";
  }

  return "text";
}
