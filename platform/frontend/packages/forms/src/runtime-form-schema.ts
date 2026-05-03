import type {
  RuntimeFormAccordionLayoutDefinition,
  RuntimeFormCommitMode,
  RuntimeFormContentDefinition,
  RuntimeFormChoiceOrientation,
  RuntimeFormChoiceRenderStyle,
  RuntimeFormDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormFieldOption,
  RuntimeFormFieldType,
  RuntimeFormGridLayoutDefinition,
  RuntimeFormGroupLayoutDefinition,
  RuntimeFormLayoutDefinition,
  RuntimeFormMode,
  RuntimeFormNodeDefinition,
  RuntimeFormNodeRules,
  RuntimeFormRequirementRule,
  RuntimeFormRuleCondition,
  RuntimeFormRuleOperator,
  RuntimeFormRuleValue,
  RuntimeFormSectionDefinition,
  RuntimeFormTabsLayoutDefinition,
  RuntimeFormVisibilityRule,
} from "./runtime-form";

type JsonRecord = Record<string, unknown>;

export type RuntimeFormSchemaSource = {
  commitMode: RuntimeFormCommitMode;
  dataSchema?: JsonRecord;
  description?: string;
  mode: RuntimeFormMode;
  modelId: string;
  title?: string;
  uiSchema?: JsonRecord;
  viewId: string;
};

type CompileContext = {
  fieldById: Map<string, JsonRecord>;
  nodesByParentId: Map<string | null, JsonRecord[]>;
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
  const fields = asArray(rootDataScope(dataSchema).fields)
    .filter(isRecord);
  return new Map(fields.flatMap((field) => {
    const fieldId = stringValue(field.fieldId, stringValue(field.id, stringValue(field.key)));
    return fieldId ? [[fieldId, field] as const] : [];
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
  return asArray(field.options)
    .flatMap((option) => {
      if (typeof option === "string" || typeof option === "number") {
        const value = optionStringValue(option);
        if (!value || seen.has(value)) {
          return [];
        }
        seen.add(value);
        return [{ label: value, value }];
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
      return [{
        label: labelCandidate || value,
        value,
      }];
    });
}

function isChoiceFieldType(type: RuntimeFormFieldType) {
  return type === "single_select" || type === "multi_select" || type === "radio";
}

function readChoiceDisplay(field: JsonRecord) {
  return asRecord(field.choiceDisplay);
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

function runtimeFieldType(field: JsonRecord): RuntimeFormFieldType | null {
  const kind = stringValue(field.kind, stringValue(field.dataType, stringValue(field.baseType)));
  const selectionMode = stringValue(field.selectionMode);

  if (kind === "db_lookup") {
    if (selectionMode === "multiple") {
      return null;
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
  return {
    choiceAllowEmpty: type === "single_select" ? readChoiceAllowEmpty(field) : undefined,
    choiceLayout: type === "radio" ? "inline" : undefined,
    choiceOrientation: isChoiceField ? readChoiceOrientation(field) : undefined,
    choiceRenderStyle: isChoiceField ? readChoiceRenderStyle(field) ?? (type === "radio" ? "buttons" : "native") : undefined,
    helperText: stringValue(node.helperText) || undefined,
    id: fieldId,
    label: stringValue(field.label, stringValue(field.displayName, fieldId)),
    nodeType: "field",
    options: optionsList.length > 0 ? optionsList : undefined,
    placeholder: stringValue(node.placeholder) || undefined,
    readonly,
    required: boolValue(node.required, boolValue(field.required)),
    rules: readRuntimeRules(node.rules),
    type,
    width,
  };
}

function createContentNode(node: JsonRecord): RuntimeFormContentDefinition | null {
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
      label: stringValue(node.title, "Output"),
      nodeType: "content",
      rules: readRuntimeRules(node.rules),
      value: stringValue(node.text),
      width: "full",
    };
  }

  return null;
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
        title: stringValue(tabNode.title, "Tab"),
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
        title: stringValue(itemNode.title, "Item"),
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
        const content = createContentNode(node);
        return content ? [content] : [];
      }

      if (nodeType === "subform") {
        return [];
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
  const context: CompileContext = {
    fieldById: createFieldMap(dataSchema),
    nodesByParentId: createNodesByParentId(uiSchema),
    workflowStatus,
  };

  const sections = createRuntimeSections(context);
  return {
    commitMode: source.commitMode,
    description: source.description,
    id: `runtime-${source.modelId}-${source.viewId}`,
    mode: source.mode,
    sections,
    title: source.title || (source.mode === "create" ? "Start new record" : "Edit record"),
    workflowStatus,
  };
}
