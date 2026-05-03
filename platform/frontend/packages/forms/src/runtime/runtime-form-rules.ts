import type {
  RuntimeFormNodeDefinition,
  RuntimeFormRequirementRule,
  RuntimeFormRuleCondition,
  RuntimeFormRuleValue,
  RuntimeFormValues,
  RuntimeFormVisibilityRule,
} from "./runtime-form-types";
import {
  isRuntimeFormValueEmpty,
} from "./runtime-form-utils";

function normalizeRuleValue(value: RuntimeFormRuleValue | undefined) {
  if (typeof value === "number") {
    return Number.isNaN(value) ? "" : String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return value ?? "";
}

function normalizeFieldValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isNaN(value) ? "" : String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return typeof value === "string" ? value : "";
}

function numericCompare(
  left: unknown,
  right: RuntimeFormRuleValue | undefined,
  compare: (leftValue: number, rightValue: number) => boolean,
) {
  const leftNumber = Number(normalizeFieldValue(left));
  const rightNumber = Number(normalizeRuleValue(right));

  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
    return false;
  }

  return compare(leftNumber, rightNumber);
}

function valueMatchesAny(fieldValue: unknown, values: ReadonlyArray<RuntimeFormRuleValue> | undefined) {
  const acceptedValues = new Set((values ?? []).map((value) => normalizeRuleValue(value)));

  if (Array.isArray(fieldValue)) {
    return fieldValue.some((item) => acceptedValues.has(normalizeFieldValue(item)));
  }

  return acceptedValues.has(normalizeFieldValue(fieldValue));
}

export function evaluateRuntimeRuleCondition(values: RuntimeFormValues, condition: RuntimeFormRuleCondition) {
  const fieldValue = values[condition.fieldId];

  switch (condition.operator) {
    case "eq":
      return normalizeFieldValue(fieldValue) === normalizeRuleValue(condition.value);
    case "neq":
      return normalizeFieldValue(fieldValue) !== normalizeRuleValue(condition.value);
    case "in":
      return valueMatchesAny(fieldValue, condition.values);
    case "not_in":
      return !valueMatchesAny(fieldValue, condition.values);
    case "is_empty":
      return isRuntimeFormValueEmpty(fieldValue);
    case "not_empty":
      return !isRuntimeFormValueEmpty(fieldValue);
    case "gt":
      return numericCompare(fieldValue, condition.value, (left, right) => left > right);
    case "gte":
      return numericCompare(fieldValue, condition.value, (left, right) => left >= right);
    case "lt":
      return numericCompare(fieldValue, condition.value, (left, right) => left < right);
    case "lte":
      return numericCompare(fieldValue, condition.value, (left, right) => left <= right);
    default:
      return false;
  }
}

function ruleMatches(values: RuntimeFormValues, rule: RuntimeFormVisibilityRule | RuntimeFormRequirementRule) {
  return rule.when.all.every((condition) => evaluateRuntimeRuleCondition(values, condition));
}

export function isRuntimeNodeVisible(node: RuntimeFormNodeDefinition, values: RuntimeFormValues) {
  const visibilityRules = node.rules?.visibilityRules;
  if (!visibilityRules?.length) {
    return true;
  }

  let visible = !visibilityRules.some((rule) => rule.effect === "show");
  for (const rule of visibilityRules) {
    if (!ruleMatches(values, rule)) {
      continue;
    }

    visible = rule.effect === "show";
  }

  return visible;
}

export function isRuntimeFieldRequired(
  node: RuntimeFormNodeDefinition,
  values: RuntimeFormValues,
  baseRequired: boolean | undefined,
) {
  let required = Boolean(baseRequired);

  for (const rule of node.rules?.requirementRules ?? []) {
    if (!ruleMatches(values, rule)) {
      continue;
    }

    required = rule.effect === "required";
  }

  return required;
}
