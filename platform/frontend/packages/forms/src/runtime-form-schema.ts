import type {
  RuntimeFormAccordionLayoutDefinition,
  RuntimeFormCommitMode,
  RuntimeFormContentDefinition,
  RuntimeFormContentValueBinding,
  RuntimeFormChoiceOptionStyleVariant,
  RuntimeFormChoiceOrientation,
  RuntimeFormChoiceRenderStyle,
  RuntimeFormDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormFieldOption,
  RuntimeFormFieldType,
  RuntimeFormGridLayoutDefinition,
  RuntimeFormGroupLayoutDefinition,
  RuntimeFormInputMode,
  RuntimeFormLabels,
  RuntimeFormLayoutDefinition,
  RuntimeFormLookupDefinition,
  RuntimeFormLookupFilter,
  RuntimeFormLookupFilterOperator,
  RuntimeFormLookupFilterScalar,
  RuntimeFormMode,
  RuntimeFormNodeDefinition,
  RuntimeFormNodeRules,
  RuntimeFormRequirementRule,
  RuntimeFormRuleCondition,
  RuntimeFormRuleOperator,
  RuntimeFormRuleValue,
  RuntimeFormSectionDefinition,
  RuntimeFormSubformColumnType,
  RuntimeFormSubformDefinition,
  RuntimeFormTabsLayoutDefinition,
  RuntimeFormTextInputType,
  RuntimeFormTextValidation,
  RuntimeFormVisibilityRule,
} from "./runtime-form";
import { resolveRuntimeFormLabels } from "./runtime/runtime-form-labels";

type JsonRecord = Record<string, unknown>;

export type RuntimeFormSchemaSource = {
  commitMode: RuntimeFormCommitMode;
  dataSchema?: JsonRecord;
  description?: string;
  labels?: RuntimeFormLabels;
  mode: RuntimeFormMode;
  modelId: string;
  title?: string;
  uiSchema?: JsonRecord;
  viewId: string;
};

type CompileContext = {
  fieldById: Map<string, JsonRecord>;
  nodesByParentId: Map<string | null, JsonRecord[]>;
  subformDataScopeById: Map<string, JsonRecord>;
  subformUiScopeById: Map<string, JsonRecord>;
  labels: ReturnType<typeof resolveRuntimeFormLabels>;
  workflowStatus?: {
    fieldId: string;
    finalValue?: string;
    initialValue?: string;
  };
};

const runtimeFieldTypes = new Set<RuntimeFormFieldType>([
  "boolean",
  "currency",
  "date",
  "date_time",
  "decimal",
  "integer",
  "long_text",
  "multi_select",
  "rich_text",
  "short_text",
  "single_select",
]);

const runtimeRuleOperators = new Set<RuntimeFormRuleOperator>([
  "eq",
  "gt",
  "gte",
  "in",
  "is_empty",
  "lt",
  "lte",
  "neq",
  "not_empty",
  "not_in",
]);

const runtimeChoiceOptionStyleVariants = new Set<RuntimeFormChoiceOptionStyleVariant>([
  "danger",
  "default",
  "info",
  "primary",
  "secondary",
  "success",
  "warning",
]);

const runtimeInputModes = new Set<RuntimeFormInputMode>([
  "decimal",
  "email",
  "none",
  "numeric",
  "search",
  "tel",
  "text",
  "url",
]);

const runtimeTextValidations = new Set<RuntimeFormTextValidation>(["email", "phone", "url"]);
const runtimeLookupFilterOperators = new Set<RuntimeFormLookupFilterOperator>([
  "contains",
  "eq",
  "in",
  "is_empty",
  "is_not_empty",
  "not_eq",
  "starts_with",
]);

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function firstStringValue(...values: unknown[]) {
  for (const value of values) {
    const normalized = stringValue(value);
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

function stringListValue(...values: unknown[]) {
  for (const value of values) {
    const out = asArray(value)
      .flatMap((entry) => {
        const normalized = stringValue(entry);
        return normalized ? [normalized] : [];
      });
    if (out.length > 0) {
      return out;
    }
  }
  return undefined;
}

function boolValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function optionStringValue(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function numericValue(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function orderValue(node: JsonRecord, fallback: number) {
  return numericValue(node.order) ?? fallback;
}

function orderedNodes(nodes: ReadonlyArray<JsonRecord>) {
  return nodes.map((node, index) => ({ index, node })).sort((left, right) => {
    const leftOrder = orderValue(left.node, left.index);
    const rightOrder = orderValue(right.node, right.index);
    if (leftOrder === rightOrder) {
      return left.index - right.index;
    }
    return leftOrder - rightOrder;
  }).map((entry) => entry.node);
}

function rootDataScope(dataSchema: JsonRecord) {
  return asRecord(dataSchema.rootScope);
}

function rootUiScope(uiSchema: JsonRecord) {
  return asRecord(uiSchema.rootScope);
}

function createFieldMap(dataSchema: JsonRecord) {
  return createScopedFieldMap(rootDataScope(dataSchema));
}

function createScopedFieldMap(scope: JsonRecord) {
  const fields = asArray(scope.fields).filter(isRecord);
  return new Map(fields.flatMap((field) => {
    const fieldId = stringValue(field.fieldId, stringValue(field.id, stringValue(field.key)));
    return fieldId ? [[fieldId, field] as const] : [];
  }));
}

function createSubformDataScopeMap(dataSchema: JsonRecord) {
  const scopes = asArray(dataSchema.subformScopes).filter(isRecord);
  return new Map(scopes.flatMap((scope) => {
    const scopeId = stringValue(scope.schemaScopeId, stringValue(scope.tableKey));
    return scopeId ? [[scopeId, scope] as const] : [];
  }));
}

function createSubformUiScopeMap(uiSchema: JsonRecord) {
  const scopes = asArray(uiSchema.subformScopes).filter(isRecord);
  return new Map(scopes.flatMap((scope) => {
    const scopeId = stringValue(scope.schemaScopeId, stringValue(scope.tableKey));
    return scopeId ? [[scopeId, scope] as const] : [];
  }));
}

function createNodesByParentId(uiSchema: JsonRecord) {
  const nodesByParentId = new Map<string | null, JsonRecord[]>();
  asArray(rootUiScope(uiSchema).nodes).filter(isRecord).forEach((node) => {
    const parentId = typeof node.parentId === "string" && node.parentId.trim().length > 0
      ? node.parentId.trim()
      : null;
    const nodes = nodesByParentId.get(parentId) ?? [];
    nodes.push(node);
    nodesByParentId.set(parentId, nodes);
  });
  return nodesByParentId;
}

function readWorkflowStatus(uiSchema: JsonRecord) {
  const workflow = asRecord(asRecord(rootUiScope(uiSchema).systemFields).workflowStatus);
  const fieldId = stringValue(workflow.fieldId);
  if (!fieldId) {
    return undefined;
  }
  return {
    fieldId,
    finalValue: stringValue(workflow.finalValue) || undefined,
    initialValue: stringValue(workflow.initialValue) || undefined,
  };
}

function readOptions(field: JsonRecord): RuntimeFormFieldOption[] {
  const seen = new Set<string>();
  const optionStyleVariantByOption = readChoiceOptionStyleVariants(field);
  return asArray(field.options)
    .flatMap((option) => {
      if (typeof option === "string" || typeof option === "number") {
        const value = optionStringValue(option);
        if (!value || seen.has(value)) {
          return [];
        }
        seen.add(value);
        return [createRuntimeOption(value, value, optionStyleVariantByOption.get(value))];
      }

      if (!isRecord(option)) {
        return [];
      }

      const labelCandidate = stringValue(
        option.label,
        stringValue(option.displayName, stringValue(option.title, stringValue(option.name))),
      );
      const value = optionStringValue(
        option.value,
        optionStringValue(
          option.id,
          optionStringValue(option.key, optionStringValue(option.option, labelCandidate)),
        ),
      );
      if (!value || seen.has(value)) {
        return [];
      }
      seen.add(value);
      return [createRuntimeOption(
        labelCandidate || value,
        value,
        optionStyleVariantByOption.get(value) ?? optionStyleVariantByOption.get(labelCandidate),
        readOptionFields(option),
      )];
    });
}

function readOptionFields(option: JsonRecord) {
  const fields = asRecord(option.fields);
  const entries = Object.entries(fields).flatMap(([key, value]) => {
    const fieldValue = stringValue(value);
    return key && fieldValue ? [[key, fieldValue]] : [];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function isChoiceFieldType(type: RuntimeFormFieldType) {
  return type === "single_select" || type === "multi_select" || type === "radio";
}

function readChoiceDisplay(field: JsonRecord) {
  return asRecord(field.choiceDisplay);
}

function createRuntimeOption(
  label: string,
  value: string,
  styleVariant: RuntimeFormChoiceOptionStyleVariant | undefined,
  fields?: Record<string, string>,
): RuntimeFormFieldOption {
  return {
    ...(fields ? { fields } : {}),
    label,
    ...(styleVariant && styleVariant !== "default" ? { styleVariant } : {}),
    value,
  };
}

function readChoiceOptionStyleVariants(field: JsonRecord) {
  const styles = new Map<string, RuntimeFormChoiceOptionStyleVariant>();
  asArray(readChoiceDisplay(field).optionStyles).filter(isRecord).forEach((entry) => {
    const option = stringValue(entry.option);
    const variant = stringValue(entry.variant) as RuntimeFormChoiceOptionStyleVariant;

    if (!option || !runtimeChoiceOptionStyleVariants.has(variant) || variant === "default") {
      return;
    }

    styles.set(option, variant);
  });
  return styles;
}

function readChoiceRenderStyle(field: JsonRecord): RuntimeFormChoiceRenderStyle | undefined {
  const renderStyle = stringValue(readChoiceDisplay(field).renderStyle);
  return renderStyle === "buttons" || renderStyle === "native" ? renderStyle : undefined;
}

function readChoiceOrientation(field: JsonRecord): RuntimeFormChoiceOrientation | undefined {
  const orientation = stringValue(readChoiceDisplay(field).orientation);
  return orientation === "horizontal" || orientation === "vertical" ? orientation : undefined;
}

function readChoiceAllowEmpty(field: JsonRecord) {
  const choiceDisplay = readChoiceDisplay(field);
  return typeof choiceDisplay.allowEmpty === "boolean" ? choiceDisplay.allowEmpty : undefined;
}

function readInputMode(field: JsonRecord): RuntimeFormInputMode | undefined {
  const inputMode = firstStringValue(field.inputMode);
  return runtimeInputModes.has(inputMode as RuntimeFormInputMode)
    ? inputMode as RuntimeFormInputMode
    : undefined;
}

function readTextValidation(field: JsonRecord): RuntimeFormTextValidation | undefined {
  const validation = firstStringValue(field.validation);
  return runtimeTextValidations.has(validation as RuntimeFormTextValidation)
    ? validation as RuntimeFormTextValidation
    : undefined;
}

function readTextInputType(
  field: JsonRecord,
  inputMode: RuntimeFormInputMode | undefined,
  validation: RuntimeFormTextValidation | undefined,
): RuntimeFormTextInputType | undefined {
  const preset = firstStringValue(field.preset);

  if (validation === "email" || preset === "email" || inputMode === "email") {
    return "email";
  }

  if (validation === "url" || preset === "url" || inputMode === "url") {
    return "url";
  }

  if (validation === "phone" || preset === "phone" || inputMode === "tel") {
    return "tel";
  }

  return undefined;
}

function readRuleValue(value: unknown): RuntimeFormRuleValue | undefined {
  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function readRuleCondition(rawCondition: unknown): RuntimeFormRuleCondition | null {
  const condition = asRecord(rawCondition);
  const fieldId = stringValue(condition.fieldId);
  const operator = stringValue(condition.operator) as RuntimeFormRuleOperator;
  if (!fieldId || !runtimeRuleOperators.has(operator)) {
    return null;
  }

  const out: RuntimeFormRuleCondition = {
    fieldId,
    operator,
  };
  const value = readRuleValue(condition.value);
  if (value !== undefined) {
    out.value = value;
  }
  const values = asArray(condition.values).flatMap((item) => {
    const ruleValue = readRuleValue(item);
    return ruleValue === undefined ? [] : [ruleValue];
  });
  if (values.length > 0) {
    out.values = values;
  }
  return out;
}

function readRuntimeRules(rawRules: unknown): RuntimeFormNodeRules | undefined {
  const rules = asRecord(rawRules);
  const visibilityRules = asArray(rules.visibilityRules)
    .filter(isRecord)
    .flatMap((rule): RuntimeFormVisibilityRule[] => {
      const id = stringValue(rule.id);
      const effect = rule.effect === "show" || rule.effect === "hide" ? rule.effect : null;
      const conditions = asArray(asRecord(rule.when).all).flatMap((condition) => {
        const out = readRuleCondition(condition);
        return out ? [out] : [];
      });
      return id && effect && conditions.length > 0
        ? [{ effect, id, when: { all: conditions } }]
        : [];
    });
  const requirementRules = asArray(rules.requirementRules)
    .filter(isRecord)
    .flatMap((rule): RuntimeFormRequirementRule[] => {
      const id = stringValue(rule.id);
      const effect = rule.effect === "required" || rule.effect === "optional" ? rule.effect : null;
      const conditions = asArray(asRecord(rule.when).all).flatMap((condition) => {
        const out = readRuleCondition(condition);
        return out ? [out] : [];
      });
      return id && effect && conditions.length > 0
        ? [{ effect, id, when: { all: conditions } }]
        : [];
    });

  if (visibilityRules.length === 0 && requirementRules.length === 0) {
    return undefined;
  }
  return {
    requirementRules,
    visibilityRules,
  };
}

function readLookupFilterScalar(value: unknown): RuntimeFormLookupFilterScalar | undefined {
  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function readLookupFilters(value: unknown): RuntimeFormLookupFilter[] | undefined {
  const filters = asArray(value)
    .filter(isRecord)
    .flatMap((filter): RuntimeFormLookupFilter[] => {
      const field = stringValue(filter.field);
      const operator = stringValue(filter.operator) as RuntimeFormLookupFilterOperator;
      if (!field || (operator && !runtimeLookupFilterOperators.has(operator))) {
        return [];
      }

      const scalarValue = readLookupFilterScalar(filter.value);
      const values = asArray(filter.value)
        .flatMap((entry) => {
          const scalar = readLookupFilterScalar(entry);
          return scalar === undefined ? [] : [scalar];
        });
      const out: RuntimeFormLookupFilter = { field };
      if (operator) {
        out.operator = operator;
      }
      if (values.length > 0) {
        out.value = values;
      } else if (scalarValue !== undefined) {
        out.value = scalarValue;
      }
      return [out];
    });

  return filters.length > 0 ? filters : undefined;
}

function readLookupDisplayMode(lookupConfig: JsonRecord): RuntimeFormLookupDefinition["displayMode"] {
  return stringValue(lookupConfig.displayMode) === "catalog_modal" ? "catalog_modal" : "search_select";
}

function readLookupDefinition(field: JsonRecord): RuntimeFormLookupDefinition | undefined {
  const kind = stringValue(field.kind, stringValue(field.dataType, stringValue(field.baseType)));
  if (kind !== "db_lookup") {
    return undefined;
  }

  const lookupConfig = asRecord(field.lookupConfig);
  const preset = firstStringValue(field.preset) || undefined;
  const selectionMode = stringValue(field.selectionMode) === "multiple" || preset === "db_lookup_multi"
    ? "multiple"
    : "single";
  const displayFields = stringListValue(lookupConfig.displayFields, field.displayFields);
  const searchFields = stringListValue(lookupConfig.searchFields);
  const storedTextFields = stringListValue(lookupConfig.storedTextFields);

  return {
    dictionary: firstStringValue(lookupConfig.dictionary, field.dictionary) || undefined,
    displayFields,
    displayMode: readLookupDisplayMode(lookupConfig),
    displayTemplate: firstStringValue(lookupConfig.displayTemplate) || undefined,
    filters: readLookupFilters(lookupConfig.filters),
    preset,
    searchFields,
    selectionMode,
    sortField: firstStringValue(lookupConfig.sortField) || undefined,
    sourceModel: firstStringValue(lookupConfig.sourceModel) || undefined,
    storedTextFields,
    storedValueField: firstStringValue(lookupConfig.storedValueField) || undefined,
    valueMode: preset === "db_lookup_value" ? "text" : "stored_value",
  };
}

function runtimeFieldType(field: JsonRecord): RuntimeFormFieldType | null {
  const kind = stringValue(field.kind, stringValue(field.dataType, stringValue(field.baseType)));
  const selectionMode = stringValue(field.selectionMode);
  const preset = stringValue(field.preset);

  if (kind === "db_lookup") {
    if (selectionMode === "multiple" || preset === "db_lookup_multi") {
      return "multi_select";
    }
    return "single_select";
  }
  if (runtimeFieldTypes.has(kind as RuntimeFormFieldType)) {
    return kind as RuntimeFormFieldType;
  }
  return null;
}

function createFieldNode(
  context: CompileContext,
  node: JsonRecord,
  options: { insideGrid?: boolean },
): RuntimeFormFieldDefinition | null {
  const fieldId = stringValue(node.fieldId);
  const field = context.fieldById.get(fieldId);
  if (!field) {
    return null;
  }

  const type = runtimeFieldType(field);
  if (!type) {
    return null;
  }

  const optionsList = readOptions(field);
  const readonly = node.visibility === "readonly" || boolValue(node.readonly, boolValue(field.readonly));
  const width = options.insideGrid ? undefined : "full";
  const isChoiceField = isChoiceFieldType(type);
  const inputMode = type === "short_text" ? readInputMode(field) : undefined;
  const validation = type === "short_text" ? readTextValidation(field) : undefined;
  const lookup = readLookupDefinition(field);
  return {
    autocomplete: type === "short_text" ? firstStringValue(field.autocomplete, field.autoComplete) || undefined : undefined,
    choiceAllowEmpty: type === "single_select" ? readChoiceAllowEmpty(field) : undefined,
    choiceLayout: type === "radio" ? "inline" : undefined,
    choiceOrientation: isChoiceField ? readChoiceOrientation(field) : undefined,
    choiceRenderStyle: isChoiceField ? readChoiceRenderStyle(field) ?? (type === "radio" ? "buttons" : "native") : undefined,
    helperText: stringValue(node.helperText) || undefined,
    id: fieldId,
    inputMode,
    inputType: type === "short_text" ? readTextInputType(field, inputMode, validation) : undefined,
    label: stringValue(field.label, stringValue(field.displayName, fieldId)),
    lookup,
    mask: type === "short_text" ? firstStringValue(field.mask) || undefined : undefined,
    nodeType: "field",
    options: optionsList.length > 0 ? optionsList : undefined,
    placeholder: firstStringValue(node.placeholder, field.placeholder) || undefined,
    readonly,
    required: boolValue(node.required, boolValue(field.required)),
    rules: readRuntimeRules(node.rules),
    type,
    validation,
    width,
  };
}

function readViewOnlyValueBinding(node: JsonRecord): RuntimeFormContentValueBinding | undefined {
  const binding = asRecord(node.viewOnlyBinding);
  const kind = stringValue(binding.kind);
  const sourceFieldId = stringValue(binding.sourceFieldId);
  const outputKey = stringValue(binding.outputKey);

  if (kind !== "lookup_derived_output" || !sourceFieldId || !outputKey) {
    return undefined;
  }

  return {
    kind,
    outputKey,
    sourceFieldId,
  };
}

function createContentNode(context: CompileContext, node: JsonRecord): RuntimeFormContentDefinition | null {
  const id = stringValue(node.id);
  const nodeType = stringValue(node.type);
  if (!id) {
    return null;
  }

  if (nodeType === "heading") {
    return {
      content: stringValue(node.title, stringValue(node.text)),
      contentType: "heading",
      id,
      level: 3,
      nodeType: "content",
      rules: readRuntimeRules(node.rules),
      width: "full",
    };
  }

  if (nodeType === "text" || nodeType === "rich_text") {
    return {
      content: stringValue(node.text, stringValue(node.title)),
      contentType: nodeType === "rich_text" ? "rich_text_block" : "text",
      id,
      nodeType: "content",
      rules: readRuntimeRules(node.rules),
      styleVariant: "muted",
      width: "full",
    };
  }

  if (nodeType === "view_only_field") {
    return {
      contentType: "view_only_field",
      id,
      label: stringValue(node.title, context.labels.generatedOutputLabel),
      labelLayout: "responsive-inline",
      nodeType: "content",
      rules: readRuntimeRules(node.rules),
      value: stringValue(node.text),
      valueBinding: readViewOnlyValueBinding(node),
      width: "full",
    };
  }

  return null;
}

function runtimeSubformColumnType(field: JsonRecord): RuntimeFormSubformColumnType {
  const kind = stringValue(field.kind, stringValue(field.dataType, stringValue(field.baseType)));
  switch (kind) {
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "date_time":
      return "date_time";
    default:
      return "text";
  }
}

function readViewSettings(scope: JsonRecord) {
  return asRecord(scope.viewSettings);
}

function readListSettings(scope: JsonRecord) {
  return asRecord(readViewSettings(scope).list);
}

function readSubformActions(scope: JsonRecord) {
  const actions = asRecord(readViewSettings(scope).actions);
  return {
    canAdd: boolValue(actions.canAdd, true),
    canDelete: boolValue(actions.canDelete, true),
    canEdit: boolValue(actions.canEdit, true),
  };
}

function createSubformColumns(
  dataScope: JsonRecord,
  uiScope: JsonRecord,
): RuntimeFormSubformDefinition["columns"] {
  const fieldsById = createScopedFieldMap(dataScope);
  const listSettings = readListSettings(uiScope);
  const authoredColumns = asArray(listSettings.columns)
    .filter(isRecord)
    .filter((column) => column.visible !== false);
  const sourceColumns = authoredColumns.length > 0
    ? authoredColumns
    : asArray(dataScope.fields)
      .filter(isRecord)
      .map((field, index) => ({
        fieldId: stringValue(field.fieldId, stringValue(field.id, stringValue(field.key))),
        id: stringValue(field.fieldId, stringValue(field.id, stringValue(field.key))),
        order: index,
      }));

  return orderedNodes(sourceColumns).flatMap((column) => {
    const fieldId = stringValue(column.fieldId);
    if (!fieldId || fieldId.includes("::lookup_output::")) {
      return [];
    }
    const field = fieldsById.get(fieldId);
    if (!field) {
      return [];
    }
    const columnId = stringValue(column.id, fieldId);
    return [{
      fieldId,
      id: columnId,
      label: stringValue(column.label, stringValue(field.label, stringValue(field.displayName, fieldId))),
      type: runtimeSubformColumnType(field),
    }];
  });
}

function createSubformNode(context: CompileContext, node: JsonRecord): RuntimeFormSubformDefinition | null {
  const id = stringValue(node.id);
  const schemaScopeId = stringValue(node.schemaScopeId, stringValue(node.tableKey));
  if (!id || !schemaScopeId) {
    return null;
  }

  const dataScope = context.subformDataScopeById.get(schemaScopeId);
  const uiScope = context.subformUiScopeById.get(schemaScopeId) ?? {};
  if (!dataScope) {
    return null;
  }

  const columns = createSubformColumns(dataScope, uiScope);
  const sorting = asRecord(readListSettings(uiScope).sorting);
  const sortFieldId = stringValue(sorting.fieldId);
  const sortDirection = sorting.direction === "desc" ? "desc" : "asc";

  return {
    actions: readSubformActions(uiScope),
    columns,
    defaultSort: sortFieldId ? {
      columnId: sortFieldId,
      direction: sortDirection,
    } : undefined,
    id,
    nodeType: "subform",
    rules: readRuntimeRules(node.rules),
    schemaScopeId,
    subformType: stringValue(node.subformType, stringValue(dataScope.subformType, "DEFAULT")),
    tableKey: stringValue(node.tableKey, schemaScopeId),
    title: stringValue(node.title, stringValue(dataScope.displayName, String(context.labels.generatedSubformTitle))),
    width: "full",
  };
}

function createLayoutNode(context: CompileContext, node: JsonRecord): RuntimeFormLayoutDefinition | null {
  const id = stringValue(node.id);
  const nodeType = stringValue(node.type);
  if (!id) {
    return null;
  }

  if (nodeType === "grid") {
    return {
      id,
      layoutType: "grid",
      nodeType: "layout",
      nodes: createRuntimeNodes(context, id, { insideGrid: true }),
      rules: readRuntimeRules(node.rules),
      title: stringValue(node.title) || undefined,
      width: "full",
    } satisfies RuntimeFormGridLayoutDefinition;
  }

  if (nodeType === "group" || nodeType === "column" || nodeType === "tab_item" || nodeType === "accordion_item") {
    return {
      id,
      layoutType: "group",
      nodeType: "layout",
      nodes: createRuntimeNodes(context, id),
      rules: readRuntimeRules(node.rules),
      title: stringValue(node.title) || undefined,
      width: "full",
    } satisfies RuntimeFormGroupLayoutDefinition;
  }

  if (nodeType === "tabs") {
    const tabs = orderedNodes(context.nodesByParentId.get(id) ?? [])
      .filter((child) => stringValue(child.type) === "tab_item")
      .map((tabNode) => ({
        id: stringValue(tabNode.id),
        nodes: createRuntimeNodes(context, stringValue(tabNode.id)),
        title: stringValue(tabNode.title, String(context.labels.generatedTabTitle)),
      }))
      .filter((tab) => tab.id && tab.nodes.length > 0);
    if (tabs.length === 0) {
      return null;
    }
    return {
      defaultTabId: tabs[0]?.id,
      id,
      layoutType: "tabs",
      nodeType: "layout",
      scrollable: true,
      size: "sm",
      styleVariant: "surface",
      tabs,
      title: stringValue(node.title) || undefined,
      width: "full",
    } satisfies RuntimeFormTabsLayoutDefinition;
  }

  if (nodeType === "accordion") {
    const items = orderedNodes(context.nodesByParentId.get(id) ?? [])
      .filter((child) => stringValue(child.type) === "accordion_item")
      .map((itemNode) => ({
        id: stringValue(itemNode.id),
        nodes: createRuntimeNodes(context, stringValue(itemNode.id)),
        title: stringValue(itemNode.title, String(context.labels.generatedAccordionItemTitle)),
      }))
      .filter((item) => item.id && item.nodes.length > 0);
    if (items.length === 0) {
      return null;
    }
    return {
      id,
      items,
      layoutType: "accordion",
      nodeType: "layout",
      title: stringValue(node.title) || undefined,
      width: "full",
    } satisfies RuntimeFormAccordionLayoutDefinition;
  }

  if (nodeType === "divider") {
    return {
      id,
      label: stringValue(node.title, stringValue(node.text)) || undefined,
      layoutType: "divider",
      nodeType: "layout",
      rules: readRuntimeRules(node.rules),
      width: "full",
    };
  }

  if (nodeType === "spacer") {
    return {
      id,
      layoutType: "spacer",
      nodeType: "layout",
      rules: readRuntimeRules(node.rules),
      size: "sm",
      width: "full",
    };
  }

  return null;
}

function createRuntimeNodes(
  context: CompileContext,
  parentId: string | null,
  options: { insideGrid?: boolean } = {},
): RuntimeFormNodeDefinition[] {
  return orderedNodes(context.nodesByParentId.get(parentId) ?? [])
    .flatMap((node): RuntimeFormNodeDefinition[] => {
      if (node.visibility === "hidden") {
        return [];
      }

      const nodeType = stringValue(node.type);
      if (nodeType === "field") {
        const field = createFieldNode(context, node, options);
        return field ? [field] : [];
      }

      if (nodeType === "heading" || nodeType === "text" || nodeType === "rich_text" || nodeType === "view_only_field") {
        const content = createContentNode(context, node);
        return content ? [content] : [];
      }

      if (nodeType === "subform") {
        const subform = createSubformNode(context, node);
        return subform ? [subform] : [];
      }

      const layout = createLayoutNode(context, node);
      return layout ? [layout] : [];
    });
}

function createRuntimeSections(context: CompileContext): RuntimeFormSectionDefinition[] {
  const rootNodes = orderedNodes(context.nodesByParentId.get(null) ?? []);
  const sectionNodes = rootNodes.filter((node) => stringValue(node.type) === "section");
  if (sectionNodes.length === 0) {
    return [{
      id: "default",
      nodes: createRuntimeNodes(context, null),
    }];
  }

  const leadingNodes = rootNodes.filter((node) => stringValue(node.type) !== "section");
  const sections: RuntimeFormSectionDefinition[] = [];
  const leadingRuntimeNodes = leadingNodes.flatMap((node) => {
    const transientContext: CompileContext = {
      ...context,
      nodesByParentId: new Map(context.nodesByParentId).set("__leading__", [node]),
    };
    return createRuntimeNodes(transientContext, "__leading__");
  });
  if (leadingRuntimeNodes.length > 0) {
    sections.push({
      id: "default",
      nodes: leadingRuntimeNodes,
    });
  }

  sectionNodes.forEach((sectionNode) => {
    const sectionId = stringValue(sectionNode.id);
    const nodes = createRuntimeNodes(context, sectionId);
    if (nodes.length === 0) {
      return;
    }
    sections.push({
      description: stringValue(sectionNode.text) || undefined,
      id: sectionId,
      nodes,
      title: stringValue(sectionNode.title) || undefined,
    });
  });
  return sections.length > 0 ? sections : [{ id: "default", nodes: [] }];
}

export function createRuntimeFormDefinitionFromSchema(source: RuntimeFormSchemaSource): RuntimeFormDefinition {
  const dataSchema = asRecord(source.dataSchema);
  const uiSchema = asRecord(source.uiSchema);
  const workflowStatus = readWorkflowStatus(uiSchema);
  const labels = resolveRuntimeFormLabels(source.labels);
  const context: CompileContext = {
    fieldById: createFieldMap(dataSchema),
    labels,
    nodesByParentId: createNodesByParentId(uiSchema),
    subformDataScopeById: createSubformDataScopeMap(dataSchema),
    subformUiScopeById: createSubformUiScopeMap(uiSchema),
    workflowStatus,
  };

  const sections = createRuntimeSections(context);
  return {
    commitMode: source.commitMode,
    description: source.description,
    id: `runtime-${source.modelId}-${source.viewId}`,
    mode: source.mode,
    sections,
    title: source.title || (source.mode === "create" ? labels.createTitle : labels.editTitle),
    workflowStatus,
  };
}
