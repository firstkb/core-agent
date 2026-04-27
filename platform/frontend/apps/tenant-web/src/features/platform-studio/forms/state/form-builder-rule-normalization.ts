import type {
  FormBuilderNodeRules,
  FormBuilderRequirementRule,
  FormBuilderRuleCondition,
  FormBuilderRuleOperator,
  FormBuilderVisibilityRule,
} from "../forms-builder-state";
import { isFilterScalar } from "./form-builder-filter-normalization";

const formBuilderRuleOperatorValues = new Set<FormBuilderRuleOperator>([
  "eq",
  "neq",
  "in",
  "not_in",
  "is_empty",
  "not_empty",
  "gt",
  "gte",
  "lt",
  "lte",
]);

function isRuleOperator(value: unknown): value is FormBuilderRuleOperator {
  return typeof value === "string" && formBuilderRuleOperatorValues.has(value as FormBuilderRuleOperator);
}

export function createDefaultNodeRules(): FormBuilderNodeRules {
  return {
    requirementRules: [],
    visibilityRules: [],
  };
}

function normalizeRuleCondition(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderRuleCondition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderRuleCondition>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.fieldId !== "string" ||
    !fieldIds.has(candidate.fieldId) ||
    !isRuleOperator(candidate.operator)
  ) {
    return null;
  }

  const usesArray = candidate.operator === "in" || candidate.operator === "not_in";
  const values = Array.isArray(candidate.values) && candidate.values.every((entry) => isFilterScalar(entry))
    ? [...candidate.values]
    : undefined;
  const valueScalar = isFilterScalar(candidate.value) ? candidate.value : undefined;

  return {
    fieldId: candidate.fieldId,
    id: candidate.id,
    operator: candidate.operator,
    value: usesArray ? undefined : valueScalar,
    values: usesArray ? values : undefined,
  };
}

function normalizeVisibilityRule(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderVisibilityRule | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderVisibilityRule> & { when?: { all?: unknown } };
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    (candidate.effect !== "show" && candidate.effect !== "hide")
  ) {
    return null;
  }

  const all = Array.isArray(candidate.when?.all)
    ? candidate.when.all
        .map((entry) => normalizeRuleCondition(entry, fieldIds))
        .filter((entry): entry is FormBuilderRuleCondition => Boolean(entry))
    : [];

  return {
    effect: candidate.effect,
    id: candidate.id,
    when: {
      all,
    },
  };
}

function normalizeRequirementRule(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderRequirementRule | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderRequirementRule> & { when?: { all?: unknown } };
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    (candidate.effect !== "required" && candidate.effect !== "optional")
  ) {
    return null;
  }

  const all = Array.isArray(candidate.when?.all)
    ? candidate.when.all
        .map((entry) => normalizeRuleCondition(entry, fieldIds))
        .filter((entry): entry is FormBuilderRuleCondition => Boolean(entry))
    : [];

  return {
    effect: candidate.effect,
    id: candidate.id,
    when: {
      all,
    },
  };
}

export function normalizeNodeRules(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderNodeRules {
  if (!value || typeof value !== "object") {
    return createDefaultNodeRules();
  }

  const candidate = value as Partial<FormBuilderNodeRules>;
  return {
    requirementRules: Array.isArray(candidate.requirementRules)
      ? candidate.requirementRules
          .map((entry) => normalizeRequirementRule(entry, fieldIds))
          .filter((entry): entry is FormBuilderRequirementRule => Boolean(entry))
      : [],
    visibilityRules: Array.isArray(candidate.visibilityRules)
      ? candidate.visibilityRules
          .map((entry) => normalizeVisibilityRule(entry, fieldIds))
          .filter((entry): entry is FormBuilderVisibilityRule => Boolean(entry))
      : [],
  };
}
