import { type useTranslation } from "@platform/i18n";

import {
  type BuilderCanvasBreadcrumbItem,
  type BuilderCanvasNodeItem,
  type BuilderCanvasUnplacedFieldItem,
} from "../components/builder-canvas";
import { type GridSettingsFieldItem } from "../components/grid-settings-panel";
import { type LookupSourcePickerModelItem } from "../components/lookup-source-picker-dialog";
import { type RulesPanelRuleItem } from "../components/rules-panel";
import {
  type ViewSettingsDefaultFilterItem,
  type ViewSettingsFilterFieldOption,
} from "../components/view-settings-default-filters-section";
import { type ViewSettingsSortingFieldItem } from "../components/view-settings-actions-sorting-section";
import {
  getFormBuilderDisplayLabel,
  getFormBuilderNodeSummary,
  isFormBuilderContainer,
  type FormBuilderDocument,
  type FormBuilderFilterCondition,
  type FormBuilderLookupFilterClause,
  type FormBuilderLookupFilterCondition,
  type FormBuilderGridColumnDefinition,
  type FormBuilderNode,
  type FormBuilderRequirementRule,
  type FormBuilderVisibilityRule,
} from "../forms-builder-state";
import {
  getFormsPlaceholderFieldDisplayName,
  getFormsPlaceholderFieldIconKey,
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { type LookupSourceModelOption } from "./form-builder-workspace-lookup-options";

type Translate = ReturnType<typeof useTranslation>["t"];

type FieldTypeKeyResolver = (field: Pick<FormsPlaceholderField, "historicalUpdates" | "kind">) => string;

type SummaryTextResolver = (
  node: FormBuilderNode,
  document: FormBuilderDocument,
  objectTitle: string,
  objectFields: ReadonlyArray<FormsPlaceholderField>,
  summaryKey: string,
  t: Translate,
  childrenCount: number,
) => string;

type RuleSummaryResolver = (
  rule: Pick<FormBuilderVisibilityRule, "when"> | Pick<FormBuilderRequirementRule, "when">,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: Translate,
) => string;

type FilterConditionSummaryResolver = (
  condition: FormBuilderFilterCondition,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: Translate,
) => string;

const lookupFilterOrGroupClauseKeys = new Set([
  "active_account",
  "by_user_company",
  "business_unit_is_user_company",
  "main_company_is_user_company",
  "project_in_user_access",
]);

export function createCanvasBreadcrumbItems({
  breadcrumb,
  currentModel,
}: {
  breadcrumb: ReadonlyArray<FormBuilderNode>;
  currentModel: FormsPlaceholderModel;
}): ReadonlyArray<BuilderCanvasBreadcrumbItem> {
  return breadcrumb.map((node) => ({
    id: node.id,
    label: getFormBuilderDisplayLabel(node, currentModel),
  }));
}

export function createCanvasNodeItems({
  attentionNodeIds,
  currentModel,
  currentNodes,
  document,
  getSummaryText,
  t,
}: {
  attentionNodeIds: ReadonlySet<string>;
  currentModel: FormsPlaceholderModel;
  currentNodes: ReadonlyArray<FormBuilderNode>;
  document: FormBuilderDocument;
  getSummaryText: SummaryTextResolver;
  t: Translate;
}): ReadonlyArray<BuilderCanvasNodeItem> {
  const fieldsById = new Map(currentModel.fields.map((field) => [field.id, field]));
  const childCountByParentId = createChildCountByParentId(document);

  return currentNodes.map((node) => {
    const summaryKey = getFormBuilderNodeSummary(node, document, currentModel);
    const iconKey = node.type === "field"
      ? getFormsPlaceholderFieldIconKey(fieldsById.get(node.fieldId ?? "") ?? {
          family: "core",
          id: "missing-field",
          isLocked: false,
          kind: "short_text",
          label: "Field",
        })
      : node.type;

    return {
      hasAttention: attentionNodeIds.has(node.id),
      iconKey,
      id: node.id,
      isContainer: isFormBuilderContainer(node.type),
      label: getFormBuilderDisplayLabel(node, currentModel),
      summary: getSummaryText(
        node,
        document,
        currentModel.title,
        currentModel.fields,
        summaryKey,
        t,
        childCountByParentId.get(node.id) ?? 0,
      ),
      visibility: node.visibility,
    };
  });
}

function createChildCountByParentId(document: FormBuilderDocument) {
  const counts = new Map<string, number>();

  for (const node of document.rootScope.uiSchema.nodes) {
    if (node.parentId) {
      counts.set(node.parentId, (counts.get(node.parentId) ?? 0) + 1);
    }
  }

  for (const scope of document.subformScopes) {
    let rootChildCount = 0;
    for (const node of scope.uiSchema.nodes) {
      if (node.parentId) {
        counts.set(node.parentId, (counts.get(node.parentId) ?? 0) + 1);
      } else {
        rootChildCount += 1;
      }
    }

    counts.set(scope.parentSubformNodeId, rootChildCount);
  }

  return counts;
}

export function createCanvasUnplacedFields({
  fields,
  getFieldTypeKey,
  t,
}: {
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldTypeKey: FieldTypeKeyResolver;
  t: Translate;
}): ReadonlyArray<BuilderCanvasUnplacedFieldItem> {
  return fields.map((field) => ({
    id: field.id,
    label: getFormsPlaceholderFieldDisplayName(field),
    summary: t(getFieldTypeKey(field)),
  }));
}

export function createGridSettingsFieldItems({
  columns,
  fields,
}: {
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>;
  fields: ReadonlyArray<FormsPlaceholderField>;
}): ReadonlyArray<GridSettingsFieldItem> {
  return fields.map((field) => {
    const column = columns.find((entry) => entry.fieldId === field.id) ?? null;

    return {
      iconKey: getFormsPlaceholderFieldIconKey(field),
      id: field.id,
      label: field.label,
      visible: column?.visible ?? false,
    };
  });
}

export function createRulesPanelRuleItems({
  fields,
  getRuleSummary,
  rules,
  t,
}: {
  fields: ReadonlyArray<FormsPlaceholderField>;
  getRuleSummary: RuleSummaryResolver;
  rules: ReadonlyArray<FormBuilderVisibilityRule | FormBuilderRequirementRule>;
  t: Translate;
}): ReadonlyArray<RulesPanelRuleItem> {
  return rules.map((rule) => ({
    effectLabel: t(`tenant.platformStudio.forms.builder.rule.effect.${rule.effect}`),
    id: rule.id,
    summary: getRuleSummary(rule, fields, t),
  }));
}

export function createViewSettingsSortingFields(
  fields: ReadonlyArray<FormsPlaceholderField>,
): ReadonlyArray<ViewSettingsSortingFieldItem> {
  return fields.map((field) => ({
    id: field.id,
    label: field.label,
  }));
}

export function createViewSettingsFilterFieldOptions(
  fields: ReadonlyArray<FormsPlaceholderField>,
): ReadonlyArray<ViewSettingsFilterFieldOption> {
  return fields.map((field) => ({
    id: field.id,
    label: field.label,
  }));
}

export function createViewSettingsDefaultFilterItems({
  conditions,
  fields,
  getFilterConditionSummary,
  t,
}: {
  conditions: ReadonlyArray<FormBuilderFilterCondition>;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFilterConditionSummary: FilterConditionSummaryResolver;
  t: Translate;
}): ReadonlyArray<ViewSettingsDefaultFilterItem> {
  const fieldLabelsById = new Map(fields.map((field) => [field.id, field.label]));
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const lookupGroupsByClauseKey = new Map<string, ViewSettingsDefaultFilterItem>();
  const items: ViewSettingsDefaultFilterItem[] = [];

  conditions.forEach((condition, index) => {
    const fieldLabel = fieldLabelsById.get(condition.fieldId)
      ?? t("tenant.platformStudio.forms.builder.filter.fieldLabel");
    const field = fieldsById.get(condition.fieldId);
    const activeLookupClauses = getDisplayableLookupOrClauses(condition, field);

    if (activeLookupClauses.length === 0 || !isLookupFilterCondition(condition)) {
      items.push({
        fieldLabel,
        id: `default-filter-${index}`,
        index,
        summary: getFilterConditionSummary(condition, fields, t),
      });
      return;
    }

    for (const clause of activeLookupClauses) {
      const group = lookupGroupsByClauseKey.get(clause.clauseKey);
      if (group) {
        if (!group.actionItems?.some((action) => action.index === index)) {
          group.actionItems = [...(group.actionItems ?? []), { fieldLabel, index }];
          group.fieldLabels = [...(group.fieldLabels ?? []), fieldLabel];
        }
        continue;
      }

      const groupedCondition: FormBuilderLookupFilterCondition = {
        ...condition,
        clauses: [clause],
      };
      const nextGroup: ViewSettingsDefaultFilterItem = {
        actionItems: [{ fieldLabel, index }],
        connective: "or",
        fieldLabel,
        fieldLabels: [fieldLabel],
        id: `default-filter-lookup-or-${clause.clauseKey}`,
        index,
        summary: getFilterConditionSummary(groupedCondition, fields, t),
      };

      lookupGroupsByClauseKey.set(clause.clauseKey, nextGroup);
      items.push(nextGroup);
    }
  });

  return items;
}

function getDisplayableLookupOrClauses(
  condition: FormBuilderFilterCondition,
  field: FormsPlaceholderField | undefined,
): ReadonlyArray<FormBuilderLookupFilterClause> {
  if (!isLookupFilterCondition(condition) || !field || field.kind !== "db_lookup") {
    return [];
  }

  if (field.selectionMode === "multiple") {
    return [];
  }

  if (condition.lookupPreset !== field.preset) {
    return [];
  }

  return condition.clauses.filter((clause) =>
    clause.valueMode === "boolean_flag" &&
    clause.value === true &&
    lookupFilterOrGroupClauseKeys.has(clause.clauseKey)
  );
}

function isLookupFilterCondition(
  condition: FormBuilderFilterCondition,
): condition is FormBuilderLookupFilterCondition {
  return "editorType" in condition && condition.editorType === "lookup";
}

export function createLookupSourcePickerModelItems({
  sourceModels,
  sourceModelsById,
}: {
  sourceModels: ReadonlyArray<LookupSourceModelOption>;
  sourceModelsById: Readonly<Record<string, LookupSourceModelOption>>;
}): ReadonlyArray<LookupSourcePickerModelItem> {
  return sourceModels.map((modelOption) => {
    const loadedModelOption = sourceModelsById[modelOption.id];

    return {
      activeFilterField: loadedModelOption?.activeFilterField ?? modelOption.activeFilterField,
      defaultDisplayFields: loadedModelOption ? [...loadedModelOption.defaultDisplayFields] : [],
      defaultSortField: loadedModelOption?.defaultSortField ?? "",
      fieldCount: loadedModelOption?.fields.length ?? null,
      id: modelOption.id,
      label: modelOption.label,
    };
  });
}

export function createLookupSourcePickerSelectedFieldsSummary({
  getLookupModelFieldLabels,
  lookupSourcePicker,
  selectedModel,
  t,
}: {
  getLookupModelFieldLabels: (
    model: LookupSourceModelOption | null,
    fieldKeys: ReadonlyArray<string> | undefined,
  ) => ReadonlyArray<string>;
  lookupSourcePicker: { selectedFieldKeys: ReadonlyArray<string> } | null;
  selectedModel: LookupSourceModelOption | null;
  t: Translate;
}) {
  if (!lookupSourcePicker || !selectedModel) {
    return "";
  }

  return lookupSourcePicker.selectedFieldKeys.length > 0
    ? getLookupModelFieldLabels(selectedModel, lookupSourcePicker.selectedFieldKeys).join(", ")
    : t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields");
}
