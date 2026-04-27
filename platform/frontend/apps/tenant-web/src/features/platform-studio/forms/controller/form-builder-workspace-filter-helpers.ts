import { type useTranslation } from "@platform/i18n";

import {
  getFilterOperatorKey,
  getRelativeDatePresetKey,
  stringifyScalarValue,
} from "../components/filter-condition-editor-helpers";
import {
  getLookupClauseKey,
  getLookupDynamicTokenKey,
  lookupDynamicTokenOptions,
} from "../components/lookup-filter-editor-helpers";
import {
  type FormBuilderFilterCondition,
  type FormBuilderLookupFilterClause,
  type FormBuilderQuickFilter,
  type FormBuilderScalarFilterCondition,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import { getFieldById } from "./form-builder-workspace-field-scope-grid";

type Translate = ReturnType<typeof useTranslation>["t"];

const filterTokenOptions = [
  "currentUser.companyId",
  "currentUser.companyName",
  "currentUser.divisionId",
  "currentUser.divisionName",
  "currentUser.projectAccessIds",
] as const;

function getFilterTokenKey(token: typeof filterTokenOptions[number]) {
  return `tenant.platformStudio.forms.builder.filter.token.${token}`;
}

export function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : "";
}

export function upsertDefaultFilterCondition(
  conditions: ReadonlyArray<FormBuilderFilterCondition>,
  index: number | null,
  condition: FormBuilderFilterCondition,
) {
  return index === null
    ? [...conditions, condition]
    : conditions.map((entry, entryIndex) => (entryIndex === index ? condition : entry));
}

export function removeDefaultFilterCondition(
  conditions: ReadonlyArray<FormBuilderFilterCondition>,
  index: number,
) {
  return conditions.filter((_, entryIndex) => entryIndex !== index);
}

export function upsertQuickFilter(
  quickFilters: ReadonlyArray<FormBuilderQuickFilter>,
  index: number | null,
  quickFilter: FormBuilderQuickFilter,
) {
  return index === null
    ? [...quickFilters, quickFilter]
    : quickFilters.map((entry, entryIndex) => (entryIndex === index ? quickFilter : entry));
}

function getFilterValueSummary(
  field: FormsPlaceholderField,
  valueSource: FormBuilderScalarFilterCondition["valueSource"],
  t: Translate,
) {
  if (!valueSource) {
    return "";
  }

  if (valueSource.kind === "token") {
    return t(getFilterTokenKey(valueSource.token));
  }

  if (valueSource.kind === "relative_date") {
    return t(getRelativeDatePresetKey(valueSource.preset));
  }

  if (valueSource.kind === "literal_array") {
    return valueSource.value.join(", ");
  }

  if (valueSource.kind === "scalar_range") {
    return `${stringifyScalarValue(valueSource.start)} - ${stringifyScalarValue(valueSource.end)}`;
  }

  if (field.kind === "boolean" && typeof valueSource.value === "boolean") {
    return t(valueSource.value
      ? "tenant.platformStudio.forms.builder.boolean.true"
      : "tenant.platformStudio.forms.builder.boolean.false");
  }

  return stringifyScalarValue(valueSource.value);
}

function getLookupClauseSummary(
  clause: FormBuilderLookupFilterClause,
  t: Translate,
) {
  const clauseLabel = t(getLookupClauseKey(clause.clauseKey));
  if (clause.valueMode === "boolean_flag") {
    return clause.value
      ? clauseLabel
      : `${clauseLabel}: ${t("tenant.platformStudio.forms.builder.boolean.false")}`;
  }

  if (clause.valueMode === "dynamic_token") {
    return `${clauseLabel}: ${t(getLookupDynamicTokenKey(clause.dynamicToken ?? lookupDynamicTokenOptions[0]))}`;
  }

  return `${clauseLabel}: ${stringifyScalarValue(clause.value)}`;
}

export function getFilterConditionSummary(
  condition: FormBuilderFilterCondition,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: Translate,
) {
  const field = getFieldById(fields, condition.fieldId);
  if (!field) {
    return t("tenant.platformStudio.forms.builder.filter.emptyValue");
  }

  if ("editorType" in condition && condition.editorType === "lookup") {
    const activeClauses = condition.clauses.filter((clause) => {
      if (clause.valueMode === "boolean_flag") {
        return Boolean(clause.value);
      }

      if (clause.valueMode === "literal") {
        return String(clause.value ?? "").trim().length > 0;
      }

      return true;
    });

    if (activeClauses.length === 0) {
      return t("tenant.platformStudio.forms.builder.filter.lookupEmptyClauses");
    }

    return activeClauses
      .map((clause) => getLookupClauseSummary(clause, t))
      .join(" · ");
  }

  const scalarCondition = condition as FormBuilderScalarFilterCondition;

  if (scalarCondition.operator === "is_empty" || scalarCondition.operator === "is_not_empty") {
    return t(getFilterOperatorKey(scalarCondition.operator));
  }

  const valueSummary = getFilterValueSummary(field, scalarCondition.valueSource, t);
  const operatorLabel = t(getFilterOperatorKey(scalarCondition.operator));

  return valueSummary ? `${operatorLabel} ${valueSummary}` : operatorLabel;
}

export function getQuickFilterSummary(
  quickFilter: FormBuilderQuickFilter,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: Translate,
) {
  if (quickFilter.conditions.length === 0) {
    return t("tenant.platformStudio.forms.builder.filter.emptyDefaultFilters");
  }

  return quickFilter.conditions
    .map((condition) => {
      const field = getFieldById(fields, condition.fieldId);
      const prefix = field?.label ?? t("tenant.platformStudio.forms.builder.filter.fieldLabel");
      return `${prefix}: ${getFilterConditionSummary(condition, fields, t)}`;
    })
    .join(" · ");
}
