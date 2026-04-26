import {
  type FormBuilderRuleCondition,
  type FormBuilderRuleOperator,
  type FormBuilderRuleScalar,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import { getFieldById } from "./filter-condition-editor-helpers";

export function getRuleOperatorKey(operator: FormBuilderRuleOperator) {
  return `tenant.platformStudio.forms.builder.rule.operator.${operator}`;
}

export function getRuleOperatorOptions(field: FormsPlaceholderField): ReadonlyArray<FormBuilderRuleOperator> {
  switch (field.kind) {
    case "boolean":
      return ["eq", "neq"];
    case "currency":
    case "date":
    case "date_time":
    case "decimal":
    case "integer":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "not_empty"];
    case "db_lookup":
    case "multi_select":
    case "single_select":
      return ["eq", "neq", "in", "not_in", "is_empty", "not_empty"];
    default:
      return ["eq", "neq", "in", "not_in", "is_empty", "not_empty"];
  }
}

export function ruleOperatorNeedsValue(operator: FormBuilderRuleOperator) {
  return operator !== "is_empty" && operator !== "not_empty";
}

export function ruleOperatorUsesArray(operator: FormBuilderRuleOperator) {
  return operator === "in" || operator === "not_in";
}

export function getDefaultRuleScalarValue(field: FormsPlaceholderField): FormBuilderRuleScalar {
  if (field.kind === "boolean") {
    return true;
  }

  if (field.kind === "currency" || field.kind === "decimal" || field.kind === "integer") {
    return 0;
  }

  return "";
}

export function createDefaultRuleCondition(
  fields: ReadonlyArray<FormsPlaceholderField>,
): FormBuilderRuleCondition | null {
  const field = fields[0] ?? null;
  if (!field) {
    return null;
  }

  const operator = getRuleOperatorOptions(field)[0] ?? "eq";
  return {
    fieldId: field.id,
    id: `rule-condition-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    operator,
    value: ruleOperatorNeedsValue(operator) && !ruleOperatorUsesArray(operator)
      ? getDefaultRuleScalarValue(field)
      : undefined,
    values: ruleOperatorUsesArray(operator) ? [String(getDefaultRuleScalarValue(field))] : undefined,
  };
}

export function createNextRuleConditionForField(
  condition: FormBuilderRuleCondition,
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId: string,
): FormBuilderRuleCondition | null {
  const field = getFieldById(fields, fieldId);
  if (!field) {
    return null;
  }

  const operator = getRuleOperatorOptions(field)[0] ?? "eq";
  return {
    fieldId: field.id,
    id: condition.id,
    operator,
    value: ruleOperatorNeedsValue(operator) && !ruleOperatorUsesArray(operator)
      ? getDefaultRuleScalarValue(field)
      : undefined,
    values: ruleOperatorUsesArray(operator)
      ? [String(getDefaultRuleScalarValue(field))]
      : undefined,
  };
}

export function createNextRuleConditionForOperator(
  condition: FormBuilderRuleCondition,
  field: FormsPlaceholderField,
  operator: FormBuilderRuleOperator,
): FormBuilderRuleCondition {
  return {
    fieldId: field.id,
    id: condition.id,
    operator,
    value: ruleOperatorNeedsValue(operator) && !ruleOperatorUsesArray(operator)
      ? getDefaultRuleScalarValue(field)
      : undefined,
    values: ruleOperatorUsesArray(operator)
      ? [String(getDefaultRuleScalarValue(field))]
      : undefined,
  };
}

export function stringifyRuleScalarValue(value: FormBuilderRuleScalar | undefined) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value ?? "";
}

export function parseRuleScalarValue(
  field: FormsPlaceholderField,
  value: string,
): FormBuilderRuleScalar {
  if (field.kind === "boolean") {
    return value === "true";
  }

  if (field.kind === "currency" || field.kind === "decimal" || field.kind === "integer") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return value;
}
