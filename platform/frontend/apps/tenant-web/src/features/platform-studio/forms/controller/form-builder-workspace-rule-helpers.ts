import { type useTranslation } from "@platform/i18n";

import {
  createDefaultRuleCondition,
  getRuleOperatorKey,
  ruleOperatorNeedsValue,
  ruleOperatorUsesArray,
  stringifyRuleScalarValue,
} from "../components/rule-condition-editor-helpers";
import {
  type FormBuilderNode,
  type FormBuilderRequirementRule,
  type FormBuilderRuleCondition,
  type FormBuilderRuntimePreset,
  type FormBuilderVisibilityRule,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import { getFieldById } from "./form-builder-workspace-field-scope-grid";

type Translate = ReturnType<typeof useTranslation>["t"];

function createRuleId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRuleCondition(condition: FormBuilderRuleCondition): FormBuilderRuleCondition {
  return {
    ...condition,
    values: condition.values ? [...condition.values] : undefined,
  };
}

export function cloneVisibilityRule(rule: FormBuilderVisibilityRule): FormBuilderVisibilityRule {
  return {
    ...rule,
    when: {
      all: rule.when.all.map(cloneRuleCondition),
    },
  };
}

export function cloneRequirementRule(rule: FormBuilderRequirementRule): FormBuilderRequirementRule {
  return {
    ...rule,
    when: {
      all: rule.when.all.map(cloneRuleCondition),
    },
  };
}

export function getSingleConditionVisibilityRule(
  rule: FormBuilderVisibilityRule,
  fields: ReadonlyArray<FormsPlaceholderField>,
): FormBuilderVisibilityRule | null {
  const condition = rule.when.all[0] ?? createDefaultRuleCondition(fields);
  if (!condition) {
    return null;
  }

  return {
    ...rule,
    when: {
      all: [cloneRuleCondition(condition)],
    },
  };
}

export function getSingleConditionRequirementRule(
  rule: FormBuilderRequirementRule,
  fields: ReadonlyArray<FormsPlaceholderField>,
): FormBuilderRequirementRule | null {
  const condition = rule.when.all[0] ?? createDefaultRuleCondition(fields);
  if (!condition) {
    return null;
  }

  return {
    ...rule,
    when: {
      all: [cloneRuleCondition(condition)],
    },
  };
}

export function upsertVisibilityRule(
  rules: ReadonlyArray<FormBuilderVisibilityRule>,
  index: number | null,
  rule: FormBuilderVisibilityRule,
) {
  return index === null
    ? [...rules, rule]
    : rules.map((entry, entryIndex) => (entryIndex === index ? rule : entry));
}

export function removeVisibilityRule(
  rules: ReadonlyArray<FormBuilderVisibilityRule>,
  index: number,
) {
  return rules.filter((_, entryIndex) => entryIndex !== index);
}

export function upsertRequirementRule(
  rules: ReadonlyArray<FormBuilderRequirementRule>,
  index: number | null,
  rule: FormBuilderRequirementRule,
) {
  return index === null
    ? [...rules, rule]
    : rules.map((entry, entryIndex) => (entryIndex === index ? rule : entry));
}

export function removeRequirementRule(
  rules: ReadonlyArray<FormBuilderRequirementRule>,
  index: number,
) {
  return rules.filter((_, entryIndex) => entryIndex !== index);
}

function getRuleConditionSummary(
  condition: FormBuilderRuleCondition,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: Translate,
) {
  const field = getFieldById(fields, condition.fieldId) ?? null;
  const operatorLabel = t(getRuleOperatorKey(condition.operator));

  if (!field) {
    return operatorLabel;
  }

  if (!ruleOperatorNeedsValue(condition.operator)) {
    return `${field.label} ${operatorLabel}`;
  }

  if (ruleOperatorUsesArray(condition.operator)) {
    const values = (condition.values ?? [])
      .map((entry) => stringifyRuleScalarValue(entry).trim())
      .filter(Boolean);
    const valueSummary = values.length
      ? values.join(", ")
      : t("tenant.platformStudio.forms.builder.rule.noValue");

    return `${field.label} ${operatorLabel} ${valueSummary}`;
  }

  const valueSummary = stringifyRuleScalarValue(condition.value).trim();
  return valueSummary
    ? `${field.label} ${operatorLabel} ${valueSummary}`
    : `${field.label} ${operatorLabel}`;
}

export function getRuleSummary(
  rule: Pick<FormBuilderVisibilityRule, "when"> | Pick<FormBuilderRequirementRule, "when">,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: Translate,
) {
  return rule.when.all
    .map((condition) => getRuleConditionSummary(condition, fields, t))
    .filter(Boolean)
    .join(" · ");
}

export function createDefaultVisibilityRule(
  fields: ReadonlyArray<FormsPlaceholderField>,
): FormBuilderVisibilityRule | null {
  const condition = createDefaultRuleCondition(fields);
  if (!condition) {
    return null;
  }

  return {
    effect: "show",
    id: createRuleId("visibility-rule"),
    when: {
      all: [condition],
    },
  };
}

export function createDefaultRequirementRule(
  fields: ReadonlyArray<FormsPlaceholderField>,
): FormBuilderRequirementRule | null {
  const condition = createDefaultRuleCondition(fields);
  if (!condition) {
    return null;
  }

  return {
    effect: "required",
    id: createRuleId("requirement-rule"),
    when: {
      all: [condition],
    },
  };
}

export function getCompatibleRuntimePresets(
  field: FormsPlaceholderField,
  visibility: FormBuilderNode["visibility"],
): ReadonlyArray<FormBuilderRuntimePreset> {
  const presets: FormBuilderRuntimePreset[] = [];

  if (field.kind === "single_select") {
    presets.push("select", "radio_chips", "badge");
  }

  if (field.kind === "db_lookup") {
    presets.push("relation_summary_card");
  }

  if (visibility === "readonly") {
    presets.push("readonly_card");
  }

  return [...new Set(presets)];
}
