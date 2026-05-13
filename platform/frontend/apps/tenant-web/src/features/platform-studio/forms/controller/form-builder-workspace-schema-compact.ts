import { type FormBuilderNode } from "../forms-builder-state";
import { isRecord } from "./form-builder-workspace-schema-utils";

function compactSchemaValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const nextItems = value
      .map((entry) => compactSchemaValue(entry))
      .filter((entry) => entry !== undefined);
    return nextItems.length > 0 ? nextItems : undefined;
  }

  if (isRecord(value)) {
    const nextRecord: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, entry]) => {
      const compactedEntry = compactSchemaValue(entry);
      if (typeof compactedEntry === "undefined") {
        return;
      }

      nextRecord[key] = compactedEntry;
    });

    return Object.keys(nextRecord).length > 0 ? nextRecord : undefined;
  }

  if (typeof value === "string") {
    return value.trim().length > 0 ? value : undefined;
  }

  if (value === null || typeof value === "undefined") {
    return undefined;
  }

  return value;
}

export function compactSchemaRecord(value: Record<string, unknown>) {
  const compacted = compactSchemaValue(value);
  return isRecord(compacted) ? compacted : {};
}

function compactNodeRulesForUiSchema(rules: unknown) {
  if (!isRecord(rules)) {
    return undefined;
  }

  const nextRules: Record<string, unknown> = {};
  if (Array.isArray(rules.requirementRules) && rules.requirementRules.length > 0) {
    nextRules.requirementRules = rules.requirementRules;
  }
  if (Array.isArray(rules.visibilityRules) && rules.visibilityRules.length > 0) {
    nextRules.visibilityRules = rules.visibilityRules;
  }

  return Object.keys(nextRules).length > 0 ? nextRules : undefined;
}

export function compactFilterDefinitionsForUiSchema(filterDefinitions: unknown) {
  if (!isRecord(filterDefinitions)) {
    return undefined;
  }

  const defaultFilters = isRecord(filterDefinitions.defaultFilters)
    ? filterDefinitions.defaultFilters
    : null;
  const hasDefaultConditions = Array.isArray(defaultFilters?.conditions) && defaultFilters.conditions.length > 0;
  const quickFilters = Array.isArray(filterDefinitions.quickFilters) ? filterDefinitions.quickFilters : [];
  if (!hasDefaultConditions && quickFilters.length === 0) {
    return undefined;
  }

  return compactSchemaRecord({
    defaultFilters,
    quickFilters,
    version: filterDefinitions.version,
  });
}

export function compactViewSettingsForUiSchema(viewSettings: unknown) {
  if (!isRecord(viewSettings)) {
    return undefined;
  }

  const nextSettings: Record<string, unknown> = {};
  const actions = isRecord(viewSettings.actions) ? viewSettings.actions : null;
  if (actions) {
    const actionValues = Object.values(actions);
    const allTrue = actionValues.length > 0 && actionValues.every((value) => value === true);
    if (!allTrue) {
      nextSettings.actions = actions;
    }
  }

  const correctiveAction = isRecord(viewSettings.correctiveAction)
    ? viewSettings.correctiveAction
    : null;
  if (correctiveAction?.enabled === true) {
    nextSettings.correctiveAction = correctiveAction;
  }

  const list = isRecord(viewSettings.list) ? viewSettings.list : null;
  if (list) {
    const nextList: Record<string, unknown> = {};
    if (Array.isArray(list.columns) && list.columns.length > 0) {
      nextList.columns = list.columns.map((column) => {
        const nextColumn = isRecord(column) ? { ...column } : {};
        if (nextColumn.visible === true) {
          delete nextColumn.visible;
        }
        return compactSchemaRecord(nextColumn);
      });
    }

    const sorting = isRecord(list.sorting) ? { ...list.sorting } : null;
    if (sorting) {
      if (sorting.direction === "asc") {
        delete sorting.direction;
      }
      const nextSorting = compactSchemaRecord(sorting);
      if (Object.keys(nextSorting).length > 0) {
        nextList.sorting = nextSorting;
      }
    }

    const rowLayout = isRecord(list.rowLayout)
      ? compactSchemaRecord(list.rowLayout)
      : {};
    if (Object.keys(rowLayout).length > 0) {
      nextList.rowLayout = rowLayout;
    }

    if (Object.keys(nextList).length > 0) {
      nextSettings.list = nextList;
    }
  }

  return Object.keys(nextSettings).length > 0 ? nextSettings : undefined;
}

export function compactSystemFieldsForUiSchema(systemFields: unknown) {
  if (!isRecord(systemFields)) {
    return undefined;
  }

  const nextSystemFields = compactSchemaRecord(systemFields);
  const keys = Object.keys(nextSystemFields).filter((key) => key !== "version");
  return keys.length > 0 ? nextSystemFields : undefined;
}

export function compactUiNodeForSchema(
  node: FormBuilderNode,
  fieldLabelById: ReadonlyMap<string, string>,
) {
  const nextNode: Record<string, unknown> = { ...node };

  if (nextNode.helperText === "") {
    delete nextNode.helperText;
  }
  if (nextNode.parentId === null) {
    delete nextNode.parentId;
  }
  if (nextNode.required === false) {
    delete nextNode.required;
  }
  if (nextNode.visibility === "visible") {
    delete nextNode.visibility;
  }

  const nextRules = compactNodeRulesForUiSchema(nextNode.rules);
  if (nextRules) {
    nextNode.rules = nextRules;
  } else {
    delete nextNode.rules;
  }

  if (
    node.type === "field"
    && typeof node.fieldId === "string"
    && typeof nextNode.title === "string"
    && nextNode.title.trim() === fieldLabelById.get(node.fieldId)
  ) {
    delete nextNode.title;
  }

  if (nextNode.title === "") {
    delete nextNode.title;
  }

  return compactSchemaRecord(nextNode);
}
