import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ApiClientError,
  createTenantFormBuilderDraftClient,
  isUnauthorizedApiError,
  requestWithUnauthorizedRetry,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import { useTranslation } from "@platform/i18n";
import {
  Button,
  Input,
} from "@platform/ui-kit";
import {
  useNavigate,
  useParams,
  useBeforeUnload,
} from "react-router-dom";

import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { platformStudioPaths } from "../../platform-studio-route-meta";
import {
  BuilderCanvas,
  type BuilderCanvasBreadcrumbItem,
  type BuilderCanvasNodeItem,
  type BuilderCanvasUnplacedFieldItem,
} from "../components/builder-canvas";
import { ChoiceFieldSettings } from "../components/choice-field-settings";
import { DateTodayFieldSettings } from "../components/date-today-field-settings";
import { DebugDialog } from "../components/debug-dialog";
import { DefaultFilterEditorDialog } from "../components/default-filter-editor-dialog";
import { DeleteNodeConfirmationDialog } from "../components/delete-node-confirmation-dialog";
import { WorkspaceLoadingState } from "../components/empty-state";
import { WorkspaceErrorState } from "../components/error-state";
import {
  FieldPalette,
  type FieldPaletteDisplaySection,
} from "../components/field-palette";
import { FilterConditionEditor } from "../components/filter-condition-editor";
import {
  createDefaultFilterCondition,
  getFilterOperatorKey,
  getRelativeDatePresetKey,
  stringifyScalarValue,
} from "../components/filter-condition-editor-helpers";
import {
  GridSettingsPanel,
  type GridSettingsFieldItem,
} from "../components/grid-settings-panel";
import {
  InspectorPanel,
  InspectorPanelTab,
  type InspectorPanelTabValue,
} from "../components/inspector-panel";
import { LookupFieldSettings } from "../components/lookup-field-settings";
import {
  getLookupClauseKey,
  getLookupDynamicTokenKey,
  getLookupPresetFromField,
  isPresetLookupField,
  lookupDynamicTokenOptions,
} from "../components/lookup-filter-editor-helpers";
import {
  LookupSourcePickerDialog,
  type LookupSourcePickerModelItem,
} from "../components/lookup-source-picker-dialog";
import { QuickFilterEditorDialog } from "../components/quick-filter-editor-dialog";
import { RuleConditionEditor } from "../components/rule-condition-editor";
import {
  createDefaultRuleCondition,
  getRuleOperatorKey,
  ruleOperatorNeedsValue,
  ruleOperatorUsesArray,
  stringifyRuleScalarValue,
} from "../components/rule-condition-editor-helpers";
import { RuleEditorDialog } from "../components/rule-editor-dialog";
import {
  RulesPanel,
  type RulesPanelRuleItem,
} from "../components/rules-panel";
import { SelectionDeleteAction } from "../components/selection-delete-action";
import { SelectionInspectorBasicSection } from "../components/selection-inspector-basic-section";
import { SelectionInspectorEmptyState } from "../components/selection-inspector-empty-state";
import { TagsFieldSettings } from "../components/tags-field-settings";
import { TextFieldSettings } from "../components/text-field-settings";
import { UnsavedLeaveConfirmationDialog } from "../components/unsaved-leave-confirmation-dialog";
import { ViewSettingsPanel } from "../components/view-settings-panel";
import { WorkspaceTopline } from "../components/workspace-topline";
import {
  createFormBuilderFieldFromDefinition,
  formBuilderPaletteSectionDefinitions,
  type FormBuilderLibraryFieldDefinition,
} from "../forms-builder-library";
import {
  addFormBuilderElementNode,
  addFormBuilderFieldNode,
  getActiveFormBuilderScope,
  getCurrentFormBuilderChildren,
  getCurrentFormBuilderInsertParentId,
  getCurrentFormBuilderParentId,
  getCurrentFormBuilderScopeSubformNode,
  getCurrentFormBuilderSelectedNodeId,
  getAllowedChildNodeTypes,
  getElementPaletteItems,
  getFieldPaletteItems,
  getFormBuilderBreadcrumb,
  getFormBuilderChildren,
  getFormBuilderDisplayLabel,
  getFormBuilderNode,
  getFormBuilderNodeSummary,
  getFormBuilderNodeScopeId,
  getFormBuilderScopeFieldIds,
  getFormBuilderScopeUnplacedFieldIds,
  getFormsWorkspaceAccess,
  createPersistedFormBuilderDocument,
  formBuilderScopeRootPlacementKey,
  isFormBuilderContainer,
  normalizePersistedFormBuilderDocument,
  normalizeDataScopeRuntime,
  reconcileFormBuilderDocumentWithModel,
  reorderFormBuilderNode,
  removeFormBuilderNode,
  selectFormBuilderNode,
  setFormBuilderCurrentParent,
  normalizeViewScopeRuntime,
  updateFormBuilderNode,
  useFormBuilderDocument,
  type FormBuilderFilterCondition,
  type FormBuilderGridColumnDefinition,
  type FormBuilderLookupFilterClause,
  type FormBuilderNode,
  type FormBuilderFieldPaletteCategory,
  type FormBuilderQuickFilter,
  type FormBuilderRequirementRule,
  type FormBuilderRuleCondition,
  type FormBuilderRuntimePreset,
  type FormBuilderScalarFilterCondition,
  type FormBuilderVisibilityRule,
} from "../forms-builder-state";
import {
  getFormsAuthoringAccess,
  getFormsAuthoringActor,
} from "../forms-actors";
import { useFormBuilderAuthoring } from "../forms-authoring-context";
import {
  cloneFormsPlaceholderModel,
  createFormsPlaceholderStorageKey,
  createUniqueFormsPlaceholderStorageKey,
  findFormsPlaceholderScreenById,
  getFormsPlaceholderFieldDisplayName,
  getFormsPlaceholderFieldIconKey,
  normalizeFormsPlaceholderModel,
  normalizeFormsPlaceholderView,
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderFieldKind,
  type FormsPlaceholderFieldOptionStyle,
  type FormsPlaceholderFieldSemanticRole,
  type FormsPlaceholderLookupConfig,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
  getFormsPlaceholderModel,
  type FormsPlaceholderField,
  getFormsPlaceholderView,
} from "../forms-placeholder-data";
import {
  createRouteBootstrapFallbackModel,
  createRouteBootstrapFallbackView,
  getFormsPlaceholderModelRouteId,
  isDefaultFormsPlaceholderView,
} from "../forms-route-helpers";
import { useTenantRuntimeConfig } from "../../../../app/tenant-runtime-config-context";
import { useTenantWorkspaceUser } from "../../../../app/tenant-workspace-user-context";

declare global {
  interface Window {
    __tenantPlatformStudioLeaveGuard?: () => boolean | Promise<boolean>;
  }
}

function isDraftEndpointUnavailable(error: unknown) {
  return error instanceof ApiClientError && error.statusCode === 404;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function dedupeStringValues(values: ReadonlyArray<string>) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getFieldSchemaScopeId(field: Pick<FormsPlaceholderField, "schemaScopeKey">) {
  const normalizedScopeKey = field.schemaScopeKey?.trim();
  return normalizedScopeKey && normalizedScopeKey.length > 0
    ? normalizedScopeKey
    : "root";
}

function humanizeAuthoringSchemaScopeKey(value: string) {
  return value
    .replace(/^pb_/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Subform";
}

function getModelSubformScopeDefinitions(model: FormsPlaceholderModel) {
  const scopes = new Map(
    (model.schemaScopes ?? []).map((scope) => [scope.key, scope]),
  );

  model.fields.forEach((field) => {
    const scopeId = getFieldSchemaScopeId(field);
    if (scopeId === "root" || scopes.has(scopeId)) {
      return;
    }

    scopes.set(scopeId, {
      displayName: humanizeAuthoringSchemaScopeKey(scopeId),
      key: scopeId,
      scopeType: "SUBFORM" as const,
      subformType: "DEFAULT" as const,
    });
  });

  return [...scopes.values()];
}

function createEmptyLayoutBlueprint(model: FormsPlaceholderModel) {
  return {
    rootScope: {
      containers: [],
      fieldPlacements: [],
      schemaScopeId: "root",
      unplacedFieldIds: [],
    },
    subformScopes: getModelSubformScopeDefinitions(model).map((scope) => ({
      containers: [],
      fieldPlacements: [],
      schemaScopeId: scope.key,
      unplacedFieldIds: [],
    })),
  } satisfies Record<string, unknown>;
}

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

function compactSchemaRecord(value: Record<string, unknown>) {
  const compacted = compactSchemaValue(value);
  return isRecord(compacted) ? compacted : {};
}

function serializeModelFieldForDataSchema(field: FormsPlaceholderField) {
  const serializedField: Record<string, unknown> = {
    ...field,
  };

  delete serializedField.displayName;
  delete serializedField.fieldId;
  delete serializedField.isPersisted;
  delete serializedField.key;
  delete serializedField.schemaScopeId;
  delete serializedField.schemaScopeKey;

  if (serializedField.autocomplete === "on") {
    delete serializedField.autocomplete;
  }
  if (serializedField.isLocked === false) {
    delete serializedField.isLocked;
  }
  if (serializedField.status === "persisted") {
    delete serializedField.status;
  }

  return compactSchemaRecord(serializedField);
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

function compactFilterDefinitionsForUiSchema(filterDefinitions: unknown) {
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

function compactViewSettingsForUiSchema(viewSettings: unknown) {
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

    if (Object.keys(nextList).length > 0) {
      nextSettings.list = nextList;
    }
  }

  return Object.keys(nextSettings).length > 0 ? nextSettings : undefined;
}

function compactSystemFieldsForUiSchema(systemFields: unknown) {
  if (!isRecord(systemFields)) {
    return undefined;
  }

  const nextSystemFields = compactSchemaRecord(systemFields);
  const keys = Object.keys(nextSystemFields).filter((key) => key !== "version");
  return keys.length > 0 ? nextSystemFields : undefined;
}

function compactUiNodeForSchema(
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

function buildCanonicalDataSchema(
  model: FormsPlaceholderModel,
  document?: ReturnType<typeof useFormBuilderDocument>["document"],
) {
  const rootFields = model.fields
    .filter((field) => getFieldSchemaScopeId(field) === "root")
    .map(serializeModelFieldForDataSchema);
  const subformDataRuntimeByTableKey = new Map(
    (document?.subformScopes ?? []).flatMap((scope) =>
      scope.dataSchema.runtime ? [[scope.tableKey, scope.dataSchema.runtime] as const] : []),
  );
  const subformScopes = getModelSubformScopeDefinitions(model).map((scope) => ({
    displayName: scope.displayName,
    fields: model.fields
      .filter((field) => getFieldSchemaScopeId(field) === scope.key)
      .map(serializeModelFieldForDataSchema),
    ...(subformDataRuntimeByTableKey.get(scope.key)
      ? { runtime: subformDataRuntimeByTableKey.get(scope.key) }
      : {}),
    schemaScopeId: scope.key,
    subformType: scope.subformType,
    tableKey: scope.key,
  }));

  return {
    modelId: model.id,
    modelTitle: model.title,
    rootScope: {
      fields: rootFields,
      ...(document?.rootScope.dataSchema.runtime
        ? { runtime: document.rootScope.dataSchema.runtime }
        : {}),
      schemaScopeId: "root",
    },
    subformScopes,
  } satisfies Record<string, unknown>;
}

function isBlueprintContainerType(type: FormBuilderNode["type"]) {
  return (
    type === "accordion" ||
    type === "accordion_item" ||
    type === "column" ||
    type === "grid" ||
    type === "group" ||
    type === "section" ||
    type === "subform" ||
    type === "tab_item" ||
    type === "tabs"
  );
}

function deriveTransientContainerKey(
  scopeId: string,
  node: FormBuilderNode,
  parentContainerKey: string,
  usedKeys: Map<string, number>,
) {
  const base = [
    scopeId,
    node.type,
    toStorageKey(node.title?.trim() || node.id),
  ].filter(Boolean).join(".");
  const parentAwareBase = parentContainerKey && !base.startsWith(parentContainerKey)
    ? `${parentContainerKey}.${toStorageKey(node.title?.trim() || node.id)}`
    : base;
  const nextBase = parentAwareBase || `${scopeId}.${node.type}.${toStorageKey(node.id)}`;
  const usageCount = usedKeys.get(nextBase) ?? 0;
  usedKeys.set(nextBase, usageCount + 1);
  return usageCount === 0 ? nextBase : `${nextBase}.${usageCount + 1}`;
}

function orderScopeNodesForAuthoringCompile(
  nodes: ReadonlyArray<FormBuilderNode>,
) {
  const indexedNodes = nodes.map((node, index) => ({ index, node }));
  const childrenByParentId = new Map<string | null, Array<{ index: number; node: FormBuilderNode }>>();
  const visitedNodeIds = new Set<string>();
  const orderedNodes: FormBuilderNode[] = [];
  const sortEntries = (entries: ReadonlyArray<{ index: number; node: FormBuilderNode }>) =>
    [...entries].sort((left, right) => {
      if (left.node.order === right.node.order) {
        return left.index - right.index;
      }

      return left.node.order - right.node.order;
    });

  indexedNodes.forEach((entry) => {
    const parentId = entry.node.parentId ?? null;
    const siblings = childrenByParentId.get(parentId) ?? [];
    siblings.push(entry);
    childrenByParentId.set(parentId, siblings);
  });

  const visitChildren = (parentId: string | null) => {
    sortEntries(childrenByParentId.get(parentId) ?? []).forEach((entry) => {
      if (visitedNodeIds.has(entry.node.id)) {
        return;
      }

      visitedNodeIds.add(entry.node.id);
      orderedNodes.push(entry.node);
      visitChildren(entry.node.id);
    });
  };

  visitChildren(null);

  sortEntries(indexedNodes).forEach((entry) => {
    if (visitedNodeIds.has(entry.node.id)) {
      return;
    }

    visitedNodeIds.add(entry.node.id);
    orderedNodes.push(entry.node);
    visitChildren(entry.node.id);
  });

  return orderedNodes;
}

function compileAuthoringScope(
  scopeId: string,
  nodes: ReadonlyArray<FormBuilderNode>,
  unplacedFieldIds: ReadonlyArray<string>,
) {
  const orderedNodes = orderScopeNodesForAuthoringCompile(nodes);
  const containerKeyByNodeId = new Map<string, string>();
  const usedKeys = new Map<string, number>();
  const uiNodes: Record<string, unknown>[] = [];
  const containers: Record<string, unknown>[] = [];
  const fieldPlacements: Record<string, unknown>[] = [];
  const unresolvedFieldIds: string[] = [];

  orderedNodes.forEach((node, index) => {
    if (isBlueprintContainerType(node.type)) {
      const parentContainerKey = node.parentId
        ? (containerKeyByNodeId.get(node.parentId) ?? "")
        : "";
      const containerKey = node.containerKey?.trim()
        || deriveTransientContainerKey(scopeId, node, parentContainerKey, usedKeys);
      containerKeyByNodeId.set(node.id, containerKey);

      const baseContainer = {
        containerKey,
        order: node.order ?? index,
        parentContainerKey,
        title: node.title ?? "",
        type: node.type,
      } satisfies Record<string, unknown>;
      containers.push(
        node.type === "subform"
          ? {
              ...baseContainer,
              displayName: node.title ?? humanizeAuthoringSchemaScopeKey(node.tableKey ?? node.schemaScopeId ?? node.id),
              schemaScopeId: node.schemaScopeId ?? node.tableKey ?? node.id,
              subformType: node.subformType ?? "DEFAULT",
              tableKey: node.tableKey ?? node.schemaScopeId ?? node.id,
            }
          : baseContainer,
      );
      uiNodes.push(
        node.type === "subform"
          ? {
              ...node,
              containerKey,
              schemaScopeId: node.schemaScopeId ?? node.tableKey ?? node.id,
              subformType: node.subformType ?? "DEFAULT",
              tableKey: node.tableKey ?? node.schemaScopeId ?? node.id,
            }
          : {
              ...node,
              containerKey,
            },
      );
      return;
    }

    if (node.type === "field" && typeof node.fieldId === "string") {
      const parentContainerKey = node.parentId
        ? (containerKeyByNodeId.get(node.parentId) ?? "")
        : "";
      if (node.parentId && !parentContainerKey) {
        unresolvedFieldIds.push(node.fieldId);
        return;
      }

      fieldPlacements.push({
        containerKey: node.parentId ? parentContainerKey : formBuilderScopeRootPlacementKey,
        fieldId: node.fieldId,
        order: node.order ?? index,
      });
      uiNodes.push({ ...node });
      return;
    }

    uiNodes.push({ ...node });
  });

  return {
    fieldPlacements,
    layoutBlueprintScope: {
      containers,
      fieldPlacements,
      schemaScopeId: scopeId,
      unplacedFieldIds: dedupeStringValues([
        ...unplacedFieldIds,
        ...unresolvedFieldIds,
      ]),
    } satisfies Record<string, unknown>,
    uiScope: {
      nodes: uiNodes,
      schemaScopeId: scopeId,
      unplacedFieldIds: dedupeStringValues([
        ...unplacedFieldIds,
        ...unresolvedFieldIds,
      ]),
    } satisfies Record<string, unknown>,
  };
}

function buildCanonicalUiSchema(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  model: Pick<FormsPlaceholderModel, "fields">,
) {
  const fieldLabelById = new Map(
    model.fields.map((field) => [field.id, getModelFieldLabel(field)] as const),
  );
  const rootScope = compileAuthoringScope(
    "root",
    document.rootScope.uiSchema.nodes,
    document.rootScope.uiSchema.unplacedFieldIds,
  );
  const subformScopes = document.subformScopes.map((scope) => {
    const compiled = compileAuthoringScope(
      scope.tableKey,
      scope.uiSchema.nodes,
      scope.uiSchema.unplacedFieldIds,
    );

    return compactSchemaRecord({
      ...compiled.uiScope,
      nodes: compiled.uiScope.nodes
        .map((node) => compactUiNodeForSchema(node as FormBuilderNode, fieldLabelById)),
      ...(compactFilterDefinitionsForUiSchema(scope.filterDefinitions)
        ? { filterDefinitions: compactFilterDefinitionsForUiSchema(scope.filterDefinitions) }
        : {}),
      parentSubformNodeId: scope.parentSubformNodeId,
      ...(scope.runtime ? { runtime: scope.runtime } : {}),
      subformType: scope.subformType,
      tableKey: scope.tableKey,
      ...(compactViewSettingsForUiSchema(scope.viewSettings)
        ? { viewSettings: compactViewSettingsForUiSchema(scope.viewSettings) }
        : {}),
    });
  });

  return {
    rootScope: compactSchemaRecord({
      ...rootScope.uiScope,
      nodes: rootScope.uiScope.nodes
        .map((node) => compactUiNodeForSchema(node as FormBuilderNode, fieldLabelById)),
      ...(compactFilterDefinitionsForUiSchema(document.filterDefinitions)
        ? { filterDefinitions: compactFilterDefinitionsForUiSchema(document.filterDefinitions) }
        : {}),
      ...(document.rootScope.runtime ? { runtime: document.rootScope.runtime } : {}),
      ...(compactSystemFieldsForUiSchema(document.systemFields)
        ? { systemFields: compactSystemFieldsForUiSchema(document.systemFields) }
        : {}),
      ...(compactViewSettingsForUiSchema(document.viewSettings)
        ? { viewSettings: compactViewSettingsForUiSchema(document.viewSettings) }
        : {}),
    }),
    subformScopes,
  } satisfies Record<string, unknown>;
}

function buildCanonicalLayoutBlueprint(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
) {
  const rootScope = compileAuthoringScope(
    "root",
    document.rootScope.uiSchema.nodes,
    document.rootScope.uiSchema.unplacedFieldIds,
  );

  return {
    rootScope: rootScope.layoutBlueprintScope,
    subformScopes: document.subformScopes.map((scope) =>
      compileAuthoringScope(
        scope.tableKey,
        scope.uiSchema.nodes,
        scope.uiSchema.unplacedFieldIds,
      ).layoutBlueprintScope
    ),
  } satisfies Record<string, unknown>;
}

function buildWorkspaceDocumentFromCanonicalSchemas(
  modelPayload: Record<string, unknown>,
  viewPayload: Record<string, unknown>,
  model: FormsPlaceholderModel,
  view: FormsPlaceholderView,
) {
  const dataSchema = isRecord(modelPayload.dataSchema) ? modelPayload.dataSchema : null;
  const uiSchema = isRecord(viewPayload.uiSchema) ? viewPayload.uiSchema : null;
  if (!dataSchema || !uiSchema) {
    return normalizePersistedFormBuilderDocument(viewPayload, model, view);
  }

  const rootUiScope = isRecord(uiSchema.rootScope) ? uiSchema.rootScope : null;
  const rootDataScope = isRecord(dataSchema.rootScope) ? dataSchema.rootScope : null;
  const subformDataScopeById = new Map<string, Record<string, unknown>>();
  if (Array.isArray(dataSchema.subformScopes)) {
    dataSchema.subformScopes.forEach((entry) => {
      if (!isRecord(entry)) {
        return;
      }

      const scopeId = typeof entry.schemaScopeId === "string" && entry.schemaScopeId.trim().length > 0
        ? entry.schemaScopeId
        : typeof entry.tableKey === "string" && entry.tableKey.trim().length > 0
          ? entry.tableKey
          : "";
      if (!scopeId) {
        return;
      }

      subformDataScopeById.set(scopeId, entry);
    });
  }

  const subformScopes = Array.isArray(uiSchema.subformScopes)
    ? uiSchema.subformScopes.flatMap((entry) => {
        if (!isRecord(entry)) {
          return [];
        }

        const schemaScopeId = typeof entry.schemaScopeId === "string" && entry.schemaScopeId.trim().length > 0
          ? entry.schemaScopeId
          : typeof entry.tableKey === "string" && entry.tableKey.trim().length > 0
            ? entry.tableKey
            : "";
        const parentSubformNodeId = typeof entry.parentSubformNodeId === "string" ? entry.parentSubformNodeId : "";
        if (!schemaScopeId || !parentSubformNodeId) {
          return [];
        }

        const dataScope = subformDataScopeById.get(schemaScopeId);
        const fieldIds = Array.isArray(dataScope?.fields)
          ? dataScope.fields.flatMap((field) =>
            isRecord(field) && typeof field.fieldId === "string"
              ? [field.fieldId]
              : isRecord(field) && typeof field.id === "string"
                ? [field.id]
                : [])
          : [];
        const scopeUiNodes = Array.isArray(entry.nodes)
          ? entry.nodes.map((node) =>
            isRecord(node) && node.parentId === null
              ? {
                  ...node,
                  parentId: parentSubformNodeId,
                }
              : node)
          : [];

        return [{
          dataSchema: {
            fieldIds,
            runtime: normalizeDataScopeRuntime(dataScope?.runtime),
          },
          filterDefinitions: isRecord(entry.filterDefinitions) ? entry.filterDefinitions : {},
          parentSubformNodeId,
          runtime: normalizeViewScopeRuntime(entry.runtime),
          scopeId: parentSubformNodeId,
          scopeType: "SUBFORM" as const,
          subformType: entry.subformType === "CHECKLIST" ? "CHECKLIST" : "DEFAULT",
          tableKey: typeof entry.tableKey === "string" && entry.tableKey.trim().length > 0
            ? entry.tableKey
            : schemaScopeId,
          uiSchema: {
            currentParentId: null,
            nodes: scopeUiNodes,
            selectedNodeId: null,
            unplacedFieldIds: Array.isArray(entry.unplacedFieldIds)
              ? entry.unplacedFieldIds
              : [],
          },
          viewSettings: isRecord(entry.viewSettings) ? entry.viewSettings : {},
        }];
      })
    : [];

  return normalizePersistedFormBuilderDocument({
    currentParentId: null,
    filterDefinitions: isRecord(rootUiScope?.filterDefinitions) ? rootUiScope.filterDefinitions : {},
    nodes: [
      ...(Array.isArray(rootUiScope?.nodes) ? rootUiScope.nodes : []),
      ...subformScopes.flatMap((scope) => scope.uiSchema.nodes),
    ],
    rootScope: {
      dataSchema: {
        fieldIds: Array.isArray(rootDataScope?.fields)
          ? rootDataScope.fields.flatMap((field) =>
            isRecord(field) && typeof field.fieldId === "string"
              ? [field.fieldId]
              : isRecord(field) && typeof field.id === "string"
                ? [field.id]
                : [])
          : [],
        runtime: normalizeDataScopeRuntime(rootDataScope?.runtime),
      },
      runtime: normalizeViewScopeRuntime(rootUiScope?.runtime),
      scopeId: "root",
      scopeType: "ROOT",
      uiSchema: {
        currentParentId: null,
        nodes: Array.isArray(rootUiScope?.nodes) ? rootUiScope.nodes : [],
        selectedNodeId: null,
        unplacedFieldIds: Array.isArray(rootUiScope?.unplacedFieldIds)
          ? rootUiScope.unplacedFieldIds
          : [],
      },
    },
    selectedNodeId: null,
    subformScopes,
    systemFields: isRecord(rootUiScope?.systemFields) ? rootUiScope.systemFields : {},
    viewDescription: typeof viewPayload.description === "string" ? viewPayload.description : view.description,
    viewKind: viewPayload.kind === "detail" ? "detail" : view.kind,
    viewSettings: isRecord(rootUiScope?.viewSettings) ? rootUiScope.viewSettings : {},
    viewTitle: typeof viewPayload.title === "string" ? viewPayload.title : view.title,
  }, model, view);
}

function replaceModelViewById(
  model: FormsPlaceholderModel,
  nextView: FormsPlaceholderView,
) {
  const hasExistingView = model.screens.some((screen) => screen.id === nextView.id);
  return cloneFormsPlaceholderModel({
    ...model,
    screens: hasExistingView
      ? model.screens.map((screen) => (screen.id === nextView.id ? nextView : screen))
      : [...model.screens, nextView],
  });
}

function getNodeTypeKey(nodeType: FormBuilderNode["type"]) {
  return `tenant.platformStudio.forms.builder.nodeType.${nodeType}`;
}

function getFieldTypeKey(field: Pick<FormsPlaceholderField, "historicalUpdates" | "kind">) {
  if (field.kind === "long_text" && field.historicalUpdates) {
    return "tenant.platformStudio.forms.builder.fieldType.long_text_historical";
  }

  return `tenant.platformStudio.forms.builder.fieldType.${field.kind}`;
}

function getLookupPresetLabelKey(field: Pick<FormsPlaceholderField, "kind" | "preset" | "selectionMode">) {
  if (field.kind !== "db_lookup") {
    return null;
  }

  if (field.preset === "db_lookup_value") {
    return "tenant.platformStudio.forms.builder.fieldPreset.db_lookup_value";
  }

  if (field.preset === "contact_lookup") {
    return field.selectionMode === "multiple"
      ? "tenant.platformStudio.forms.builder.fieldPreset.contacts_lookup"
      : "tenant.platformStudio.forms.builder.fieldPreset.contact_lookup";
  }

  if (field.preset === "company_lookup") {
    return field.selectionMode === "multiple"
      ? "tenant.platformStudio.forms.builder.fieldPreset.companies_lookup"
      : "tenant.platformStudio.forms.builder.fieldPreset.company_lookup";
  }

  if (field.preset === "project_lookup") {
    return field.selectionMode === "multiple"
      ? "tenant.platformStudio.forms.builder.fieldPreset.projects_lookup"
      : "tenant.platformStudio.forms.builder.fieldPreset.project_lookup";
  }

  if (field.selectionMode === "multiple") {
    return "tenant.platformStudio.forms.builder.fieldPreset.db_lookup_multi";
  }

  return null;
}

function getFieldPresetKey(field: Pick<FormsPlaceholderField, "kind" | "preset" | "selectionMode">) {
  return getLookupPresetLabelKey(field) ?? (
    field.preset ? `tenant.platformStudio.forms.builder.fieldPreset.${field.preset}` : null
  );
}

function getFieldPaletteDescription(
  field: Pick<
    FormsPlaceholderField,
    "historicalUpdates" | "kind" | "options" | "preset" | "selectionMode" | "sourceLabel"
  >,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const typeLabel = t(getFieldTypeKey(field));
  const presetLabelKey = getFieldPresetKey(field);

  if (field.kind === "db_lookup" && presetLabelKey) {
    return `${typeLabel} / ${t(presetLabelKey)}`;
  }

  if (field.kind === "db_lookup") {
    return `${typeLabel} / ${field.sourceLabel ?? t("tenant.platformStudio.forms.builder.fieldMeta.lookupReady")}`;
  }

  if (field.kind === "long_text" && field.historicalUpdates) {
    return `${typeLabel} / ${t("tenant.platformStudio.forms.builder.fieldMeta.historyEnabled")}`;
  }

  if (presetLabelKey) {
    return `${typeLabel} / ${t(presetLabelKey)}`;
  }

  if (field.options?.length) {
    return `${typeLabel} / ${t("tenant.platformStudio.forms.builder.fieldMeta.optionsCount", { count: field.options.length })}`;
  }

  return typeLabel;
}

type SystemFieldRole = "reportedBy" | "reportedDate" | "workflowStatus";
type SystemFieldPaletteItem = {
  descriptionKey: string;
  disabled: boolean;
  disabledReasonKey: string | null;
  iconKey: string;
  key: SystemFieldRole;
  kind: "systemField";
  labelKey: string;
  searchTerms: ReadonlyArray<string>;
};

const systemFieldRoles: ReadonlyArray<SystemFieldRole> = ["reportedBy", "reportedDate", "workflowStatus"];
const filterTokenOptions = [
  "currentUser.companyId",
  "currentUser.companyName",
  "currentUser.divisionId",
  "currentUser.divisionName",
  "currentUser.projectAccessIds",
] as const;

type LookupSourceFieldOption = {
  key: string;
  label: string;
};

type LookupSourceModelOption = {
  defaultDisplayFields: ReadonlyArray<string>;
  defaultSortField: string;
  defaultSearchFields: ReadonlyArray<string>;
  fields: ReadonlyArray<LookupSourceFieldOption>;
  id: string;
  label: string;
  storedValueField: string;
};

type LookupDerivedOutputDefinition = {
  bindingId: string;
  columnName: string;
  fieldKind: FormsPlaceholderFieldKind;
  label: string;
  outputKey: string;
};
type ViewOnlyBindingOption = {
  binding: NonNullable<FormBuilderNode["viewOnlyBinding"]>;
  bindingId: string;
  columnName: string;
  fieldKind: FormsPlaceholderFieldKind;
  label: string;
};

const rootRecordLookupSourceField = {
  key: "doc_id",
  label: "Doc.id",
} as const satisfies LookupSourceFieldOption;

function buildLookupSourceFieldOptions(
  fields: ReadonlyArray<{
    displayName?: string;
    id?: string;
    label?: string;
    storageKey?: string;
  }>,
) {
  const seen = new Set<string>();
  const out: LookupSourceFieldOption[] = [];

  const appendField = (key: string | undefined, label: string | undefined) => {
    const normalizedKey = key?.trim();
    if (!normalizedKey || seen.has(normalizedKey)) {
      return;
    }

    seen.add(normalizedKey);
    out.push({
      key: normalizedKey,
      label: label?.trim() || normalizedKey,
    });
  };

  appendField(rootRecordLookupSourceField.key, rootRecordLookupSourceField.label);
  fields.forEach((field) => {
    appendField(field.storageKey ?? field.id, field.displayName ?? field.label ?? field.storageKey ?? field.id);
  });

  return out;
}

function buildLookupSourceModelOption(
  modelId: string,
  modelLabel: string,
  fields: ReadonlyArray<{
    displayName?: string;
    id?: string;
    label?: string;
    storageKey?: string;
  }>,
): LookupSourceModelOption {
  const normalizedFields = buildLookupSourceFieldOptions(fields);
  const dataFields = normalizedFields.filter((field) => field.key !== rootRecordLookupSourceField.key);
  const defaultDisplayFields = dataFields.length > 0
    ? [dataFields[0].key]
    : [rootRecordLookupSourceField.key];
  const defaultSortField = dataFields[0]?.key ?? rootRecordLookupSourceField.key;

  return {
    defaultDisplayFields,
    defaultSearchFields: normalizedFields.map((field) => field.key),
    defaultSortField,
    fields: normalizedFields,
    id: modelId,
    label: modelLabel.trim() || modelId,
    storedValueField: rootRecordLookupSourceField.key,
  };
}

function buildLookupSourceModelFromPlaceholderModel(
  model: Pick<FormsPlaceholderModel, "displayName" | "fields" | "id" | "title">,
) {
  return buildLookupSourceModelOption(
    model.id,
    model.displayName?.trim() || model.title,
    model.fields.map((field) => ({
      displayName: field.displayName,
      id: field.id,
      label: field.label,
      storageKey: field.storageKey,
    })),
  );
}

function buildLookupSourceModelFromDraft(
  model: Pick<FormsPlaceholderModel, "displayName" | "fields" | "id" | "title">,
  draftModel: Record<string, unknown>,
) {
  const dataSchema = isRecord(draftModel.dataSchema) ? draftModel.dataSchema : null;
  const rootScope = dataSchema && isRecord(dataSchema.rootScope) ? dataSchema.rootScope : null;
  const rootFields = Array.isArray(rootScope?.fields)
    ? rootScope.fields.flatMap((entry) => {
      if (!isRecord(entry)) {
        return [];
      }

      return [{
        displayName: typeof entry.displayName === "string" ? entry.displayName : undefined,
        id: typeof entry.fieldId === "string"
          ? entry.fieldId
          : typeof entry.id === "string"
            ? entry.id
            : undefined,
        label: typeof entry.label === "string" ? entry.label : undefined,
        storageKey: typeof entry.storageKey === "string" ? entry.storageKey : undefined,
      }];
    })
    : [];

  if (rootFields.length === 0) {
    return buildLookupSourceModelFromPlaceholderModel(model);
  }

  return buildLookupSourceModelOption(
    model.id,
    model.displayName?.trim() || model.title,
    rootFields,
  );
}

function getLookupSourceModelById(
  sourceModels: ReadonlyArray<LookupSourceModelOption>,
  modelId: string | null | undefined,
) {
  if (!modelId) {
    return null;
  }

  return sourceModels.find((model) => model.id === modelId) ?? null;
}

function getLookupModelFieldLabel(
  model: LookupSourceModelOption | null,
  fieldKey: string | null | undefined,
) {
  if (!model || !fieldKey) {
    return fieldKey ?? "";
  }

  return model.fields.find((field) => field.key === fieldKey)?.label ?? fieldKey;
}

function getLookupModelFieldLabels(
  model: LookupSourceModelOption | null,
  fieldKeys: ReadonlyArray<string> | undefined,
) {
  return (fieldKeys ?? []).map((fieldKey) => getLookupModelFieldLabel(model, fieldKey));
}

function getLookupDerivedOutputFieldKind(outputKey: string): FormsPlaceholderFieldKind {
  if (outputKey.endsWith("_id") || outputKey === "count") {
    return "integer";
  }

  return "short_text";
}

function getSystemFieldKey(role: SystemFieldRole) {
  return `tenant.platformStudio.forms.builder.systemField.${role}`;
}

function getSystemFieldPaletteDescriptionKey(role: SystemFieldRole) {
  return `tenant.platformStudio.forms.builder.systemField.palette.${role}Description`;
}

function getFilterTokenKey(token: typeof filterTokenOptions[number]) {
  return `tenant.platformStudio.forms.builder.filter.token.${token}`;
}

function toStorageKey(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "field";
}

function createLookupDerivedOutputBindingId(fieldId: string, outputKey: string) {
  return `${fieldId}::lookup_output::${outputKey}`;
}

function createRootRecordIdBindingId() {
  return "root::record_id";
}

function getLookupSourceSummary(
  field: FormsPlaceholderField,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const preset = getLookupPresetFromField(field);

  if (preset === "contact_lookup") {
    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.presetSource"),
      summary: field.sourceLabel?.trim() || "users",
    };
  }

  if (preset === "company_lookup") {
    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.presetSource"),
      summary: field.sourceLabel?.trim() || "company",
    };
  }

  if (preset === "project_lookup") {
    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.presetSource"),
      summary: field.sourceLabel?.trim() || "projects",
    };
  }

  return {
    label: t("tenant.platformStudio.forms.builder.fieldSettings.sourceModel"),
    summary: field.lookupConfig?.sourceModel?.trim() || t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
  };
}

function getLookupStoredValueSummary(
  field: FormsPlaceholderField,
  sourceModel: LookupSourceModelOption | null,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (field.preset === "db_lookup_value") {
    const storedTextFields = field.lookupConfig?.storedTextFields?.length
      ? field.lookupConfig.storedTextFields
      : field.displayFields;

    return {
      label: t("tenant.platformStudio.forms.builder.fieldSettings.storedValue"),
      summary: storedTextFields?.length
        ? getLookupModelFieldLabels(sourceModel, storedTextFields).join(", ")
        : t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
    };
  }

  return {
    label: t("tenant.platformStudio.forms.builder.fieldSettings.displayFields"),
    summary: field.displayFields?.length
      ? getLookupModelFieldLabels(sourceModel, field.displayFields).join(", ")
      : t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields"),
  };
}

function getLookupSortFieldSummary(
  field: FormsPlaceholderField,
  sourceModel: LookupSourceModelOption | null,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const sortField = field.lookupConfig?.sortField || sourceModel?.defaultSortField;

  return {
    label: t("tenant.platformStudio.forms.builder.fieldSettings.sortBy"),
    summary: getLookupModelFieldLabel(sourceModel, sortField)
      || t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
  };
}

function getLookupDerivedOutputDefinitions(
  field: FormsPlaceholderField,
  t: ReturnType<typeof useTranslation>["t"],
): ReadonlyArray<LookupDerivedOutputDefinition> {
  if (field.preset === "db_lookup_value") {
    return [];
  }

  const fieldStorageKey = toStorageKey(field.id);
  const preset = getLookupPresetFromField(field);
  const selectionMode = field.selectionMode ?? "single";

  if (selectionMode === "multiple") {
    return [
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "labels"),
        columnName: `${fieldStorageKey}__labels`,
        fieldKind: getLookupDerivedOutputFieldKind("labels"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabels"),
        outputKey: "labels",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "count"),
        columnName: `${fieldStorageKey}__count`,
        fieldKind: getLookupDerivedOutputFieldKind("count"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCount"),
        outputKey: "count",
      },
    ];
  }

  if (preset === "contact_lookup") {
    return [
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "label"),
        columnName: `${fieldStorageKey}__label`,
        fieldKind: getLookupDerivedOutputFieldKind("label"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel"),
        outputKey: "label",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "company_name"),
        columnName: `${fieldStorageKey}__company_name`,
        fieldKind: getLookupDerivedOutputFieldKind("company_name"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCompanyName"),
        outputKey: "company_name",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "company_id"),
        columnName: `${fieldStorageKey}__company_id`,
        fieldKind: getLookupDerivedOutputFieldKind("company_id"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCompanyId"),
        outputKey: "company_id",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "title"),
        columnName: `${fieldStorageKey}__title`,
        fieldKind: getLookupDerivedOutputFieldKind("title"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputTitle"),
        outputKey: "title",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "phone"),
        columnName: `${fieldStorageKey}__phone`,
        fieldKind: getLookupDerivedOutputFieldKind("phone"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputPhone"),
        outputKey: "phone",
      },
    ];
  }

  if (preset === "company_lookup") {
    return [
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "label"),
        columnName: `${fieldStorageKey}__label`,
        fieldKind: getLookupDerivedOutputFieldKind("label"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel"),
        outputKey: "label",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "type"),
        columnName: `${fieldStorageKey}__type`,
        fieldKind: getLookupDerivedOutputFieldKind("type"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputType"),
        outputKey: "type",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "main_company_name"),
        columnName: `${fieldStorageKey}__main_company_name`,
        fieldKind: getLookupDerivedOutputFieldKind("main_company_name"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputMainCompanyName"),
        outputKey: "main_company_name",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "state"),
        columnName: `${fieldStorageKey}__state`,
        fieldKind: getLookupDerivedOutputFieldKind("state"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputState"),
        outputKey: "state",
      },
    ];
  }

  if (preset === "project_lookup") {
    return [
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "label"),
        columnName: `${fieldStorageKey}__label`,
        fieldKind: getLookupDerivedOutputFieldKind("label"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel"),
        outputKey: "label",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "num"),
        columnName: `${fieldStorageKey}__num`,
        fieldKind: getLookupDerivedOutputFieldKind("num"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputProjectNumber"),
        outputKey: "num",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "name"),
        columnName: `${fieldStorageKey}__name`,
        fieldKind: getLookupDerivedOutputFieldKind("name"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputProjectName"),
        outputKey: "name",
      },
      {
        bindingId: createLookupDerivedOutputBindingId(field.id, "company_name"),
        columnName: `${fieldStorageKey}__company_name`,
        fieldKind: getLookupDerivedOutputFieldKind("company_name"),
        label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCompanyName"),
        outputKey: "company_name",
      },
    ];
  }

  return [
    {
      bindingId: createLookupDerivedOutputBindingId(field.id, "label"),
      columnName: `${fieldStorageKey}__label`,
      fieldKind: getLookupDerivedOutputFieldKind("label"),
      label: t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel"),
      outputKey: "label",
    },
  ];
}

function getLookupDerivedOutputBindingOptionsForField(
  field: FormsPlaceholderField,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  t: ReturnType<typeof useTranslation>["t"],
): ReadonlyArray<ViewOnlyBindingOption> {
  const prefix = getFieldLabelAndBoundField(field, document).labelField;

  return getLookupDerivedOutputDefinitions(field, t).map((output) => ({
    binding: {
      kind: "lookup_derived_output" as const,
      outputKey: output.outputKey,
      sourceFieldId: field.id,
    },
    ...output,
    label: `${prefix} / ${output.label}`,
  }));
}

function createLookupDerivedOutputPseudoFields(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
) {
  return fields.flatMap((field) =>
    field.kind === "db_lookup"
      ? getLookupDerivedOutputBindingOptionsForField(field, document, t).map((output) => ({
          family: "advanced" as const,
          id: output.bindingId,
          isLocked: false,
          kind: output.fieldKind,
          label: output.label,
          readonly: true,
          sourceLabel: output.columnName,
        }))
      : []
  );
}

function getViewOnlyBindingOptions(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  fields: ReadonlyArray<FormsPlaceholderField>,
  scopeSubformId: string | null,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const lookupOptions = getScopeFields(document, fields, scopeSubformId)
    .filter((field) => field.kind === "db_lookup")
    .flatMap((field) => getLookupDerivedOutputBindingOptionsForField(field, document, t));

  if (scopeSubformId !== null) {
    return lookupOptions;
  }

  return [
    {
      binding: {
        kind: "root_record_id" as const,
      },
      bindingId: createRootRecordIdBindingId(),
      columnName: "doc_id",
      fieldKind: "integer",
      label: t("tenant.platformStudio.forms.builder.fieldSettings.rootRecordId"),
    },
    ...lookupOptions,
  ];
}

function getViewOnlyBindingOption(
  binding: FormBuilderNode["viewOnlyBinding"] | undefined,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (!binding || binding.kind !== "lookup_derived_output") {
    return binding?.kind === "root_record_id"
      ? {
          binding,
          bindingId: createRootRecordIdBindingId(),
          columnName: "doc_id",
          fieldKind: "integer" as const,
          label: t("tenant.platformStudio.forms.builder.fieldSettings.rootRecordId"),
        }
      : null;
  }

  const sourceField = getFieldById(fields, binding.sourceFieldId);
  if (!sourceField || sourceField.kind !== "db_lookup") {
    return null;
  }

  return getLookupDerivedOutputBindingOptionsForField(sourceField, document, t)
    .find((option) => option.binding.kind === "lookup_derived_output" && option.binding.outputKey === binding.outputKey) ?? null;
}

function getFieldsWithLookupDerivedOutputs(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
) {
  return fields.flatMap((field) => {
    if (field.kind !== "db_lookup") {
      return [field];
    }

    const lookupFieldLabel = getFieldLabelAndBoundField(field, document).labelField;

    return [
      {
        ...field,
        label: lookupFieldLabel,
      },
      ...createLookupDerivedOutputPseudoFields(document, [field], t),
    ];
  });
}

function createRuleId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFieldById(
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId: string | null | undefined,
) {
  if (!fieldId) {
    return null;
  }

  return fields.find((field) => field.id === fieldId) ?? null;
}

function getModelFieldLabel(field: FormsPlaceholderField) {
  return getFormsPlaceholderFieldDisplayName(field);
}

function isPersistedModelField(field: FormsPlaceholderField) {
  return field.isPersisted ?? field.status !== "draft";
}

function getSystemFieldSemanticRole(role: SystemFieldRole): FormsPlaceholderFieldSemanticRole {
  return role === "reportedBy"
    ? "reportedBy"
    : role === "reportedDate"
      ? "reportedDate"
      : "workflowStatus";
}

function getSystemFieldExistingCandidate(
  fields: ReadonlyArray<FormsPlaceholderField>,
  role: SystemFieldRole,
) {
  const semanticRole = getSystemFieldSemanticRole(role);
  return fields.find((field) => field.semanticRole === semanticRole) ?? null;
}

function getAuthoringFieldLabel(
  field: FormsPlaceholderField,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
) {
  const node = findFormBuilderNodeByFieldId(document, field.id);
  return node?.title?.trim() || getModelFieldLabel(field);
}

function getFieldLabelAndBoundField(
  field: FormsPlaceholderField,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
) {
  const labelField = getAuthoringFieldLabel(field, document);

  return {
    boundField: getModelFieldLabel(field),
    labelField,
  };
}

function getFieldLabelWithBoundField(
  field: FormsPlaceholderField,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
) {
  const binding = getFieldLabelAndBoundField(field, document);
  return `${binding.labelField} / ${binding.boundField}`;
}

function getSystemFieldBindingSummary(
  role: SystemFieldRole,
  fields: ReadonlyArray<FormsPlaceholderField>,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  t: ReturnType<typeof useTranslation>["t"],
) {
  const boundFieldId = getBoundSystemFieldIdByRole(document, role);
  const boundField = getFieldById(fields, boundFieldId);

  if (!boundField) {
    return t("tenant.platformStudio.forms.builder.systemField.unbound");
  }

  const binding = getFieldLabelAndBoundField(boundField, document);

  return `${t("tenant.platformStudio.forms.builder.systemField.labelField")}: ${binding.labelField} / ${t("tenant.platformStudio.forms.builder.systemField.boundField")}: ${binding.boundField}`;
}

function getRuleScopeFields(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  fields: ReadonlyArray<FormsPlaceholderField>,
  nodeId: string,
) {
  const scopeSubformId = getFormBuilderNodeScopeId(document, nodeId);
  const scopeFieldIds = getFormBuilderScopeFieldIds(
    document,
    scopeSubformId === "root" ? null : scopeSubformId,
  );

  return fields
    .filter((field) => scopeFieldIds.has(field.id))
    .map((field) => ({
      ...field,
      label: getAuthoringFieldLabel(field, document),
    }));
}

function getScopeFields(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  fields: ReadonlyArray<FormsPlaceholderField>,
  scopeSubformId: string | null,
) {
  const scopeFieldIds = getFormBuilderScopeFieldIds(document, scopeSubformId);

  return fields
    .filter((field) => scopeFieldIds.has(field.id))
    .map((field) => ({
      ...field,
      label: getAuthoringFieldLabel(field, document),
    }));
}

function getGridColumnByFieldId(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  fieldId: string,
) {
  return columns.find((column) => column.fieldId === fieldId) ?? null;
}

function getNextGridColumnOrder(columns: ReadonlyArray<FormBuilderGridColumnDefinition>) {
  return columns.length === 0
    ? 0
    : Math.max(...columns.map((column) => column.order)) + 1;
}

function sortGridColumns(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
) {
  return [...columns].sort((left, right) => {
    if (left.order === right.order) {
      return left.fieldId.localeCompare(right.fieldId);
    }

    return left.order - right.order;
  });
}

function sortGridScopeFields(
  fields: ReadonlyArray<FormsPlaceholderField>,
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
) {
  const fallbackIndexByFieldId = new Map(fields.map((field, index) => [field.id, index]));

  return [...fields].sort((left, right) => {
    const leftColumn = getGridColumnByFieldId(columns, left.id);
    const rightColumn = getGridColumnByFieldId(columns, right.id);

    if (leftColumn && rightColumn && leftColumn.order !== rightColumn.order) {
      return leftColumn.order - rightColumn.order;
    }

    return (fallbackIndexByFieldId.get(left.id) ?? 0) - (fallbackIndexByFieldId.get(right.id) ?? 0);
  });
}

function cloneRuleCondition(condition: FormBuilderRuleCondition): FormBuilderRuleCondition {
  return {
    ...condition,
    values: condition.values ? [...condition.values] : undefined,
  };
}

function cloneVisibilityRule(rule: FormBuilderVisibilityRule): FormBuilderVisibilityRule {
  return {
    ...rule,
    when: {
      all: rule.when.all.map(cloneRuleCondition),
    },
  };
}

function cloneRequirementRule(rule: FormBuilderRequirementRule): FormBuilderRequirementRule {
  return {
    ...rule,
    when: {
      all: rule.when.all.map(cloneRuleCondition),
    },
  };
}

function getSingleConditionVisibilityRule(
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

function getSingleConditionRequirementRule(
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

function getRuleConditionSummary(
  condition: FormBuilderRuleCondition,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
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

function getRuleSummary(
  rule: Pick<FormBuilderVisibilityRule, "when"> | Pick<FormBuilderRequirementRule, "when">,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
) {
  return rule.when.all
    .map((condition) => getRuleConditionSummary(condition, fields, t))
    .filter(Boolean)
    .join(" · ");
}

function createDefaultVisibilityRule(
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

function createDefaultRequirementRule(
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

function getCompatibleRuntimePresets(
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

function isCompatibleSystemField(
  field: FormsPlaceholderField,
  role: SystemFieldRole,
) {
  if (role === "reportedBy") {
    return field.kind === "db_lookup";
  }

  if (role === "reportedDate") {
    return field.kind === "date" || field.kind === "date_time";
  }

  return field.kind === "single_select";
}

function getBoundSystemFieldIdByRole(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  role: SystemFieldRole,
) {
  if (role === "reportedBy") {
    return document.systemFields.reportedBy?.fieldId ?? null;
  }

  if (role === "reportedDate") {
    return document.systemFields.reportedDate?.fieldId ?? null;
  }

  return document.systemFields.workflowStatus?.fieldId ?? null;
}

function getSystemFieldOptions(
  fields: ReadonlyArray<FormsPlaceholderField>,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  role: SystemFieldRole,
) {
  const currentFieldId = getBoundSystemFieldIdByRole(document, role);
  const blockedFieldIds = new Set(
    systemFieldRoles
      .filter((entry) => entry !== role)
      .map((entry) => getBoundSystemFieldIdByRole(document, entry))
      .filter((entry): entry is string => Boolean(entry)),
  );

  return fields.filter((field) =>
    isCompatibleSystemField(field, role) && (!blockedFieldIds.has(field.id) || field.id === currentFieldId),
  );
}

function getSystemFieldTemplate(
  fields: ReadonlyArray<FormsPlaceholderField>,
  role: SystemFieldRole,
): FormsPlaceholderField {
  const baseId =
    role === "reportedBy"
      ? "reported-by"
      : role === "reportedDate"
        ? "reported-date"
        : "status";
  const existingIds = new Set(fields.map((field) => field.id));
  let nextId = baseId;
  let suffix = 2;

  while (existingIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  if (role === "reportedBy") {
    return {
      displayName: "Reported By",
      displayFields: ["Full name", "Email"],
      family: "preset",
      id: nextId,
      isPersisted: false,
      isLocked: false,
      kind: "db_lookup",
      label: "Reported By",
      preset: "contact_lookup",
      semanticRole: "reportedBy",
      selectionMode: "single",
      sourceFilters: ["Only active contacts"],
      sourceLabel: "Contacts",
      status: "draft",
      storageKey: createFormsPlaceholderStorageKey("Reported By", nextId),
    };
  }

  if (role === "reportedDate") {
    return {
      displayName: "Reported Date",
      family: "core",
      id: nextId,
      isPersisted: false,
      isLocked: false,
      kind: "date",
      label: "Reported Date",
      semanticRole: "reportedDate",
      status: "draft",
      storageKey: createFormsPlaceholderStorageKey("Reported Date", nextId),
    };
  }

  return {
    displayName: "Status",
    family: "choice",
    id: nextId,
    isPersisted: false,
    isLocked: false,
    kind: "single_select",
    label: "Status",
    options: ["Draft", "Open", "Closed"],
    semanticRole: "workflowStatus",
    status: "draft",
    storageKey: createFormsPlaceholderStorageKey("Status", nextId),
  };
}

function findFormBuilderNodeByFieldId(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  fieldId: string,
) {
  return document.rootScope.uiSchema.nodes.find((node) => node.type === "field" && node.fieldId === fieldId)
    ?? document.subformScopes
      .flatMap((scope) => scope.uiSchema.nodes)
      .find((node) => node.type === "field" && node.fieldId === fieldId)
    ?? null;
}

function syncFieldNodeTitlesWithModel(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  model: FormsPlaceholderModel,
) {
  const fieldLabelById = new Map(
    model.fields.map((field) => [field.id, getModelFieldLabel(field)] as const),
  );
  let hasChanges = false;

  const syncNodes = (nodes: ReadonlyArray<FormBuilderNode>) => {
    let nodesChanged = false;
    const nextNodes = nodes.map((node) => {
      if (node.type !== "field" || !node.fieldId) {
        return node;
      }

      const nextTitle = fieldLabelById.get(node.fieldId);
      if (!nextTitle || node.title === nextTitle) {
        return node;
      }

      nodesChanged = true;
      hasChanges = true;
      return {
        ...node,
        title: nextTitle,
      };
    });

    return nodesChanged ? nextNodes : nodes;
  };

  const nextRootNodes = syncNodes(document.rootScope.uiSchema.nodes);
  const nextSubformScopes = document.subformScopes.map((scope) => {
    const nextNodes = syncNodes(scope.uiSchema.nodes);
    if (nextNodes === scope.uiSchema.nodes) {
      return scope;
    }

    return {
      ...scope,
      uiSchema: {
        ...scope.uiSchema,
        nodes: nextNodes,
      },
    };
  });

  if (!hasChanges) {
    return document;
  }

  return {
    ...document,
    rootScope: {
      ...document.rootScope,
      uiSchema: {
        ...document.rootScope.uiSchema,
        nodes: nextRootNodes,
      },
    },
    subformScopes: nextSubformScopes,
  };
}

function pruneStructureMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => pruneStructureMetadata(entry));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  Object.entries(record).forEach(([key, entry]) => {
    if (key === "displayName" || key === "label" || key === "modelTitle") {
      return;
    }
    out[key] = pruneStructureMetadata(entry);
  });
  return out;
}

function buildDataSchemaStructureSignature(dataSchema: Record<string, unknown>) {
  return JSON.stringify(pruneStructureMetadata(dataSchema));
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : "";
}

function syncChoiceOptionStyles(
  options: ReadonlyArray<string> | undefined,
  optionStyles: ReadonlyArray<FormsPlaceholderFieldOptionStyle> | undefined,
) {
  const optionSet = new Set(options ?? []);
  const nextStyles = (optionStyles ?? []).filter((entry) => optionSet.has(entry.option));
  return nextStyles.length > 0 ? nextStyles : undefined;
}

function getFilterValueSummary(
  field: FormsPlaceholderField,
  valueSource: FormBuilderScalarFilterCondition["valueSource"],
  t: ReturnType<typeof useTranslation>["t"],
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
  t: ReturnType<typeof useTranslation>["t"],
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

function getFilterConditionSummary(
  condition: FormBuilderFilterCondition,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
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

function getQuickFilterSummary(
  quickFilter: FormBuilderQuickFilter,
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
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

function EditableStringList({
  addLabel,
  disabled,
  emptyLabel,
  idPrefix,
  newItemLabel,
  onChange,
  t,
  values,
}: {
  addLabel: string;
  disabled: boolean;
  emptyLabel: string;
  idPrefix: string;
  newItemLabel: string;
  onChange: (values: ReadonlyArray<string>) => void;
  t: ReturnType<typeof useTranslation>["t"];
  values: ReadonlyArray<string>;
}) {
  return (
    <div className="tenant-web__platform-studio-builder-stack">
      {values.length === 0 ? (
        <p className="tenant-web__platform-studio-inline-help">
          {emptyLabel}
        </p>
      ) : (
        values.map((value, index) => (
          <div className="tenant-web__platform-studio-compact-row" key={`${idPrefix}-${index}`}>
            <div className="tenant-web__platform-studio-compact-row-main">
              <Input
                disabled={disabled}
                id={`${idPrefix}-${index}`}
                onChange={(event) => onChange(values.map((entry, entryIndex) =>
                  entryIndex === index ? event.target.value : entry
                ))}
                value={value}
              />
            </div>
            <div className="tenant-web__platform-studio-button-row">
              <Button
                disabled={disabled || index === 0}
                onClick={() => {
                  const nextValues = [...values];
                  [nextValues[index - 1], nextValues[index]] = [nextValues[index], nextValues[index - 1]];
                  onChange(nextValues);
                }}
                size="sm"
                variant="ghost"
              >
                {t("tenant.platformStudio.forms.builder.moveUp")}
              </Button>
              <Button
                disabled={disabled || index === values.length - 1}
                onClick={() => {
                  const nextValues = [...values];
                  [nextValues[index], nextValues[index + 1]] = [nextValues[index + 1], nextValues[index]];
                  onChange(nextValues);
                }}
                size="sm"
                variant="ghost"
              >
                {t("tenant.platformStudio.forms.builder.moveDown")}
              </Button>
              <Button
                disabled={disabled}
                onClick={() => onChange(values.filter((_, entryIndex) => entryIndex !== index))}
                size="sm"
                variant="ghost"
              >
                {t("tenant.platformStudio.forms.builder.removeNode")}
              </Button>
            </div>
          </div>
        ))
      )}

      <div className="tenant-web__platform-studio-button-row">
        <Button
          disabled={disabled}
          onClick={() => onChange([...values, `${newItemLabel} ${values.length + 1}`])}
          size="sm"
          variant="secondary"
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function getSummaryText(
  node: FormBuilderNode,
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  objectTitle: string,
  objectFields: ReadonlyArray<FormsPlaceholderField>,
  summaryKey: string,
  t: ReturnType<typeof useTranslation>["t"],
  childrenCount: number,
) {
  if (summaryKey === "tenant.platformStudio.forms.builder.summary.children") {
    return `${t(getNodeTypeKey(node.type))} (${t(summaryKey, { count: childrenCount })})`;
  }

  if (node.type === "field") {
    const field = objectFields.find((entry) => entry.id === node.fieldId);
    return field ? t(getFieldTypeKey(field)) : t(summaryKey, {
      fieldLabel: objectTitle,
    });
  }

  if (node.type === "view_only_field") {
    return t(getNodeTypeKey("view_only_field"));
  }

  if ((node.type === "text" || node.type === "rich_text") && node.text?.trim()) {
    const fallbackText = node.text
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    const nextText = typeof globalThis.document !== "undefined"
      ? (() => {
          const temporaryElement = globalThis.document.createElement("div");
          temporaryElement.innerHTML = node.text ?? "";
          return temporaryElement.textContent?.replace(/\s+/g, " ").trim() ?? fallbackText;
        })()
      : fallbackText;

    if (nextText.length > 0) {
      return nextText.length > 88 ? `${nextText.slice(0, 85).trimEnd()}...` : nextText;
    }
  }

  return t(summaryKey);
}

function buildCompiledRuntimeFieldMappings(
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: ReturnType<typeof useTranslation>["t"],
) {
  return fields.map((field) => {
    const storageKey = field.storageKey ?? toStorageKey(field.id);
    const selectionMode = field.selectionMode ?? "single";
    const storageMode = field.kind === "db_lookup" && selectionMode === "multiple"
      ? "multi_value"
      : "column";

    return {
      fieldId: field.id,
      kind: field.kind,
      storageKey,
      storageMode,
      physicalColumnName: storageMode === "multi_value"
        ? null
        : field.kind === "db_lookup"
          ? `${storageKey}_id`
          : storageKey,
      dataViewColumnName: storageKey,
      lookupOutputColumns: field.kind === "db_lookup"
        ? Object.fromEntries(
            getLookupDerivedOutputDefinitions(field, t).map((output) => [output.outputKey, output.columnName] as const),
          )
        : {},
    };
  });
}

function buildCompiledRuntimeMapping(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  model: Pick<FormsPlaceholderModel, "fields">,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const rootFields = model.fields.filter((field) => getFieldSchemaScopeId(field) === "root");

  return {
    dataScopes: [
      {
        schemaScopeId: "root",
        ...document.rootScope.dataSchema.runtime,
        fields: buildCompiledRuntimeFieldMappings(rootFields, t),
      },
      ...document.subformScopes.map((scope) => ({
        schemaScopeId: scope.tableKey,
        ...scope.dataSchema.runtime,
        fields: buildCompiledRuntimeFieldMappings(
          model.fields.filter((field) => getFieldSchemaScopeId(field) === scope.tableKey),
          t,
        ),
      })),
    ],
    viewScopes: [
      {
        schemaScopeId: "root",
        ...document.rootScope.runtime,
      },
      ...document.subformScopes.map((scope) => ({
        schemaScopeId: scope.tableKey,
        ...scope.runtime,
      })),
    ],
  } satisfies Record<string, unknown>;
}

function compileDebugSchemas(
  document: ReturnType<typeof useFormBuilderDocument>["document"],
  model: FormsPlaceholderModel,
  view: FormsPlaceholderView,
  layoutBlueprint: Record<string, unknown>,
  t: ReturnType<typeof useTranslation>["t"],
) {
  return {
    modelSchema: {
      dataSchema: buildCanonicalDataSchema(model, document),
      layoutBlueprint,
    },
    compiledRuntime: buildCompiledRuntimeMapping(document, model, t),
    uiSchema: {
      isDefault: view.isDefault,
      isActive: view.isActive,
      viewId: view.id,
      viewKey: view.key,
      ...buildCanonicalUiSchema(document, model),
    },
  };
}

function getAllFormBuilderDocumentNodes(document: ReturnType<typeof createPersistedFormBuilderDocument>) {
  return [
    ...document.rootScope.uiSchema.nodes,
    ...document.subformScopes.flatMap((scope) => scope.uiSchema.nodes),
  ];
}

function getCanvasAttentionNodeIds(
  currentDocument: ReturnType<typeof createPersistedFormBuilderDocument>,
  savedDocument: ReturnType<typeof createPersistedFormBuilderDocument>,
  currentModel: FormsPlaceholderModel,
  savedModel: FormsPlaceholderModel,
) {
  const currentNodes = getAllFormBuilderDocumentNodes(currentDocument);
  const savedNodes = getAllFormBuilderDocumentNodes(savedDocument);
  const currentNodeById = new Map(currentNodes.map((node) => [node.id, node]));
  const savedNodeById = new Map(savedNodes.map((node) => [node.id, node]));
  const directlyChangedNodeIds = new Set<string>();

  new Set([...currentNodeById.keys(), ...savedNodeById.keys()]).forEach((nodeId) => {
    const currentNode = currentNodeById.get(nodeId);
    const previousNode = savedNodeById.get(nodeId);
    if (!currentNode || !previousNode || JSON.stringify(currentNode) !== JSON.stringify(previousNode)) {
      directlyChangedNodeIds.add(nodeId);
    }
  });

  const currentFieldById = new Map(currentModel.fields.map((field) => [field.id, field]));
  const savedFieldById = new Map(savedModel.fields.map((field) => [field.id, field]));
  new Set([...currentFieldById.keys(), ...savedFieldById.keys()]).forEach((fieldId) => {
    const currentField = currentFieldById.get(fieldId);
    const previousField = savedFieldById.get(fieldId);
    if (!currentField || !previousField || JSON.stringify(currentField) !== JSON.stringify(previousField)) {
      currentNodes.forEach((node) => {
        if (node.type === "field" && node.fieldId === fieldId) {
          directlyChangedNodeIds.add(node.id);
        }
      });
    }
  });

  const attentionNodeIds = new Set<string>();
  const appendAncestorChain = (
    nodeMap: ReadonlyMap<string, FormBuilderNode>,
    startNodeId: string,
  ) => {
    let cursor: string | null = startNodeId;
    while (cursor) {
      if (currentNodeById.has(cursor)) {
        attentionNodeIds.add(cursor);
      }

      cursor = nodeMap.get(cursor)?.parentId ?? null;
    }
  };

  directlyChangedNodeIds.forEach((nodeId) => {
    appendAncestorChain(currentNodeById, nodeId);
    appendAncestorChain(savedNodeById, nodeId);
  });

  return attentionNodeIds;
}

export function FormsViewWorkspacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const runtimeConfig = useTenantRuntimeConfig();
  const draftClient = useMemo(
    () => createTenantFormBuilderDraftClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const {
    checkAuth,
    getAccessToken,
    signOut,
  } = useAuth();
  const {
    ensureModel,
    models,
    replaceModel,
  } = useFormBuilderAuthoring();
  const workspaceUser = useTenantWorkspaceUser();
  const currentActor = getFormsAuthoringActor(workspaceUser);
  const model = getFormsPlaceholderModel(params.modelId, models);
  const view = getFormsPlaceholderView(params.modelId, params.viewId, models);
  const fallbackView = useMemo(
    () => createRouteBootstrapFallbackView(params.viewId),
    [params.viewId],
  );
  const fallbackModel = useMemo(
    () => createRouteBootstrapFallbackModel(params.modelId, fallbackView),
    [fallbackView, params.modelId],
  );
  const hasResolvedWorkspace = Boolean(model && view);
  const resolvedModel = model ?? fallbackModel;
  const resolvedView = view
    ?? findFormsPlaceholderScreenById(resolvedModel.screens, fallbackView.id)
    ?? fallbackView;
  const routeDraftSignature = hasResolvedWorkspace ? `${resolvedModel.id}:${resolvedView.id}` : null;
  const [routeBootstrapError, setRouteBootstrapError] = useState<string | null>(null);
  const [isBootstrappingRoute, setIsBootstrappingRoute] = useState(Boolean(params.modelId && params.viewId));
  const [paletteQuery, setPaletteQuery] = useState("");
  const [inspectorTab, setInspectorTab] = useState<InspectorPanelTabValue>("selection");
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [draggedGridFieldId, setDraggedGridFieldId] = useState<string | null>(null);
  const [dragOverGridFieldId, setDragOverGridFieldId] = useState<string | null>(null);
  const [draggedChoiceOptionIndex, setDraggedChoiceOptionIndex] = useState<number | null>(null);
  const [dragOverChoiceOptionIndex, setDragOverChoiceOptionIndex] = useState<number | null>(null);
  const [deleteNodeOpen, setDeleteNodeOpen] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [draftSyncError, setDraftSyncError] = useState<string | null>(null);
  const [isDraftSyncing, setIsDraftSyncing] = useState(false);
  const [hydratedDraftSignature, setHydratedDraftSignature] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const hasHydratedCurrentDraft = routeDraftSignature !== null && hydratedDraftSignature === routeDraftSignature;

  useEffect(() => {
    if (!params.modelId || !params.viewId) {
      setIsBootstrappingRoute(false);
      setRouteBootstrapError(null);
      return;
    }

    if (model && view) {
      setIsBootstrappingRoute(false);
      setRouteBootstrapError(null);
      return;
    }

    let isActive = true;
    setIsBootstrappingRoute(true);
    setRouteBootstrapError(null);

    void ensureModel(params.modelId)
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.statusCode === 404) {
          setRouteBootstrapError(null);
          return;
        }

        setRouteBootstrapError(
          error instanceof Error
            ? error.message
            : t("tenant.platformStudio.forms.workspaceBootstrapError"),
        );
      })
      .finally(() => {
        if (isActive) {
          setIsBootstrappingRoute(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [ensureModel, model, params.modelId, params.viewId, t, view]);

  const [modelDraft, setModelDraft] = useState<FormsPlaceholderModel>(() => cloneFormsPlaceholderModel(resolvedModel));
  const [savedModelDraft, setSavedModelDraft] = useState<FormsPlaceholderModel>(() => cloneFormsPlaceholderModel(resolvedModel));
  const [layoutBlueprintDraft, setLayoutBlueprintDraft] = useState<Record<string, unknown>>(() =>
    createEmptyLayoutBlueprint(resolvedModel),
  );
  const [savedLayoutBlueprintDraft, setSavedLayoutBlueprintDraft] = useState<Record<string, unknown>>(() =>
    createEmptyLayoutBlueprint(resolvedModel),
  );
  const currentModel = modelDraft;
  const currentView = findFormsPlaceholderScreenById(currentModel.screens, resolvedView.id) ?? resolvedView;
  const isDefaultView = isDefaultFormsPlaceholderView(currentView);
  const isStaticModel = typeof currentModel.sourceType === "string"
    && currentModel.sourceType.trim().length > 0
    && currentModel.sourceType !== "managed";
  const currentModelRouteId = getFormsPlaceholderModelRouteId(currentModel);
  const [pendingDefaultFilterFieldId, setPendingDefaultFilterFieldId] = useState(
    () => currentModel.fields[0]?.id ?? "",
  );
  const [defaultFilterEditor, setDefaultFilterEditor] = useState<{
    draft: FormBuilderFilterCondition;
    index: number | null;
  } | null>(null);
  const [quickFilterEditor, setQuickFilterEditor] = useState<{
    draft: FormBuilderQuickFilter;
    index: number | null;
  } | null>(null);
  const [visibilityRuleEditor, setVisibilityRuleEditor] = useState<{
    draft: FormBuilderVisibilityRule;
    index: number | null;
  } | null>(null);
  const [requirementRuleEditor, setRequirementRuleEditor] = useState<{
    draft: FormBuilderRequirementRule;
    index: number | null;
  } | null>(null);
  const [lookupSourcePicker, setLookupSourcePicker] = useState<{
    fieldId: string;
    modelId: string;
    selectedFieldKeys: ReadonlyArray<string>;
    sortFieldKey: string;
  } | null>(null);
  const [lookupSourceModelsById, setLookupSourceModelsById] = useState<Record<string, LookupSourceModelOption>>({});
  const [isLookupSourcePickerLoading, setIsLookupSourcePickerLoading] = useState(false);
  const [lookupSourcePickerError, setLookupSourcePickerError] = useState<string | null>(null);

  const access = getFormsAuthoringAccess(currentActor, currentModel, currentView);
  const workspaceAccess = getFormsWorkspaceAccess(access, currentModel, currentView);
  const {
    document,
    hydrateDocument,
    isDirty: hasUnsavedDocumentChanges,
    savedDocument,
    setDocument,
  } = useFormBuilderDocument(currentModel, currentView);
  const hydrateDocumentRef = useRef(hydrateDocument);
  const hasUnsavedModelChanges = useMemo(
    () => JSON.stringify(modelDraft) !== JSON.stringify(savedModelDraft),
    [modelDraft, savedModelDraft],
  );
  const hasUnsavedChanges = hasUnsavedDocumentChanges || hasUnsavedModelChanges;
  const isSaveButtonDisabled = !hasUnsavedChanges || savePulse || isSavingDraft || isDraftSyncing;
  const currentModelSchemaScopes = useMemo(
    () => deriveModelSchemaScopes(currentModel, document),
    [currentModel, document],
  );
  const savedModelSchemaScopes = useMemo(
    () => deriveModelSchemaScopes(savedModelDraft, savedDocument),
    [savedDocument, savedModelDraft],
  );
  const currentDataSchema = useMemo(
    () => buildCanonicalDataSchema({
      ...currentModel,
      schemaScopes: currentModelSchemaScopes,
    }, document),
    [currentModel, currentModelSchemaScopes, document],
  );
  const savedDataSchema = useMemo(
    () => buildCanonicalDataSchema({
      ...savedModelDraft,
      schemaScopes: savedModelSchemaScopes,
    }, savedDocument),
    [savedDocument, savedModelDraft, savedModelSchemaScopes],
  );
  const activeScope = getActiveFormBuilderScope(document);
  const currentScopeParentId = getCurrentFormBuilderParentId(document);
  const currentScopeSelectedNodeId = getCurrentFormBuilderSelectedNodeId(document);
  const currentNodes = getCurrentFormBuilderChildren(document);
  const persistedDocument = useMemo(
    () => createPersistedFormBuilderDocument(document),
    [document],
  );
  const attentionNodeIds = useMemo(
    () => getCanvasAttentionNodeIds(persistedDocument, savedDocument, currentModel, savedModelDraft),
    [currentModel, persistedDocument, savedDocument, savedModelDraft],
  );
  const selectedNode = getFormBuilderNode(document, currentScopeSelectedNodeId);
  const selectedField =
    selectedNode?.type === "field"
      ? currentModel.fields.find((field) => field.id === selectedNode.fieldId) ?? null
      : null;
  const selectedNodeScopeFields = useMemo(
    () => selectedNode ? getRuleScopeFields(document, currentModel.fields, selectedNode.id) : [],
    [currentModel.fields, document, selectedNode],
  );
  const selectedNodeRuleFields = useMemo(
    () => selectedNode?.type === "field" && selectedField
      ? selectedNodeScopeFields.filter((field) => field.id !== selectedField.id)
      : selectedNodeScopeFields,
    [selectedField, selectedNode?.type, selectedNodeScopeFields],
  );
  const selectedNodeSupportsRules = Boolean(
    selectedNode && (selectedNode.type === "field" || selectedNode.type === "view_only_field" || isFormBuilderContainer(selectedNode.type)),
  );
  const selectedVisibilityRuleItems: ReadonlyArray<RulesPanelRuleItem> = (selectedNode?.rules?.visibilityRules ?? []).map((rule) => ({
    effectLabel: t(`tenant.platformStudio.forms.builder.rule.effect.${rule.effect}`),
    id: rule.id,
    summary: getRuleSummary(rule, selectedNodeRuleFields, t),
  }));
  const selectedRequirementRuleItems: ReadonlyArray<RulesPanelRuleItem> = (selectedNode?.rules?.requirementRules ?? []).map((rule) => ({
    effectLabel: t(`tenant.platformStudio.forms.builder.rule.effect.${rule.effect}`),
    id: rule.id,
    summary: getRuleSummary(rule, selectedNodeRuleFields, t),
  }));
  const currentParentNode = getFormBuilderNode(document, currentScopeParentId);
  const currentScopeSubformNode = getCurrentFormBuilderScopeSubformNode(document);
  const currentGridScopeFields = useMemo(
    () => getScopeFields(document, currentModel.fields, currentScopeSubformNode?.id ?? null),
    [currentModel.fields, currentScopeSubformNode?.id, document],
  );
  const currentGridScopeTargets = useMemo(
    () => getFieldsWithLookupDerivedOutputs(document, currentGridScopeFields, t),
    [currentGridScopeFields, document, t],
  );
  const currentGridColumns = activeScope.scopeType === "SUBFORM"
    ? activeScope.viewSettings.list.columns
    : document.viewSettings.list.columns;
  const sortedCurrentGridScopeTargets = useMemo(
    () => sortGridScopeFields(currentGridScopeTargets, currentGridColumns),
    [currentGridColumns, currentGridScopeTargets],
  );
  const isChecklistGridScope = currentScopeSubformNode?.subformType === "CHECKLIST";
  const isSubformGridScope = Boolean(currentScopeSubformNode);
  const isRootViewScope = activeScope.scopeType === "ROOT";
  const isDefaultSubformViewScope = activeScope.scopeType === "SUBFORM" && activeScope.subformType === "DEFAULT";
  const isViewTabAvailable = isRootViewScope || isDefaultSubformViewScope;
  const rootViewScopeFields = useMemo(
    () => getScopeFields(document, currentModel.fields, null),
    [currentModel.fields, document],
  );
  const rootViewFilterTargets = useMemo(
    () => getFieldsWithLookupDerivedOutputs(document, rootViewScopeFields, t),
    [document, rootViewScopeFields, t],
  );
  const currentScopeFilterDefinitions = activeScope.scopeType === "SUBFORM"
    ? activeScope.filterDefinitions
    : document.filterDefinitions;
  const currentViewFilterTargets = isRootViewScope ? rootViewFilterTargets : currentGridScopeTargets;
  const currentDraftViewTitle = document.viewTitle.trim() || currentView.title;
  const currentScopeViewLabel = isRootViewScope
    ? currentDraftViewTitle
    : (currentScopeSubformNode?.title ?? t("tenant.platformStudio.forms.builder.nodeType.subform"));
  const currentScopeViewSettings = activeScope.scopeType === "SUBFORM"
    ? activeScope.viewSettings
    : null;
  const currentScopeSortingFields = isRootViewScope ? rootViewScopeFields : currentGridScopeFields;
  const selectedFieldIsChoice = selectedField?.kind === "single_select" || selectedField?.kind === "multi_select";
  const selectedFieldIsLookup = selectedField?.kind === "db_lookup";
  const selectedFieldIsPresetLookup = selectedField ? isPresetLookupField(selectedField) : false;
  const selectedFieldIsLookupValue = selectedField?.preset === "db_lookup_value";
  const selectedFieldShowsLookupDisplayMode = selectedFieldIsLookup
    && !selectedFieldIsPresetLookup
    && !selectedFieldIsLookupValue
    && (selectedField?.selectionMode ?? "single") === "single";
  const selectedLookupSourceSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup" ? getLookupSourceSummary(selectedField, t) : null,
    [selectedField, t],
  );
  const availableLookupSourceModels = useMemo(
    () => models
      .filter((entry) => entry.id !== currentModel.id)
      .map((entry) => lookupSourceModelsById[entry.id] ?? buildLookupSourceModelFromPlaceholderModel(entry)),
    [currentModel.id, lookupSourceModelsById, models],
  );
  const selectedNodeScopeSubformId = selectedNode
    ? getFormBuilderNodeScopeId(document, selectedNode.id)
    : "root";
  const selectedViewOnlyBindingOptions = useMemo(
    () => selectedNode?.type === "view_only_field"
      ? getViewOnlyBindingOptions(
          document,
          currentModel.fields,
          selectedNodeScopeSubformId === "root" ? null : selectedNodeScopeSubformId,
          t,
        )
      : [],
    [currentModel.fields, document, selectedNode?.id, selectedNode?.type, selectedNodeScopeSubformId, t],
  );
  const selectedViewOnlyBindingOption = useMemo(
    () => selectedNode?.type === "view_only_field"
      ? getViewOnlyBindingOption(selectedNode.viewOnlyBinding, document, currentModel.fields, t)
      : null,
    [currentModel.fields, document, selectedNode, t],
  );
  const selectedGenericLookupSourceModel = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupSourceModelById(availableLookupSourceModels, selectedField.lookupConfig?.sourceModel)
      : null,
    [availableLookupSourceModels, selectedField],
  );
  const selectedLookupStoredValueSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupStoredValueSummary(selectedField, selectedGenericLookupSourceModel, t)
      : null,
    [selectedField, selectedGenericLookupSourceModel, t],
  );
  const selectedLookupSortFieldSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupSortFieldSummary(selectedField, selectedGenericLookupSourceModel, t)
      : null,
    [selectedField, selectedGenericLookupSourceModel, t],
  );
  const lookupSourcePickerModel = useMemo(
    () => getLookupSourceModelById(availableLookupSourceModels, lookupSourcePicker?.modelId),
    [availableLookupSourceModels, lookupSourcePicker?.modelId],
  );
  const selectedFieldSupportsTextInputSettings = selectedField?.kind === "short_text";
  const selectedFieldSupportsTextPreset =
    selectedField?.preset === "email" || selectedField?.preset === "phone" || selectedField?.preset === "url";
  const selectedFieldIsDateToday = selectedField?.preset === "date_today";
  const selectedFieldIsTags = selectedField?.preset === "tags";
  const selectedFieldAutocompleteChecked = selectedField ? selectedField.autocomplete !== "off" : true;
  const canEditModelDefinition = access.canManageStructure && isDefaultView;
  const shouldSyncFieldNodeTitlesWithModel = isDefaultView && !isStaticModel;
  const canToggleModelLocks = currentActor.isRoot && !isStaticModel;
  const canToggleViewLocks = currentActor.isRoot;
  const selectedFieldDefaultAutocompleteValue = useMemo(() => {
    if (!selectedField) {
      return "on";
    }

    switch (selectedField.preset) {
      case "email":
        return "email";
      case "phone":
        return "tel";
      case "url":
        return "url";
      default:
        return "on";
    }
  }, [selectedField]);
  const currentScopeContainerType = currentScopeParentId
    ? currentParentNode?.type ?? null
    : (activeScope.scopeType === "SUBFORM" ? "subform" : null);
  const canPlaceFieldAtCurrentLevel = getAllowedChildNodeTypes(currentScopeContainerType).includes("field");
  const currentUiSchema = useMemo(
    () => buildCanonicalUiSchema(document, currentModel),
    [currentModel, document],
  );
  const currentLayoutBlueprint = useMemo(
    () => (isDefaultView ? buildCanonicalLayoutBlueprint(document) : layoutBlueprintDraft),
    [document, isDefaultView, layoutBlueprintDraft],
  );
  const breadcrumb = getFormBuilderBreadcrumb(document);
  const structureEditingAccess = useMemo(
    () => (isDefaultView
      ? workspaceAccess
      : {
          ...workspaceAccess,
          canAddElementItems: false,
          canAddFieldItems: false,
          canRemoveItems: false,
          lockReasonKey: "tenant.platformStudio.forms.builder.defaultViewBlueprintOnlyNotice",
          structureLockReasonKey: "tenant.platformStudio.forms.builder.defaultViewStructureOnlyNotice",
        }),
    [isDefaultView, workspaceAccess],
  );
  const elementItems = getElementPaletteItems(document, structureEditingAccess, paletteQuery);
  const workflowStatusField = getFieldById(currentModel.fields, document.systemFields.workflowStatus?.fieldId);
  const workflowStatusOptions = workflowStatusField?.options ?? [];
  const currentScopePlacementLabel = isRootViewScope
    ? t("tenant.platformStudio.forms.builder.rootLevel")
    : currentScopeViewLabel;
  const currentScopeUnplacedFieldIds = useMemo(
    () => getFormBuilderScopeUnplacedFieldIds(document, currentScopeSubformNode?.id ?? null),
    [currentScopeSubformNode?.id, document],
  );
  const currentScopeUnplacedFields = useMemo(() => {
    const fieldById = new Map(currentModel.fields.map((field) => [field.id, {
      ...field,
      label: getAuthoringFieldLabel(field, document),
    }]));
    return currentScopeUnplacedFieldIds.flatMap((fieldId) => {
      const field = fieldById.get(fieldId);
      return field ? [field] : [];
    });
  }, [currentModel.fields, currentScopeUnplacedFieldIds, document]);
  const canCreateFieldAtCurrentLevel = canPlaceFieldAtCurrentLevel;
  const fieldPlacementAccess = structureEditingAccess;
  const fieldItems = getFieldPaletteItems(document, fieldPlacementAccess, paletteQuery);
  const canPlaceUnplacedFields = isDefaultView
    && canPlaceFieldAtCurrentLevel
    && structureEditingAccess.canAddFieldItems;
  const unplacedFieldsHintKey = !isDefaultView
    ? "tenant.platformStudio.forms.builder.unplacedFieldsDefaultOnlyHint"
    : !canPlaceFieldAtCurrentLevel
      ? "tenant.platformStudio.forms.builder.unplacedFieldsOpenContainerHint"
      : (!structureEditingAccess.canAddFieldItems
        ? (structureEditingAccess.structureLockReasonKey ?? structureEditingAccess.lockReasonKey)
        : null);
  const pendingNavigationPathRef = useRef<string | null>(null);
  const pendingLeaveResolverRef = useRef<((value: boolean) => void) | null>(null);
  const selectionPanelTopRef = useRef<HTMLDivElement | null>(null);
  const compiledDebugSchemas = useMemo(
    () => compileDebugSchemas(
      document,
      {
        ...currentModel,
        schemaScopes: currentModelSchemaScopes,
      },
      currentView,
      currentLayoutBlueprint,
      t,
    ),
    [currentLayoutBlueprint, currentModel, currentModelSchemaScopes, currentView, document, t],
  );

  function cycleNodeVisibility(currentVisibility: FormBuilderNode["visibility"]): FormBuilderNode["visibility"] {
    switch (currentVisibility) {
      case "visible":
        return "readonly";
      case "readonly":
        return "hidden";
      default:
        return "visible";
    }
  }

  useEffect(() => {
    hydrateDocumentRef.current = hydrateDocument;
  }, [hydrateDocument]);

  useEffect(() => {
    const nextModelDraft = cloneFormsPlaceholderModel(resolvedModel);
    setModelDraft(nextModelDraft);
    setSavedModelDraft(nextModelDraft);
    if (!hasResolvedWorkspace) {
      const nextLayoutBlueprint = createEmptyLayoutBlueprint(nextModelDraft);
      setLayoutBlueprintDraft(nextLayoutBlueprint);
      setSavedLayoutBlueprintDraft(nextLayoutBlueprint);
    }
  }, [hasResolvedWorkspace, resolvedModel]);

  useEffect(() => {
    if (!hasResolvedWorkspace) {
      return;
    }

    const draftSignature = `${resolvedModel.id}:${resolvedView.id}`;
    if (hydratedDraftSignature === draftSignature) {
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    let isActive = true;
    setIsDraftSyncing(true);
    setDraftSyncError(null);
    setHydratedDraftSignature((current) => (current === draftSignature ? current : null));

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    void requestWithUnauthorizedRetry(
      (bearerToken) => draftClient.loadDraft(bearerToken, resolvedModel.id, resolvedView.id),
      {
        accessToken,
        onUnauthorized: recoverUnauthorizedAccessToken,
      },
    )
      .then((response) => {
        if (!isActive) {
          return;
        }

        const loadedModel = normalizeFormsPlaceholderModel(response.draft.model, resolvedModel);
        const hydratedView = normalizeFormsPlaceholderView(
          response.draft.view,
          findFormsPlaceholderScreenById(loadedModel.screens, resolvedView.id) ?? resolvedView,
          loadedModel,
        );
        const nextModel = replaceModelViewById(loadedModel, hydratedView);
        const nextView = findFormsPlaceholderScreenById(nextModel.screens, resolvedView.id) ?? hydratedView;
        const nextLayoutBlueprint = isRecord(response.draft.model.layoutBlueprint)
          ? response.draft.model.layoutBlueprint
          : createEmptyLayoutBlueprint(nextModel);
        const nextDocument = buildWorkspaceDocumentFromCanonicalSchemas(
          response.draft.model,
          response.draft.view,
          nextModel,
          nextView,
        );
        const nextCanonicalDocument = shouldSyncFieldNodeTitlesWithModel
          ? syncFieldNodeTitlesWithModel(nextDocument, nextModel)
          : nextDocument;
        const alignedStructureVersions = [
          resolvedView.lastAlignedModelStructureVersion,
          hydratedView.lastAlignedModelStructureVersion,
          nextView.lastAlignedModelStructureVersion,
        ].filter((value): value is number => typeof value === "number");
        const lastKnownAlignedStructureVersion = alignedStructureVersions.length > 0
          ? Math.min(...alignedStructureVersions)
          : (nextModel.modelStructureVersion ?? 1);
        const shouldEnforceCanonicalFieldPlacements =
          (nextModel.modelStructureVersion ?? 1) > lastKnownAlignedStructureVersion;
        const nextModelWithScopes = cloneFormsPlaceholderModel({
          ...nextModel,
          schemaScopes: deriveModelSchemaScopes(nextModel, nextCanonicalDocument),
        });
        const reconciledDocument = reconcileFormBuilderDocumentWithModel(
          nextCanonicalDocument,
          nextModelWithScopes,
          nextLayoutBlueprint,
          {
            enforceCanonicalFieldPlacements: shouldEnforceCanonicalFieldPlacements,
          },
        );
        const baselineDocument = JSON.stringify(reconciledDocument) !== JSON.stringify(nextCanonicalDocument)
          ? reconciledDocument
          : nextCanonicalDocument;
        const baselineModel = cloneFormsPlaceholderModel({
          ...nextModelWithScopes,
          schemaScopes: deriveModelSchemaScopes(nextModelWithScopes, baselineDocument),
        });

        setHydratedDraftSignature(draftSignature);
        replaceModel(baselineModel);
        setModelDraft(baselineModel);
        setSavedModelDraft(baselineModel);
        setLayoutBlueprintDraft(nextLayoutBlueprint);
        setSavedLayoutBlueprintDraft(nextLayoutBlueprint);
        // Treat the frontend-normalized workspace state as the clean baseline after load.
        // Otherwise Save becomes active immediately when reconciliation adds canonical nodes.
        hydrateDocumentRef.current(baselineDocument);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedApiError(error)) {
          void signOut();
          return;
        }

        if (isDraftEndpointUnavailable(error)) {
          setHydratedDraftSignature(draftSignature);
          return;
        }
        setDraftSyncError(
          error instanceof Error
            ? error.message
            : t("tenant.platformStudio.forms.builder.draftLoadError"),
        );
      })
      .finally(() => {
        if (isActive) {
          setIsDraftSyncing(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [checkAuth, draftClient, getAccessToken, hasResolvedWorkspace, hydratedDraftSignature, replaceModel, resolvedModel, resolvedView, signOut, t]);

  useEffect(() => {
    setVisibilityRuleEditor(null);
    setRequirementRuleEditor(null);
    setLookupSourcePicker(null);
  }, [selectedNode?.id]);
  useEffect(() => {
    setDraggedChoiceOptionIndex(null);
    setDragOverChoiceOptionIndex(null);
  }, [selectedField?.id]);
  useEffect(() => {
    if (inspectorTab !== "selection" || !selectedNode?.id) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      selectionPanelTopRef.current?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [inspectorTab, selectedNode?.id]);
  useEffect(() => {
    if (currentViewFilterTargets.length === 0) {
      if (pendingDefaultFilterFieldId) {
        setPendingDefaultFilterFieldId("");
      }
      return;
    }

    if (!currentViewFilterTargets.some((field) => field.id === pendingDefaultFilterFieldId)) {
      setPendingDefaultFilterFieldId(currentViewFilterTargets[0]?.id ?? "");
    }
  }, [currentViewFilterTargets, pendingDefaultFilterFieldId]);
  const debugDataSchema = useMemo(
    () => JSON.stringify(compiledDebugSchemas.modelSchema, null, 2),
    [compiledDebugSchemas.modelSchema],
  );
  const debugCompiledRuntime = useMemo(
    () => JSON.stringify(compiledDebugSchemas.compiledRuntime, null, 2),
    [compiledDebugSchemas.compiledRuntime],
  );
  const debugUiSchema = useMemo(
    () => JSON.stringify(compiledDebugSchemas.uiSchema, null, 2),
    [compiledDebugSchemas.uiSchema],
  );

  useEffect(() => {
    if (inspectorTab === "view" && !isViewTabAvailable) {
      setInspectorTab("selection");
    }
  }, [inspectorTab, isViewTabAvailable]);

  useBeforeUnload((event) => {
    if (!hasUnsavedChanges) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  useEffect(() => {
    window.__tenantPlatformStudioLeaveGuard = () => {
      if (!hasUnsavedChanges) {
        return true;
      }

      return new Promise<boolean>((resolve) => {
        pendingLeaveResolverRef.current = resolve;
        pendingNavigationPathRef.current = null;
        setLeaveConfirmOpen(true);
      });
    };

    return () => {
      if (window.__tenantPlatformStudioLeaveGuard) {
        delete window.__tenantPlatformStudioLeaveGuard;
      }
    };
  }, [hasUnsavedChanges]);

  const systemFieldItems = useMemo<ReadonlyArray<SystemFieldPaletteItem>>(() => {
    if (!canPlaceFieldAtCurrentLevel || document.activeScopeId !== "root") {
      return [];
    }

    const normalizedSearch = paletteQuery.trim().toLowerCase();

    return systemFieldRoles
      .map((role) => {
        const alreadyConfigured = Boolean(getBoundSystemFieldIdByRole(document, role));

        return {
          descriptionKey: getSystemFieldPaletteDescriptionKey(role),
          disabled: !fieldPlacementAccess.canAddFieldItems || alreadyConfigured,
          disabledReasonKey: alreadyConfigured
            ? "tenant.platformStudio.forms.builder.systemField.alreadyConfigured"
            : (!fieldPlacementAccess.canAddFieldItems ? fieldPlacementAccess.structureLockReasonKey : null),
          iconKey:
            role === "reportedBy"
              ? "db_lookup"
              : role === "reportedDate"
                ? "date"
                : "status",
          key: role,
          kind: "systemField" as const,
          labelKey: getSystemFieldKey(role),
          searchTerms: [
            role,
            role === "reportedBy"
              ? "reported by contact user"
              : role === "reportedDate"
                ? "reported date date"
                : "status workflow state",
          ],
        };
      })
      .filter((item) =>
        !normalizedSearch || item.searchTerms.some((term) => term.toLowerCase().includes(normalizedSearch)),
      );
  }, [canPlaceFieldAtCurrentLevel, document, fieldPlacementAccess, paletteQuery]);

  const paletteSections = useMemo(
    () =>
      formBuilderPaletteSectionDefinitions
        .map((section) => {
          if (section.key === "layout" || section.key === "content") {
            return {
              items: elementItems.filter((item) => item.category === section.key),
              key: section.key,
              labelKey: section.labelKey,
            };
          }

          if (section.key === "systemFields") {
            return {
              items: systemFieldItems,
              key: section.key,
              labelKey: section.labelKey,
            };
          }

          return {
            items: fieldItems.filter((item) => item.category === section.key as FormBuilderFieldPaletteCategory),
            key: section.key,
            labelKey: section.labelKey,
          };
        })
        .filter((section) => section.items.length > 0),
    [elementItems, fieldItems, systemFieldItems],
  );

  function updateDocument(updater: (currentDocument: typeof document) => typeof document) {
    setDocument((currentDocument) => updater(currentDocument));
  }

  function updateCurrentModel(
    updater: (currentModelDraft: FormsPlaceholderModel) => FormsPlaceholderModel,
  ) {
    setModelDraft((currentValue) => cloneFormsPlaceholderModel(updater(currentValue)));
  }

  function updateFieldById(
    fieldId: string,
    updater: (field: FormsPlaceholderField) => FormsPlaceholderField,
  ) {
    if (!canEditModelDefinition) {
      return;
    }

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: currentModelDraft.fields.map((field) =>
        field.id === fieldId ? updater(field) : field
      ),
    }));
  }

  function deleteUnsavedField(fieldId: string, nodeId: string) {
    const nextModelBase = cloneFormsPlaceholderModel({
      ...currentModel,
      fields: currentModel.fields.filter((field) => field.id !== fieldId),
    });
    const documentWithoutField = normalizePersistedFormBuilderDocument(
      createPersistedFormBuilderDocument(removeFormBuilderNode(document, nodeId)),
      nextModelBase,
      currentView,
    );
    const nextModel = cloneFormsPlaceholderModel({
      ...nextModelBase,
      schemaScopes: deriveModelSchemaScopes(nextModelBase, documentWithoutField),
    });

    setModelDraft(nextModel);
    setDocument(documentWithoutField);
  }

  function updateSelectedField(
    updater: (field: FormsPlaceholderField) => FormsPlaceholderField,
  ) {
    if (!selectedField) {
      return;
    }

    updateFieldById(selectedField.id, updater);
  }

  function updateCurrentViewMetadata(
    updater: (viewEntry: FormsPlaceholderView) => FormsPlaceholderView,
  ) {
    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      screens: currentModelDraft.screens.map((screenEntry) =>
        screenEntry.id === currentView.id
          ? updater(screenEntry)
          : screenEntry
      ),
    }));
  }

  function getScopeSchemaScopeKey(scope: typeof activeScope) {
    return scope.scopeType === "SUBFORM" ? scope.tableKey : "root";
  }

  function getDocumentFieldSchemaScopeKey(
    currentDocument: typeof document,
    fieldId: string,
  ) {
    const subformScope = currentDocument.subformScopes.find((scope) => scope.dataSchema.fieldIds.includes(fieldId));
    if (subformScope) {
      return subformScope.tableKey;
    }

    return currentDocument.rootScope.dataSchema.fieldIds.includes(fieldId) ? "root" : null;
  }

  function humanizeSchemaScopeKey(value: string) {
    return value
      .replace(/^pb_/, "")
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Subform";
  }

  function deriveModelSchemaScopes(
    modelDraft: FormsPlaceholderModel,
    currentDocument: typeof document,
  ) {
    const nextScopes = new Map(
      (modelDraft.schemaScopes ?? []).map((scope) => [scope.key, scope]),
    );
    const subformNodeById = new Map(
      currentDocument.rootScope.uiSchema.nodes
        .filter((node) => node.type === "subform")
        .map((node) => [node.id, node]),
    );

    currentDocument.subformScopes.forEach((scope) => {
      const key = scope.tableKey.trim();
      if (!key) {
        return;
      }

      nextScopes.set(key, {
        displayName:
          subformNodeById.get(scope.parentSubformNodeId)?.title?.trim()
          || nextScopes.get(key)?.displayName
          || humanizeSchemaScopeKey(key),
        key,
        scopeType: "SUBFORM",
        subformType: scope.subformType,
      });
    });

    return [...nextScopes.values()];
  }

  function handleCreateLibraryField(definition: FormBuilderLibraryFieldDefinition) {
    if (!canCreateFieldAtCurrentLevel || !structureEditingAccess.canAddFieldItems || !canEditModelDefinition) {
      return;
    }

    const nextField = createFormBuilderFieldFromDefinition(
      definition,
      currentModel.fields,
      getScopeSchemaScopeKey(activeScope),
    );

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: [...currentModelDraft.fields, nextField],
    }));

    updateDocument((currentDocument) =>
      addFormBuilderFieldNode(currentDocument, getCurrentFormBuilderInsertParentId(currentDocument), nextField)
    );
  }

  function updateSelectedFieldOptions(
    updater: (options: ReadonlyArray<string>) => ReadonlyArray<string>,
  ) {
    updateSelectedField((field) => {
      const nextOptions = updater(field.options ?? []);
      return {
        ...field,
        choiceDisplay: field.choiceDisplay
          ? {
              ...field.choiceDisplay,
              optionStyles: syncChoiceOptionStyles(nextOptions, field.choiceDisplay.optionStyles),
            }
          : field.choiceDisplay,
        options: nextOptions.length > 0 ? nextOptions : undefined,
      };
    });
  }

  function renameSelectedFieldOption(optionIndex: number, nextValue: string) {
    updateSelectedField((field) => {
      const currentOptions = field.options ?? [];
      const previousValue = currentOptions[optionIndex];
      const nextOptions = currentOptions.map((entry, entryIndex) =>
        entryIndex === optionIndex ? nextValue : entry
      );

      return {
        ...field,
        choiceDisplay: field.choiceDisplay
          ? {
              ...field.choiceDisplay,
              optionStyles: field.choiceDisplay.optionStyles
                ?.map((entry) => previousValue && entry.option === previousValue
                  ? {
                      ...entry,
                      option: nextValue,
                    }
                  : entry)
                .filter((entry) => nextOptions.includes(entry.option)),
            }
          : field.choiceDisplay,
        options: nextOptions.length > 0 ? nextOptions : undefined,
      };
    });
  }

  function reorderSelectedFieldOption(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }

    updateSelectedFieldOptions((options) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= options.length || toIndex >= options.length) {
        return options;
      }

      const nextOptions = [...options];
      const [movedOption] = nextOptions.splice(fromIndex, 1);

      if (typeof movedOption === "undefined") {
        return options;
      }

      nextOptions.splice(toIndex, 0, movedOption);
      return nextOptions;
    });
  }

  function updateSelectedFieldChoiceDisplay(
    updater: (choiceDisplay: FormsPlaceholderChoiceDisplay | undefined) => FormsPlaceholderChoiceDisplay | undefined,
  ) {
    updateSelectedField((field) => ({
      ...field,
      choiceDisplay: updater(field.choiceDisplay),
    }));
  }

  function updateSelectedFieldChoiceStyle(
    option: string,
    updater: (style: FormsPlaceholderFieldOptionStyle | undefined) => FormsPlaceholderFieldOptionStyle | undefined,
  ) {
    updateSelectedFieldChoiceDisplay((choiceDisplay) => {
      const currentStyles = choiceDisplay?.optionStyles ?? [];
      const currentStyle = currentStyles.find((entry) => entry.option === option);
      const nextStyle = updater(currentStyle);
      const remainingStyles = currentStyles.filter((entry) => entry.option !== option);
      const nextStyles = nextStyle ? [...remainingStyles, nextStyle] : remainingStyles;

      return {
        ...choiceDisplay,
        optionStyles: nextStyles.length > 0 ? nextStyles : undefined,
      };
    });
  }

  function updateSelectedFieldLookupConfig(
    updater: (lookupConfig: FormsPlaceholderLookupConfig | undefined) => FormsPlaceholderLookupConfig | undefined,
  ) {
    updateSelectedField((field) => ({
      ...field,
      lookupConfig: updater(field.lookupConfig),
    }));
  }

  async function loadLookupSourceModel(modelId: string) {
    const trimmedModelId = modelId.trim();
    if (!trimmedModelId) {
      return null;
    }

    const cachedModel = lookupSourceModelsById[trimmedModelId];
    if (cachedModel) {
      return cachedModel;
    }

    const sourceModel = await ensureModel(trimmedModelId);
    if (!sourceModel) {
      return null;
    }

    const fallbackSourceModel = buildLookupSourceModelFromPlaceholderModel(sourceModel);
    const defaultView = sourceModel.screens.find((entry) => entry.isDefault) ?? sourceModel.screens[0] ?? null;
    if (!defaultView) {
      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? fallbackSourceModel,
      }));
      return fallbackSourceModel;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? fallbackSourceModel,
      }));
      return fallbackSourceModel;
    }

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    try {
      const response = await requestWithUnauthorizedRetry(
        (bearerToken) => draftClient.loadDraft(bearerToken, sourceModel.id, defaultView.id),
        {
          accessToken,
          onUnauthorized: recoverUnauthorizedAccessToken,
        },
      );
      const nextSourceModel = buildLookupSourceModelFromDraft(sourceModel, response.draft.model);

      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? nextSourceModel,
      }));

      return nextSourceModel;
    } catch (error) {
      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? fallbackSourceModel,
      }));

      if (isUnauthorizedApiError(error)) {
        await signOut();
      }

      throw error;
    }
  }

  function openLookupSourcePicker() {
    if (!selectedField || selectedField.kind !== "db_lookup" || selectedFieldIsPresetLookup) {
      return;
    }

    const requestedModelId = selectedField.lookupConfig?.sourceModel?.trim();
    const initialModelId = requestedModelId && availableLookupSourceModels.some((entry) => entry.id === requestedModelId)
      ? requestedModelId
      : availableLookupSourceModels[0]?.id ?? "";

    setLookupSourcePickerError(null);
    setLookupSourcePicker({
      fieldId: selectedField.id,
      modelId: initialModelId,
      selectedFieldKeys: selectedField.displayFields?.length
        ? [...selectedField.displayFields]
        : [],
      sortFieldKey: selectedField.lookupConfig?.sortField ?? "",
    });
  }

  function saveLookupSourcePicker() {
    if (!selectedField || selectedField.kind !== "db_lookup" || !lookupSourcePickerModel || !lookupSourcePicker) {
      return;
    }
    if (lookupSourcePickerModel.id === currentModel.id) {
      return;
    }

    const selectedFieldSet = new Set(lookupSourcePicker.selectedFieldKeys);
    const effectiveDisplayFields = lookupSourcePickerModel.fields
      .filter((field) => selectedFieldSet.has(field.key))
      .map((field) => field.key);

    if (effectiveDisplayFields.length === 0) {
      return;
    }

    const nonStoredDisplayFields = effectiveDisplayFields.filter(
      (fieldKey) => fieldKey !== lookupSourcePickerModel.storedValueField,
    );
    const nextGroupByField = nonStoredDisplayFields[0] ?? effectiveDisplayFields[0];
    const nextItemLabelFields = nonStoredDisplayFields.slice(1);

    updateSelectedField((field) => ({
      ...field,
      displayFields: effectiveDisplayFields,
      lookupConfig: {
        ...field.lookupConfig,
        groupByField: field.preset === "db_lookup_value"
          ? undefined
          : field.lookupConfig?.displayMode === "catalog_modal"
            ? nextGroupByField
            : undefined,
        itemLabelFields: field.preset === "db_lookup_value"
          ? undefined
          : field.lookupConfig?.displayMode === "catalog_modal" && nextItemLabelFields.length > 0
            ? nextItemLabelFields
            : undefined,
        searchFields: [...effectiveDisplayFields],
        sortField: lookupSourcePicker.sortFieldKey || lookupSourcePickerModel.defaultSortField,
        sourceModel: lookupSourcePickerModel.id,
        storedTextFields: field.preset === "db_lookup_value" ? [...effectiveDisplayFields] : undefined,
        storedValueField: field.preset === "db_lookup_value" ? undefined : lookupSourcePickerModel.storedValueField,
      },
      sourceLabel: lookupSourcePickerModel.label,
    }));

    setLookupSourcePicker(null);
  }

  useEffect(() => {
    const sourceModelId =
      selectedField?.kind === "db_lookup" && !selectedFieldIsPresetLookup
        ? selectedField.lookupConfig?.sourceModel?.trim()
        : "";
    if (!sourceModelId || lookupSourceModelsById[sourceModelId]) {
      return;
    }

    void loadLookupSourceModel(sourceModelId).catch(() => {});
  }, [
    lookupSourceModelsById,
    selectedField?.id,
    selectedField?.kind,
    selectedField?.lookupConfig?.sourceModel,
    selectedFieldIsPresetLookup,
  ]);

  useEffect(() => {
    const targetModelId = lookupSourcePicker?.modelId?.trim();
    if (!targetModelId) {
      setIsLookupSourcePickerLoading(false);
      setLookupSourcePickerError(null);
      return;
    }

    if (lookupSourceModelsById[targetModelId]) {
      setIsLookupSourcePickerLoading(false);
      setLookupSourcePickerError(null);
      return;
    }

    let isActive = true;
    setIsLookupSourcePickerLoading(true);
    setLookupSourcePickerError(null);

    void loadLookupSourceModel(targetModelId)
      .then(() => {
        if (!isActive) {
          return;
        }

        setIsLookupSourcePickerLoading(false);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setLookupSourcePickerError(
          error instanceof Error
            ? error.message
            : t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerLoadError"),
        );
        setIsLookupSourcePickerLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [
    lookupSourceModelsById,
    lookupSourcePicker?.modelId,
    t,
  ]);

  useEffect(() => {
    if (!lookupSourcePicker || !lookupSourcePickerModel) {
      return;
    }

    if (lookupSourcePicker.selectedFieldKeys.length > 0 && lookupSourcePicker.sortFieldKey.trim()) {
      return;
    }

    setLookupSourcePicker((currentValue) => {
      if (!currentValue || currentValue.modelId !== lookupSourcePickerModel.id) {
        return currentValue;
      }

      return {
        ...currentValue,
        selectedFieldKeys: currentValue.selectedFieldKeys.length > 0
          ? currentValue.selectedFieldKeys
          : [...lookupSourcePickerModel.defaultDisplayFields],
        sortFieldKey: currentValue.sortFieldKey.trim() || lookupSourcePickerModel.defaultSortField,
      };
    });
  }, [lookupSourcePicker, lookupSourcePickerModel]);

  function updateSystemFieldBinding(
    role: SystemFieldRole,
    fieldId: string,
  ) {
    if (!canEditModelDefinition) {
      return;
    }

    const semanticRole = getSystemFieldSemanticRole(role);

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: currentModelDraft.fields.map((field) =>
        field.semanticRole === semanticRole && field.id !== fieldId
          ? {
              ...field,
              semanticRole: undefined,
            }
          : field.id === fieldId
            ? {
                ...field,
                semanticRole,
              }
            : field,
      ),
    }));

    updateDocument((currentDocument) => {
      const normalizedFieldId = fieldId.trim();
      const nextSystemFields = {
        ...currentDocument.systemFields,
      };

      if (!normalizedFieldId) {
        if (role === "reportedBy") {
          delete nextSystemFields.reportedBy;
        } else if (role === "reportedDate") {
          delete nextSystemFields.reportedDate;
        } else {
          delete nextSystemFields.workflowStatus;
        }

        return {
          ...currentDocument,
          systemFields: {
            ...nextSystemFields,
            version: 1,
          },
        };
      }

      if (role === "reportedBy") {
        nextSystemFields.reportedBy = {
          fieldId: normalizedFieldId,
        };
      } else if (role === "reportedDate") {
        nextSystemFields.reportedDate = {
          fieldId: normalizedFieldId,
        };
      } else {
        const currentStatus = currentDocument.systemFields.workflowStatus;
        nextSystemFields.workflowStatus = {
          fieldId: normalizedFieldId,
          finalValue: currentStatus?.fieldId === normalizedFieldId ? currentStatus.finalValue : undefined,
          initialValue: currentStatus?.fieldId === normalizedFieldId ? currentStatus.initialValue : undefined,
        };
      }

      return {
        ...currentDocument,
        systemFields: {
          ...nextSystemFields,
          version: 1,
        },
      };
    });
  }

  function updateWorkflowStatusOption(
    key: "finalValue" | "initialValue",
    value: string,
  ) {
    updateDocument((currentDocument) => {
      const workflowStatus = currentDocument.systemFields.workflowStatus;
      if (!workflowStatus) {
        return currentDocument;
      }

      return {
        ...currentDocument,
        systemFields: {
          ...currentDocument.systemFields,
          version: 1,
          workflowStatus: {
            ...workflowStatus,
            [key]: value.trim() ? value : undefined,
          },
        },
      };
    });
  }

  function updateDefaultFilters(
    updater: (conditions: ReadonlyArray<FormBuilderFilterCondition>) => ReadonlyArray<FormBuilderFilterCondition>,
  ) {
    if (activeScope.scopeType === "SUBFORM") {
      updateDocument((currentDocument) => ({
        ...currentDocument,
        subformScopes: currentDocument.subformScopes.map((scope) =>
          scope.scopeId === activeScope.scopeId
            ? {
                ...scope,
                filterDefinitions: {
                  ...scope.filterDefinitions,
                  defaultFilters: {
                    ...scope.filterDefinitions.defaultFilters,
                    conditions: updater(scope.filterDefinitions.defaultFilters.conditions),
                  },
                },
              }
            : scope,
        ),
      }));
      return;
    }

    updateDocument((currentDocument) => ({
      ...currentDocument,
      filterDefinitions: {
        ...currentDocument.filterDefinitions,
        defaultFilters: {
          ...currentDocument.filterDefinitions.defaultFilters,
          conditions: updater(currentDocument.filterDefinitions.defaultFilters.conditions),
        },
      },
    }));
  }

  function updateQuickFilters(
    updater: (quickFilters: ReadonlyArray<FormBuilderQuickFilter>) => ReadonlyArray<FormBuilderQuickFilter>,
  ) {
    updateDocument((currentDocument) => ({
      ...currentDocument,
      filterDefinitions: {
        ...currentDocument.filterDefinitions,
        quickFilters: updater(currentDocument.filterDefinitions.quickFilters),
      },
    }));
  }

  function updateSelectedNodeRules(
    updater: (
      rules: NonNullable<FormBuilderNode["rules"]>,
    ) => NonNullable<FormBuilderNode["rules"]>,
  ) {
    if (!selectedNode) {
      return;
    }

    updateDocument((currentDocument) => {
      const currentNode = getFormBuilderNode(currentDocument, selectedNode.id);
      if (!currentNode) {
        return currentDocument;
      }

      return updateFormBuilderNode(currentDocument, selectedNode.id, {
        rules: updater(currentNode.rules ?? {
          requirementRules: [],
          visibilityRules: [],
        }),
      });
    });
  }

  function updateVisibilityRules(
    updater: (
      rules: NonNullable<FormBuilderNode["rules"]>["visibilityRules"],
    ) => NonNullable<FormBuilderNode["rules"]>["visibilityRules"],
  ) {
    updateSelectedNodeRules((rules) => ({
      ...rules,
      visibilityRules: updater(rules.visibilityRules),
    }));
  }

  function updateRequirementRules(
    updater: (
      rules: NonNullable<FormBuilderNode["rules"]>["requirementRules"],
    ) => NonNullable<FormBuilderNode["rules"]>["requirementRules"],
  ) {
    updateSelectedNodeRules((rules) => ({
      ...rules,
      requirementRules: updater(rules.requirementRules),
    }));
  }

  function openVisibilityRuleEditor(index: number | null) {
    const draft = index === null
      ? createDefaultVisibilityRule(selectedNodeRuleFields)
      : (() => {
          const existingRule = selectedNode?.rules?.visibilityRules[index] ?? null;
          return existingRule
            ? getSingleConditionVisibilityRule(cloneVisibilityRule(existingRule), selectedNodeRuleFields)
            : null;
        })();

    if (!draft) {
      return;
    }

    setVisibilityRuleEditor({
      draft,
      index,
    });
  }

  function saveVisibilityRuleEditor() {
    if (!visibilityRuleEditor) {
      return;
    }

    const normalizedDraft = getSingleConditionVisibilityRule(visibilityRuleEditor.draft, selectedNodeRuleFields);
    if (!normalizedDraft) {
      return;
    }

    if (visibilityRuleEditor.index === null) {
      updateVisibilityRules((rules) => [...rules, normalizedDraft]);
    } else {
      updateVisibilityRules((rules) =>
        rules.map((entry, entryIndex) =>
          entryIndex === visibilityRuleEditor.index ? normalizedDraft : entry,
        )
      );
    }

    setVisibilityRuleEditor(null);
  }

  function openRequirementRuleEditor(index: number | null) {
    const draft = index === null
      ? createDefaultRequirementRule(selectedNodeRuleFields)
      : (() => {
          const existingRule = selectedNode?.rules?.requirementRules[index] ?? null;
          return existingRule
            ? getSingleConditionRequirementRule(cloneRequirementRule(existingRule), selectedNodeRuleFields)
            : null;
        })();

    if (!draft) {
      return;
    }

    setRequirementRuleEditor({
      draft,
      index,
    });
  }

  function saveRequirementRuleEditor() {
    if (!requirementRuleEditor) {
      return;
    }

    const normalizedDraft = getSingleConditionRequirementRule(requirementRuleEditor.draft, selectedNodeRuleFields);
    if (!normalizedDraft) {
      return;
    }

    if (requirementRuleEditor.index === null) {
      updateRequirementRules((rules) => [...rules, normalizedDraft]);
    } else {
      updateRequirementRules((rules) =>
        rules.map((entry, entryIndex) =>
          entryIndex === requirementRuleEditor.index ? normalizedDraft : entry,
        )
      );
    }

    setRequirementRuleEditor(null);
  }

  function createDefaultQuickFilterDraft(): FormBuilderQuickFilter | null {
    const nextCondition = createDefaultFilterCondition(rootViewFilterTargets);
    if (!nextCondition) {
      return null;
    }

    return {
      color: undefined,
      conditions: [nextCondition],
      id: `quick-filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: t("tenant.platformStudio.forms.builder.filter.defaultQuickFilterLabel"),
      logic: "and",
    };
  }

  function openDefaultFilterEditor(index: number | null, fieldId?: string) {
    const draft = index === null
      ? createDefaultFilterCondition(currentViewFilterTargets, fieldId ?? pendingDefaultFilterFieldId)
      : (currentScopeFilterDefinitions.defaultFilters.conditions[index] ?? null);

    if (!draft) {
      return;
    }

    setDefaultFilterEditor({
      draft,
      index,
    });
  }

  function saveDefaultFilterEditor() {
    if (!defaultFilterEditor) {
      return;
    }

    if (defaultFilterEditor.index === null) {
      updateDefaultFilters((conditions) => [...conditions, defaultFilterEditor.draft]);
    } else {
      updateDefaultFilters((conditions) =>
        conditions.map((entry, entryIndex) =>
          entryIndex === defaultFilterEditor.index ? defaultFilterEditor.draft : entry,
        ),
      );
    }

    setDefaultFilterEditor(null);
  }

  function openQuickFilterEditor(index: number | null) {
    const draft = index === null
      ? createDefaultQuickFilterDraft()
      : (document.filterDefinitions.quickFilters[index] ?? null);

    if (!draft) {
      return;
    }

    setQuickFilterEditor({
      draft: {
        ...draft,
        conditions: [...draft.conditions],
      },
      index,
    });
  }

  function saveQuickFilterEditor() {
    if (!quickFilterEditor) {
      return;
    }

    if (quickFilterEditor.index === null) {
      updateQuickFilters((quickFilters) => [...quickFilters, quickFilterEditor.draft]);
    } else {
      updateQuickFilters((quickFilters) =>
        quickFilters.map((entry, entryIndex) =>
          entryIndex === quickFilterEditor.index ? quickFilterEditor.draft : entry,
        ),
      );
    }

    setQuickFilterEditor(null);
  }

  function updateViewSettings(
    updater: (viewSettings: typeof document.viewSettings) => typeof document.viewSettings,
  ) {
    updateDocument((currentDocument) => ({
      ...currentDocument,
      viewSettings: updater(currentDocument.viewSettings),
    }));
  }

  function updateCurrentScopeSubformViewSettings(
    updater: (viewSettings: NonNullable<typeof currentScopeViewSettings>) => NonNullable<typeof currentScopeViewSettings>,
  ) {
    if (activeScope.scopeType !== "SUBFORM") {
      return;
    }

    updateDocument((currentDocument) => ({
      ...currentDocument,
      subformScopes: currentDocument.subformScopes.map((scope) =>
        scope.scopeId === activeScope.scopeId
          ? {
              ...scope,
              viewSettings: updater(scope.viewSettings),
            }
          : scope,
      ),
    }));
  }

  function updateCurrentGridColumns(
    updater: (
      columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
    ) => ReadonlyArray<FormBuilderGridColumnDefinition>,
  ) {
    if (activeScope.scopeType === "SUBFORM") {
      updateCurrentScopeSubformViewSettings((viewSettings) => ({
        ...viewSettings,
        list: {
          ...viewSettings.list,
          columns: sortGridColumns(updater(viewSettings.list.columns)),
        },
      }));
      return;
    }

    updateViewSettings((viewSettings) => ({
      ...viewSettings,
      list: {
        ...viewSettings.list,
        columns: sortGridColumns(updater(viewSettings.list.columns)),
      },
    }));
  }

  function updateGridColumnVisibility(
    fieldId: string,
    visible: boolean,
  ) {
    updateCurrentGridColumns((columns) => {
      const existingColumn = getGridColumnByFieldId(columns, fieldId);
      if (!existingColumn && !visible) {
        return columns;
      }

      if (!existingColumn && visible) {
        return [
          ...columns,
          {
            fieldId,
            id: `grid-column-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            order: getNextGridColumnOrder(columns),
            visible: true,
          },
        ];
      }

      return columns.map((column) =>
        column.fieldId === fieldId
          ? {
              ...column,
              visible,
            }
          : column,
      );
    });
  }

  function reorderGridColumns(
    sourceFieldId: string,
    targetFieldId: string,
  ) {
    if (sourceFieldId === targetFieldId) {
      return;
    }

    updateCurrentGridColumns((columns) => {
      const orderedFieldIds = sortGridScopeFields(currentGridScopeTargets, columns).map((field) => field.id);
      const sourceIndex = orderedFieldIds.indexOf(sourceFieldId);
      const targetIndex = orderedFieldIds.indexOf(targetFieldId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return columns;
      }

      const nextFieldIds = [...orderedFieldIds];
      const [movedFieldId] = nextFieldIds.splice(sourceIndex, 1);
      nextFieldIds.splice(targetIndex, 0, movedFieldId);

      const columnsByFieldId = new Map(columns.map((column) => [column.fieldId, column]));

      return nextFieldIds.map((fieldId, index) => {
        const existingColumn = columnsByFieldId.get(fieldId);

        return {
          fieldId,
          id: existingColumn?.id ?? `grid-column-${fieldId}`,
          order: index,
          visible: existingColumn?.visible ?? false,
        };
      });
    });
  }

  function addDefaultFilterCondition() {
    openDefaultFilterEditor(null);
  }

  function addQuickFilter() {
    openQuickFilterEditor(null);
  }

  function handleCreateSystemField(role: SystemFieldRole) {
    if (getBoundSystemFieldIdByRole(document, role)) {
      return;
    }

    if (!canPlaceFieldAtCurrentLevel || !structureEditingAccess.canAddFieldItems || !canEditModelDefinition) {
      return;
    }

    const existingField = getSystemFieldExistingCandidate(currentModel.fields, role);
    const nextField = {
      ...(existingField ?? getSystemFieldTemplate(currentModel.fields, role)),
      schemaScopeKey: "root",
    };

    if (!existingField) {
      updateCurrentModel((currentModelDraft) => ({
        ...currentModelDraft,
        fields: [...currentModelDraft.fields, nextField],
      }));
    } else if (existingField.schemaScopeKey !== "root") {
      updateFieldById(existingField.id, (field) => ({
        ...field,
        schemaScopeKey: "root",
      }));
    }

    updateDocument((currentDocument) => {
      let nextDocument = currentDocument;

      if (role === "reportedBy") {
        nextDocument = {
          ...nextDocument,
          systemFields: {
            ...nextDocument.systemFields,
            reportedBy: {
              fieldId: nextField.id,
            },
            version: 1,
          },
        };
      } else if (role === "reportedDate") {
        nextDocument = {
          ...nextDocument,
          systemFields: {
            ...nextDocument.systemFields,
            reportedDate: {
              fieldId: nextField.id,
            },
            version: 1,
          },
        };
      } else {
        const options = nextField.options ?? [];

        nextDocument = {
          ...nextDocument,
          systemFields: {
            ...nextDocument.systemFields,
            version: 1,
            workflowStatus: {
              fieldId: nextField.id,
              finalValue: options.length > 0 ? options[options.length - 1] : undefined,
              initialValue: options[0],
            },
          },
        };
      }

      const existingNode = findFormBuilderNodeByFieldId(nextDocument, nextField.id);
      if (existingNode || !canPlaceFieldAtCurrentLevel) {
        return nextDocument;
      }

      return addFormBuilderFieldNode(nextDocument, getCurrentFormBuilderInsertParentId(nextDocument), nextField);
    });

    setInspectorTab("view");
  }

  const currentLevelLabel = currentParentNode
    ? getFormBuilderDisplayLabel(currentParentNode, currentModel)
    : t("tenant.platformStudio.forms.builder.rootLevel");
  const canDragItems = workspaceAccess.canMoveItems && currentNodes.length > 1;
  const selectedNodeLabel = selectedNode ? getFormBuilderDisplayLabel(selectedNode, currentModel) : "";

  useEffect(() => {
    if (hasUnsavedChanges && savePulse) {
      setSavePulse(false);
    }
  }, [hasUnsavedChanges, savePulse]);

  function triggerSavePulse() {
    setSavePulse(true);
    window.setTimeout(() => setSavePulse(false), 1200);
  }

  async function handleSave() {
    const structureChanged = isDefaultView && (
      buildDataSchemaStructureSignature(currentDataSchema) !== buildDataSchemaStructureSignature(savedDataSchema)
      || JSON.stringify(currentLayoutBlueprint) !== JSON.stringify(savedLayoutBlueprintDraft)
    );
    const previousModelStructureVersion = savedModelDraft.modelStructureVersion ?? 1;
    const nextModelStructureVersion = structureChanged
      ? previousModelStructureVersion + 1
      : (savedModelDraft.modelStructureVersion ?? currentModel.modelStructureVersion ?? previousModelStructureVersion);
    const previousCurrentView = findFormsPlaceholderScreenById(savedModelDraft.screens, currentView.id) ?? currentView;
    const nextViewTitle = document.viewTitle.trim() || currentView.title;
    const nextViewDescription = document.viewDescription;
    const nextModel = cloneFormsPlaceholderModel({
      ...currentModel,
      fields: currentModel.fields.map((field) => {
        const modelLabel = getModelFieldLabel(field);
        const schemaScopeKey = getDocumentFieldSchemaScopeKey(document, field.id) ?? field.schemaScopeKey;
        const storageKey = field.storageKey && isPersistedModelField(field)
          ? field.storageKey
          : createFormsPlaceholderStorageKey(field.storageKey ?? modelLabel, field.id);

        return {
          ...field,
          displayName: modelLabel,
          isPersisted: true,
          label: modelLabel,
          schemaScopeKey,
          status: field.status === "published" ? "published" : "persisted",
          storageKey,
        };
      }),
      modelStructureVersion: nextModelStructureVersion,
      schemaScopes: currentModelSchemaScopes,
      screens: currentModel.screens.map((screenEntry) =>
        screenEntry.id === currentView.id
          ? {
              ...screenEntry,
              displayName: nextViewTitle,
              description: nextViewDescription,
              lastAlignedModelStructureVersion: nextModelStructureVersion,
              title: nextViewTitle,
              viewVersion: (previousCurrentView.viewVersion ?? screenEntry.viewVersion ?? 0) + 1,
            }
          : screenEntry
      ),
      version: hasUnsavedModelChanges
        ? ((savedModelDraft.version ?? previousModelStructureVersion) + 1)
        : (currentModel.version ?? savedModelDraft.version ?? previousModelStructureVersion),
    });
    const documentForSave = shouldSyncFieldNodeTitlesWithModel
      ? syncFieldNodeTitlesWithModel(document, nextModel)
      : document;
    const nextView = findFormsPlaceholderScreenById(nextModel.screens, currentView.id) ?? currentView;
    const nextDataSchema = isDefaultView
      ? buildCanonicalDataSchema({
        ...nextModel,
        schemaScopes: currentModelSchemaScopes,
      }, documentForSave)
      : savedDataSchema;
    const nextLayoutBlueprint = isDefaultView ? currentLayoutBlueprint : savedLayoutBlueprintDraft;
    const nextUiSchema = buildCanonicalUiSchema(documentForSave, nextModel);
    const expectedVersions = {
      model: savedModelDraft.version ?? previousModelStructureVersion,
      view: previousCurrentView.viewVersion ?? currentView.viewVersion ?? 1,
    };

    const commitSavedDraft = (
      savedModel: FormsPlaceholderModel,
      savedDocument: typeof document,
      savedLayoutBlueprint: Record<string, unknown>,
    ) => {
      hydrateDocument(savedDocument);
      setModelDraft(savedModel);
      setSavedModelDraft(savedModel);
      setLayoutBlueprintDraft(savedLayoutBlueprint);
      setSavedLayoutBlueprintDraft(savedLayoutBlueprint);
      replaceModel(savedModel);
      setDraftSyncError(null);
      triggerSavePulse();
    };

    const accessToken = getAccessToken();
    if (!accessToken) {
      setDraftSyncError(t("tenant.platformStudio.forms.builder.draftSaveError"));
      return;
    }

    setIsSavingDraft(true);
    setDraftSyncError(null);

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    try {
      const response = await requestWithUnauthorizedRetry(
        (bearerToken) => draftClient.saveDraft(
          bearerToken,
          nextModel.id,
          currentView.id,
          {
            draft: {
              model: {
                ...(nextModel as unknown as Record<string, unknown>),
                dataSchema: nextDataSchema,
                layoutBlueprint: nextLayoutBlueprint,
              },
              view: {
                ...(nextView as unknown as Record<string, unknown>),
                description: nextViewDescription,
                kind: nextView.kind,
                title: nextViewTitle,
                uiSchema: nextUiSchema,
              },
            },
            expectedVersions,
          },
        ),
        {
          accessToken,
          onUnauthorized: recoverUnauthorizedAccessToken,
        },
      );

      const savedModel = normalizeFormsPlaceholderModel(response.draft.model, nextModel);
      const hydratedSavedView = normalizeFormsPlaceholderView(
        response.draft.view,
        findFormsPlaceholderScreenById(savedModel.screens, currentView.id) ?? nextView,
        savedModel,
      );
      const savedModelWithView = replaceModelViewById(savedModel, hydratedSavedView);
      const savedLayoutBlueprint = isRecord(response.draft.model.layoutBlueprint)
        ? response.draft.model.layoutBlueprint
        : nextLayoutBlueprint;
      const savedDocument = reconcileFormBuilderDocumentWithModel(
        buildWorkspaceDocumentFromCanonicalSchemas(
          response.draft.model,
          response.draft.view,
          savedModelWithView,
          hydratedSavedView,
        ),
        savedModelWithView,
        savedLayoutBlueprint,
      );
      commitSavedDraft(
        savedModelWithView,
        shouldSyncFieldNodeTitlesWithModel ? syncFieldNodeTitlesWithModel(savedDocument, savedModelWithView) : savedDocument,
        savedLayoutBlueprint,
      );
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        void signOut();
        return;
      }

      if (isDraftEndpointUnavailable(error)) {
        commitSavedDraft(nextModel, documentForSave, nextLayoutBlueprint);
        return;
      }

      setDraftSyncError(
        error instanceof Error
          ? error.message
          : t("tenant.platformStudio.forms.builder.draftSaveError"),
      );
    } finally {
      setIsSavingDraft(false);
    }
  }

  function resolveLeaveConfirmation(shouldLeave: boolean) {
    const pendingPath = pendingNavigationPathRef.current;
    const pendingResolver = pendingLeaveResolverRef.current;

    pendingNavigationPathRef.current = null;
    pendingLeaveResolverRef.current = null;
    setLeaveConfirmOpen(false);

    if (pendingResolver) {
      pendingResolver(shouldLeave);
      return;
    }

    if (shouldLeave && pendingPath) {
      navigate(pendingPath);
    }
  }

  function requestNavigate(nextPath: string) {
    if (!hasUnsavedChanges) {
      navigate(nextPath);
      return;
    }

    pendingNavigationPathRef.current = nextPath;
    pendingLeaveResolverRef.current = null;
    setLeaveConfirmOpen(true);
  }

  if (!hasResolvedWorkspace && isBootstrappingRoute) {
    return (
      <WorkspaceLoadingState
        description={t("tenant.platformStudio.forms.loadingWorkspaceDescription")}
        title={t("tenant.platformStudio.forms.loadingWorkspaceTitle")}
      />
    );
  }

  if (hasResolvedWorkspace && !hasHydratedCurrentDraft && !draftSyncError) {
    return (
      <WorkspaceLoadingState
        description={t("tenant.platformStudio.forms.loadingWorkspaceDescription")}
        title={t("tenant.platformStudio.forms.loadingWorkspaceTitle")}
      />
    );
  }

  if (!hasResolvedWorkspace) {
    return (
      <WorkspaceErrorState
        actions={(
          <>
            <Button onClick={() => navigate(platformStudioPaths.forms)} variant="outline">
              {t("tenant.platformStudio.forms.backToForms")}
            </Button>
            {params.modelId ? (
              <Button onClick={() => navigate(platformStudioPaths.model(params.modelId ?? ""))} variant="ghost">
                {t("tenant.platformStudio.forms.backToModel")}
              </Button>
            ) : null}
          </>
        )}
        description={routeBootstrapError ?? t("tenant.platformStudio.forms.missingDescription")}
        title={t("tenant.platformStudio.forms.missingTitle")}
      />
    );
  }

  const paletteDisplaySections: ReadonlyArray<FieldPaletteDisplaySection> = paletteSections.map((section) => ({
    items: section.items.map((item) => {
      if (item.kind === "element") {
        return {
          description: t(item.descriptionKey),
          disabled: item.disabled,
          disabledReason: item.disabledReasonKey ? t(item.disabledReasonKey) : null,
          iconKey: item.iconKey,
          key: `${item.nodeType}:${item.labelKey}`,
          label: t(item.labelKey),
          onClick: () => updateDocument((currentDocument) =>
            addFormBuilderElementNode(
              currentDocument,
              getCurrentFormBuilderInsertParentId(currentDocument),
              item.nodeType,
              item.initialNode,
            )
          ),
        };
      }

      if (item.kind === "systemField") {
        return {
          description: t(item.descriptionKey),
          disabled: item.disabled,
          disabledReason: item.disabledReasonKey ? t(item.disabledReasonKey) : null,
          iconKey: item.iconKey,
          key: item.key,
          label: t(item.labelKey),
          onClick: () => handleCreateSystemField(item.key),
        };
      }

      return {
        description: getFieldPaletteDescription(item.definition.template, t),
        disabled: item.disabled,
        disabledReason: item.disabledReasonKey ? t(item.disabledReasonKey) : null,
        iconKey: item.iconKey,
        key: item.definition.idBase,
        label: t(item.definition.labelKey),
        onClick: () => handleCreateLibraryField(item.definition),
      };
    }),
    key: section.key,
    label: t(section.labelKey),
  }));
  const canvasBreadcrumbItems: ReadonlyArray<BuilderCanvasBreadcrumbItem> = breadcrumb.map((node) => ({
    id: node.id,
    label: getFormBuilderDisplayLabel(node, currentModel),
  }));
  const canvasNodeItems: ReadonlyArray<BuilderCanvasNodeItem> = currentNodes.map((node) => {
    const summaryKey = getFormBuilderNodeSummary(node, document, currentModel);
    const iconKey = node.type === "field"
      ? getFormsPlaceholderFieldIconKey(currentModel.fields.find((field) => field.id === node.fieldId) ?? {
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
        getFormBuilderChildren(document, node.id).length,
      ),
      visibility: node.visibility,
    };
  });
  const canvasUnplacedFields: ReadonlyArray<BuilderCanvasUnplacedFieldItem> = currentScopeUnplacedFields.map((field) => ({
    id: field.id,
    label: getFormsPlaceholderFieldDisplayName(field),
    summary: t(getFieldTypeKey(field)),
  }));
  const gridSettingsFieldItems: ReadonlyArray<GridSettingsFieldItem> = sortedCurrentGridScopeTargets.map((field) => {
    const column = getGridColumnByFieldId(currentGridColumns, field.id);

    return {
      iconKey: getFormsPlaceholderFieldIconKey(field),
      id: field.id,
      label: field.label,
      visible: column?.visible ?? false,
    };
  });
  const viewSettingsActionItems = isRootViewScope
    ? ([
        ["canAdd", "tenant.platformStudio.forms.builder.viewSettings.action.add"],
        ["canView", "tenant.platformStudio.forms.builder.viewSettings.action.view"],
        ["canEdit", "tenant.platformStudio.forms.builder.viewSettings.action.edit"],
        ["canDelete", "tenant.platformStudio.forms.builder.viewSettings.action.delete"],
      ] as const).map(([actionKey, labelKey]) => ({
        checked: document.viewSettings.actions[actionKey],
        key: actionKey,
        label: t(labelKey),
        onChange: (checked: boolean) => updateViewSettings((viewSettings) => ({
          ...viewSettings,
          actions: {
            ...viewSettings.actions,
            [actionKey]: checked,
          },
        })),
      }))
    : ([
        ["canAdd", "tenant.platformStudio.forms.builder.viewSettings.action.add"],
        ["canEdit", "tenant.platformStudio.forms.builder.viewSettings.action.edit"],
        ["canDelete", "tenant.platformStudio.forms.builder.viewSettings.action.delete"],
      ] as const).map(([actionKey, labelKey]) => ({
        checked: Boolean(currentScopeViewSettings?.actions[actionKey]),
        key: actionKey,
        label: t(labelKey),
        onChange: (checked: boolean) => updateCurrentScopeSubformViewSettings((viewSettings) => ({
          ...viewSettings,
          actions: {
            ...viewSettings.actions,
            [actionKey]: checked,
          },
        })),
      }));
  const viewSettingsSystemFields = systemFieldRoles.map((role) => ({
    boundFieldId: getBoundSystemFieldIdByRole(document, role) ?? "",
    compatibleFields: getSystemFieldOptions(currentModel.fields, document, role).map((field) => ({
      id: field.id,
      label: getFieldLabelWithBoundField(field, document),
    })),
    finalValue: document.systemFields.workflowStatus?.finalValue ?? "",
    initialValue: document.systemFields.workflowStatus?.initialValue ?? "",
    label: t(getSystemFieldKey(role)),
    noCompatibleText: t("tenant.platformStudio.forms.builder.systemField.noCompatibleField"),
    role,
    summary: getSystemFieldBindingSummary(role, currentModel.fields, document, t),
    workflowStatusOptions,
  }));
  const viewSettingsSortingFields = currentScopeSortingFields.map((field) => ({
    id: field.id,
    label: field.label,
  }));
  const viewSettingsDefaultFilterItems = currentScopeFilterDefinitions.defaultFilters.conditions.map((condition, index) => ({
    fieldLabel: getFieldById(currentViewFilterTargets, condition.fieldId)?.label ?? t("tenant.platformStudio.forms.builder.filter.fieldLabel"),
    index,
    summary: getFilterConditionSummary(condition, currentViewFilterTargets, t),
  }));
  const lookupSourcePickerModelItems: LookupSourcePickerModelItem[] = availableLookupSourceModels.map((modelOption) => {
    const loadedModelOption = lookupSourceModelsById[modelOption.id];

    return {
      defaultDisplayFields: loadedModelOption ? [...loadedModelOption.defaultDisplayFields] : [],
      defaultSortField: loadedModelOption?.defaultSortField ?? "",
      fieldCount: loadedModelOption?.fields.length ?? null,
      id: modelOption.id,
      label: modelOption.label,
    };
  });
  const lookupSourcePickerSelectedFieldsSummary = lookupSourcePicker && lookupSourcePickerModel
    ? lookupSourcePicker.selectedFieldKeys.length > 0
      ? getLookupModelFieldLabels(
        lookupSourcePickerModel,
        lookupSourcePicker.selectedFieldKeys,
      ).join(", ")
      : t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields")
    : "";

  return (
    <div className="tenant-web__platform-studio-shell tenant-web__platform-studio-shell--desktop-panels">
      <PlatformStudioTabs onFormsNavigate={() => requestNavigate(platformStudioPaths.forms)} />

      <WorkspaceTopline
        canEditViewsOnly={currentModel.canEditViewsOnly ?? false}
        draftSyncError={draftSyncError}
        isDefaultView={isDefaultView}
        isDraftSyncing={isDraftSyncing}
        isRootActor={currentActor.isRoot}
        isSaveButtonDisabled={isSaveButtonDisabled}
        isSavingDraft={isSavingDraft}
        isStructureLocked={currentModel.isStructureLocked ?? false}
        isViewLocked={currentView.isViewLocked ?? false}
        labels={{
          backToModel: t("tenant.platformStudio.forms.backToModel"),
          canEditViewsOnly: t("tenant.platformStudio.forms.canEditViewsOnly"),
          debugAction: t("tenant.platformStudio.forms.builder.debugAction"),
          defaultView: t("tenant.platformStudio.forms.builder.viewMode.default"),
          saveAction: t("tenant.platformStudio.forms.builder.saveAction"),
          savedAction: t("tenant.platformStudio.forms.builder.savedAction"),
          savingAction: t("tenant.platformStudio.forms.builder.savingAction"),
          structureLocked: t("tenant.platformStudio.forms.structureLocked"),
          syncingDraft: t("tenant.platformStudio.forms.builder.syncingDraft"),
          viewLocked: t("tenant.platformStudio.forms.viewLocked"),
        }}
        modelTitle={currentModel.title}
        onBackToModel={() => requestNavigate(platformStudioPaths.model(currentModelRouteId))}
        onDebugOpen={() => setDebugOpen(true)}
        onSave={() => {
          void handleSave();
        }}
        savePulse={savePulse}
      />

      <section className="tenant-web__platform-studio-builder-grid">
        <FieldPalette
          emptyText={t("tenant.platformStudio.forms.builder.noPaletteResults")}
          onQueryChange={setPaletteQuery}
          placeholder={t("tenant.platformStudio.forms.builder.searchPlaceholder")}
          query={paletteQuery}
          searchInputId="tenant-platform-studio-palette-search"
          sections={paletteDisplaySections}
        />

        <BuilderCanvas
          breadcrumbItems={canvasBreadcrumbItems}
          canEditVisibility={workspaceAccess.canEditSettings}
          canMoveItems={canDragItems}
          canPlaceUnplacedFields={canPlaceUnplacedFields}
          canvasEmptyText={
            structureEditingAccess.canAddElementItems || structureEditingAccess.canAddFieldItems
              ? t("tenant.platformStudio.forms.builder.canvasEmpty")
              : t("tenant.platformStudio.forms.builder.canvasEmptyLocked")
          }
          currentLevelId={currentScopeParentId}
          currentLevelBadgeLabel={t("tenant.platformStudio.forms.builder.currentLevelBadge")}
          currentLevelLabel={currentLevelLabel}
          dragToReorderLabel={t("tenant.platformStudio.forms.builder.dragToReorder")}
          dragOverNodeId={dragOverNodeId}
          draggedNodeId={draggedNodeId}
          nodeItems={canvasNodeItems}
          onDragEnd={() => {
            setDraggedNodeId(null);
            setDragOverNodeId(null);
          }}
          onDragOverNode={(nodeId) => setDragOverNodeId(nodeId)}
          onDragStartNode={(nodeId) => {
            setDraggedNodeId(nodeId);
            setDragOverNodeId(nodeId);
          }}
          onDropNode={(nodeId) => {
            if (!draggedNodeId || draggedNodeId === nodeId) {
              setDragOverNodeId(null);
              return;
            }

            updateDocument((currentDocument) =>
              reorderFormBuilderNode(currentDocument, draggedNodeId, nodeId)
            );
            setDraggedNodeId(null);
            setDragOverNodeId(null);
          }}
          onOpenBreadcrumb={(nodeId) => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, nodeId))}
          onOpenLevel={(nodeId) => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, nodeId))}
          onOpenRoot={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, null))}
          onPlaceUnplacedField={(fieldId) => {
            const field = currentScopeUnplacedFields.find((entry) => entry.id === fieldId);
            if (!field) {
              return;
            }

            updateDocument((currentDocument) =>
              addFormBuilderFieldNode(currentDocument, currentScopeParentId, field)
            );
          }}
          onSelectNode={(nodeId) => {
            updateDocument((currentDocument) => selectFormBuilderNode(currentDocument, nodeId));
            setInspectorTab("selection");
          }}
          onToggleVisibility={(nodeId, visibility) => updateDocument((currentDocument) =>
            updateFormBuilderNode(currentDocument, nodeId, {
              visibility: cycleNodeVisibility(visibility),
            })
          )}
          openWorkspaceLabel={t("tenant.platformStudio.forms.openWorkspace")}
          rootLevelLabel={t("tenant.platformStudio.forms.builder.rootLevel")}
          selectedNodeId={currentScopeSelectedNodeId}
          title={currentDraftViewTitle}
          unplacedFields={canvasUnplacedFields}
          unplacedFieldsDescription={t("tenant.platformStudio.forms.builder.unplacedFieldsDescription", {
            scope: currentScopePlacementLabel,
          })}
          unplacedFieldsHint={unplacedFieldsHintKey ? t(unplacedFieldsHintKey) : null}
          unplacedFieldsPlaceActionLabel={t("tenant.platformStudio.forms.builder.unplacedFieldsPlaceAction")}
          unplacedFieldsTitle={t("tenant.platformStudio.forms.builder.unplacedFieldsTitle")}
          visibilityLabels={{
            hidden: t("tenant.platformStudio.forms.builder.visibility.hidden"),
            readonly: t("tenant.platformStudio.forms.builder.visibility.readonly"),
            visible: t("tenant.platformStudio.forms.builder.visibility.visible"),
          }}
        />

        <InspectorPanel
          activeTab={inspectorTab}
          isViewTabAvailable={isViewTabAvailable}
          labels={{
            grid: t("tenant.platformStudio.forms.builder.gridTab"),
            selection: t("tenant.platformStudio.forms.builder.selectionTab"),
            view: t("tenant.platformStudio.forms.builder.viewTab"),
          }}
          onTabChange={setInspectorTab}
        >
          <InspectorPanelTab value="selection">
                    <div ref={selectionPanelTopRef} />
                    {selectedNode ? (
                      <div className="tenant-web__platform-studio-builder-stack">
                        <SelectionInspectorBasicSection
                          canEdit={workspaceAccess.canEditSettings}
                          iconKey={selectedField ? getFormsPlaceholderFieldIconKey(selectedField) : selectedNode.type}
                          labels={{
                            hiddenVisibility: t("tenant.platformStudio.forms.builder.visibility.hidden"),
                            lockedHint: !structureEditingAccess.canRemoveItems
                              ? t(structureEditingAccess.lockReasonKey ?? "tenant.platformStudio.forms.builder.lockedStructureHint")
                              : null,
                            noAdvancedSettings: t("tenant.platformStudio.forms.builder.noAdvancedSettings"),
                            nodeText: t("tenant.platformStudio.forms.builder.nodeTextLabel"),
                            nodeTitle: t("tenant.platformStudio.forms.builder.nodeTitleLabel"),
                            nodeVisibility: t("tenant.platformStudio.forms.builder.nodeVisibilityLabel"),
                            readonlyText: t(access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly"),
                            readonlyVisibility: t("tenant.platformStudio.forms.builder.visibility.readonly"),
                            required: t("tenant.platformStudio.forms.builder.rule.effect.required"),
                            viewOnlyBinding: t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBinding"),
                            viewOnlyBindingEmpty: t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBindingEmpty"),
                            viewOnlyBindingPending: t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBindingPending"),
                            viewOnlyFieldSection: t("tenant.platformStudio.forms.builder.nodeType.view_only_field"),
                            visibleVisibility: t("tenant.platformStudio.forms.builder.visibility.visible"),
                          }}
                          meta={selectedField ? t(getFieldTypeKey(selectedField)) : t(getNodeTypeKey(selectedNode.type))}
                          nodeRequired={selectedNode.required ?? false}
                          nodeText={selectedNode.text ?? ""}
                          nodeTitle={selectedNode.title ?? ""}
                          nodeType={selectedNode.type}
                          nodeVisibility={selectedNode.visibility}
                          onRequiredChange={(checked) => updateDocument((currentDocument) =>
                            updateFormBuilderNode(currentDocument, selectedNode.id, { required: checked })
                          )}
                          onRichTextChange={(value) => updateDocument((currentDocument) =>
                            updateFormBuilderNode(currentDocument, selectedNode.id, { text: value })
                          )}
                          onTextChange={(value) => updateDocument((currentDocument) =>
                            updateFormBuilderNode(currentDocument, selectedNode.id, { text: value })
                          )}
                          onTitleChange={(nextTitle) => {
                            if (selectedNode.type === "field") {
                              if (!selectedField) {
                                return;
                              }

                              if (canEditModelDefinition) {
                                updateFieldById(selectedField.id, (field) => {
                                  const nextModelLabel = nextTitle.trim() || getModelFieldLabel(field);

                                  return {
                                    ...field,
                                    displayName: nextModelLabel,
                                    label: nextModelLabel,
                                    ...(!isPersistedModelField(field)
                                      ? {
                                          storageKey: createUniqueFormsPlaceholderStorageKey(
                                            nextModelLabel,
                                            field.id,
                                            currentModel.fields,
                                            {
                                              excludeFieldId: field.id,
                                              schemaScopeKey: field.schemaScopeKey,
                                            },
                                          ),
                                        }
                                      : {}),
                                  };
                                });
                              }
                            }

                            updateDocument((currentDocument) =>
                              updateFormBuilderNode(currentDocument, selectedNode.id, { title: nextTitle })
                            );
                          }}
                          onViewOnlyBindingChange={(bindingId) => {
                            const nextOption = selectedViewOnlyBindingOptions.find((option) => option.bindingId === bindingId) ?? null;
                            const currentBindingLabel = selectedViewOnlyBindingOption?.label;
                            const nextTitle = selectedNode.title?.trim() ?? "";
                            const shouldAutofillTitle =
                              nextTitle.length === 0 ||
                              nextTitle === t("tenant.platformStudio.forms.builder.nodeType.view_only_field") ||
                              (currentBindingLabel ? nextTitle === currentBindingLabel : false);

                            updateDocument((currentDocument) =>
                              updateFormBuilderNode(currentDocument, selectedNode.id, {
                                title: nextOption && shouldAutofillTitle ? nextOption.label : selectedNode.title,
                                viewOnlyBinding: nextOption?.binding,
                              })
                            );
                          }}
                          onVisibilityChange={(nextVisibility) => {
                            updateDocument((currentDocument) => {
                              if (selectedNode.type !== "field") {
                                return updateFormBuilderNode(currentDocument, selectedNode.id, {
                                  visibility: nextVisibility,
                                });
                              }

                              const nextRuntimePresets = selectedField
                                ? getCompatibleRuntimePresets(selectedField, nextVisibility)
                                : [];

                              return updateFormBuilderNode(currentDocument, selectedNode.id, {
                                runtimePreset:
                                  selectedNode.runtimePreset && !nextRuntimePresets.includes(selectedNode.runtimePreset)
                                    ? undefined
                                    : selectedNode.runtimePreset,
                                visibility: nextVisibility,
                              });
                            });
                          }}
                          persistedField={selectedField && isPersistedModelField(selectedField)
                            ? {
                                label: getModelFieldLabel(selectedField),
                                storageKey: selectedField.storageKey ?? "",
                              }
                            : null}
                          selectedViewOnlyBindingId={selectedViewOnlyBindingOption?.bindingId ?? ""}
                          title={getFormBuilderDisplayLabel(selectedNode, currentModel)}
                          titleDisabled={Boolean(
                            selectedField
                            && isDefaultView
                            && !canEditModelDefinition
                            && !isStaticModel,
                          )}
                          viewOnlyBindingOptions={selectedViewOnlyBindingOptions.map((option) => ({
                            bindingId: option.bindingId,
                            label: option.label,
                          }))}
                        >
                          {selectedNode.type === "field" ? (
                            <>
                                  {selectedFieldIsChoice ? (
                                    <ChoiceFieldSettings
                                      canEdit={workspaceAccess.canEditSettings && canEditModelDefinition}
                                      canMoveOptions={workspaceAccess.canEditSettings && canEditModelDefinition && (selectedField.options?.length ?? 0) > 1}
                                      choiceDisplay={selectedField.choiceDisplay}
                                      dragOverOptionIndex={dragOverChoiceOptionIndex}
                                      draggedOptionIndex={draggedChoiceOptionIndex}
                                      fieldKind={selectedField.kind === "multi_select" ? "multi_select" : "single_select"}
                                      fieldTypeLabel={t(getFieldTypeKey(selectedField))}
                                      labels={{
                                        actionsMenu: t("tenant.platformStudio.forms.builder.rule.actionsMenu"),
                                        addOption: t("tenant.platformStudio.forms.builder.fieldSettings.addOption"),
                                        allowEmpty: t("tenant.platformStudio.forms.builder.fieldSettings.allowEmpty"),
                                        backgroundColor: t("tenant.platformStudio.forms.builder.fieldSettings.backgroundColor"),
                                        borderColor: t("tenant.platformStudio.forms.builder.fieldSettings.borderColor"),
                                        buttonStyles: t("tenant.platformStudio.forms.builder.fieldSettings.buttonStyles"),
                                        display: t("tenant.platformStudio.forms.builder.fieldSettings.display"),
                                        dragToReorder: t("tenant.platformStudio.forms.builder.dragToReorder"),
                                        emptyOptions: t("tenant.platformStudio.forms.builder.fieldSettings.emptyOptions"),
                                        maxSelections: t("tenant.platformStudio.forms.builder.fieldSettings.maxSelections"),
                                        minSelections: t("tenant.platformStudio.forms.builder.fieldSettings.minSelections"),
                                        options: t("tenant.platformStudio.forms.builder.fieldSettings.options"),
                                        orientation: t("tenant.platformStudio.forms.builder.fieldSettings.orientation"),
                                        orientationHorizontal: t("tenant.platformStudio.forms.builder.fieldSettings.orientationHorizontal"),
                                        orientationVertical: t("tenant.platformStudio.forms.builder.fieldSettings.orientationVertical"),
                                        removeOption: t("tenant.platformStudio.forms.builder.removeNode"),
                                        renderStyle: t("tenant.platformStudio.forms.builder.fieldSettings.renderStyle"),
                                        renderStyleButtons: t("tenant.platformStudio.forms.builder.fieldSettings.renderStyleButtons"),
                                        renderStyleNative: t("tenant.platformStudio.forms.builder.fieldSettings.renderStyleNative"),
                                        selection: t("tenant.platformStudio.forms.builder.fieldSettings.selection"),
                                        textColor: t("tenant.platformStudio.forms.builder.fieldSettings.textColor"),
                                      }}
                                      onAddOption={() => updateSelectedFieldOptions((options) => [
                                        ...options,
                                        `${t("tenant.platformStudio.forms.builder.fieldSettings.newOption")} ${options.length + 1}`,
                                      ])}
                                      onChoiceDisplayChange={updateSelectedFieldChoiceDisplay}
                                      onDragEnd={() => {
                                        setDraggedChoiceOptionIndex(null);
                                        setDragOverChoiceOptionIndex(null);
                                      }}
                                      onDragOverOption={setDragOverChoiceOptionIndex}
                                      onDragStartOption={(optionIndex) => {
                                        setDraggedChoiceOptionIndex(optionIndex);
                                        setDragOverChoiceOptionIndex(optionIndex);
                                      }}
                                      onDropOption={(optionIndex) => {
                                        if (draggedChoiceOptionIndex === null || draggedChoiceOptionIndex === optionIndex) {
                                          setDragOverChoiceOptionIndex(null);
                                          return;
                                        }

                                        reorderSelectedFieldOption(draggedChoiceOptionIndex, optionIndex);
                                        setDraggedChoiceOptionIndex(null);
                                        setDragOverChoiceOptionIndex(null);
                                      }}
                                      onOptionChange={renameSelectedFieldOption}
                                      onOptionRemove={(optionIndex) => updateSelectedFieldOptions((options) =>
                                        options.filter((_, currentIndex) => currentIndex !== optionIndex)
                                      )}
                                      onOptionStyleChange={updateSelectedFieldChoiceStyle}
                                      options={selectedField.options ?? []}
                                    />
                                  ) : null}

                                  {selectedFieldIsLookup ? (
                                    <LookupFieldSettings
                                      canChooseSource={workspaceAccess.canEditSettings && canEditModelDefinition}
                                      displayMode={selectedField.lookupConfig?.displayMode ?? "search_select"}
                                      fieldTypeLabel={t(getFieldTypeKey(selectedField))}
                                      labels={{
                                        chooseSource: t("tenant.platformStudio.forms.builder.fieldSettings.chooseSource"),
                                        display: t("tenant.platformStudio.forms.builder.fieldSettings.display"),
                                        displayMode: t("tenant.platformStudio.forms.builder.fieldSettings.displayMode"),
                                        displayModeCatalogModal: t("tenant.platformStudio.forms.builder.fieldSettings.displayModeCatalogModal"),
                                        displayModeSearchSelect: t("tenant.platformStudio.forms.builder.fieldSettings.displayModeSearchSelect"),
                                      }}
                                      onChooseSource={openLookupSourcePicker}
                                      onDisplayModeChange={(displayMode) => updateSelectedFieldLookupConfig((lookupConfig) => ({
                                        ...lookupConfig,
                                        displayMode,
                                      }))}
                                      presetLookupSummary={selectedFieldIsPresetLookup && selectedLookupSourceSummary
                                        ? selectedLookupSourceSummary
                                        : null}
                                      showDisplayMode={selectedFieldShowsLookupDisplayMode}
                                      sourceRows={[
                                        {
                                          label: t("tenant.platformStudio.forms.builder.fieldSettings.sourceModel"),
                                          summary: selectedGenericLookupSourceModel?.label
                                            ?? selectedField.sourceLabel
                                            ?? t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
                                        },
                                        ...(!selectedFieldIsLookupValue
                                          ? [{
                                              label: t("tenant.platformStudio.forms.builder.fieldSettings.storedValueField"),
                                              summary: getLookupModelFieldLabel(
                                                selectedGenericLookupSourceModel,
                                                selectedField.lookupConfig?.storedValueField,
                                              ) || t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
                                            }]
                                          : []),
                                        {
                                          label: selectedLookupStoredValueSummary?.label
                                            ?? t("tenant.platformStudio.forms.builder.fieldSettings.displayFields"),
                                          summary: selectedLookupStoredValueSummary?.summary
                                            ?? t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields"),
                                        },
                                        {
                                          label: selectedLookupSortFieldSummary?.label
                                            ?? t("tenant.platformStudio.forms.builder.fieldSettings.sortBy"),
                                          summary: selectedLookupSortFieldSummary?.summary
                                            ?? t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
                                        },
                                      ]}
                                    />
                                  ) : null}

                                  {selectedFieldSupportsTextInputSettings ? (
                                    <TextFieldSettings
                                      autocompleteChecked={selectedFieldAutocompleteChecked}
                                      fieldTypeLabel={t(getFieldTypeKey(selectedField))}
                                      labels={{
                                        autocomplete: t("tenant.platformStudio.forms.builder.fieldSettings.autocomplete"),
                                        mask: t("tenant.platformStudio.forms.builder.fieldSettings.mask"),
                                        placeholder: t("tenant.platformStudio.forms.builder.fieldSettings.placeholder"),
                                        unbound: t("tenant.platformStudio.forms.builder.systemField.unbound"),
                                        validation: t("tenant.platformStudio.forms.builder.fieldSettings.validation"),
                                        validationEmail: t("tenant.platformStudio.forms.builder.fieldSettings.validationEmail"),
                                        validationPhone: t("tenant.platformStudio.forms.builder.fieldSettings.validationPhone"),
                                        validationUrl: t("tenant.platformStudio.forms.builder.fieldSettings.validationUrl"),
                                      }}
                                      mask={selectedField.mask ?? ""}
                                      onAutocompleteChange={(checked) => updateSelectedField((field) => ({
                                        ...field,
                                        autocomplete: checked ? selectedFieldDefaultAutocompleteValue : "off",
                                      }))}
                                      onMaskChange={(mask) => updateSelectedField((field) => ({
                                        ...field,
                                        mask: mask || undefined,
                                      }))}
                                      onPlaceholderChange={(placeholder) => updateSelectedField((field) => ({
                                        ...field,
                                        placeholder: placeholder || undefined,
                                      }))}
                                      onValidationChange={(validation) => updateSelectedField((field) => ({
                                        ...field,
                                        validation,
                                      }))}
                                      placeholder={selectedField.placeholder ?? ""}
                                      showValidation={selectedFieldSupportsTextPreset}
                                      validation={selectedField.validation}
                                    />
                                  ) : null}

                                  {selectedFieldIsDateToday ? (
                                    <DateTodayFieldSettings
                                      displayFormat={selectedField.displayFormat ?? ""}
                                      labels={{
                                        dateToday: t("tenant.platformStudio.forms.builder.fieldSettings.dateToday"),
                                        defaultValueMode: t("tenant.platformStudio.forms.builder.fieldSettings.defaultValueMode"),
                                        defaultValueToday: t("tenant.platformStudio.forms.builder.fieldSettings.defaultValueToday"),
                                        displayFormat: t("tenant.platformStudio.forms.builder.fieldSettings.displayFormat"),
                                        readonly: t("tenant.platformStudio.forms.builder.visibility.readonly"),
                                      }}
                                      onDisplayFormatChange={(displayFormat) => updateSelectedField((field) => ({
                                        ...field,
                                        displayFormat: displayFormat || undefined,
                                      }))}
                                      onReadonlyChange={(checked) => updateSelectedField((field) => ({
                                        ...field,
                                        readonly: checked,
                                      }))}
                                      readonly={selectedField.readonly ?? false}
                                    />
                                  ) : null}

                                  {selectedFieldIsTags ? (
                                    <TagsFieldSettings
                                      labels={{
                                        maxTags: t("tenant.platformStudio.forms.builder.fieldSettings.maxTags"),
                                        tagMode: t("tenant.platformStudio.forms.builder.fieldSettings.tagMode"),
                                        tagModeCreateOnly: t("tenant.platformStudio.forms.builder.fieldSettings.tagModeCreateOnly"),
                                        tagModeSelectExisting: t("tenant.platformStudio.forms.builder.fieldSettings.tagModeSelectExisting"),
                                        tagModeSelectOrCreate: t("tenant.platformStudio.forms.builder.fieldSettings.tagModeSelectOrCreate"),
                                        tags: t("tenant.platformStudio.forms.builder.fieldSettings.tags"),
                                      }}
                                      maxTags={selectedField.maxTags ?? ""}
                                      onMaxTagsChange={(maxTags) => updateSelectedField((field) => ({
                                        ...field,
                                        maxTags: maxTags.trim()
                                          ? Math.max(0, Number(maxTags) || 0)
                                          : undefined,
                                      }))}
                                      onTagModeChange={(tagMode) => updateSelectedField((field) => ({
                                        ...field,
                                        tagMode,
                                      }))}
                                      tagMode={selectedField.tagMode ?? "select_or_create"}
                                    />
                                  ) : null}
                            </>
                          ) : null}
                        </SelectionInspectorBasicSection>

                        {selectedNodeSupportsRules ? (
                          <RulesPanel
                            canEdit={workspaceAccess.canEditSettings}
                            labels={{
                              actionsMenu: t("tenant.platformStudio.forms.builder.rule.actionsMenu"),
                              addRequirementRule: t("tenant.platformStudio.forms.builder.rule.addRequirementRule"),
                              addVisibilityRule: t("tenant.platformStudio.forms.builder.rule.addVisibilityRule"),
                              deleteRule: t("tenant.platformStudio.forms.builder.filter.deleteFilter"),
                              editRule: t("tenant.platformStudio.forms.builder.filter.editFilter"),
                              emptyRequirementRules: t("tenant.platformStudio.forms.builder.rule.emptyRequirementRules"),
                              emptyVisibilityRules: t("tenant.platformStudio.forms.builder.rule.emptyVisibilityRules"),
                              noScopeFields: t("tenant.platformStudio.forms.builder.rule.noScopeFields"),
                              readonlyText: t(access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly"),
                              requirementRules: t("tenant.platformStudio.forms.builder.rule.requirementRules"),
                              visibilityRules: t("tenant.platformStudio.forms.builder.rule.visibilityRules"),
                            }}
                            onAddRequirementRule={() => openRequirementRuleEditor(null)}
                            onAddVisibilityRule={() => openVisibilityRuleEditor(null)}
                            onDeleteRequirementRule={(ruleIndex) => updateRequirementRules((rules) =>
                              rules.filter((_, entryIndex) => entryIndex !== ruleIndex)
                            )}
                            onDeleteVisibilityRule={(ruleIndex) => updateVisibilityRules((rules) =>
                              rules.filter((_, entryIndex) => entryIndex !== ruleIndex)
                            )}
                            onEditRequirementRule={openRequirementRuleEditor}
                            onEditVisibilityRule={openVisibilityRuleEditor}
                            requirementRules={selectedRequirementRuleItems}
                            ruleFieldsAvailable={selectedNodeRuleFields.length > 0}
                            showRequirementRules={selectedNode.type === "field"}
                            visibilityRules={selectedVisibilityRuleItems}
                          />
                        ) : null}

                        {structureEditingAccess.canRemoveItems ? (
                          <SelectionDeleteAction
                            label={t("tenant.platformStudio.forms.builder.deleteNode")}
                            onDelete={() => setDeleteNodeOpen(true)}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <SelectionInspectorEmptyState
                        description={t("tenant.platformStudio.forms.builder.selectionEmptyDescription")}
                        title={t("tenant.platformStudio.forms.builder.selectionEmptyTitle")}
                      />
                    )}
          </InspectorPanelTab>

          <InspectorPanelTab value="grid">
                    <GridSettingsPanel
                      canEdit={workspaceAccess.canEditSettings}
                      canMoveItems={workspaceAccess.canEditSettings && sortedCurrentGridScopeTargets.length > 1}
                      checklistUnsupportedText={t("tenant.platformStudio.forms.builder.grid.checklistUnsupported")}
                      dragOverFieldId={dragOverGridFieldId}
                      draggedFieldId={draggedGridFieldId}
                      dragToReorderLabel={t("tenant.platformStudio.forms.builder.dragToReorder")}
                      fieldItems={gridSettingsFieldItems}
                      hiddenInGridText={t("tenant.platformStudio.forms.builder.grid.hiddenInGrid")}
                      isChecklistGridScope={isChecklistGridScope}
                      meta={
                        isSubformGridScope
                          ? (currentScopeSubformNode?.title ?? t("tenant.platformStudio.forms.builder.nodeType.subform"))
                          : currentDraftViewTitle
                      }
                      noFieldsText={t("tenant.platformStudio.forms.builder.grid.noFields")}
                      onDragEnd={() => {
                        setDraggedGridFieldId(null);
                        setDragOverGridFieldId(null);
                      }}
                      onDragOverField={(fieldId) => {
                        setDragOverGridFieldId(fieldId);
                      }}
                      onDragStartField={(fieldId) => {
                        setDraggedGridFieldId(fieldId);
                        setDragOverGridFieldId(fieldId);
                      }}
                      onDropField={(fieldId) => {
                        if (!draggedGridFieldId || draggedGridFieldId === fieldId) {
                          return;
                        }

                        reorderGridColumns(draggedGridFieldId, fieldId);
                        setDraggedGridFieldId(null);
                        setDragOverGridFieldId(null);
                      }}
                      onToggleVisible={updateGridColumnVisibility}
                      title={t(
                        isSubformGridScope
                          ? "tenant.platformStudio.forms.builder.grid.subtable"
                          : "tenant.platformStudio.forms.builder.grid.mainTable",
                      )}
                      visibleInGridText={t("tenant.platformStudio.forms.builder.grid.visibleInGrid")}
                    />
          </InspectorPanelTab>

          <InspectorPanelTab value="view">
                    <ViewSettingsPanel
                      actionItems={viewSettingsActionItems}
                      actionsMenuLabel={t("tenant.platformStudio.forms.builder.rule.actionsMenu")}
                      addFilterLabel={t("tenant.platformStudio.forms.builder.filter.addFilter")}
                      canEditModelDefinition={canEditModelDefinition}
                      canEditSettings={workspaceAccess.canEditSettings}
                      canToggleModelLocks={canToggleModelLocks}
                      canToggleViewLocks={canToggleViewLocks}
                      correctiveActionEnabled={document.viewSettings.correctiveAction.enabled}
                      currentScopeViewLabel={currentScopeViewLabel}
                      defaultFilterEmptyText={t("tenant.platformStudio.forms.builder.filter.emptyDefaultFilters")}
                      defaultFilterFieldLabel={t("tenant.platformStudio.forms.builder.filter.fieldLabel")}
                      defaultFilterItems={viewSettingsDefaultFilterItems}
                      deleteFilterLabel={t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
                      editFilterLabel={t("tenant.platformStudio.forms.builder.filter.editFilter")}
                      filterFieldOptions={currentViewFilterTargets.map((field) => ({
                        id: field.id,
                        label: field.label,
                      }))}
                      isRootActor={currentActor.isRoot}
                      isRootViewScope={isRootViewScope}
                      isStaticModel={isStaticModel}
                      labels={{
                        actionsSection: t("tenant.platformStudio.forms.builder.viewSection.actions"),
                        activeView: t("tenant.platformStudio.forms.builder.activeViewLabel"),
                        correctiveAction: t("tenant.platformStudio.forms.builder.viewSettings.correctiveAction"),
                        correctiveActionSource: t("tenant.platformStudio.forms.builder.viewSettings.correctiveActionSource"),
                        defaultViewStructureOnlyNotice: t("tenant.platformStudio.forms.builder.defaultViewStructureOnlyNotice"),
                        filtersSection: t("tenant.platformStudio.forms.builder.viewSection.filters"),
                        finalValue: t("tenant.platformStudio.forms.builder.systemField.finalValue"),
                        initialValue: t("tenant.platformStudio.forms.builder.systemField.initialValue"),
                        locked: t("tenant.platformStudio.forms.builder.locking.locked"),
                        modelLock: t("tenant.platformStudio.forms.builder.locking.model"),
                        sortDirection: t("tenant.platformStudio.forms.builder.viewSettings.sortDirection"),
                        sortDirectionAsc: t("tenant.platformStudio.forms.builder.viewSettings.sortDirectionAsc"),
                        sortDirectionDesc: t("tenant.platformStudio.forms.builder.viewSettings.sortDirectionDesc"),
                        sortField: t(
                          isRootViewScope
                            ? "tenant.platformStudio.forms.builder.viewSettings.sortField"
                            : "tenant.platformStudio.forms.builder.viewSettings.sortFieldSubtable",
                        ),
                        sortingSection: t(
                          isRootViewScope
                            ? "tenant.platformStudio.forms.builder.viewSettings.sorting"
                            : "tenant.platformStudio.forms.builder.viewSettings.sortingSubtable",
                        ),
                        subtableTitle: t("tenant.platformStudio.forms.builder.grid.subtable"),
                        systemFieldsSection: t("tenant.platformStudio.forms.builder.viewSection.systemFields"),
                        unbound: t("tenant.platformStudio.forms.builder.systemField.unbound"),
                        unlocked: t("tenant.platformStudio.forms.builder.locking.unlocked"),
                        viewActive: t("tenant.platformStudio.forms.viewActive"),
                        viewDescription: t("tenant.platformStudio.forms.builder.viewDescriptionLabel"),
                        viewInactive: t("tenant.platformStudio.forms.viewInactive"),
                        viewLock: t("tenant.platformStudio.forms.builder.locking.view"),
                        viewTitle: t("tenant.platformStudio.forms.builder.viewTitleLabel"),
                        workflowSection: t("tenant.platformStudio.forms.builder.viewSection.workflow"),
                      }}
                      modelStructureLocked={currentModel.isStructureLocked}
                      onAddDefaultFilter={addDefaultFilterCondition}
                      onCorrectiveActionChange={(checked) => updateViewSettings((viewSettings) => ({
                        ...viewSettings,
                        correctiveAction: {
                          ...viewSettings.correctiveAction,
                          enabled: checked,
                        },
                      }))}
                      onDeleteDefaultFilter={(index) => updateDefaultFilters((conditions) =>
                        conditions.filter((_, entryIndex) => entryIndex !== index)
                      )}
                      onEditDefaultFilter={openDefaultFilterEditor}
                      onModelStructureLockedChange={(checked) => updateCurrentModel((currentModelDraft) => ({
                        ...currentModelDraft,
                        isStructureLocked: checked,
                      }))}
                      onPendingDefaultFilterFieldChange={setPendingDefaultFilterFieldId}
                      onSortDirectionChange={(direction) => {
                        if (isRootViewScope) {
                          updateViewSettings((viewSettings) => ({
                            ...viewSettings,
                            list: {
                              ...viewSettings.list,
                              sorting: {
                                ...viewSettings.list.sorting,
                                direction,
                              },
                            },
                          }));
                          return;
                        }

                        updateCurrentScopeSubformViewSettings((viewSettings) => ({
                          ...viewSettings,
                          list: {
                            ...viewSettings.list,
                            sorting: {
                              ...viewSettings.list.sorting,
                              direction,
                            },
                          },
                        }));
                      }}
                      onSortFieldChange={(fieldId) => {
                        if (isRootViewScope) {
                          updateViewSettings((viewSettings) => ({
                            ...viewSettings,
                            list: {
                              ...viewSettings.list,
                              sorting: {
                                ...viewSettings.list.sorting,
                                fieldId: fieldId || undefined,
                              },
                            },
                          }));
                          return;
                        }

                        updateCurrentScopeSubformViewSettings((viewSettings) => ({
                          ...viewSettings,
                          list: {
                            ...viewSettings.list,
                            sorting: {
                              ...viewSettings.list.sorting,
                              fieldId: fieldId || undefined,
                            },
                          },
                        }));
                      }}
                      onSystemFieldChange={(role, fieldId) => updateSystemFieldBinding(role as SystemFieldRole, fieldId)}
                      onViewActiveChange={(checked) => updateCurrentViewMetadata((viewEntry) => ({
                        ...viewEntry,
                        isActive: checked,
                      }))}
                      onViewDescriptionChange={(description) => updateDocument((currentDocument) => ({
                        ...currentDocument,
                        viewDescription: description,
                      }))}
                      onViewLockedChange={(checked) => updateCurrentViewMetadata((viewEntry) => ({
                        ...viewEntry,
                        isViewLocked: checked,
                      }))}
                      onViewTitleChange={(title) => updateDocument((currentDocument) => ({
                        ...currentDocument,
                        viewTitle: title,
                      }))}
                      onWorkflowStatusOptionChange={updateWorkflowStatusOption}
                      pendingDefaultFilterFieldId={pendingDefaultFilterFieldId}
                      sortDirection={isRootViewScope
                        ? document.viewSettings.list.sorting.direction
                        : (currentScopeViewSettings?.list.sorting.direction ?? "asc")}
                      sortFieldId={isRootViewScope
                        ? (document.viewSettings.list.sorting.fieldId ?? "")
                        : (currentScopeViewSettings?.list.sorting.fieldId ?? "")}
                      sortingFieldItems={viewSettingsSortingFields}
                      systemFields={viewSettingsSystemFields}
                      viewActive={currentView.isActive}
                      viewDescription={document.viewDescription}
                      viewLocked={currentView.isViewLocked ?? false}
                      viewTitle={document.viewTitle}
                    />
          </InspectorPanelTab>
        </InspectorPanel>
      </section>

      <DeleteNodeConfirmationDialog
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        confirmLabel={t("tenant.platformStudio.forms.builder.deleteNode")}
        description={t("tenant.platformStudio.forms.builder.confirmDeleteNodeDescription", { title: selectedNodeLabel })}
        onConfirm={() => {
          if (!selectedNode) {
            setDeleteNodeOpen(false);
            return;
          }

          if (selectedNode.type === "field" && selectedField && !isPersistedModelField(selectedField)) {
            deleteUnsavedField(selectedField.id, selectedNode.id);
            setDeleteNodeOpen(false);
            return;
          }

          updateDocument((currentDocument) => removeFormBuilderNode(currentDocument, selectedNode.id));
          setDeleteNodeOpen(false);
        }}
        onOpenChange={setDeleteNodeOpen}
        open={deleteNodeOpen}
        title={t("tenant.platformStudio.forms.builder.confirmDeleteNode", { title: selectedNodeLabel })}
      />

      <RuleEditorDialog
        canDelete={Boolean(visibilityRuleEditor && visibilityRuleEditor.index !== null)}
        canEdit={workspaceAccess.canEditSettings}
        canSave={Boolean(visibilityRuleEditor && visibilityRuleEditor.draft.when.all.length > 0)}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        deleteLabel={t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
        description={t("tenant.platformStudio.forms.builder.rule.rulesDescription")}
        effectLabel={t("tenant.platformStudio.forms.builder.rule.effectLabel")}
        effectOptions={[
          { label: t("tenant.platformStudio.forms.builder.rule.effect.show"), value: "show" },
          { label: t("tenant.platformStudio.forms.builder.rule.effect.hide"), value: "hide" },
        ]}
        effectSelectId="tenant-platform-studio-visibility-rule-effect"
        effectValue={visibilityRuleEditor?.draft.effect ?? "show"}
        onOpenChange={(open) => {
          if (!open) {
            setVisibilityRuleEditor(null);
          }
        }}
        open={Boolean(visibilityRuleEditor)}
        onCancel={() => setVisibilityRuleEditor(null)}
        onDelete={() => {
          if (!visibilityRuleEditor || visibilityRuleEditor.index === null) {
            return;
          }

          updateVisibilityRules((rules) =>
            rules.filter((_, entryIndex) => entryIndex !== visibilityRuleEditor.index)
          );
          setVisibilityRuleEditor(null);
        }}
        onEffectChange={(effect) => setVisibilityRuleEditor((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                draft: {
                  ...currentValue.draft,
                  effect,
                },
              }
            : currentValue
        )}
        onSave={saveVisibilityRuleEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          visibilityRuleEditor?.index === null
            ? t("tenant.platformStudio.forms.builder.rule.addVisibilityRule")
            : t("tenant.platformStudio.forms.builder.rule.editVisibilityRule")
        }
      >
        {visibilityRuleEditor?.draft.when.all[0] ? (
          <RuleConditionEditor
            allowRemove={false}
            condition={visibilityRuleEditor.draft.when.all[0]}
            disabled={!workspaceAccess.canEditSettings}
            fields={selectedNodeRuleFields}
            idPrefix={`tenant-platform-studio-visibility-rule-editor-${visibilityRuleEditor.draft.id}`}
            onChange={(nextCondition) => setVisibilityRuleEditor((currentValue) =>
              currentValue
                ? {
                    ...currentValue,
                    draft: {
                      ...currentValue.draft,
                      when: {
                        all: [nextCondition],
                      },
                    },
                  }
                : currentValue
            )}
            onRemove={() => undefined}
            t={t}
          />
        ) : null}
      </RuleEditorDialog>

      <RuleEditorDialog
        canDelete={Boolean(requirementRuleEditor && requirementRuleEditor.index !== null)}
        canEdit={workspaceAccess.canEditSettings}
        canSave={Boolean(requirementRuleEditor && requirementRuleEditor.draft.when.all.length > 0)}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        deleteLabel={t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
        description={t("tenant.platformStudio.forms.builder.rule.rulesDescription")}
        effectLabel={t("tenant.platformStudio.forms.builder.rule.effectLabel")}
        effectOptions={[
          { label: t("tenant.platformStudio.forms.builder.rule.effect.required"), value: "required" },
          { label: t("tenant.platformStudio.forms.builder.rule.effect.optional"), value: "optional" },
        ]}
        effectSelectId="tenant-platform-studio-requirement-rule-effect"
        effectValue={requirementRuleEditor?.draft.effect ?? "required"}
        onOpenChange={(open) => {
          if (!open) {
            setRequirementRuleEditor(null);
          }
        }}
        open={Boolean(requirementRuleEditor)}
        onCancel={() => setRequirementRuleEditor(null)}
        onDelete={() => {
          if (!requirementRuleEditor || requirementRuleEditor.index === null) {
            return;
          }

          updateRequirementRules((rules) =>
            rules.filter((_, entryIndex) => entryIndex !== requirementRuleEditor.index)
          );
          setRequirementRuleEditor(null);
        }}
        onEffectChange={(effect) => setRequirementRuleEditor((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                draft: {
                  ...currentValue.draft,
                  effect,
                },
              }
            : currentValue
        )}
        onSave={saveRequirementRuleEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          requirementRuleEditor?.index === null
            ? t("tenant.platformStudio.forms.builder.rule.addRequirementRule")
            : t("tenant.platformStudio.forms.builder.rule.editRequirementRule")
        }
      >
        {requirementRuleEditor?.draft.when.all[0] ? (
          <RuleConditionEditor
            allowRemove={false}
            condition={requirementRuleEditor.draft.when.all[0]}
            disabled={!workspaceAccess.canEditSettings}
            fields={selectedNodeRuleFields}
            idPrefix={`tenant-platform-studio-requirement-rule-editor-${requirementRuleEditor.draft.id}`}
            onChange={(nextCondition) => setRequirementRuleEditor((currentValue) =>
              currentValue
                ? {
                    ...currentValue,
                    draft: {
                      ...currentValue.draft,
                      when: {
                        all: [nextCondition],
                      },
                    },
                  }
                : currentValue
            )}
            onRemove={() => undefined}
            t={t}
          />
        ) : null}
      </RuleEditorDialog>

      <LookupSourcePickerDialog
        canEdit={workspaceAccess.canEditSettings}
        error={lookupSourcePickerError}
        isLoading={isLookupSourcePickerLoading}
        labels={{
          availableFields: t("tenant.platformStudio.forms.builder.fieldSettings.availableFields"),
          availableFieldsCount: t("tenant.platformStudio.forms.builder.fieldSettings.availableFieldsCount"),
          availableModels: t("tenant.platformStudio.forms.builder.fieldSettings.availableModels"),
          cancel: t("tenant.platformStudio.forms.cancelDelete"),
          emptyDisplayFields: t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields"),
          noAvailableModels: t("tenant.platformStudio.forms.builder.fieldSettings.noAvailableModels"),
          noSourceSelected: t("tenant.platformStudio.forms.builder.fieldSettings.noSourceSelected"),
          save: t("tenant.platformStudio.forms.builder.saveAction"),
          selectedFields: t("tenant.platformStudio.forms.builder.fieldSettings.selectedFields"),
          sortBy: t("tenant.platformStudio.forms.builder.fieldSettings.sortBy"),
          sourcePickerDescription: t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerDescription"),
          sourcePickerLoading: t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerLoading"),
          sourcePickerTitle: t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerTitle"),
        }}
        modelItems={lookupSourcePickerModelItems}
        onCancel={() => setLookupSourcePicker(null)}
        onFieldCheckedChange={(fieldKey, checked) => setLookupSourcePicker((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                selectedFieldKeys: checked
                  ? Array.from(new Set([...currentValue.selectedFieldKeys, fieldKey]))
                  : currentValue.selectedFieldKeys.filter((entry) => entry !== fieldKey),
              }
            : currentValue
        )}
        onModelChange={(modelId, selectedFieldKeys, sortFieldKey) => setLookupSourcePicker((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                modelId,
                selectedFieldKeys: [...selectedFieldKeys],
                sortFieldKey,
              }
            : currentValue
        )}
        onOpenChange={(open) => {
          if (!open) {
            setLookupSourcePicker(null);
            setLookupSourcePickerError(null);
            setIsLookupSourcePickerLoading(false);
          }
        }}
        onSave={saveLookupSourcePicker}
        onSortFieldChange={(sortFieldKey) => setLookupSourcePicker((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                sortFieldKey: sortFieldKey || (lookupSourcePickerModel?.defaultSortField ?? ""),
              }
            : currentValue
        )}
        open={Boolean(lookupSourcePicker)}
        selectedFieldKeys={lookupSourcePicker?.selectedFieldKeys ?? []}
        selectedFieldsSummary={lookupSourcePickerSelectedFieldsSummary}
        selectedModel={lookupSourcePickerModel}
        selectedModelId={lookupSourcePicker?.modelId ?? ""}
        sortFieldKey={lookupSourcePicker?.sortFieldKey ?? ""}
      />

      <DefaultFilterEditorDialog
        canEdit={workspaceAccess.canEditSettings}
        canSave={Boolean(defaultFilterEditor)}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        description={t(
          isRootViewScope
            ? "tenant.platformStudio.forms.builder.viewSection.filtersDescription"
            : "tenant.platformStudio.forms.builder.filter.filtersDescriptionSubtable",
        )}
        onOpenChange={(open) => {
          if (!open) {
            setDefaultFilterEditor(null);
          }
        }}
        open={Boolean(defaultFilterEditor)}
        onCancel={() => setDefaultFilterEditor(null)}
        onSave={saveDefaultFilterEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          defaultFilterEditor?.index === null
            ? t(
              isRootViewScope
                ? "tenant.platformStudio.forms.builder.filter.addFilter"
                : "tenant.platformStudio.forms.builder.filter.addFilterSubtable",
            )
            : t(
              isRootViewScope
                ? "tenant.platformStudio.forms.builder.filter.editFilter"
                : "tenant.platformStudio.forms.builder.filter.editFilterSubtable",
            )
        }
      >
        {defaultFilterEditor ? (
          <FilterConditionEditor
            condition={defaultFilterEditor.draft}
            disabled={!workspaceAccess.canEditSettings}
            fields={currentViewFilterTargets}
            idPrefix="tenant-platform-studio-default-filter-editor"
            onChange={(nextCondition) => setDefaultFilterEditor((currentValue) =>
              currentValue
                ? {
                    ...currentValue,
                    draft: nextCondition,
                  }
                : currentValue
            )}
            onRemove={() => {
              if (defaultFilterEditor.index !== null) {
                updateDefaultFilters((conditions) =>
                  conditions.filter((_, entryIndex) => entryIndex !== defaultFilterEditor.index)
                );
              }

              setDefaultFilterEditor(null);
            }}
            t={t}
          />
        ) : null}
      </DefaultFilterEditorDialog>

      <QuickFilterEditorDialog
        addConditionLabel={t("tenant.platformStudio.forms.builder.filter.addCondition")}
        canAddCondition={workspaceAccess.canEditSettings && rootViewFilterTargets.length > 0}
        canEdit={workspaceAccess.canEditSettings}
        canSave={Boolean(
          quickFilterEditor
          && quickFilterEditor.draft.label.trim()
          && quickFilterEditor.draft.conditions.length > 0,
        )}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        color={quickFilterEditor?.draft.color ?? ""}
        colorLabel={t("tenant.platformStudio.forms.builder.filter.quickFilterColor")}
        colorPlaceholder="#D97706"
        description={t("tenant.platformStudio.forms.builder.filter.quickFilters")}
        label={quickFilterEditor?.draft.label ?? ""}
        labelInputLabel={t("tenant.platformStudio.forms.builder.filter.quickFilterLabel")}
        onAddCondition={() => {
          const nextCondition = createDefaultFilterCondition(rootViewFilterTargets);
          if (!nextCondition) {
            return;
          }

          setQuickFilterEditor((currentValue) =>
            currentValue
              ? {
                  ...currentValue,
                  draft: {
                    ...currentValue.draft,
                    conditions: [...currentValue.draft.conditions, nextCondition],
                  },
                }
              : currentValue
          );
        }}
        onCancel={() => setQuickFilterEditor(null)}
        onColorChange={(color) => setQuickFilterEditor((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                draft: {
                  ...currentValue.draft,
                  color: normalizeHexColor(color) || undefined,
                },
              }
            : currentValue
        )}
        onLabelChange={(label) => setQuickFilterEditor((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                draft: {
                  ...currentValue.draft,
                  label,
                },
              }
            : currentValue
        )}
        onOpenChange={(open) => {
          if (!open) {
            setQuickFilterEditor(null);
          }
        }}
        open={Boolean(quickFilterEditor)}
        onSave={saveQuickFilterEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          quickFilterEditor?.index === null
            ? t("tenant.platformStudio.forms.builder.filter.addQuickFilter")
            : t("tenant.platformStudio.forms.builder.filter.editFilter")
        }
      >
        {quickFilterEditor
          ? quickFilterEditor.draft.conditions.map((condition, conditionIndex) => (
              <FilterConditionEditor
                condition={condition}
                disabled={!workspaceAccess.canEditSettings}
                fields={rootViewFilterTargets}
                idPrefix={`tenant-platform-studio-quick-filter-editor-${quickFilterEditor.draft.id}-${conditionIndex}`}
                key={`${quickFilterEditor.draft.id}-${conditionIndex}`}
                onChange={(nextCondition) => setQuickFilterEditor((currentValue) =>
                  currentValue
                    ? {
                        ...currentValue,
                        draft: {
                          ...currentValue.draft,
                          conditions: currentValue.draft.conditions.map((entry, entryIndex) =>
                            entryIndex === conditionIndex ? nextCondition : entry
                          ),
                        },
                      }
                    : currentValue
                )}
                onRemove={() => setQuickFilterEditor((currentValue) =>
                  currentValue
                    ? {
                        ...currentValue,
                        draft: {
                          ...currentValue.draft,
                          conditions: currentValue.draft.conditions.filter((_, entryIndex) =>
                            entryIndex !== conditionIndex
                          ),
                        },
                      }
                    : currentValue
                )}
                t={t}
              />
            ))
          : null}
      </QuickFilterEditorDialog>

      <DebugDialog
        compiledRuntime={debugCompiledRuntime}
        labels={{
          compiledRuntimeDescription: "Derived storage and SQL mapping for scopes and fields.",
          compiledRuntimeTitle: "Compiled Runtime",
          description: t("tenant.platformStudio.forms.builder.debugDialogDescription"),
          modelSchemaDescription: t("tenant.platformStudio.forms.builder.debugModelSchemaDescription"),
          modelSchemaTitle: t("tenant.platformStudio.forms.builder.debugModelSchemaTitle"),
          title: t("tenant.platformStudio.forms.builder.debugDialogTitle"),
          uiSchemaDescription: t("tenant.platformStudio.forms.builder.debugUiSchemaDescription"),
          uiSchemaTitle: t("tenant.platformStudio.forms.builder.debugUiSchemaTitle"),
        }}
        modelSchema={debugDataSchema}
        onOpenChange={setDebugOpen}
        open={debugOpen}
        uiSchema={debugUiSchema}
      />

      <UnsavedLeaveConfirmationDialog
        cancelLabel={t("tenant.platformStudio.forms.builder.stayAction")}
        confirmLabel={t("tenant.platformStudio.forms.builder.leaveWithoutSavingAction")}
        description={t("tenant.platformStudio.forms.builder.unsavedLeaveDescription")}
        onCancel={() => resolveLeaveConfirmation(false)}
        onConfirm={() => resolveLeaveConfirmation(true)}
        onOpenChange={(open) => {
          if (!open && leaveConfirmOpen) {
            resolveLeaveConfirmation(false);
          }
        }}
        open={leaveConfirmOpen}
        title={t("tenant.platformStudio.forms.builder.unsavedLeaveTitle")}
      />
    </div>
  );
}
