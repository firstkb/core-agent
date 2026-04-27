import type {
  FormBuilderFilterCondition,
  FormBuilderFilterDefinitions,
  FormBuilderFilterGroup,
  FormBuilderFilterOperator,
  FormBuilderFilterScalar,
  FormBuilderFilterToken,
  FormBuilderFilterValueSource,
  FormBuilderLookupDynamicToken,
  FormBuilderLookupFilterClause,
  FormBuilderLookupFilterCondition,
  FormBuilderLookupPreset,
  FormBuilderQuickFilter,
  FormBuilderRelativeDatePreset,
  FormBuilderScalarFilterCondition,
} from "../forms-builder-state";

const formBuilderFilterTokenValues = new Set<FormBuilderFilterToken>([
  "currentUser.companyId",
  "currentUser.companyName",
  "currentUser.divisionId",
  "currentUser.divisionName",
  "currentUser.projectAccessIds",
]);
const formBuilderLookupDynamicTokenValues = new Set<FormBuilderLookupDynamicToken>([
  "assigned_projects",
  "current_user_company_id",
  "current_user_company_name",
  "current_user_division_id",
  "current_user_division_name",
  "current_user_id",
]);
const formBuilderLookupPresetValues = new Set<FormBuilderLookupPreset>([
  "company_lookup",
  "contact_lookup",
  "generic_db_lookup",
  "project_lookup",
]);
const formBuilderRelativeDatePresetValues = new Set<FormBuilderRelativeDatePreset>([
  "current_month",
  "current_quarter",
  "current_week",
  "current_year",
  "last_12_months",
  "last_month",
  "last_quarter",
  "last_week",
  "last_year",
  "next_3_days",
  "next_5_days",
  "next_7_days",
  "next_month",
  "next_quarter",
  "next_week",
  "next_year",
  "today_or_earlier",
  "today_or_later",
]);
const formBuilderFilterOperatorValues = new Set<FormBuilderFilterOperator>([
  "between",
  "contains",
  "eq",
  "gt",
  "gte",
  "in",
  "is_empty",
  "is_not_empty",
  "lt",
  "lte",
  "neq",
  "not_contains",
  "relative_date",
]);

function isFilterToken(value: unknown): value is FormBuilderFilterToken {
  return typeof value === "string" && formBuilderFilterTokenValues.has(value as FormBuilderFilterToken);
}

function isLookupDynamicToken(value: unknown): value is FormBuilderLookupDynamicToken {
  return typeof value === "string" && formBuilderLookupDynamicTokenValues.has(value as FormBuilderLookupDynamicToken);
}

function isLookupPreset(value: unknown): value is FormBuilderLookupPreset {
  return typeof value === "string" && formBuilderLookupPresetValues.has(value as FormBuilderLookupPreset);
}

function isRelativeDatePreset(value: unknown): value is FormBuilderRelativeDatePreset {
  return typeof value === "string" && formBuilderRelativeDatePresetValues.has(value as FormBuilderRelativeDatePreset);
}

function isFilterOperator(value: unknown): value is FormBuilderFilterOperator {
  return typeof value === "string" && formBuilderFilterOperatorValues.has(value as FormBuilderFilterOperator);
}

export function isFilterScalar(value: unknown): value is FormBuilderFilterScalar {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export function createDefaultFilterDefinitions(): FormBuilderFilterDefinitions {
  return {
    defaultFilters: {
      conditions: [],
      logic: "and",
    },
    quickFilters: [],
    version: 1,
  };
}

function normalizeFilterValueSource(value: unknown): FormBuilderFilterValueSource | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<FormBuilderFilterValueSource> & { value?: unknown };
  if (candidate.kind === "literal" && isFilterScalar(candidate.value)) {
    return { kind: "literal", value: candidate.value };
  }
  if (
    candidate.kind === "literal_array" &&
    Array.isArray(candidate.value) &&
    candidate.value.length > 0 &&
    candidate.value.every((entry) => isFilterScalar(entry))
  ) {
    return { kind: "literal_array", value: [...candidate.value] };
  }
  if (candidate.kind === "token" && isFilterToken(candidate.token)) {
    return { kind: "token", token: candidate.token };
  }
  if (candidate.kind === "scalar_range" && isFilterScalar(candidate.start) && isFilterScalar(candidate.end)) {
    return { end: candidate.end, kind: "scalar_range", start: candidate.start };
  }
  if (candidate.kind === "relative_date" && isRelativeDatePreset(candidate.preset)) {
    return { kind: "relative_date", preset: candidate.preset };
  }

  return undefined;
}

function operatorNeedsValue(operator: FormBuilderFilterOperator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

function normalizeLookupFilterClause(value: unknown): FormBuilderLookupFilterClause | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderLookupFilterClause>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.clauseKey !== "string" ||
    candidate.clauseKey.trim().length === 0
  ) {
    return null;
  }

  if (candidate.valueMode === "dynamic_token") {
    return isLookupDynamicToken(candidate.dynamicToken)
      ? { clauseKey: candidate.clauseKey, dynamicToken: candidate.dynamicToken, id: candidate.id, valueMode: "dynamic_token" }
      : null;
  }
  if (candidate.valueMode === "boolean_flag") {
    return { clauseKey: candidate.clauseKey, id: candidate.id, value: typeof candidate.value === "boolean" ? candidate.value : true, valueMode: "boolean_flag" };
  }
  if (candidate.valueMode === "literal" && isFilterScalar(candidate.value)) {
    return { clauseKey: candidate.clauseKey, id: candidate.id, value: candidate.value, valueMode: "literal" };
  }

  return null;
}

function normalizeFilterCondition(value: unknown, fieldIds: ReadonlySet<string>): FormBuilderFilterCondition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderFilterCondition>;
  if (typeof candidate.fieldId !== "string" || !fieldIds.has(candidate.fieldId)) {
    return null;
  }

  if ((candidate as Partial<FormBuilderLookupFilterCondition>).editorType === "lookup") {
    const lookupCandidate = candidate as Partial<FormBuilderLookupFilterCondition>;
    if (typeof lookupCandidate.fieldId !== "string" || !isLookupPreset(lookupCandidate.lookupPreset) || !Array.isArray(lookupCandidate.clauses)) {
      return null;
    }

    return {
      clauses: lookupCandidate.clauses
        .map((entry) => normalizeLookupFilterClause(entry))
        .filter((entry): entry is FormBuilderLookupFilterClause => Boolean(entry)),
      editorType: "lookup",
      fieldId: lookupCandidate.fieldId,
      lookupPreset: lookupCandidate.lookupPreset,
    };
  }

  const scalarCandidate = candidate as Partial<FormBuilderScalarFilterCondition>;
  if (typeof scalarCandidate.fieldId !== "string" || !isFilterOperator(scalarCandidate.operator)) {
    return null;
  }

  const operator = scalarCandidate.operator;
  const valueSource = normalizeFilterValueSource(scalarCandidate.valueSource);
  return operatorNeedsValue(operator) && !valueSource
    ? null
    : { fieldId: scalarCandidate.fieldId, operator, valueSource };
}

function normalizeFilterGroup(value: unknown, fieldIds: ReadonlySet<string>): FormBuilderFilterGroup {
  if (!value || typeof value !== "object") {
    return { conditions: [], logic: "and" };
  }

  const candidate = value as { conditions?: unknown };
  return {
    conditions: Array.isArray(candidate.conditions)
      ? candidate.conditions
          .map((entry) => normalizeFilterCondition(entry, fieldIds))
          .filter((entry): entry is FormBuilderFilterCondition => Boolean(entry))
      : [],
    logic: "and",
  };
}

function normalizeQuickFilter(value: unknown, fieldIds: ReadonlySet<string>): FormBuilderQuickFilter | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderQuickFilter>;
  if (typeof candidate.id !== "string" || candidate.id.trim().length === 0 || typeof candidate.label !== "string" || candidate.label.trim().length === 0) {
    return null;
  }

  return {
    color: typeof candidate.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(candidate.color) ? candidate.color : undefined,
    conditions: normalizeFilterGroup(candidate, fieldIds).conditions,
    id: candidate.id,
    label: candidate.label,
    logic: "and",
  };
}

export function normalizeFilterDefinitions(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderFilterDefinitions {
  if (!value || typeof value !== "object") {
    return createDefaultFilterDefinitions();
  }

  const candidate = value as Partial<FormBuilderFilterDefinitions>;
  return {
    defaultFilters: normalizeFilterGroup(candidate.defaultFilters, fieldIds),
    quickFilters: Array.isArray(candidate.quickFilters)
      ? candidate.quickFilters
          .map((entry) => normalizeQuickFilter(entry, fieldIds))
          .filter((entry): entry is FormBuilderQuickFilter => Boolean(entry))
      : [],
    version: 1,
  };
}
