import {
  Fragment,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EyeIcon,
  Input,
  Label,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  RichTextEditor,
  SearchIcon,
  Select,
  Switch,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Textarea,
  StarIcon,
} from "@platform/ui-kit";
import {
  useNavigate,
  useParams,
  useBeforeUnload,
} from "react-router-dom";

import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import { platformStudioPaths } from "../../platform-studio-route-meta";
import { FormBuilderElementIcon } from "../forms-builder-icons";
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
  type FormBuilderFilterScalar,
  type FormBuilderFilterCondition,
  type FormBuilderFilterOperator,
  type FormBuilderFilterValueSource,
  type FormBuilderGridColumnDefinition,
  type FormBuilderLookupDynamicToken,
  type FormBuilderLookupFilterClause,
  type FormBuilderLookupFilterCondition,
  type FormBuilderLookupPreset,
  type FormBuilderNode,
  type FormBuilderFieldPaletteCategory,
  type FormBuilderQuickFilter,
  type FormBuilderRequirementRule,
  type FormBuilderRuleCondition,
  type FormBuilderRuleOperator,
  type FormBuilderRuleScalar,
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
  type FormsPlaceholderChoiceOrientation,
  type FormsPlaceholderFieldKind,
  type FormsPlaceholderFieldOptionStyle,
  type FormsPlaceholderFieldSemanticRole,
  type FormsPlaceholderFieldValidation,
  type FormsPlaceholderLookupConfig,
  type FormsPlaceholderLookupDisplayMode,
  type FormsPlaceholderModel,
  type FormsPlaceholderTagMode,
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

type InspectorTab = "grid" | "selection" | "view";

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
const relativeDatePresetOptions = [
  "current_week",
  "last_week",
  "next_week",
  "current_month",
  "last_month",
  "next_month",
  "current_quarter",
  "last_quarter",
  "next_quarter",
  "current_year",
  "last_year",
  "next_year",
  "last_12_months",
  "next_3_days",
  "next_5_days",
  "next_7_days",
  "today_or_later",
  "today_or_earlier",
] as const;
const lookupDynamicTokenOptions = [
  "current_user_id",
  "current_user_company_id",
  "current_user_division_id",
  "current_user_company_name",
  "current_user_division_name",
  "assigned_projects",
] as const satisfies ReadonlyArray<FormBuilderLookupDynamicToken>;

type LookupClauseDefinition = {
  clauseKey: string;
  defaultDynamicToken?: FormBuilderLookupDynamicToken;
  defaultValue?: FormBuilderFilterScalar;
  literalOptions?: ReadonlyArray<{
    label: string;
    value: string;
  }>;
  tokenOptions?: ReadonlyArray<FormBuilderLookupDynamicToken>;
  valueMode: FormBuilderLookupFilterClause["valueMode"];
};

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

const mockContactJobTypeOptions = [
  { label: "Inspector", value: "inspector" },
  { label: "Supervisor", value: "supervisor" },
  { label: "Foreman", value: "foreman" },
  { label: "Manager", value: "manager" },
] as const;

const mockBusinessUnitTypeOptions = [
  { label: "Business Unit", value: "business_unit" },
  { label: "Division", value: "division" },
  { label: "Department", value: "department" },
  { label: "Vendor", value: "vendor" },
] as const;

const mockBusinessUnitOptions = [
  { label: "Roofing", value: "roofing" },
  { label: "Electrical", value: "electrical" },
  { label: "Safety", value: "safety" },
  { label: "Operations", value: "operations" },
] as const;

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

const lookupClauseDefinitionsByPreset: Record<
  Exclude<FormBuilderLookupPreset, "generic_db_lookup">,
  ReadonlyArray<LookupClauseDefinition>
> = {
  company_lookup: [
    { clauseKey: "business_unit_type", literalOptions: mockBusinessUnitTypeOptions, valueMode: "literal" },
    { clauseKey: "business_unit_name", valueMode: "literal" },
    { clauseKey: "main_company_name", valueMode: "literal" },
    {
      clauseKey: "business_unit_scope",
      defaultDynamicToken: "current_user_company_id",
      tokenOptions: ["current_user_company_id", "current_user_division_id"],
      valueMode: "dynamic_token",
    },
    {
      clauseKey: "main_company_scope",
      defaultDynamicToken: "current_user_company_name",
      tokenOptions: ["current_user_company_name", "current_user_division_name"],
      valueMode: "dynamic_token",
    },
  ],
  contact_lookup: [
    { clauseKey: "contact_job_title", literalOptions: mockContactJobTypeOptions, valueMode: "literal" },
    {
      clauseKey: "active_account",
      defaultDynamicToken: "current_user_id",
      tokenOptions: ["current_user_id"],
      valueMode: "dynamic_token",
    },
    {
      clauseKey: "by_user_company",
      defaultValue: true,
      valueMode: "boolean_flag",
    },
  ],
  project_lookup: [
    { clauseKey: "business_unit_id", literalOptions: mockBusinessUnitOptions, valueMode: "literal" },
    {
      clauseKey: "assigned_projects",
      defaultDynamicToken: "assigned_projects",
      tokenOptions: ["assigned_projects"],
      valueMode: "dynamic_token",
    },
  ],
};

function getSystemFieldKey(role: SystemFieldRole) {
  return `tenant.platformStudio.forms.builder.systemField.${role}`;
}

function getSystemFieldPaletteDescriptionKey(role: SystemFieldRole) {
  return `tenant.platformStudio.forms.builder.systemField.palette.${role}Description`;
}

function getFilterOperatorKey(operator: FormBuilderFilterOperator) {
  return `tenant.platformStudio.forms.builder.filter.operator.${operator}`;
}

function getRuleOperatorKey(operator: FormBuilderRuleOperator) {
  return `tenant.platformStudio.forms.builder.rule.operator.${operator}`;
}

function getFilterTokenKey(token: typeof filterTokenOptions[number]) {
  return `tenant.platformStudio.forms.builder.filter.token.${token}`;
}

function getRelativeDatePresetKey(preset: typeof relativeDatePresetOptions[number]) {
  return `tenant.platformStudio.forms.builder.filter.relativeDate.${preset}`;
}

function getLookupDynamicTokenKey(token: FormBuilderLookupDynamicToken) {
  return `tenant.platformStudio.forms.builder.filter.lookupToken.${token}`;
}

function getLookupClauseKey(clauseKey: string) {
  return `tenant.platformStudio.forms.builder.filter.lookupClause.${clauseKey}`;
}

function getLookupPresetFromField(field: FormsPlaceholderField): FormBuilderLookupPreset {
  if (field.preset === "contact_lookup" || field.preset === "company_lookup" || field.preset === "project_lookup") {
    return field.preset;
  }

  return "generic_db_lookup";
}

function isPresetLookupField(field: FormsPlaceholderField) {
  return field.kind === "db_lookup" && (
    field.preset === "contact_lookup" ||
    field.preset === "company_lookup" ||
    field.preset === "project_lookup"
  );
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

function createLookupClauseId(clauseKey: string) {
  return `lookup-clause-${clauseKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultLookupClause(definition: LookupClauseDefinition): FormBuilderLookupFilterClause {
  if (definition.valueMode === "dynamic_token") {
    return {
      clauseKey: definition.clauseKey,
      dynamicToken: definition.defaultDynamicToken ?? definition.tokenOptions?.[0] ?? lookupDynamicTokenOptions[0],
      id: createLookupClauseId(definition.clauseKey),
      valueMode: "dynamic_token",
    };
  }

  if (definition.valueMode === "boolean_flag") {
    return {
      clauseKey: definition.clauseKey,
      id: createLookupClauseId(definition.clauseKey),
      value: typeof definition.defaultValue === "boolean" ? definition.defaultValue : true,
      valueMode: "boolean_flag",
    };
  }

  return {
    clauseKey: definition.clauseKey,
    id: createLookupClauseId(definition.clauseKey),
    value: definition.defaultValue ?? "",
    valueMode: "literal",
  };
}

function getLookupClauseDefinitions(
  lookupPreset: FormBuilderLookupPreset,
) {
  if (lookupPreset === "generic_db_lookup") {
    return [];
  }

  return lookupClauseDefinitionsByPreset[lookupPreset];
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

function getRuleOperatorOptions(field: FormsPlaceholderField): ReadonlyArray<FormBuilderRuleOperator> {
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

function ruleOperatorNeedsValue(operator: FormBuilderRuleOperator) {
  return operator !== "is_empty" && operator !== "not_empty";
}

function ruleOperatorUsesArray(operator: FormBuilderRuleOperator) {
  return operator === "in" || operator === "not_in";
}

function getDefaultRuleScalarValue(field: FormsPlaceholderField): FormBuilderRuleScalar {
  if (field.kind === "boolean") {
    return true;
  }

  if (field.kind === "currency" || field.kind === "decimal" || field.kind === "integer") {
    return 0;
  }

  return "";
}

function createDefaultRuleCondition(
  fields: ReadonlyArray<FormsPlaceholderField>,
): FormBuilderRuleCondition | null {
  const field = fields[0] ?? null;
  if (!field) {
    return null;
  }

  const operator = getRuleOperatorOptions(field)[0] ?? "eq";
  return {
    fieldId: field.id,
    id: createRuleId("rule-condition"),
    operator,
    value: ruleOperatorNeedsValue(operator) && !ruleOperatorUsesArray(operator)
      ? getDefaultRuleScalarValue(field)
      : undefined,
    values: ruleOperatorUsesArray(operator) ? [String(getDefaultRuleScalarValue(field))] : undefined,
  };
}

function stringifyRuleScalarValue(value: FormBuilderRuleScalar | undefined) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value ?? "";
}

function parseRuleScalarValue(
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

function getFilterOperatorOptions(
  field: FormsPlaceholderField,
): ReadonlyArray<FormBuilderFilterOperator> {
  switch (field.kind) {
    case "attachment":
    case "boolean":
      return ["eq", "neq"];
    case "currency":
    case "decimal":
    case "integer":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "between", "is_empty", "is_not_empty"];
    case "date":
    case "date_time":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "between", "relative_date", "is_empty", "is_not_empty"];
    case "db_lookup":
    case "geo_point":
    case "multi_select":
    case "signature":
    case "single_select":
      return ["eq", "neq", "in", "is_empty", "is_not_empty"];
    case "long_text":
    case "rich_text":
    case "short_text":
    default:
      return ["eq", "neq", "contains", "not_contains", "in", "is_empty", "is_not_empty"];
  }
}

function getDefaultFilterScalarValue(field: FormsPlaceholderField): FormBuilderFilterScalar {
  if (field.kind === "boolean") {
    return true;
  }

  if (field.kind === "currency" || field.kind === "decimal" || field.kind === "integer") {
    return 0;
  }

  return "";
}

function createDefaultFilterValueSource(
  field: FormsPlaceholderField,
  operator: FormBuilderFilterOperator,
): FormBuilderFilterValueSource | undefined {
  if (operator === "is_empty" || operator === "is_not_empty") {
    return undefined;
  }

  if (operator === "between") {
    return {
      end: getDefaultFilterScalarValue(field),
      kind: "scalar_range",
      start: getDefaultFilterScalarValue(field),
    };
  }

  if (operator === "in") {
    const firstOption = field.options?.[0];

    return {
      kind: "literal_array",
      value: [firstOption ?? getDefaultFilterScalarValue(field)],
    };
  }

  if (operator === "relative_date") {
    return {
      kind: "relative_date",
      preset: "current_month",
    };
  }

  return {
    kind: "literal",
    value: getDefaultFilterScalarValue(field),
  };
}

function createDefaultFilterCondition(
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId?: string,
): FormBuilderFilterCondition | null {
  const field = getFieldById(fields, fieldId) ?? fields[0] ?? null;
  if (!field) {
    return null;
  }

  if (isPresetLookupField(field)) {
    const lookupPreset = getLookupPresetFromField(field);
    return {
      clauses: getLookupClauseDefinitions(lookupPreset).map((definition) => createDefaultLookupClause(definition)),
      editorType: "lookup",
      fieldId: field.id,
      lookupPreset,
    };
  }

  const operator = getFilterOperatorOptions(field)[0];

  return {
    fieldId: field.id,
    operator,
    valueSource: createDefaultFilterValueSource(field, operator),
  };
}

function parseScalarInput(
  field: FormsPlaceholderField,
  value: string,
): FormBuilderFilterScalar {
  if (field.kind === "boolean") {
    return value === "true";
  }

  if (field.kind === "currency" || field.kind === "decimal" || field.kind === "integer") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return value;
}

function stringifyScalarValue(value: FormBuilderFilterScalar | undefined) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value ?? "";
}

function getScalarInputType(fieldKind: FormsPlaceholderFieldKind) {
  if (fieldKind === "currency" || fieldKind === "decimal" || fieldKind === "integer") {
    return "number";
  }

  if (fieldKind === "date") {
    return "date";
  }

  if (fieldKind === "date_time") {
    return "datetime-local";
  }

  return "text";
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : "";
}

function getChoiceOptionStyle(
  choiceDisplay: FormsPlaceholderChoiceDisplay | undefined,
  option: string,
) {
  return choiceDisplay?.optionStyles?.find((entry) => entry.option === option) ?? null;
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

function LookupFilterEditor({
  condition,
  disabled,
  field,
  onChange,
  t,
}: {
  condition: FormBuilderLookupFilterCondition;
  disabled: boolean;
  field: FormsPlaceholderField;
  onChange: (condition: FormBuilderLookupFilterCondition) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const clauseDefinitions = getLookupClauseDefinitions(condition.lookupPreset);
  if (clauseDefinitions.length === 0) {
    return (
      <p className="tenant-web__platform-studio-inline-help">
        {t("tenant.platformStudio.forms.builder.filter.genericLookupFallback")}
      </p>
    );
  }

  return (
    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
      {clauseDefinitions.map((definition) => {
        const clause = condition.clauses.find((entry) => entry.clauseKey === definition.clauseKey)
          ?? createDefaultLookupClause(definition);

        if (definition.valueMode === "boolean_flag") {
          return (
            <div className="tenant-web__platform-studio-switch-row" key={definition.clauseKey}>
              <span className="tenant-web__platform-studio-compact-row-label">
                {t(getLookupClauseKey(definition.clauseKey))}
              </span>
              <Switch
                checked={condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey && Boolean(entry.value))}
                disabled={disabled}
                onCheckedChange={(checked) => onChange({
                  ...condition,
                  clauses: checked
                    ? condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                      ? condition.clauses.map((entry) =>
                          entry.clauseKey === definition.clauseKey
                            ? {
                                ...entry,
                                value: true,
                              }
                            : entry,
                        )
                      : [...condition.clauses, { ...clause, value: true }]
                    : condition.clauses.filter((entry) => entry.clauseKey !== definition.clauseKey),
                })}
                size="sm"
              />
            </div>
          );
        }

        if (definition.valueMode === "dynamic_token") {
          const tokenOptions = definition.tokenOptions ?? lookupDynamicTokenOptions;
          const selectedToken = clause.dynamicToken ?? definition.defaultDynamicToken ?? tokenOptions[0];

          if (tokenOptions.length <= 1) {
            return (
              <div className="tenant-web__platform-studio-compact-row" key={definition.clauseKey}>
                <div className="tenant-web__platform-studio-compact-row-main">
                  <span className="tenant-web__platform-studio-compact-row-label">
                    {t(getLookupClauseKey(definition.clauseKey))}
                  </span>
                  <span className="tenant-web__platform-studio-compact-row-summary">
                    {t(getLookupDynamicTokenKey(selectedToken))}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div className="tenant-web__platform-studio-form-group" key={definition.clauseKey}>
              <Label htmlFor={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}>
                {t(getLookupClauseKey(definition.clauseKey))}
              </Label>
              <Select
                disabled={disabled}
                id={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}
                onChange={(event) => onChange({
                  ...condition,
                  clauses: condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                    ? condition.clauses.map((entry) =>
                        entry.clauseKey === definition.clauseKey
                          ? {
                              ...entry,
                              dynamicToken: event.target.value as FormBuilderLookupDynamicToken,
                            }
                          : entry,
                      )
                    : [...condition.clauses, {
                        ...clause,
                        dynamicToken: event.target.value as FormBuilderLookupDynamicToken,
                      }],
                })}
                value={selectedToken}
              >
                {tokenOptions.map((token) => (
                  <option key={token} value={token}>
                    {t(getLookupDynamicTokenKey(token))}
                  </option>
                ))}
              </Select>
            </div>
          );
        }

        return (
          <div className="tenant-web__platform-studio-form-group" key={definition.clauseKey}>
            <Label htmlFor={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}>
              {t(getLookupClauseKey(definition.clauseKey))}
            </Label>
            {definition.literalOptions ? (
              <Select
                disabled={disabled}
                id={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}
                onChange={(event) => onChange({
                  ...condition,
                  clauses: condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                    ? condition.clauses.map((entry) =>
                        entry.clauseKey === definition.clauseKey
                          ? {
                              ...entry,
                              value: event.target.value,
                            }
                          : entry,
                      )
                    : [...condition.clauses, {
                        ...clause,
                        value: event.target.value,
                      }],
                })}
                value={typeof clause.value === "string" || typeof clause.value === "number" ? String(clause.value) : ""}
              >
                <option value="">{t("tenant.platformStudio.forms.builder.systemField.unbound")}</option>
                {definition.literalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                disabled={disabled}
                id={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}
                onChange={(event) => onChange({
                  ...condition,
                  clauses: condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                    ? condition.clauses.map((entry) =>
                        entry.clauseKey === definition.clauseKey
                          ? {
                              ...entry,
                              value: event.target.value,
                            }
                          : entry,
                      )
                    : [...condition.clauses, {
                        ...clause,
                        value: event.target.value,
                      }],
                })}
                value={typeof clause.value === "string" || typeof clause.value === "number" ? String(clause.value) : ""}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FilterConditionEditor({
  condition,
  disabled,
  fields,
  idPrefix,
  onChange,
  onRemove,
  t,
}: {
  condition: FormBuilderFilterCondition;
  disabled: boolean;
  fields: ReadonlyArray<FormsPlaceholderField>;
  idPrefix: string;
  onChange: (condition: FormBuilderFilterCondition) => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const field = getFieldById(fields, condition.fieldId) ?? fields[0] ?? null;
  if (!field) {
    return null;
  }

  if (field.kind === "db_lookup" && "editorType" in condition && condition.editorType === "lookup") {
    return (
      <div className="tenant-web__platform-studio-filter-card">
        <LookupFilterEditor
          condition={condition}
          disabled={disabled}
          field={field}
          onChange={onChange}
          t={t}
        />
      </div>
    );
  }

  const scalarCondition = condition as FormBuilderScalarFilterCondition;
  const operatorOptions = getFilterOperatorOptions(field);
  const operator = operatorOptions.includes(scalarCondition.operator)
    ? scalarCondition.operator
    : operatorOptions[0];
  const rawValueSource = scalarCondition.valueSource ?? createDefaultFilterValueSource(field, operator);
  const valueSource = rawValueSource?.kind === "token"
    ? createDefaultFilterValueSource(field, operator)
    : rawValueSource;

  return (
    <div className="tenant-web__platform-studio-filter-card">
      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor={`${idPrefix}-field`}>
          {t("tenant.platformStudio.forms.builder.filter.fieldLabel")}
        </Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-field`}
          onChange={(event) => {
            const nextCondition = createDefaultFilterCondition(fields, event.target.value);
            if (nextCondition) {
              onChange(nextCondition);
            }
          }}
          value={field.id}
        >
          {fields.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor={`${idPrefix}-operator`}>
          {t("tenant.platformStudio.forms.builder.filter.operatorLabel")}
        </Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-operator`}
          onChange={(event) => {
            const nextOperator = event.target.value as FormBuilderFilterOperator;
            onChange({
              fieldId: field.id,
              operator: nextOperator,
              valueSource: createDefaultFilterValueSource(field, nextOperator),
            });
          }}
          value={operator}
        >
          {operatorOptions.map((item) => (
            <option key={item} value={item}>
              {t(getFilterOperatorKey(item))}
            </option>
          ))}
        </Select>
      </div>

      {(operator !== "is_empty" && operator !== "is_not_empty") ? (
        <>
          {valueSource?.kind === "literal" ? (
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor={`${idPrefix}-value`}>
                {t("tenant.platformStudio.forms.builder.filter.valueLabel")}
              </Label>
              {field.kind === "boolean" ? (
                <Select
                  disabled={disabled}
                  id={`${idPrefix}-value`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      kind: "literal",
                      value: parseScalarInput(field, event.target.value),
                    },
                  })}
                  value={stringifyScalarValue(valueSource.value)}
                >
                  <option value="true">{t("tenant.platformStudio.forms.builder.boolean.true")}</option>
                  <option value="false">{t("tenant.platformStudio.forms.builder.boolean.false")}</option>
                </Select>
              ) : field.kind === "single_select" && field.options?.length ? (
                <Select
                  disabled={disabled}
                  id={`${idPrefix}-value`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      kind: "literal",
                      value: event.target.value,
                    },
                  })}
                  value={stringifyScalarValue(valueSource.value)}
                >
                  <option value="">{t("tenant.platformStudio.forms.builder.filter.emptyValue")}</option>
                  {field.options.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  disabled={disabled}
                  id={`${idPrefix}-value`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      kind: "literal",
                      value: parseScalarInput(field, event.target.value),
                    },
                  })}
                  type={getScalarInputType(field.kind)}
                  value={stringifyScalarValue(valueSource.value)}
                />
              )}
            </div>
          ) : null}

          {valueSource?.kind === "literal_array" ? (
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor={`${idPrefix}-value-array`}>
                {t("tenant.platformStudio.forms.builder.filter.valueLabel")}
              </Label>
              <Input
                disabled={disabled}
                id={`${idPrefix}-value-array`}
                onChange={(event) => onChange({
                  fieldId: field.id,
                  operator,
                  valueSource: {
                    kind: "literal_array",
                    value: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  },
                })}
                value={valueSource.value.join(", ")}
              />
            </div>
          ) : null}

          {valueSource?.kind === "scalar_range" ? (
            <>
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor={`${idPrefix}-range-start`}>
                  {t("tenant.platformStudio.forms.builder.filter.rangeStartLabel")}
                </Label>
                <Input
                  disabled={disabled}
                  id={`${idPrefix}-range-start`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      ...valueSource,
                      start: parseScalarInput(field, event.target.value),
                    },
                  })}
                  type={getScalarInputType(field.kind)}
                  value={stringifyScalarValue(valueSource.start)}
                />
              </div>
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor={`${idPrefix}-range-end`}>
                  {t("tenant.platformStudio.forms.builder.filter.rangeEndLabel")}
                </Label>
                <Input
                  disabled={disabled}
                  id={`${idPrefix}-range-end`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      ...valueSource,
                      end: parseScalarInput(field, event.target.value),
                    },
                  })}
                  type={getScalarInputType(field.kind)}
                  value={stringifyScalarValue(valueSource.end)}
                />
              </div>
            </>
          ) : null}

          {valueSource?.kind === "relative_date" ? (
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor={`${idPrefix}-relative-date`}>
                {t("tenant.platformStudio.forms.builder.filter.valueLabel")}
              </Label>
              <Select
                disabled={disabled}
                id={`${idPrefix}-relative-date`}
                onChange={(event) => onChange({
                  fieldId: field.id,
                  operator,
                  valueSource: {
                    kind: "relative_date",
                    preset: event.target.value as typeof relativeDatePresetOptions[number],
                  },
                })}
                value={valueSource.preset}
              >
                {relativeDatePresetOptions.map((item) => (
                  <option key={item} value={item}>
                    {t(getRelativeDatePresetKey(item))}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function RuleConditionEditor({
  allowRemove = true,
  condition,
  disabled,
  fields,
  idPrefix,
  onChange,
  onRemove,
  t,
}: {
  allowRemove?: boolean;
  condition: FormBuilderRuleCondition;
  disabled: boolean;
  fields: ReadonlyArray<FormsPlaceholderField>;
  idPrefix: string;
  onChange: (condition: FormBuilderRuleCondition) => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const field = getFieldById(fields, condition.fieldId) ?? fields[0] ?? null;
  if (!field) {
    return null;
  }

  const operatorOptions = getRuleOperatorOptions(field);
  const operator = operatorOptions.includes(condition.operator)
    ? condition.operator
    : operatorOptions[0];
  const usesArray = ruleOperatorUsesArray(operator);
  const needsValue = ruleOperatorNeedsValue(operator);
  const scalarValue = usesArray
    ? undefined
    : condition.value ?? getDefaultRuleScalarValue(field);
  const arrayValue = usesArray
    ? (condition.values?.length ? [...condition.values] : [String(getDefaultRuleScalarValue(field))])
    : [];

  return (
    <div className="tenant-web__platform-studio-filter-card">
      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor={`${idPrefix}-field`}>
          {t("tenant.platformStudio.forms.builder.filter.fieldLabel")}
        </Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-field`}
          onChange={(event) => {
            const nextField = getFieldById(fields, event.target.value);
            if (!nextField) {
              return;
            }

            const nextOperator = getRuleOperatorOptions(nextField)[0] ?? "eq";
            onChange({
              fieldId: nextField.id,
              id: condition.id,
              operator: nextOperator,
              value: ruleOperatorNeedsValue(nextOperator) && !ruleOperatorUsesArray(nextOperator)
                ? getDefaultRuleScalarValue(nextField)
                : undefined,
              values: ruleOperatorUsesArray(nextOperator)
                ? [String(getDefaultRuleScalarValue(nextField))]
                : undefined,
            });
          }}
          value={field.id}
        >
          {fields.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor={`${idPrefix}-operator`}>
          {t("tenant.platformStudio.forms.builder.rule.operatorLabel")}
        </Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-operator`}
          onChange={(event) => {
            const nextOperator = event.target.value as FormBuilderRuleOperator;
            onChange({
              fieldId: field.id,
              id: condition.id,
              operator: nextOperator,
              value: ruleOperatorNeedsValue(nextOperator) && !ruleOperatorUsesArray(nextOperator)
                ? getDefaultRuleScalarValue(field)
                : undefined,
              values: ruleOperatorUsesArray(nextOperator)
                ? [String(getDefaultRuleScalarValue(field))]
                : undefined,
            });
          }}
          value={operator}
        >
          {operatorOptions.map((item) => (
            <option key={item} value={item}>
              {t(getRuleOperatorKey(item))}
            </option>
          ))}
        </Select>
      </div>

      {needsValue ? (
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor={`${idPrefix}-value`}>
            {t("tenant.platformStudio.forms.builder.rule.valueLabel")}
          </Label>
          {field.kind === "boolean" && !usesArray ? (
            <Select
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: event.target.value === "true",
                values: undefined,
              })}
              value={stringifyRuleScalarValue(scalarValue)}
            >
              <option value="true">{t("tenant.platformStudio.forms.builder.boolean.true")}</option>
              <option value="false">{t("tenant.platformStudio.forms.builder.boolean.false")}</option>
            </Select>
          ) : field.kind === "single_select" && field.options?.length && !usesArray ? (
            <Select
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: event.target.value,
                values: undefined,
              })}
              value={stringifyRuleScalarValue(scalarValue)}
            >
              <option value="">{t("tenant.platformStudio.forms.builder.rule.noValue")}</option>
              {field.options.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          ) : usesArray ? (
            <Input
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: undefined,
                values: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item) => parseRuleScalarValue(field, item)),
              })}
              value={arrayValue.map((item) => stringifyRuleScalarValue(item)).join(", ")}
            />
          ) : (
            <Input
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: parseRuleScalarValue(field, event.target.value),
                values: undefined,
              })}
              type={getScalarInputType(field.kind)}
              value={stringifyRuleScalarValue(scalarValue)}
            />
          )}
        </div>
      ) : null}

      {allowRemove ? (
        <div className="tenant-web__platform-studio-button-row">
          <Button disabled={disabled} onClick={onRemove} size="sm" variant="ghost">
            {t("tenant.platformStudio.forms.builder.rule.removeCondition")}
          </Button>
        </div>
      ) : null}
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

function BackArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="tenant-web__platform-studio-back-icon"
      fill="none"
      viewBox="0 0 20 20"
      width="16"
      height="16"
    >
      <path
        d="M10.5 5.5 6 10l4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 5.5 2 10l4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DatabaseFieldIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 20 20"
    >
      <ellipse cx="10" cy="5" rx="5.5" ry="2.5" />
      <path d="M4.5 5v4c0 1.4 2.46 2.5 5.5 2.5s5.5-1.1 5.5-2.5V5" />
      <path d="M4.5 9v4c0 1.4 2.46 2.5 5.5 2.5s5.5-1.1 5.5-2.5V9" />
    </svg>
  );
}

function DragHandleIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
    >
      <circle cx="7" cy="6" fill="currentColor" r="1.1" />
      <circle cx="13" cy="6" fill="currentColor" r="1.1" />
      <circle cx="7" cy="10" fill="currentColor" r="1.1" />
      <circle cx="13" cy="10" fill="currentColor" r="1.1" />
      <circle cx="7" cy="14" fill="currentColor" r="1.1" />
      <circle cx="13" cy="14" fill="currentColor" r="1.1" />
    </svg>
  );
}

function PaletteItem({
  description,
  disabled,
  disabledReason,
  iconKey,
  label,
  onClick,
}: {
  description: string;
  disabled: boolean;
  disabledReason: string | null;
  iconKey: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`tenant-web__platform-studio-palette-item${disabled ? " tenant-web__platform-studio-palette-item--disabled" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={disabledReason ?? undefined}
      type="button"
    >
      <span className="tenant-web__platform-studio-item-icon">
        <FormBuilderElementIcon iconKey={iconKey} />
      </span>
      <span className="tenant-web__platform-studio-palette-copy">
        <span className="tenant-web__platform-studio-palette-title">{label}</span>
        <span className="tenant-web__platform-studio-palette-description">{description}</span>
      </span>
    </button>
  );
}

function CanvasNodeRow({
  canEditVisibility,
  canMoveItems,
  currentLevelId,
  document,
  dragOverNodeId,
  draggedNodeId,
  hasAttention,
  object,
  onDragEnd,
  onDragOverNode,
  onDragStartNode,
  onDropNode,
  onOpenLevel,
  onToggleVisibility,
  onSelect,
  selectedNodeId,
  t,
  workspaceDocumentChildrenCount,
  node,
}: {
  canEditVisibility: boolean;
  canMoveItems: boolean;
  currentLevelId: string | null;
  document: Parameters<typeof getFormBuilderNodeSummary>[1];
  dragOverNodeId: string | null;
  draggedNodeId: string | null;
  hasAttention: boolean;
  node: FormBuilderNode;
  object: NonNullable<ReturnType<typeof getFormsPlaceholderModel>>;
  onDragEnd: () => void;
  onDragOverNode: () => void;
  onDragStartNode: () => void;
  onDropNode: () => void;
  onOpenLevel: () => void;
  onToggleVisibility: () => void;
  onSelect: () => void;
  selectedNodeId: string | null;
  t: ReturnType<typeof useTranslation>["t"];
  workspaceDocumentChildrenCount: number;
}) {
  const isSelected = selectedNodeId === node.id;
  const isCurrentLevel = currentLevelId === node.id;
  const isDragging = draggedNodeId === node.id;
  const isDropTarget = dragOverNodeId === node.id && draggedNodeId !== node.id;
  const isContainer = isFormBuilderContainer(node.type);
  const summaryKey = getFormBuilderNodeSummary(
    node,
    document,
    object,
  );
  const summary = getSummaryText(
    node,
    document,
    object.title,
    object.fields,
    summaryKey,
    t,
    workspaceDocumentChildrenCount,
  );
  const visibilityToneClass =
    node.visibility === "readonly"
      ? " tenant-web__platform-studio-canvas-visibility-button--readonly"
      : node.visibility === "hidden"
        ? " tenant-web__platform-studio-canvas-visibility-button--hidden"
        : " tenant-web__platform-studio-canvas-visibility-button--visible";

  return (
    <div
      className={`tenant-web__platform-studio-canvas-item${isSelected ? " tenant-web__platform-studio-canvas-item--selected" : ""}${isDragging ? " tenant-web__platform-studio-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-studio-canvas-item--drop-target" : ""}${hasAttention ? " tenant-web__platform-studio-canvas-item--attention" : ""}`}
      draggable={canMoveItems}
      role="button"
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDragOverNode();
      }}
      onDragStart={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", node.id);
        onDragStartNode();
      }}
      onDrop={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDropNode();
      }}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="tenant-web__platform-studio-canvas-item-main">
        {canMoveItems ? (
          <span className="tenant-web__platform-studio-drag-handle" title={t("tenant.platformStudio.forms.builder.dragToReorder")}>
            <DragHandleIcon />
          </span>
        ) : null}
        <span className="tenant-web__platform-studio-item-icon tenant-web__platform-studio-item-icon--canvas">
          <FormBuilderElementIcon
            iconKey={
              node.type === "field"
                ? getFormsPlaceholderFieldIconKey(object.fields.find((field) => field.id === node.fieldId) ?? {
                  family: "core",
                  id: "missing-field",
                  isLocked: false,
                  kind: "short_text",
                  label: "Field",
                })
                : node.type
            }
          />
        </span>
        <div className="tenant-web__platform-studio-canvas-copy">
          <span className="tenant-web__platform-studio-canvas-item-title">{getFormBuilderDisplayLabel(node, object)}</span>
          <span className="tenant-web__platform-studio-canvas-item-summary">{summary}</span>
        </div>
      </div>

      <div className="tenant-web__platform-studio-canvas-actions">
        <button
          aria-label={t(`tenant.platformStudio.forms.builder.visibility.${node.visibility}`)}
          className={`tenant-web__platform-studio-canvas-visibility-button${visibilityToneClass}`}
          disabled={!canEditVisibility}
          onClick={(event) => {
            event.stopPropagation();
            onToggleVisibility();
          }}
          title={t(`tenant.platformStudio.forms.builder.visibility.${node.visibility}`)}
          type="button"
        >
          <EyeIcon />
        </button>
        {isContainer ? (
          <>
            {isCurrentLevel ? (
              <Badge appearance="soft" size="sm" variant="brand">
                {t("tenant.platformStudio.forms.builder.currentLevelBadge")}
              </Badge>
            ) : (
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLevel();
                }}
                size="sm"
                variant="secondary"
              >
                {t("tenant.platformStudio.forms.openWorkspace")}
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function GridColumnRow({
  canEdit,
  canMoveItems,
  dragOverFieldId,
  draggedFieldId,
  field,
  onDragEnd,
  onDragOverField,
  onDragStartField,
  onDropField,
  t,
  visible,
  onToggleVisible,
}: {
  canEdit: boolean;
  canMoveItems: boolean;
  dragOverFieldId: string | null;
  draggedFieldId: string | null;
  field: FormsPlaceholderField;
  onDragEnd: () => void;
  onDragOverField: () => void;
  onDragStartField: () => void;
  onDropField: () => void;
  onToggleVisible: (checked: boolean) => void;
  t: ReturnType<typeof useTranslation>["t"];
  visible: boolean;
}) {
  const isDragging = draggedFieldId === field.id;
  const isDropTarget = dragOverFieldId === field.id && draggedFieldId !== field.id;

  return (
    <div
      className={`tenant-web__platform-studio-canvas-item tenant-web__platform-studio-grid-column-item${isDragging ? " tenant-web__platform-studio-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-studio-canvas-item--drop-target" : ""}`}
      draggable={canMoveItems}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDragOverField();
      }}
      onDragStart={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", field.id);
        onDragStartField();
      }}
      onDrop={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDropField();
      }}
    >
      <div className="tenant-web__platform-studio-canvas-item-main">
        {canMoveItems ? (
          <span className="tenant-web__platform-studio-drag-handle" title={t("tenant.platformStudio.forms.builder.dragToReorder")}>
            <DragHandleIcon />
          </span>
        ) : null}
        <span className="tenant-web__platform-studio-item-icon tenant-web__platform-studio-item-icon--canvas">
          <FormBuilderElementIcon iconKey={getFormsPlaceholderFieldIconKey(field)} />
        </span>
        <div className="tenant-web__platform-studio-canvas-copy">
          <span className="tenant-web__platform-studio-canvas-item-title">{field.label}</span>
          <span className="tenant-web__platform-studio-canvas-item-summary">
            {visible
              ? t("tenant.platformStudio.forms.builder.grid.visibleInGrid")
              : t("tenant.platformStudio.forms.builder.grid.hiddenInGrid")}
          </span>
        </div>
      </div>

      <div className="tenant-web__platform-studio-grid-column-switch">
        <Switch
          checked={visible}
          disabled={!canEdit}
          onCheckedChange={onToggleVisible}
          size="sm"
        />
      </div>
    </div>
  );
}

function ChoiceOptionRow({
  canEdit,
  canMoveItems,
  dragOverOptionIndex,
  draggedOptionIndex,
  index,
  onChangeValue,
  onDragEnd,
  onDragOverOption,
  onDragStartOption,
  onDropOption,
  onRemove,
  t,
  value,
}: {
  canEdit: boolean;
  canMoveItems: boolean;
  dragOverOptionIndex: number | null;
  draggedOptionIndex: number | null;
  index: number;
  onChangeValue: (value: string) => void;
  onDragEnd: () => void;
  onDragOverOption: () => void;
  onDragStartOption: () => void;
  onDropOption: () => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslation>["t"];
  value: string;
}) {
  const isDragging = draggedOptionIndex === index;
  const isDropTarget = dragOverOptionIndex === index && draggedOptionIndex !== index;

  return (
    <div
      className={`tenant-web__platform-studio-compact-row tenant-web__platform-studio-choice-option-row${isDragging ? " tenant-web__platform-studio-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-studio-canvas-item--drop-target" : ""}`}
      draggable={canMoveItems}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDragOverOption();
      }}
      onDragStart={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        onDragStartOption();
      }}
      onDrop={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDropOption();
      }}
    >
      <div className="tenant-web__platform-studio-choice-option-main">
        {canMoveItems ? (
          <span
            className="tenant-web__platform-studio-drag-handle"
            title={t("tenant.platformStudio.forms.builder.dragToReorder")}
          >
            <DragHandleIcon />
          </span>
        ) : null}

        <div className="tenant-web__platform-studio-choice-option-editor">
          <Input
            disabled={!canEdit}
            id={`tenant-platform-studio-choice-option-${index}`}
            onChange={(event) => onChangeValue(event.target.value)}
            value={value}
          />
        </div>
      </div>

      <Menu align="end">
        <MenuTrigger>
          <button
            aria-label={t("tenant.platformStudio.forms.builder.rule.actionsMenu")}
            className="tenant-web__platform-studio-menu-trigger tenant-web__platform-studio-menu-trigger--compact"
            disabled={!canEdit}
            type="button"
          >
            <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">⋮</span>
          </button>
        </MenuTrigger>
        <MenuContent className="tenant-web__platform-studio-menu">
          <MenuItem
            onClick={onRemove}
            tone="danger"
          >
            {t("tenant.platformStudio.forms.builder.removeNode")}
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
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
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("selection");
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
        const nextCanonicalDocument = isDefaultView
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
    const documentForSave = isDefaultView
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
        isDefaultView ? syncFieldNodeTitlesWithModel(savedDocument, savedModelWithView) : savedDocument,
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
      <Card className="tenant-web__platform-studio-missing">
        <CardHeader>
          <div>
            <CardTitle>{t("tenant.platformStudio.forms.loadingWorkspaceTitle")}</CardTitle>
            <CardDescription>{t("tenant.platformStudio.forms.loadingWorkspaceDescription")}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (hasResolvedWorkspace && !hasHydratedCurrentDraft && !draftSyncError) {
    return (
      <Card className="tenant-web__platform-studio-missing">
        <CardHeader>
          <div>
            <CardTitle>{t("tenant.platformStudio.forms.loadingWorkspaceTitle")}</CardTitle>
            <CardDescription>{t("tenant.platformStudio.forms.loadingWorkspaceDescription")}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!hasResolvedWorkspace) {
    return (
      <Card className="tenant-web__platform-studio-missing">
        <CardHeader>
          <div>
            <CardTitle>{t("tenant.platformStudio.forms.missingTitle")}</CardTitle>
            <CardDescription>{routeBootstrapError ?? t("tenant.platformStudio.forms.missingDescription")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="tenant-web__platform-studio-row">
          <Button onClick={() => navigate(platformStudioPaths.forms)} variant="outline">
            {t("tenant.platformStudio.forms.backToForms")}
          </Button>
          {params.modelId ? (
            <Button onClick={() => navigate(platformStudioPaths.model(params.modelId ?? ""))} variant="ghost">
              {t("tenant.platformStudio.forms.backToModel")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="tenant-web__platform-studio-shell tenant-web__platform-studio-shell--desktop-panels">
      <PlatformStudioTabs onFormsNavigate={() => requestNavigate(platformStudioPaths.forms)} />

      <div className="tenant-web__platform-studio-workspace-topline">
        <div className="tenant-web__platform-studio-panel-actions tenant-web__platform-studio-panel-actions--workspace-primary">
          <Button
            leadingIcon={<BackArrowIcon />}
            onClick={() => requestNavigate(platformStudioPaths.model(currentModelRouteId))}
            variant="ghost"
          >
            {t("tenant.platformStudio.forms.backToModel")}
          </Button>
          {currentActor.isRoot ? (
            <Button
              onClick={() => setDebugOpen(true)}
              size="sm"
              variant="outline"
            >
              {t("tenant.platformStudio.forms.builder.debugAction")}
            </Button>
          ) : null}
          <Button
            disabled={isSaveButtonDisabled}
            onClick={() => {
              void handleSave();
            }}
            size="sm"
            variant={savePulse ? "secondary" : "primary"}
          >
            {savePulse
              ? t("tenant.platformStudio.forms.builder.savedAction")
              : isSavingDraft
                ? t("tenant.platformStudio.forms.builder.savingAction")
                : t("tenant.platformStudio.forms.builder.saveAction")}
          </Button>
        </div>
        <div className="tenant-web__platform-studio-badge-row">
          <Badge appearance="soft" size="sm" variant="brand">
            {currentModel.title}
          </Badge>
          {isDefaultView ? (
            <Badge appearance="soft" size="sm" variant="brand">
              <span className="tenant-web__platform-studio-badge-label">
                <StarIcon
                  aria-hidden="true"
                  className="tenant-web__platform-studio-badge-icon"
                />
                {t("tenant.platformStudio.forms.builder.viewMode.default")}
              </span>
            </Badge>
          ) : null}
          {isDraftSyncing ? (
            <Badge appearance="soft" size="sm" variant="info">
              {t("tenant.platformStudio.forms.builder.syncingDraft")}
            </Badge>
          ) : null}
          {draftSyncError ? (
            <Badge appearance="soft" size="sm" variant="warning">
              {draftSyncError}
            </Badge>
          ) : null}
          {currentModel.isStructureLocked ? (
            <Badge appearance="soft" size="sm" variant="warning">
              {t("tenant.platformStudio.forms.structureLocked")}
            </Badge>
          ) : null}
          {currentView.isViewLocked ? (
            <Badge appearance="soft" size="sm" variant="warning">
              {t("tenant.platformStudio.forms.viewLocked")}
            </Badge>
          ) : null}
          {currentModel.canEditViewsOnly ? (
            <Badge appearance="soft" size="sm" variant="info">
              {t("tenant.platformStudio.forms.canEditViewsOnly")}
            </Badge>
          ) : null}
        </div>
      </div>

      <section className="tenant-web__platform-studio-builder-grid">
        <Card className="tenant-web__platform-studio-panel">
          <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
            <div className="tenant-web__platform-studio-panel-static tenant-web__platform-studio-panel-static--compact-x">
              <div className="tenant-web__platform-studio-search">
                <div className="tenant-web__platform-studio-search-field">
                  <span className="tenant-web__platform-studio-search-icon">
                    <SearchIcon />
                  </span>
                  <Input
                    className="tenant-web__platform-studio-search-input"
                    id="tenant-platform-studio-palette-search"
                    onChange={(event) => setPaletteQuery(event.target.value)}
                    placeholder={t("tenant.platformStudio.forms.builder.searchPlaceholder")}
                    value={paletteQuery}
                  />
                </div>
              </div>
            </div>

            <PlatformStudioPanelScroll>
              <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--compact-x tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll tenant-web__platform-studio-builder-panel-body--palette-scroll">
                <div className="tenant-web__platform-studio-palette">
                  {paletteSections.map((section) => (
                    <section className="tenant-web__platform-studio-palette-section" key={section.key}>
                      <h3 className="tenant-web__platform-studio-palette-heading">
                        {t(section.labelKey)}
                      </h3>
                      <div className="tenant-web__platform-studio-palette-list">
                        {section.items.map((item) => {
                          if (item.kind === "element") {
                            return (
                              <PaletteItem
                                description={t(item.descriptionKey)}
                                disabled={item.disabled}
                                disabledReason={item.disabledReasonKey ? t(item.disabledReasonKey) : null}
                                iconKey={item.iconKey}
                                key={`${item.nodeType}:${item.labelKey}`}
                                label={t(item.labelKey)}
                                onClick={() => updateDocument((currentDocument) =>
                                  addFormBuilderElementNode(
                                    currentDocument,
                                    getCurrentFormBuilderInsertParentId(currentDocument),
                                    item.nodeType,
                                    item.initialNode,
                                  )
                                )}
                              />
                            );
                          }

                          if (item.kind === "systemField") {
                            return (
                              <PaletteItem
                                description={t(item.descriptionKey)}
                                disabled={item.disabled}
                                disabledReason={item.disabledReasonKey ? t(item.disabledReasonKey) : null}
                                iconKey={item.iconKey}
                                key={item.key}
                                label={t(item.labelKey)}
                                onClick={() => handleCreateSystemField(item.key)}
                              />
                            );
                          }

                          return (
                            <PaletteItem
                              description={getFieldPaletteDescription(item.definition.template, t)}
                              disabled={item.disabled}
                              disabledReason={item.disabledReasonKey ? t(item.disabledReasonKey) : null}
                              iconKey={item.iconKey}
                              key={item.definition.idBase}
                              label={t(item.definition.labelKey)}
                              onClick={() => handleCreateLibraryField(item.definition)}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {paletteSections.length === 0 ? (
                    <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                      <p>{t("tenant.platformStudio.forms.builder.noPaletteResults")}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </PlatformStudioPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-studio-panel">
          <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
            <div className="tenant-web__platform-studio-panel-static tenant-web__platform-studio-panel-static--compact-x">
              <div className="tenant-web__platform-studio-workspace-header">
                <p className="tenant-web__platform-studio-workspace-title">{currentDraftViewTitle}</p>
                <Breadcrumb className="tenant-web__platform-studio-workspace-breadcrumbs">
                  <BreadcrumbList className="tenant-web__platform-studio-workspace-breadcrumb-list">
                    {breadcrumb.length > 0 ? (
                      <>
                        <BreadcrumbItem>
                          <button
                            className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--button"
                            onClick={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, null))}
                            type="button"
                          >
                            {t("tenant.platformStudio.forms.builder.rootLevel")}
                          </button>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                          <span className="tenant-web__platform-studio-workspace-breadcrumb-separator">/</span>
                        </BreadcrumbSeparator>
                        {breadcrumb.map((node, index) => {
                          const label = getFormBuilderDisplayLabel(node, currentModel);
                          const isLast = index === breadcrumb.length - 1;

                          return (
                            <Fragment key={node.id}>
                              <BreadcrumbItem>
                                {isLast ? (
                                  <BreadcrumbPage>
                                    <span className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--active">
                                      {label}
                                    </span>
                                  </BreadcrumbPage>
                                ) : (
                                  <button
                                    className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--button"
                                    onClick={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, node.id))}
                                    type="button"
                                  >
                                    {label}
                                  </button>
                                )}
                              </BreadcrumbItem>
                              {!isLast ? (
                                <BreadcrumbSeparator>
                                  <span className="tenant-web__platform-studio-workspace-breadcrumb-separator">/</span>
                                </BreadcrumbSeparator>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </>
                    ) : (
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          <span className="tenant-web__platform-studio-workspace-breadcrumb-chip tenant-web__platform-studio-workspace-breadcrumb-chip--active">
                            {currentLevelLabel}
                          </span>
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>

            <PlatformStudioPanelScroll>
              <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--compact-x tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
                <div className="tenant-web__platform-studio-canvas-list">
                  {currentNodes.length > 0 ? (
                    currentNodes.map((node) => (
                      <CanvasNodeRow
                        canEditVisibility={workspaceAccess.canEditSettings}
                        canMoveItems={canDragItems}
                        currentLevelId={currentScopeParentId}
                        document={document}
                        dragOverNodeId={dragOverNodeId}
                        draggedNodeId={draggedNodeId}
                        hasAttention={attentionNodeIds.has(node.id)}
                        key={node.id}
                        node={node}
                        object={currentModel}
                        onDragEnd={() => {
                          setDraggedNodeId(null);
                          setDragOverNodeId(null);
                        }}
                        onDragOverNode={() => setDragOverNodeId(node.id)}
                        onDragStartNode={() => {
                          setDraggedNodeId(node.id);
                          setDragOverNodeId(node.id);
                        }}
                        onDropNode={() => {
                          if (!draggedNodeId || draggedNodeId === node.id) {
                            setDragOverNodeId(null);
                            return;
                          }

                          updateDocument((currentDocument) =>
                            reorderFormBuilderNode(currentDocument, draggedNodeId, node.id)
                          );
                          setDraggedNodeId(null);
                          setDragOverNodeId(null);
                        }}
                        onOpenLevel={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, node.id))}
                        onToggleVisibility={() => updateDocument((currentDocument) =>
                          updateFormBuilderNode(currentDocument, node.id, {
                            visibility: cycleNodeVisibility(node.visibility),
                          })
                        )}
                        onSelect={() => {
                          updateDocument((currentDocument) => selectFormBuilderNode(currentDocument, node.id));
                          setInspectorTab("selection");
                        }}
                        selectedNodeId={currentScopeSelectedNodeId}
                        t={t}
                        workspaceDocumentChildrenCount={getFormBuilderChildren(document, node.id).length}
                      />
                    ))
                  ) : (
                    <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                      <p>
                        {structureEditingAccess.canAddElementItems || structureEditingAccess.canAddFieldItems
                          ? t("tenant.platformStudio.forms.builder.canvasEmpty")
                          : t("tenant.platformStudio.forms.builder.canvasEmptyLocked")}
                      </p>
                    </div>
                  )}
                </div>

                {currentScopeUnplacedFields.length > 0 ? (
                  <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                    <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                      <span>{t("tenant.platformStudio.forms.builder.unplacedFieldsTitle")}</span>
                    </div>
                    <p className="tenant-web__platform-studio-inline-help">
                      {t("tenant.platformStudio.forms.builder.unplacedFieldsDescription", {
                        scope: currentScopePlacementLabel,
                      })}
                    </p>

                    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                      {currentScopeUnplacedFields.map((field) => (
                        <div className="tenant-web__platform-studio-compact-row" key={`unplaced-${field.id}`}>
                          <div className="tenant-web__platform-studio-compact-row-main">
                            <span className="tenant-web__platform-studio-compact-row-label">
                              {getFormsPlaceholderFieldDisplayName(field)}
                            </span>
                            <span className="tenant-web__platform-studio-compact-row-summary">
                              {t(getFieldTypeKey(field))}
                            </span>
                          </div>
                          <Button
                            disabled={!canPlaceUnplacedFields}
                            onClick={() => updateDocument((currentDocument) =>
                              addFormBuilderFieldNode(currentDocument, currentScopeParentId, field)
                            )}
                            size="sm"
                            variant="secondary"
                          >
                            {t("tenant.platformStudio.forms.builder.unplacedFieldsPlaceAction")}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {unplacedFieldsHintKey ? (
                      <p className="tenant-web__platform-studio-inline-help">
                        {t(unplacedFieldsHintKey)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </PlatformStudioPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-studio-panel">
          <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
            <Tabs
              defaultValue="selection"
              onValueChange={(value) => setInspectorTab(value as InspectorTab)}
              value={inspectorTab}
              variant="surface"
            >
              <div className="tenant-web__platform-studio-panel-static">
                <div className="tenant-web__platform-studio-inspector-tabs">
                  <TabsList>
                    <TabsTrigger value="selection">{t("tenant.platformStudio.forms.builder.selectionTab")}</TabsTrigger>
                    <TabsTrigger disabled={!isViewTabAvailable} value="view">{t("tenant.platformStudio.forms.builder.viewTab")}</TabsTrigger>
                    <TabsTrigger value="grid">{t("tenant.platformStudio.forms.builder.gridTab")}</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <PlatformStudioPanelScroll>
                <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
                  <TabsPanel value="selection">
                    <div ref={selectionPanelTopRef} />
                    {selectedNode ? (
                      <div className="tenant-web__platform-studio-builder-stack">
                        <div className="tenant-web__platform-studio-inspector-section">
                          <div className="tenant-web__platform-studio-inspector-head tenant-web__platform-studio-inspector-head--selection">
                            <span className="tenant-web__platform-studio-item-icon">
                              <FormBuilderElementIcon
                                iconKey={
                                  selectedField
                                    ? getFormsPlaceholderFieldIconKey(selectedField)
                                    : selectedNode.type
                                }
                              />
                            </span>
                            <div className="tenant-web__platform-studio-inspector-head-copy">
                              <p className="tenant-web__platform-studio-inspector-title">{getFormBuilderDisplayLabel(selectedNode, currentModel)}</p>
                              <p className="tenant-web__platform-studio-inspector-meta">
                                {selectedField
                                  ? t(getFieldTypeKey(selectedField))
                                  : t(getNodeTypeKey(selectedNode.type))}
                              </p>
                            </div>
                          </div>

                          {selectedField && isPersistedModelField(selectedField) ? (
                            <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                              <div className="tenant-web__platform-studio-compact-row">
                                <div className="tenant-web__platform-studio-compact-row-main">
                                  <span className="tenant-web__platform-studio-compact-row-title-wrap">
                                    <span className="tenant-web__platform-studio-compact-row-label">
                                      <DatabaseFieldIcon />
                                      {" "}
                                      {getModelFieldLabel(selectedField)}
                                    </span>
                                  </span>
                                  <span className="tenant-web__platform-studio-compact-row-summary">
                                    {selectedField.storageKey}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {workspaceAccess.canEditSettings ? (
                            <div className="tenant-web__platform-studio-form">
                              {selectedNode.type === "field" ? (
                                <>
                                  <div className="tenant-web__platform-studio-form-group">
                                    <Label htmlFor="tenant-platform-studio-node-title">
                                      {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                    </Label>
                                    <Input
                                      disabled={Boolean(selectedField && isDefaultView && !canEditModelDefinition)}
                                      id="tenant-platform-studio-node-title"
                                      onChange={(event) => {
                                        const nextTitle = event.target.value;

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

                                        updateDocument((currentDocument) =>
                                          updateFormBuilderNode(currentDocument, selectedNode.id, { title: nextTitle })
                                        );
                                      }}
                                      value={selectedNode.title ?? ""}
                                    />
                                  </div>
                                  <div className="tenant-web__platform-studio-form-group">
                                    <Label htmlFor="tenant-platform-studio-node-visibility">
                                      {t("tenant.platformStudio.forms.builder.nodeVisibilityLabel")}
                                    </Label>
                                    <Select
                                      id="tenant-platform-studio-node-visibility"
                                      onChange={(event) => {
                                        const nextVisibility = event.target.value as FormBuilderNode["visibility"];

                                        updateDocument((currentDocument) => {
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
                                      value={selectedNode.visibility}
                                    >
                                      <option value="visible">{t("tenant.platformStudio.forms.builder.visibility.visible")}</option>
                                      <option value="readonly">{t("tenant.platformStudio.forms.builder.visibility.readonly")}</option>
                                      <option value="hidden">{t("tenant.platformStudio.forms.builder.visibility.hidden")}</option>
                                    </Select>
                                  </div>
                                  <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
                                    <span className="tenant-web__platform-studio-form-inline-label">
                                      {t("tenant.platformStudio.forms.builder.rule.effect.required")}
                                    </span>
                                    <Switch
                                      checked={selectedNode.required ?? false}
                                      onCheckedChange={(checked) => updateDocument((currentDocument) =>
                                        updateFormBuilderNode(currentDocument, selectedNode.id, { required: checked })
                                      )}
                                      size="sm"
                                    />
                                  </div>
                                  {selectedFieldIsChoice ? (
                                    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                        <span>{t(getFieldTypeKey(selectedField))}</span>
                                      </div>

                                      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                        <span>{t("tenant.platformStudio.forms.builder.fieldSettings.options")}</span>
                                      </div>

                                      {(selectedField.options ?? []).length === 0 ? (
                                        <p className="tenant-web__platform-studio-inline-help">
                                          {t("tenant.platformStudio.forms.builder.fieldSettings.emptyOptions")}
                                        </p>
                                      ) : (
                                        <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                          {(selectedField.options ?? []).map((option, optionIndex) => (
                                            <ChoiceOptionRow
                                              canEdit={workspaceAccess.canEditSettings && canEditModelDefinition}
                                              canMoveItems={workspaceAccess.canEditSettings && canEditModelDefinition && (selectedField.options?.length ?? 0) > 1}
                                              dragOverOptionIndex={dragOverChoiceOptionIndex}
                                              draggedOptionIndex={draggedChoiceOptionIndex}
                                              index={optionIndex}
                                              key={`${selectedField.id}-option-${optionIndex}`}
                                              onChangeValue={(nextValue) => renameSelectedFieldOption(optionIndex, nextValue)}
                                              onDragEnd={() => {
                                                setDraggedChoiceOptionIndex(null);
                                                setDragOverChoiceOptionIndex(null);
                                              }}
                                              onDragOverOption={() => {
                                                setDragOverChoiceOptionIndex(optionIndex);
                                              }}
                                              onDragStartOption={() => {
                                                setDraggedChoiceOptionIndex(optionIndex);
                                                setDragOverChoiceOptionIndex(optionIndex);
                                              }}
                                              onDropOption={() => {
                                                if (draggedChoiceOptionIndex === null || draggedChoiceOptionIndex === optionIndex) {
                                                  setDragOverChoiceOptionIndex(null);
                                                  return;
                                                }

                                                reorderSelectedFieldOption(draggedChoiceOptionIndex, optionIndex);
                                                setDraggedChoiceOptionIndex(null);
                                                setDragOverChoiceOptionIndex(null);
                                              }}
                                              onRemove={() => updateSelectedFieldOptions((options) =>
                                                options.filter((_, currentIndex) => currentIndex !== optionIndex)
                                              )}
                                              t={t}
                                              value={option}
                                            />
                                          ))}
                                        </div>
                                      )}

                                      <div className="tenant-web__platform-studio-button-row">
                                        <Button
                                          disabled={!workspaceAccess.canEditSettings || !canEditModelDefinition}
                                          onClick={() => updateSelectedFieldOptions((options) => [
                                            ...options,
                                            `${t("tenant.platformStudio.forms.builder.fieldSettings.newOption")} ${options.length + 1}`,
                                          ])}
                                          size="sm"
                                          variant="secondary"
                                        >
                                          {t("tenant.platformStudio.forms.builder.fieldSettings.addOption")}
                                        </Button>
                                      </div>

                                      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                        <span>{t("tenant.platformStudio.forms.builder.fieldSettings.display")}</span>
                                      </div>

                                      <div className="tenant-web__platform-studio-sort-row">
                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-choice-render-style">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.renderStyle")}
                                          </Label>
                                          <Select
                                            id="tenant-platform-studio-choice-render-style"
                                            onChange={(event) => updateSelectedFieldChoiceDisplay((choiceDisplay) => ({
                                              ...choiceDisplay,
                                              renderStyle: event.target.value as "buttons" | "native",
                                            }))}
                                            value={selectedField.choiceDisplay?.renderStyle ?? "native"}
                                          >
                                            <option value="native">{t("tenant.platformStudio.forms.builder.fieldSettings.renderStyleNative")}</option>
                                            <option value="buttons">{t("tenant.platformStudio.forms.builder.fieldSettings.renderStyleButtons")}</option>
                                          </Select>
                                        </div>

                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-choice-orientation">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.orientation")}
                                          </Label>
                                          <Select
                                            id="tenant-platform-studio-choice-orientation"
                                            onChange={(event) => updateSelectedFieldChoiceDisplay((choiceDisplay) => ({
                                              ...choiceDisplay,
                                              orientation: event.target.value as FormsPlaceholderChoiceOrientation,
                                            }))}
                                            value={selectedField.choiceDisplay?.orientation ?? "vertical"}
                                          >
                                            <option value="vertical">{t("tenant.platformStudio.forms.builder.fieldSettings.orientationVertical")}</option>
                                            <option value="horizontal">{t("tenant.platformStudio.forms.builder.fieldSettings.orientationHorizontal")}</option>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                        <span>{t("tenant.platformStudio.forms.builder.fieldSettings.selection")}</span>
                                      </div>

                                      {selectedField.kind === "single_select" ? (
                                        <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
                                          <span className="tenant-web__platform-studio-form-inline-label">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.allowEmpty")}
                                          </span>
                                          <Switch
                                            checked={selectedField.choiceDisplay?.allowEmpty ?? false}
                                            onCheckedChange={(checked) => updateSelectedFieldChoiceDisplay((choiceDisplay) => ({
                                              ...choiceDisplay,
                                              allowEmpty: checked,
                                            }))}
                                            size="sm"
                                          />
                                        </div>
                                      ) : (
                                        <div className="tenant-web__platform-studio-sort-row">
                                          <div className="tenant-web__platform-studio-form-group">
                                            <Label htmlFor="tenant-platform-studio-choice-min-selections">
                                              {t("tenant.platformStudio.forms.builder.fieldSettings.minSelections")}
                                            </Label>
                                            <Input
                                              id="tenant-platform-studio-choice-min-selections"
                                              min={0}
                                              onChange={(event) => updateSelectedFieldChoiceDisplay((choiceDisplay) => ({
                                                ...choiceDisplay,
                                                minSelections: Math.max(0, Number(event.target.value) || 0),
                                              }))}
                                              type="number"
                                              value={selectedField.choiceDisplay?.minSelections ?? 0}
                                            />
                                          </div>
                                          <div className="tenant-web__platform-studio-form-group">
                                            <Label htmlFor="tenant-platform-studio-choice-max-selections">
                                              {t("tenant.platformStudio.forms.builder.fieldSettings.maxSelections")}
                                            </Label>
                                            <Input
                                              id="tenant-platform-studio-choice-max-selections"
                                              min={0}
                                              onChange={(event) => updateSelectedFieldChoiceDisplay((choiceDisplay) => {
                                                const rawValue = event.target.value.trim();
                                                return {
                                                  ...choiceDisplay,
                                                  maxSelections: rawValue ? Math.max(0, Number(rawValue) || 0) : undefined,
                                                };
                                              })}
                                              type="number"
                                              value={selectedField.choiceDisplay?.maxSelections ?? ""}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {selectedField.choiceDisplay?.renderStyle === "buttons" && (selectedField.options?.length ?? 0) > 0 ? (
                                        <>
                                          <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                            <span>{t("tenant.platformStudio.forms.builder.fieldSettings.buttonStyles")}</span>
                                          </div>

                                          <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                            {selectedField.options?.map((option) => {
                                              const optionStyle = getChoiceOptionStyle(selectedField.choiceDisplay, option);

                                              return (
                                                <div className="tenant-web__platform-studio-compact-row tenant-web__platform-studio-choice-style-row" key={`choice-style-${option}`}>
                                                  <div className="tenant-web__platform-studio-compact-row-main">
                                                    <span className="tenant-web__platform-studio-compact-row-label">{option}</span>
                                                  </div>

                                                  <div className="tenant-web__platform-studio-choice-style-controls">
                                                    <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                                                      <Label htmlFor={`tenant-platform-studio-choice-background-${option}`}>
                                                        {t("tenant.platformStudio.forms.builder.fieldSettings.backgroundColor")}
                                                      </Label>
                                                      <Input
                                                        id={`tenant-platform-studio-choice-background-${option}`}
                                                        onChange={(event) => updateSelectedFieldChoiceStyle(option, (currentStyle) => ({
                                                          ...(currentStyle ?? { option }),
                                                          backgroundColor: normalizeHexColor(event.target.value) || undefined,
                                                          option,
                                                        }))}
                                                        type="color"
                                                        value={optionStyle?.backgroundColor ?? "#000000"}
                                                      />
                                                    </div>
                                                    <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                                                      <Label htmlFor={`tenant-platform-studio-choice-text-${option}`}>
                                                        {t("tenant.platformStudio.forms.builder.fieldSettings.textColor")}
                                                      </Label>
                                                      <Input
                                                        id={`tenant-platform-studio-choice-text-${option}`}
                                                        onChange={(event) => updateSelectedFieldChoiceStyle(option, (currentStyle) => ({
                                                          ...(currentStyle ?? { option }),
                                                          option,
                                                          textColor: normalizeHexColor(event.target.value) || undefined,
                                                        }))}
                                                        type="color"
                                                        value={optionStyle?.textColor ?? "#ffffff"}
                                                      />
                                                    </div>
                                                    <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                                                      <Label htmlFor={`tenant-platform-studio-choice-border-${option}`}>
                                                        {t("tenant.platformStudio.forms.builder.fieldSettings.borderColor")}
                                                      </Label>
                                                      <Input
                                                        id={`tenant-platform-studio-choice-border-${option}`}
                                                        onChange={(event) => updateSelectedFieldChoiceStyle(option, (currentStyle) => ({
                                                          ...(currentStyle ?? { option }),
                                                          borderColor: normalizeHexColor(event.target.value) || undefined,
                                                          option,
                                                        }))}
                                                        type="color"
                                                        value={optionStyle?.borderColor ?? "#000000"}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {selectedFieldIsLookup ? (
                                    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                        <span>{t(getFieldTypeKey(selectedField))}</span>
                                      </div>

                                      {selectedFieldIsPresetLookup && selectedLookupSourceSummary ? (
                                        <div className="tenant-web__platform-studio-compact-row">
                                          <div className="tenant-web__platform-studio-compact-row-main">
                                            <span className="tenant-web__platform-studio-compact-row-label">
                                              {selectedLookupSourceSummary.label}
                                            </span>
                                            <span className="tenant-web__platform-studio-compact-row-summary">
                                              {selectedLookupSourceSummary.summary}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                            <div className="tenant-web__platform-studio-compact-row">
                                              <div className="tenant-web__platform-studio-compact-row-main">
                                                <span className="tenant-web__platform-studio-compact-row-label">
                                                  {t("tenant.platformStudio.forms.builder.fieldSettings.sourceModel")}
                                                </span>
                                                <span className="tenant-web__platform-studio-compact-row-summary">
                                                  {selectedGenericLookupSourceModel?.label
                                                    ?? selectedField.sourceLabel
                                                    ?? t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending")}
                                                </span>
                                              </div>
                                            </div>

                                            {!selectedFieldIsLookupValue ? (
                                              <div className="tenant-web__platform-studio-compact-row">
                                                <div className="tenant-web__platform-studio-compact-row-main">
                                                  <span className="tenant-web__platform-studio-compact-row-label">
                                                    {t("tenant.platformStudio.forms.builder.fieldSettings.storedValueField")}
                                                  </span>
                                                  <span className="tenant-web__platform-studio-compact-row-summary">
                                                    {getLookupModelFieldLabel(
                                                      selectedGenericLookupSourceModel,
                                                      selectedField.lookupConfig?.storedValueField,
                                                    ) || t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending")}
                                                  </span>
                                                </div>
                                              </div>
                                            ) : null}

                                            <div className="tenant-web__platform-studio-compact-row">
                                              <div className="tenant-web__platform-studio-compact-row-main">
                                                <span className="tenant-web__platform-studio-compact-row-label">
                                                  {selectedLookupStoredValueSummary?.label
                                                    ?? t("tenant.platformStudio.forms.builder.fieldSettings.displayFields")}
                                                </span>
                                                <span className="tenant-web__platform-studio-compact-row-summary">
                                                  {selectedLookupStoredValueSummary?.summary
                                                    ?? t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields")}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="tenant-web__platform-studio-compact-row">
                                              <div className="tenant-web__platform-studio-compact-row-main">
                                                <span className="tenant-web__platform-studio-compact-row-label">
                                                  {selectedLookupSortFieldSummary?.label
                                                    ?? t("tenant.platformStudio.forms.builder.fieldSettings.sortBy")}
                                                </span>
                                                <span className="tenant-web__platform-studio-compact-row-summary">
                                                  {selectedLookupSortFieldSummary?.summary
                                                    ?? t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending")}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="tenant-web__platform-studio-button-row">
                                            <Button
                                              disabled={!workspaceAccess.canEditSettings || !canEditModelDefinition}
                                              onClick={openLookupSourcePicker}
                                              size="sm"
                                              variant="secondary"
                                            >
                                              {t("tenant.platformStudio.forms.builder.fieldSettings.chooseSource")}
                                            </Button>
                                          </div>
                                        </>
                                      )}

                                      {selectedFieldShowsLookupDisplayMode ? (
                                        <>
                                          <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                            <span>{t("tenant.platformStudio.forms.builder.fieldSettings.display")}</span>
                                          </div>

                                          <div className="tenant-web__platform-studio-form-group">
                                            <Label htmlFor="tenant-platform-studio-lookup-display-mode">
                                              {t("tenant.platformStudio.forms.builder.fieldSettings.displayMode")}
                                            </Label>
                                            <Select
                                              id="tenant-platform-studio-lookup-display-mode"
                                              onChange={(event) => updateSelectedFieldLookupConfig((lookupConfig) => ({
                                                ...lookupConfig,
                                                displayMode: event.target.value as FormsPlaceholderLookupDisplayMode,
                                              }))}
                                              value={selectedField.lookupConfig?.displayMode ?? "search_select"}
                                            >
                                              <option value="search_select">{t("tenant.platformStudio.forms.builder.fieldSettings.displayModeSearchSelect")}</option>
                                              <option value="catalog_modal">{t("tenant.platformStudio.forms.builder.fieldSettings.displayModeCatalogModal")}</option>
                                            </Select>
                                          </div>
                                        </>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {selectedFieldSupportsTextInputSettings ? (
                                    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                        <span>{t(getFieldTypeKey(selectedField))}</span>
                                      </div>

                                      <div className="tenant-web__platform-studio-sort-row">
                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-preset-placeholder">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.placeholder")}
                                          </Label>
                                          <Input
                                            id="tenant-platform-studio-preset-placeholder"
                                            onChange={(event) => updateSelectedField((field) => ({
                                              ...field,
                                              placeholder: event.target.value || undefined,
                                            }))}
                                            value={selectedField.placeholder ?? ""}
                                          />
                                        </div>
                                      </div>

                                      <div className="tenant-web__platform-studio-sort-row">
                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-preset-mask">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.mask")}
                                          </Label>
                                          <Input
                                            id="tenant-platform-studio-preset-mask"
                                            onChange={(event) => updateSelectedField((field) => ({
                                              ...field,
                                              mask: event.target.value || undefined,
                                            }))}
                                            value={selectedField.mask ?? ""}
                                          />
                                        </div>
                                        {selectedFieldSupportsTextPreset ? (
                                          <div className="tenant-web__platform-studio-form-group">
                                            <Label htmlFor="tenant-platform-studio-preset-validation">
                                              {t("tenant.platformStudio.forms.builder.fieldSettings.validation")}
                                            </Label>
                                            <Select
                                              id="tenant-platform-studio-preset-validation"
                                              onChange={(event) => updateSelectedField((field) => ({
                                                ...field,
                                                validation: (event.target.value || undefined) as FormsPlaceholderFieldValidation | undefined,
                                              }))}
                                              value={selectedField.validation ?? ""}
                                            >
                                              <option value="">{t("tenant.platformStudio.forms.builder.systemField.unbound")}</option>
                                              <option value="email">{t("tenant.platformStudio.forms.builder.fieldSettings.validationEmail")}</option>
                                              <option value="phone">{t("tenant.platformStudio.forms.builder.fieldSettings.validationPhone")}</option>
                                              <option value="url">{t("tenant.platformStudio.forms.builder.fieldSettings.validationUrl")}</option>
                                            </Select>
                                          </div>
                                        ) : null}
                                      </div>

                                      <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
                                        <span className="tenant-web__platform-studio-form-inline-label">
                                          {t("tenant.platformStudio.forms.builder.fieldSettings.autocomplete")}
                                        </span>
                                        <Switch
                                          checked={selectedFieldAutocompleteChecked}
                                          onCheckedChange={(checked) => updateSelectedField((field) => ({
                                            ...field,
                                            autocomplete: checked ? selectedFieldDefaultAutocompleteValue : "off",
                                          }))}
                                          size="sm"
                                        />
                                      </div>
                                    </div>
                                  ) : null}

                                  {selectedFieldIsDateToday ? (
                                    <div className="tenant-web__platform-studio-filter-group">
                                      <p className="tenant-web__platform-studio-filter-group-title">
                                        {t("tenant.platformStudio.forms.builder.fieldSettings.dateToday")}
                                      </p>
                                      <div className="tenant-web__platform-studio-sort-row">
                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-date-today-default">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.defaultValueMode")}
                                          </Label>
                                          <Input
                                            disabled
                                            id="tenant-platform-studio-date-today-default"
                                            value={t("tenant.platformStudio.forms.builder.fieldSettings.defaultValueToday")}
                                          />
                                        </div>
                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-date-today-format">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.displayFormat")}
                                          </Label>
                                          <Input
                                            id="tenant-platform-studio-date-today-format"
                                            onChange={(event) => updateSelectedField((field) => ({
                                              ...field,
                                              displayFormat: event.target.value || undefined,
                                            }))}
                                            value={selectedField.displayFormat ?? ""}
                                          />
                                        </div>
                                      </div>
                                      <div className="tenant-web__platform-studio-switch-row">
                                        <span className="tenant-web__platform-studio-compact-row-label">
                                          {t("tenant.platformStudio.forms.builder.visibility.readonly")}
                                        </span>
                                        <Switch
                                          checked={selectedField.readonly ?? false}
                                          onCheckedChange={(checked) => updateSelectedField((field) => ({
                                            ...field,
                                            readonly: checked,
                                          }))}
                                          size="sm"
                                        />
                                      </div>
                                    </div>
                                  ) : null}

                                  {selectedFieldIsTags ? (
                                    <div className="tenant-web__platform-studio-filter-group">
                                      <p className="tenant-web__platform-studio-filter-group-title">
                                        {t("tenant.platformStudio.forms.builder.fieldSettings.tags")}
                                      </p>
                                      <div className="tenant-web__platform-studio-sort-row">
                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-tags-mode">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.tagMode")}
                                          </Label>
                                          <Select
                                            id="tenant-platform-studio-tags-mode"
                                            onChange={(event) => updateSelectedField((field) => ({
                                              ...field,
                                              tagMode: event.target.value as FormsPlaceholderTagMode,
                                            }))}
                                            value={selectedField.tagMode ?? "select_or_create"}
                                          >
                                            <option value="select_existing">{t("tenant.platformStudio.forms.builder.fieldSettings.tagModeSelectExisting")}</option>
                                            <option value="select_or_create">{t("tenant.platformStudio.forms.builder.fieldSettings.tagModeSelectOrCreate")}</option>
                                            <option value="create_only">{t("tenant.platformStudio.forms.builder.fieldSettings.tagModeCreateOnly")}</option>
                                          </Select>
                                        </div>
                                        <div className="tenant-web__platform-studio-form-group">
                                          <Label htmlFor="tenant-platform-studio-tags-max">
                                            {t("tenant.platformStudio.forms.builder.fieldSettings.maxTags")}
                                          </Label>
                                          <Input
                                            id="tenant-platform-studio-tags-max"
                                            min={0}
                                            onChange={(event) => updateSelectedField((field) => ({
                                              ...field,
                                              maxTags: event.target.value.trim()
                                                ? Math.max(0, Number(event.target.value) || 0)
                                                : undefined,
                                            }))}
                                            type="number"
                                            value={selectedField.maxTags ?? ""}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ) : null}
                                </>
                              ) : selectedNode.type === "view_only_field" ? (
                                <>
                                  <div className="tenant-web__platform-studio-form-group">
                                    <Label htmlFor="tenant-platform-studio-node-title">
                                      {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                    </Label>
                                    <Input
                                      id="tenant-platform-studio-node-title"
                                      onChange={(event) => updateDocument((currentDocument) =>
                                        updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                      )}
                                      value={selectedNode.title ?? ""}
                                    />
                                  </div>

                                  <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                    <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                      <span>{t("tenant.platformStudio.forms.builder.nodeType.view_only_field")}</span>
                                    </div>

                                    <div className="tenant-web__platform-studio-form-group">
                                      <Label htmlFor="tenant-platform-studio-view-only-binding">
                                        {t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBinding")}
                                      </Label>
                                      <Select
                                        id="tenant-platform-studio-view-only-binding"
                                        onChange={(event) => {
                                          const nextOption = selectedViewOnlyBindingOptions.find((option) => option.bindingId === event.target.value) ?? null;
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
                                        value={selectedViewOnlyBindingOption?.bindingId ?? ""}
                                      >
                                        <option value="">{t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBindingPending")}</option>
                                        {selectedViewOnlyBindingOptions.map((option) => (
                                          <option key={option.bindingId} value={option.bindingId}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>

                                    {selectedViewOnlyBindingOptions.length === 0 ? (
                                      <p className="tenant-web__platform-studio-inline-help">
                                        {t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBindingEmpty")}
                                      </p>
                                    ) : null}
                                  </div>
                                </>
                              ) : selectedNode.type === "text" ? (
                                <>
                                  <div className="tenant-web__platform-studio-form-group">
                                    <Label htmlFor="tenant-platform-studio-node-title">
                                      {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                    </Label>
                                    <Input
                                      id="tenant-platform-studio-node-title"
                                      onChange={(event) => updateDocument((currentDocument) =>
                                        updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                      )}
                                      value={selectedNode.title ?? ""}
                                    />
                                  </div>
                                  <div className="tenant-web__platform-studio-form-group">
                                    <Label htmlFor="tenant-platform-studio-node-text">
                                      {t("tenant.platformStudio.forms.builder.nodeTextLabel")}
                                    </Label>
                                    <Textarea
                                      id="tenant-platform-studio-node-text"
                                      onChange={(event) => updateDocument((currentDocument) =>
                                        updateFormBuilderNode(currentDocument, selectedNode.id, { text: event.target.value })
                                      )}
                                      rows={5}
                                      value={selectedNode.text ?? ""}
                                    />
                                  </div>
                                </>
                              ) : selectedNode.type === "rich_text" ? (
                                <>
                                  <div className="tenant-web__platform-studio-form-group">
                                    <Label htmlFor="tenant-platform-studio-node-title">
                                      {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                    </Label>
                                    <Input
                                      id="tenant-platform-studio-node-title"
                                      onChange={(event) => updateDocument((currentDocument) =>
                                        updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                      )}
                                      value={selectedNode.title ?? ""}
                                    />
                                  </div>
                                  <div className="tenant-web__platform-studio-form-group">
                                    <Label htmlFor="tenant-platform-studio-node-rich-text">
                                      {t("tenant.platformStudio.forms.builder.nodeTextLabel")}
                                    </Label>
                                    <RichTextEditor
                                      aria-label={t("tenant.platformStudio.forms.builder.nodeTextLabel")}
                                      id="tenant-platform-studio-node-rich-text"
                                      onChange={(value) => updateDocument((currentDocument) =>
                                        updateFormBuilderNode(currentDocument, selectedNode.id, { text: value })
                                      )}
                                      value={selectedNode.text ?? ""}
                                    />
                                  </div>
                                </>
                              ) : selectedNode.type === "divider" || selectedNode.type === "spacer" ? (
                                <p className="tenant-web__platform-studio-inline-help">
                                  {t("tenant.platformStudio.forms.builder.noAdvancedSettings")}
                                </p>
                              ) : (
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-node-title">
                                    {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                  </Label>
                                  <Input
                                    id="tenant-platform-studio-node-title"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                    )}
                                    value={selectedNode.title ?? ""}
                                  />
                                </div>
                              )}

                              {selectedNode.type !== "divider" && selectedNode.type !== "field" ? (
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-node-visibility">
                                    {t("tenant.platformStudio.forms.builder.nodeVisibilityLabel")}
                                  </Label>
                                  <Select
                                    id="tenant-platform-studio-node-visibility"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, {
                                        visibility: event.target.value as FormBuilderNode["visibility"],
                                      })
                                    )}
                                    value={selectedNode.visibility}
                                  >
                                    <option value="visible">{t("tenant.platformStudio.forms.builder.visibility.visible")}</option>
                                    <option value="readonly">{t("tenant.platformStudio.forms.builder.visibility.readonly")}</option>
                                    <option value="hidden">{t("tenant.platformStudio.forms.builder.visibility.hidden")}</option>
                                  </Select>
                                </div>
                              ) : null}

                              {!structureEditingAccess.canRemoveItems ? (
                                <p className="tenant-web__platform-studio-inline-help">
                                  {t(structureEditingAccess.lockReasonKey ?? "tenant.platformStudio.forms.builder.lockedStructureHint")}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="tenant-web__platform-studio-inline-help">
                              {t(access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly")}
                            </p>
                          )}
                        </div>

                        {selectedNodeSupportsRules ? (
                          <div className="tenant-web__platform-studio-inspector-section">
                            {!workspaceAccess.canEditSettings ? (
                              <p className="tenant-web__platform-studio-inline-help">
                                {t(access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly")}
                              </p>
                            ) : (
                              <div className="tenant-web__platform-studio-builder-stack">
                                <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                  <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                    <span>{t("tenant.platformStudio.forms.builder.rule.visibilityRules")}</span>
                                  </div>
                                  {(selectedNode.rules?.visibilityRules ?? []).length === 0 ? (
                                    <p className="tenant-web__platform-studio-inline-help">
                                      {selectedNodeRuleFields.length === 0
                                        ? t("tenant.platformStudio.forms.builder.rule.noScopeFields")
                                        : t("tenant.platformStudio.forms.builder.rule.emptyVisibilityRules")}
                                    </p>
                                  ) : (
                                    (selectedNode.rules?.visibilityRules ?? []).map((rule, ruleIndex) => (
                                      <div className="tenant-web__platform-studio-compact-row" key={rule.id}>
                                        <div className="tenant-web__platform-studio-compact-row-main">
                                          <span className="tenant-web__platform-studio-compact-row-label">
                                            {t(`tenant.platformStudio.forms.builder.rule.effect.${rule.effect}`)}
                                          </span>
                                          <span className="tenant-web__platform-studio-compact-row-summary">
                                            {getRuleSummary(rule, selectedNodeRuleFields, t)}
                                          </span>
                                        </div>

                                        <Menu align="end">
                                          <MenuTrigger>
                                            <button
                                              aria-label={t("tenant.platformStudio.forms.builder.rule.actionsMenu")}
                                              className="tenant-web__platform-studio-menu-trigger tenant-web__platform-studio-menu-trigger--compact"
                                              type="button"
                                            >
                                              <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">⋮</span>
                                            </button>
                                          </MenuTrigger>
                                          <MenuContent className="tenant-web__platform-studio-menu">
                                            <MenuItem onClick={() => openVisibilityRuleEditor(ruleIndex)}>
                                              {t("tenant.platformStudio.forms.builder.filter.editFilter")}
                                            </MenuItem>
                                            <MenuItem
                                              onClick={() => updateVisibilityRules((rules) =>
                                                rules.filter((_, entryIndex) => entryIndex !== ruleIndex)
                                              )}
                                              tone="danger"
                                            >
                                              {t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
                                            </MenuItem>
                                          </MenuContent>
                                        </Menu>
                                      </div>
                                    ))
                                  )}
                                  <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--compact">
                                    <Button
                                      disabled={selectedNodeRuleFields.length === 0}
                                      onClick={() => openVisibilityRuleEditor(null)}
                                      size="sm"
                                      variant="secondary"
                                    >
                                      {t("tenant.platformStudio.forms.builder.rule.addVisibilityRule")}
                                    </Button>
                                  </div>
                                </div>

                                {selectedNode.type === "field" ? (
                                  <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                                    <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
                                      <span>{t("tenant.platformStudio.forms.builder.rule.requirementRules")}</span>
                                    </div>
                                    {(selectedNode.rules?.requirementRules ?? []).length === 0 ? (
                                      <p className="tenant-web__platform-studio-inline-help">
                                        {selectedNodeRuleFields.length === 0
                                          ? t("tenant.platformStudio.forms.builder.rule.noScopeFields")
                                          : t("tenant.platformStudio.forms.builder.rule.emptyRequirementRules")}
                                      </p>
                                    ) : (
                                      (selectedNode.rules?.requirementRules ?? []).map((rule, ruleIndex) => (
                                        <div className="tenant-web__platform-studio-compact-row" key={rule.id}>
                                          <div className="tenant-web__platform-studio-compact-row-main">
                                            <span className="tenant-web__platform-studio-compact-row-label">
                                              {t(`tenant.platformStudio.forms.builder.rule.effect.${rule.effect}`)}
                                            </span>
                                            <span className="tenant-web__platform-studio-compact-row-summary">
                                              {getRuleSummary(rule, selectedNodeRuleFields, t)}
                                            </span>
                                          </div>

                                          <Menu align="end">
                                            <MenuTrigger>
                                              <button
                                                aria-label={t("tenant.platformStudio.forms.builder.rule.actionsMenu")}
                                                className="tenant-web__platform-studio-menu-trigger tenant-web__platform-studio-menu-trigger--compact"
                                                type="button"
                                              >
                                                <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">⋮</span>
                                              </button>
                                            </MenuTrigger>
                                            <MenuContent className="tenant-web__platform-studio-menu">
                                              <MenuItem onClick={() => openRequirementRuleEditor(ruleIndex)}>
                                                {t("tenant.platformStudio.forms.builder.filter.editFilter")}
                                              </MenuItem>
                                              <MenuItem
                                                onClick={() => updateRequirementRules((rules) =>
                                                  rules.filter((_, entryIndex) => entryIndex !== ruleIndex)
                                                )}
                                                tone="danger"
                                              >
                                                {t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
                                              </MenuItem>
                                            </MenuContent>
                                          </Menu>
                                        </div>
                                      ))
                                    )}
                                    <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--compact">
                                      <Button
                                        disabled={selectedNodeRuleFields.length === 0}
                                        onClick={() => openRequirementRuleEditor(null)}
                                        size="sm"
                                        variant="secondary"
                                      >
                                        {t("tenant.platformStudio.forms.builder.rule.addRequirementRule")}
                                      </Button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ) : null}

                        {structureEditingAccess.canRemoveItems ? (
                          <div className="tenant-web__platform-studio-inspector-section">
                            <div className="tenant-web__platform-studio-danger-zone">
                              <Button
                                onClick={() => setDeleteNodeOpen(true)}
                                variant="danger"
                              >
                                {t("tenant.platformStudio.forms.builder.deleteNode")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                        <p className="tenant-web__platform-studio-empty-title">
                          {t("tenant.platformStudio.forms.builder.selectionEmptyTitle")}
                        </p>
                        <p>{t("tenant.platformStudio.forms.builder.selectionEmptyDescription")}</p>
                      </div>
                    )}
                  </TabsPanel>

                  <TabsPanel value="grid">
                    <div className="tenant-web__platform-studio-builder-stack">
                      <div className="tenant-web__platform-studio-inspector-section">
                        <div className="tenant-web__platform-studio-inspector-head">
                          <div>
                            <p className="tenant-web__platform-studio-inspector-title">
                              {t(
                                isSubformGridScope
                                  ? "tenant.platformStudio.forms.builder.grid.subtable"
                                  : "tenant.platformStudio.forms.builder.grid.mainTable",
                              )}
                            </p>
                            <p className="tenant-web__platform-studio-inspector-meta">
                              {isSubformGridScope
                                ? (currentScopeSubformNode?.title ?? t("tenant.platformStudio.forms.builder.nodeType.subform"))
                                : currentDraftViewTitle}
                            </p>
                          </div>
                        </div>

                        <div className="tenant-web__platform-studio-builder-stack">
                          {isChecklistGridScope ? (
                            <p className="tenant-web__platform-studio-inline-help">
                              {t("tenant.platformStudio.forms.builder.grid.checklistUnsupported")}
                            </p>
                          ) : currentGridScopeTargets.length === 0 ? (
                            <p className="tenant-web__platform-studio-inline-help">
                              {t("tenant.platformStudio.forms.builder.grid.noFields")}
                            </p>
                          ) : (
                            <div className="tenant-web__platform-studio-builder-stack">
                              {sortedCurrentGridScopeTargets.map((field) => {
                                const column = getGridColumnByFieldId(currentGridColumns, field.id);

                                return (
                                  <GridColumnRow
                                    canEdit={workspaceAccess.canEditSettings}
                                    canMoveItems={workspaceAccess.canEditSettings && sortedCurrentGridScopeTargets.length > 1}
                                    dragOverFieldId={dragOverGridFieldId}
                                    draggedFieldId={draggedGridFieldId}
                                    field={field}
                                    key={`grid-column-${field.id}`}
                                    onDragEnd={() => {
                                      setDraggedGridFieldId(null);
                                      setDragOverGridFieldId(null);
                                    }}
                                    onDragOverField={() => {
                                      setDragOverGridFieldId(field.id);
                                    }}
                                    onDragStartField={() => {
                                      setDraggedGridFieldId(field.id);
                                      setDragOverGridFieldId(field.id);
                                    }}
                                    onDropField={() => {
                                      if (!draggedGridFieldId || draggedGridFieldId === field.id) {
                                        return;
                                      }

                                      reorderGridColumns(draggedGridFieldId, field.id);
                                      setDraggedGridFieldId(null);
                                      setDragOverGridFieldId(null);
                                    }}
                                    onToggleVisible={(checked) => updateGridColumnVisibility(field.id, checked)}
                                    t={t}
                                    visible={column?.visible ?? false}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsPanel>

                  <TabsPanel value="view">
                    <div className="tenant-web__platform-studio-builder-stack">
                      {isRootViewScope ? (
                        <>
                          <div className="tenant-web__platform-studio-inspector-section">
                            <div className="tenant-web__platform-studio-form">
                              <div className="tenant-web__platform-studio-form-group">
                                <Label htmlFor="tenant-platform-studio-view-title">
                                  {t("tenant.platformStudio.forms.builder.viewTitleLabel")}
                                </Label>
                                <Input
                                  disabled={!workspaceAccess.canEditSettings}
                                  id="tenant-platform-studio-view-title"
                                  onChange={(event) => updateDocument((currentDocument) => ({
                                    ...currentDocument,
                                    viewTitle: event.target.value,
                                  }))}
                                  value={document.viewTitle}
                                />
                              </div>

                              <div className="tenant-web__platform-studio-form-group">
                                <Label htmlFor="tenant-platform-studio-view-description">
                                  {t("tenant.platformStudio.forms.builder.viewDescriptionLabel")}
                                </Label>
                                <Textarea
                                  disabled={!workspaceAccess.canEditSettings}
                                  id="tenant-platform-studio-view-description"
                                  onChange={(event) => updateDocument((currentDocument) => ({
                                    ...currentDocument,
                                    viewDescription: event.target.value,
                                  }))}
                                  rows={5}
                                  value={document.viewDescription}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="tenant-web__platform-studio-inspector-section">
                            <div className="tenant-web__platform-studio-labeled-divider">
                              <span>{t("tenant.platformStudio.forms.builder.viewSection.authoringLocks")}</span>
                            </div>
                            <div className="tenant-web__platform-studio-builder-stack">
                              <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain">
                                <div>
                                  <p className="tenant-web__platform-studio-compact-row-label">
                                    {t("tenant.platformStudio.forms.builder.activeViewLabel")}
                                  </p>
                                  <p className="tenant-web__platform-studio-compact-row-summary">
                                    {currentView.isActive
                                      ? t("tenant.platformStudio.forms.viewActive")
                                      : t("tenant.platformStudio.forms.viewInactive")}
                                  </p>
                                </div>
                                <Switch
                                  checked={currentView.isActive}
                                  disabled={!workspaceAccess.canEditSettings}
                                  onCheckedChange={(checked) => updateCurrentViewMetadata((viewEntry) => ({
                                    ...viewEntry,
                                    isActive: checked,
                                  }))}
                                  size="sm"
                                />
                              </div>
                              {currentActor.isRoot ? (
                                <>
                                  {!isStaticModel ? (
                                    <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain">
                                      <div>
                                        <p className="tenant-web__platform-studio-compact-row-label">
                                          {t("tenant.platformStudio.forms.builder.locking.model")}
                                        </p>
                                        <p className="tenant-web__platform-studio-compact-row-summary">
                                          {currentModel.isStructureLocked
                                            ? t("tenant.platformStudio.forms.builder.locking.locked")
                                            : t("tenant.platformStudio.forms.builder.locking.unlocked")}
                                        </p>
                                      </div>
                                      <Switch
                                        checked={currentModel.isStructureLocked}
                                        disabled={!canToggleModelLocks}
                                        onCheckedChange={(checked) => updateCurrentModel((currentModelDraft) => ({
                                          ...currentModelDraft,
                                          isStructureLocked: checked,
                                        }))}
                                        size="sm"
                                      />
                                    </div>
                                  ) : null}
                                  <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain">
                                    <div>
                                      <p className="tenant-web__platform-studio-compact-row-label">
                                        {t("tenant.platformStudio.forms.builder.locking.view")}
                                      </p>
                                      <p className="tenant-web__platform-studio-compact-row-summary">
                                        {currentView.isViewLocked
                                          ? t("tenant.platformStudio.forms.builder.locking.locked")
                                          : t("tenant.platformStudio.forms.builder.locking.unlocked")}
                                      </p>
                                    </div>
                                    <Switch
                                      checked={currentView.isViewLocked ?? false}
                                      disabled={!canToggleViewLocks}
                                      onCheckedChange={(checked) => updateCurrentViewMetadata((viewEntry) => ({
                                        ...viewEntry,
                                        isViewLocked: checked,
                                      }))}
                                      size="sm"
                                    />
                                  </div>
                                  {!canToggleModelLocks ? (
                                    <p className="tenant-web__platform-studio-inline-help">
                                      {t("tenant.platformStudio.forms.builder.defaultViewStructureOnlyNotice")}
                                    </p>
                                  ) : null}
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div className="tenant-web__platform-studio-inspector-section">
                            <div className="tenant-web__platform-studio-labeled-divider">
                              <span>{t("tenant.platformStudio.forms.builder.viewSection.workflow")}</span>
                            </div>
                            <div className="tenant-web__platform-studio-builder-stack">
                              <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain">
                                <div>
                                  <p className="tenant-web__platform-studio-compact-row-label">
                                    {t("tenant.platformStudio.forms.builder.viewSettings.correctiveAction")}
                                  </p>
                                  <p className="tenant-web__platform-studio-compact-row-summary">
                                    {document.viewSettings.correctiveAction.enabled
                                      ? t("tenant.platformStudio.forms.builder.viewSettings.correctiveActionSource")
                                      : t("tenant.platformStudio.forms.builder.systemField.unbound")}
                                  </p>
                                </div>
                                <Switch
                                  checked={document.viewSettings.correctiveAction.enabled}
                                  disabled={!workspaceAccess.canEditSettings}
                                  onCheckedChange={(checked) => updateViewSettings((viewSettings) => ({
                                    ...viewSettings,
                                    correctiveAction: {
                                      ...viewSettings.correctiveAction,
                                      enabled: checked,
                                    },
                                  }))}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="tenant-web__platform-studio-inspector-section">
                            <div className="tenant-web__platform-studio-labeled-divider">
                              <span>{t("tenant.platformStudio.forms.builder.viewSection.systemFields")}</span>
                            </div>
                            <div className="tenant-web__platform-studio-builder-stack">
                              {systemFieldRoles.map((role) => {
                                const compatibleFields = getSystemFieldOptions(currentModel.fields, document, role);
                                const boundFieldId = getBoundSystemFieldIdByRole(document, role) ?? "";
                                const boundSummary = getSystemFieldBindingSummary(role, currentModel.fields, document, t);

                                return (
                                  <div className="tenant-web__platform-studio-system-field-card" key={role}>
                                    <div className="tenant-web__platform-studio-system-field-card-header">
                                      <div className="tenant-web__platform-studio-compact-row-main">
                                        <span className="tenant-web__platform-studio-compact-row-label">
                                          {t(getSystemFieldKey(role))}
                                        </span>
                                        <span className="tenant-web__platform-studio-compact-row-summary">
                                          {boundSummary}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                                      <Select
                                        aria-label={t(getSystemFieldKey(role))}
                                        disabled={!workspaceAccess.canEditSettings || !canEditModelDefinition}
                                        id={`tenant-platform-studio-system-field-${role}`}
                                        onChange={(event) => updateSystemFieldBinding(role, event.target.value)}
                                        value={boundFieldId}
                                      >
                                        <option value="">{t("tenant.platformStudio.forms.builder.systemField.unbound")}</option>
                                        {compatibleFields.map((field) => (
                                          <option key={field.id} value={field.id}>
                                            {getFieldLabelWithBoundField(field, document)}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>

                                    {compatibleFields.length === 0 ? (
                                      <p className="tenant-web__platform-studio-inline-help">
                                        {t("tenant.platformStudio.forms.builder.systemField.noCompatibleField")}
                                      </p>
                                    ) : null}

                                    {role === "workflowStatus" ? (
                                      <div className="tenant-web__platform-studio-sort-row">
                                        <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                                          <Label htmlFor="tenant-platform-studio-system-field-status-initial">
                                            {t("tenant.platformStudio.forms.builder.systemField.initialValue")}
                                          </Label>
                                          <Select
                                            disabled={!workspaceAccess.canEditSettings || !canEditModelDefinition || !document.systemFields.workflowStatus || workflowStatusOptions.length === 0}
                                            id="tenant-platform-studio-system-field-status-initial"
                                            onChange={(event) => updateWorkflowStatusOption("initialValue", event.target.value)}
                                            value={document.systemFields.workflowStatus?.initialValue ?? ""}
                                          >
                                            <option value="">{t("tenant.platformStudio.forms.builder.systemField.unbound")}</option>
                                            {workflowStatusOptions.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </Select>
                                        </div>

                                        <div className="tenant-web__platform-studio-form-group tenant-web__platform-studio-form-group--dense">
                                          <Label htmlFor="tenant-platform-studio-system-field-status-final">
                                            {t("tenant.platformStudio.forms.builder.systemField.finalValue")}
                                          </Label>
                                          <Select
                                            disabled={!workspaceAccess.canEditSettings || !canEditModelDefinition || !document.systemFields.workflowStatus || workflowStatusOptions.length === 0}
                                            id="tenant-platform-studio-system-field-status-final"
                                            onChange={(event) => updateWorkflowStatusOption("finalValue", event.target.value)}
                                            value={document.systemFields.workflowStatus?.finalValue ?? ""}
                                          >
                                            <option value="">{t("tenant.platformStudio.forms.builder.systemField.unbound")}</option>
                                            {workflowStatusOptions.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </Select>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="tenant-web__platform-studio-inspector-section">
                          <div className="tenant-web__platform-studio-inspector-header tenant-web__platform-studio-inspector-header--grid">
                            <div>
                              <p className="tenant-web__platform-studio-inspector-title">
                                {t("tenant.platformStudio.forms.builder.grid.subtable")}
                              </p>
                              <p className="tenant-web__platform-studio-inspector-meta">
                                {currentScopeViewLabel}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="tenant-web__platform-studio-inspector-section">
                        <div className="tenant-web__platform-studio-labeled-divider">
                          <span>{t("tenant.platformStudio.forms.builder.viewSection.actions")}</span>
                        </div>

                        {isRootViewScope ? (
                          <div className="tenant-web__platform-studio-switch-grid">
                            {([
                              ["canAdd", "tenant.platformStudio.forms.builder.viewSettings.action.add"],
                              ["canView", "tenant.platformStudio.forms.builder.viewSettings.action.view"],
                              ["canEdit", "tenant.platformStudio.forms.builder.viewSettings.action.edit"],
                              ["canDelete", "tenant.platformStudio.forms.builder.viewSettings.action.delete"],
                            ] as const).map(([actionKey, labelKey]) => (
                              <div className="tenant-web__platform-studio-switch-row" key={actionKey}>
                                <span className="tenant-web__platform-studio-compact-row-label">
                                  {t(labelKey)}
                                </span>
                                <Switch
                                  checked={document.viewSettings.actions[actionKey]}
                                  disabled={!workspaceAccess.canEditSettings}
                                  onCheckedChange={(checked) => updateViewSettings((viewSettings) => ({
                                    ...viewSettings,
                                    actions: {
                                      ...viewSettings.actions,
                                      [actionKey]: checked,
                                    },
                                  }))}
                                  size="sm"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="tenant-web__platform-studio-switch-grid">
                            {([
                              ["canAdd", "tenant.platformStudio.forms.builder.viewSettings.action.add"],
                              ["canEdit", "tenant.platformStudio.forms.builder.viewSettings.action.edit"],
                              ["canDelete", "tenant.platformStudio.forms.builder.viewSettings.action.delete"],
                            ] as const).map(([actionKey, labelKey]) => (
                              <div className="tenant-web__platform-studio-switch-row" key={actionKey}>
                                <span className="tenant-web__platform-studio-compact-row-label">
                                  {t(labelKey)}
                                </span>
                                <Switch
                                  checked={Boolean(currentScopeViewSettings?.actions[actionKey])}
                                  disabled={!workspaceAccess.canEditSettings}
                                  onCheckedChange={(checked) => updateCurrentScopeSubformViewSettings((viewSettings) => ({
                                    ...viewSettings,
                                    actions: {
                                      ...viewSettings.actions,
                                      [actionKey]: checked,
                                    },
                                  }))}
                                  size="sm"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="tenant-web__platform-studio-inspector-section">
                        <div className="tenant-web__platform-studio-labeled-divider">
                          <span>{t(
                            isRootViewScope
                              ? "tenant.platformStudio.forms.builder.viewSettings.sorting"
                              : "tenant.platformStudio.forms.builder.viewSettings.sortingSubtable",
                          )}</span>
                        </div>

                        <div className="tenant-web__platform-studio-builder-stack">
                          <div className="tenant-web__platform-studio-sort-row">
                            <div className="tenant-web__platform-studio-form-group">
                              <Label htmlFor="tenant-platform-studio-sort-field">
                                {t(
                                  isRootViewScope
                                    ? "tenant.platformStudio.forms.builder.viewSettings.sortField"
                                    : "tenant.platformStudio.forms.builder.viewSettings.sortFieldSubtable",
                                )}
                              </Label>
                              <Select
                                disabled={!workspaceAccess.canEditSettings}
                                id="tenant-platform-studio-sort-field"
                                onChange={(event) => {
                                  if (isRootViewScope) {
                                    updateViewSettings((viewSettings) => ({
                                      ...viewSettings,
                                      list: {
                                        ...viewSettings.list,
                                        sorting: {
                                          ...viewSettings.list.sorting,
                                          fieldId: event.target.value || undefined,
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
                                        fieldId: event.target.value || undefined,
                                      },
                                    },
                                  }));
                                }}
                                value={isRootViewScope
                                  ? (document.viewSettings.list.sorting.fieldId ?? "")
                                  : (currentScopeViewSettings?.list.sorting.fieldId ?? "")}
                              >
                                <option value="">{t("tenant.platformStudio.forms.builder.systemField.unbound")}</option>
                                {currentScopeSortingFields.map((field) => (
                                  <option key={field.id} value={field.id}>
                                    {field.label}
                                  </option>
                                ))}
                              </Select>
                            </div>

                            <div className="tenant-web__platform-studio-form-group">
                              <Label htmlFor="tenant-platform-studio-sort-direction">
                                {t("tenant.platformStudio.forms.builder.viewSettings.sortDirection")}
                              </Label>
                              <Select
                                disabled={!workspaceAccess.canEditSettings}
                                id="tenant-platform-studio-sort-direction"
                                onChange={(event) => {
                                  if (isRootViewScope) {
                                    updateViewSettings((viewSettings) => ({
                                      ...viewSettings,
                                      list: {
                                        ...viewSettings.list,
                                        sorting: {
                                          ...viewSettings.list.sorting,
                                          direction: event.target.value === "desc" ? "desc" : "asc",
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
                                        direction: event.target.value === "desc" ? "desc" : "asc",
                                      },
                                    },
                                  }));
                                }}
                                value={isRootViewScope
                                  ? document.viewSettings.list.sorting.direction
                                  : (currentScopeViewSettings?.list.sorting.direction ?? "asc")}
                              >
                                <option value="asc">{t("tenant.platformStudio.forms.builder.viewSettings.sortDirectionAsc")}</option>
                                <option value="desc">{t("tenant.platformStudio.forms.builder.viewSettings.sortDirectionDesc")}</option>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isRootViewScope ? (
                        <div className="tenant-web__platform-studio-inspector-section">
                          <div className="tenant-web__platform-studio-labeled-divider">
                            <span>{t("tenant.platformStudio.forms.builder.viewSection.filters")}</span>
                          </div>
                          <div className="tenant-web__platform-studio-builder-stack">
                            <div className="tenant-web__platform-studio-filter-group">
                              <div className="tenant-web__platform-studio-sort-row">
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-default-filter-field">
                                    {t("tenant.platformStudio.forms.builder.filter.fieldLabel")}
                                  </Label>
                                  <Select
                                    disabled={!workspaceAccess.canEditSettings || currentViewFilterTargets.length === 0}
                                    id="tenant-platform-studio-default-filter-field"
                                    onChange={(event) => setPendingDefaultFilterFieldId(event.target.value)}
                                    value={pendingDefaultFilterFieldId}
                                  >
                                    {currentViewFilterTargets.map((field) => (
                                      <option key={field.id} value={field.id}>
                                        {field.label}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
                                  <Button
                                    disabled={!workspaceAccess.canEditSettings || currentViewFilterTargets.length === 0}
                                    onClick={addDefaultFilterCondition}
                                    size="sm"
                                    variant="secondary"
                                  >
                                    {t("tenant.platformStudio.forms.builder.filter.addFilter")}
                                  </Button>
                                </div>
                              </div>
                              {currentScopeFilterDefinitions.defaultFilters.conditions.length === 0 ? (
                                <p className="tenant-web__platform-studio-inline-help">
                                  {t("tenant.platformStudio.forms.builder.filter.emptyDefaultFilters")}
                                </p>
                              ) : (
                                currentScopeFilterDefinitions.defaultFilters.conditions.map((condition, index) => (
                                  <div className="tenant-web__platform-studio-compact-row" key={`default-filter-${index}`}>
                                    <div className="tenant-web__platform-studio-compact-row-main">
                                      <span className="tenant-web__platform-studio-compact-row-label">
                                        {getFieldById(currentViewFilterTargets, condition.fieldId)?.label ?? t("tenant.platformStudio.forms.builder.filter.fieldLabel")}
                                      </span>
                                      <span className="tenant-web__platform-studio-compact-row-summary">
                                        {getFilterConditionSummary(condition, currentViewFilterTargets, t)}
                                      </span>
                                    </div>
                                    <Menu align="end">
                                      <MenuTrigger>
                                        <button
                                          aria-label={t("tenant.platformStudio.forms.builder.rule.actionsMenu")}
                                          className="tenant-web__platform-studio-menu-trigger tenant-web__platform-studio-menu-trigger--compact"
                                          type="button"
                                        >
                                          <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">⋮</span>
                                        </button>
                                      </MenuTrigger>
                                      <MenuContent className="tenant-web__platform-studio-menu">
                                        <MenuItem onClick={() => openDefaultFilterEditor(index)}>
                                          {t("tenant.platformStudio.forms.builder.filter.editFilter")}
                                        </MenuItem>
                                        <MenuItem
                                          onClick={() => updateDefaultFilters((conditions) =>
                                            conditions.filter((_, entryIndex) => entryIndex !== index)
                                          )}
                                          tone="danger"
                                        >
                                          {t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
                                        </MenuItem>
                                      </MenuContent>
                                    </Menu>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </TabsPanel>
                </div>
              </PlatformStudioPanelScroll>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <AlertDialog onOpenChange={setDeleteNodeOpen} open={deleteNodeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformStudio.forms.builder.confirmDeleteNode", { title: selectedNodeLabel })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tenant.platformStudio.forms.builder.confirmDeleteNodeDescription", { title: selectedNodeLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tenant.platformStudio.forms.cancelDelete")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
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
              variant="danger"
            >
              {t("tenant.platformStudio.forms.builder.deleteNode")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setVisibilityRuleEditor(null);
          }
        }}
        open={Boolean(visibilityRuleEditor)}
      >
        <DialogContent className="tenant-web__platform-studio-filter-dialog">
          <DialogHeader>
            <div>
              <DialogTitle>
                {visibilityRuleEditor?.index === null
                  ? t("tenant.platformStudio.forms.builder.rule.addVisibilityRule")
                  : t("tenant.platformStudio.forms.builder.rule.editVisibilityRule")}
              </DialogTitle>
              <DialogDescription>
                {t("tenant.platformStudio.forms.builder.rule.rulesDescription")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
            {visibilityRuleEditor ? (
              <div className="tenant-web__platform-studio-builder-stack">
                <div className="tenant-web__platform-studio-form-group">
                  <Label htmlFor="tenant-platform-studio-visibility-rule-effect">
                    {t("tenant.platformStudio.forms.builder.rule.effectLabel")}
                  </Label>
                  <Select
                    disabled={!workspaceAccess.canEditSettings}
                    id="tenant-platform-studio-visibility-rule-effect"
                    onChange={(event) => setVisibilityRuleEditor((currentValue) =>
                      currentValue
                        ? {
                            ...currentValue,
                            draft: {
                              ...currentValue.draft,
                              effect: event.target.value as FormBuilderVisibilityRule["effect"],
                            },
                          }
                        : currentValue
                    )}
                    value={visibilityRuleEditor.draft.effect}
                  >
                    <option value="show">{t("tenant.platformStudio.forms.builder.rule.effect.show")}</option>
                    <option value="hide">{t("tenant.platformStudio.forms.builder.rule.effect.hide")}</option>
                  </Select>
                </div>

                {visibilityRuleEditor.draft.when.all[0] ? (
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

                <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
                  <Button onClick={() => setVisibilityRuleEditor(null)} size="sm" variant="ghost">
                    {t("tenant.platformStudio.forms.cancelDelete")}
                  </Button>
                  {visibilityRuleEditor.index !== null ? (
                    <Button
                      onClick={() => {
                        updateVisibilityRules((rules) =>
                          rules.filter((_, entryIndex) => entryIndex !== visibilityRuleEditor.index)
                        );
                        setVisibilityRuleEditor(null);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      {t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
                    </Button>
                  ) : null}
                  <Button
                    disabled={
                      !workspaceAccess.canEditSettings
                      || !visibilityRuleEditor
                      || visibilityRuleEditor.draft.when.all.length === 0
                    }
                    onClick={saveVisibilityRuleEditor}
                    size="sm"
                    variant="primary"
                  >
                    {t("tenant.platformStudio.forms.builder.saveAction")}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setRequirementRuleEditor(null);
          }
        }}
        open={Boolean(requirementRuleEditor)}
      >
        <DialogContent className="tenant-web__platform-studio-filter-dialog">
          <DialogHeader>
            <div>
              <DialogTitle>
                {requirementRuleEditor?.index === null
                  ? t("tenant.platformStudio.forms.builder.rule.addRequirementRule")
                  : t("tenant.platformStudio.forms.builder.rule.editRequirementRule")}
              </DialogTitle>
              <DialogDescription>
                {t("tenant.platformStudio.forms.builder.rule.rulesDescription")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
            {requirementRuleEditor ? (
              <div className="tenant-web__platform-studio-builder-stack">
                <div className="tenant-web__platform-studio-form-group">
                  <Label htmlFor="tenant-platform-studio-requirement-rule-effect">
                    {t("tenant.platformStudio.forms.builder.rule.effectLabel")}
                  </Label>
                  <Select
                    disabled={!workspaceAccess.canEditSettings}
                    id="tenant-platform-studio-requirement-rule-effect"
                    onChange={(event) => setRequirementRuleEditor((currentValue) =>
                      currentValue
                        ? {
                            ...currentValue,
                            draft: {
                              ...currentValue.draft,
                              effect: event.target.value as FormBuilderRequirementRule["effect"],
                            },
                          }
                        : currentValue
                    )}
                    value={requirementRuleEditor.draft.effect}
                  >
                    <option value="required">{t("tenant.platformStudio.forms.builder.rule.effect.required")}</option>
                    <option value="optional">{t("tenant.platformStudio.forms.builder.rule.effect.optional")}</option>
                  </Select>
                </div>

                {requirementRuleEditor.draft.when.all[0] ? (
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

                <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
                  <Button onClick={() => setRequirementRuleEditor(null)} size="sm" variant="ghost">
                    {t("tenant.platformStudio.forms.cancelDelete")}
                  </Button>
                  {requirementRuleEditor.index !== null ? (
                    <Button
                      onClick={() => {
                        updateRequirementRules((rules) =>
                          rules.filter((_, entryIndex) => entryIndex !== requirementRuleEditor.index)
                        );
                        setRequirementRuleEditor(null);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      {t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
                    </Button>
                  ) : null}
                  <Button
                    disabled={
                      !workspaceAccess.canEditSettings
                      || !requirementRuleEditor
                      || requirementRuleEditor.draft.when.all.length === 0
                    }
                    onClick={saveRequirementRuleEditor}
                    size="sm"
                    variant="primary"
                  >
                    {t("tenant.platformStudio.forms.builder.saveAction")}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setLookupSourcePicker(null);
            setLookupSourcePickerError(null);
            setIsLookupSourcePickerLoading(false);
          }
        }}
        open={Boolean(lookupSourcePicker)}
      >
        <DialogContent className="tenant-web__platform-studio-filter-dialog">
          <DialogHeader>
            <div>
              <DialogTitle>
                {t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerDescription")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
            {lookupSourcePicker ? (
              <div className="tenant-web__platform-studio-builder-stack">
                <div className="tenant-web__platform-studio-lookup-picker-columns">
                  <div className="tenant-web__platform-studio-lookup-picker-column">
                    <p className="tenant-web__platform-studio-filter-group-title">
                      {t("tenant.platformStudio.forms.builder.fieldSettings.availableModels")}
                    </p>
                    {availableLookupSourceModels.length > 0 ? (
                      <div className="tenant-web__platform-studio-lookup-picker-list">
                        {availableLookupSourceModels.map((modelOption) => {
                          const checked = lookupSourcePicker.modelId === modelOption.id;
                          const loadedModelOption = lookupSourceModelsById[modelOption.id];

                          return (
                            <label
                              className={`tenant-web__platform-studio-lookup-picker-option${checked ? " tenant-web__platform-studio-lookup-picker-option--selected" : ""}`}
                              key={modelOption.id}
                            >
                              <input
                                checked={checked}
                                disabled={!workspaceAccess.canEditSettings}
                                name="tenant-platform-studio-lookup-source-model"
                                onChange={() => setLookupSourcePicker((currentValue) =>
                                  currentValue
                                    ? {
                                        ...currentValue,
                                        modelId: modelOption.id,
                                        selectedFieldKeys: loadedModelOption
                                          ? [...loadedModelOption.defaultDisplayFields]
                                          : [],
                                        sortFieldKey: loadedModelOption?.defaultSortField ?? "",
                                      }
                                    : currentValue
                                )}
                                type="radio"
                                value={modelOption.id}
                              />
                              <div className="tenant-web__platform-studio-compact-row-main">
                                <span className="tenant-web__platform-studio-compact-row-label">
                                  {modelOption.label}
                                </span>
                                {loadedModelOption ? (
                                  <span className="tenant-web__platform-studio-compact-row-summary">
                                    {`${loadedModelOption.fields.length} ${t("tenant.platformStudio.forms.builder.fieldSettings.availableFieldsCount")}`}
                                  </span>
                                ) : null}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="tenant-web__platform-studio-inline-help">
                        {t("tenant.platformStudio.forms.builder.fieldSettings.noAvailableModels")}
                      </p>
                    )}
                  </div>

                  <div className="tenant-web__platform-studio-lookup-picker-column">
                    <p className="tenant-web__platform-studio-filter-group-title">
                      {t("tenant.platformStudio.forms.builder.fieldSettings.availableFields")}
                    </p>

                    {isLookupSourcePickerLoading ? (
                      <p className="tenant-web__platform-studio-inline-help">
                        {t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerLoading")}
                      </p>
                    ) : lookupSourcePickerError ? (
                      <p className="tenant-web__platform-studio-inline-help">
                        {lookupSourcePickerError}
                      </p>
                    ) : lookupSourcePickerModel ? (
                      <div className="tenant-web__platform-studio-lookup-picker-list">
                        {lookupSourcePickerModel.fields.map((fieldOption) => {
                          const checked = lookupSourcePicker.selectedFieldKeys.includes(fieldOption.key);

                          return (
                            <label
                              className={`tenant-web__platform-studio-lookup-picker-option${checked ? " tenant-web__platform-studio-lookup-picker-option--selected" : ""}`}
                              key={`${lookupSourcePickerModel.id}-${fieldOption.key}`}
                            >
                              <input
                                checked={checked}
                                disabled={!workspaceAccess.canEditSettings}
                                onChange={(event) => setLookupSourcePicker((currentValue) =>
                                  currentValue
                                    ? {
                                        ...currentValue,
                                        selectedFieldKeys: event.target.checked
                                          ? Array.from(new Set([...currentValue.selectedFieldKeys, fieldOption.key]))
                                          : currentValue.selectedFieldKeys.filter((entry) => entry !== fieldOption.key),
                                      }
                                    : currentValue
                                )}
                                type="checkbox"
                              />
                              <div className="tenant-web__platform-studio-compact-row-main">
                                <span className="tenant-web__platform-studio-compact-row-label">
                                  {fieldOption.label}
                                </span>
                                <span className="tenant-web__platform-studio-compact-row-summary">
                                  {fieldOption.key}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="tenant-web__platform-studio-inline-help">
                        {t("tenant.platformStudio.forms.builder.fieldSettings.noSourceSelected")}
                      </p>
                    )}
                  </div>
                </div>

                {lookupSourcePickerModel ? (
                  <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
                    <div className="tenant-web__platform-studio-compact-row">
                      <div className="tenant-web__platform-studio-compact-row-main">
                        <span className="tenant-web__platform-studio-compact-row-label">
                          {t("tenant.platformStudio.forms.builder.fieldSettings.selectedFields")}
                        </span>
                        <span className="tenant-web__platform-studio-compact-row-summary">
                          {lookupSourcePicker.selectedFieldKeys.length > 0
                            ? getLookupModelFieldLabels(
                              lookupSourcePickerModel,
                              lookupSourcePicker.selectedFieldKeys,
                            ).join(", ")
                            : t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields")}
                        </span>
                      </div>
                    </div>

                    <div className="tenant-web__platform-studio-form-group">
                      <Label htmlFor="tenant-platform-studio-lookup-sort-field">
                        {t("tenant.platformStudio.forms.builder.fieldSettings.sortBy")}
                      </Label>
                      <Select
                        disabled={!workspaceAccess.canEditSettings}
                        id="tenant-platform-studio-lookup-sort-field"
                        onChange={(event) => setLookupSourcePicker((currentValue) =>
                          currentValue
                            ? {
                                ...currentValue,
                                sortFieldKey: event.target.value || lookupSourcePickerModel.defaultSortField,
                              }
                            : currentValue
                        )}
                        value={lookupSourcePicker.sortFieldKey}
                      >
                        {lookupSourcePickerModel.fields.map((fieldOption) => (
                          <option key={`${lookupSourcePickerModel.id}-sort-${fieldOption.key}`} value={fieldOption.key}>
                            {fieldOption.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ) : null}

                <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
                  <Button onClick={() => setLookupSourcePicker(null)} size="sm" variant="ghost">
                    {t("tenant.platformStudio.forms.cancelDelete")}
                  </Button>
                  <Button
                    disabled={
                      !workspaceAccess.canEditSettings
                      || !lookupSourcePickerModel
                      || lookupSourcePicker.selectedFieldKeys.length === 0
                    }
                    onClick={saveLookupSourcePicker}
                    size="sm"
                    variant="primary"
                  >
                    {t("tenant.platformStudio.forms.builder.saveAction")}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDefaultFilterEditor(null);
          }
        }}
        open={Boolean(defaultFilterEditor)}
      >
        <DialogContent className="tenant-web__platform-studio-filter-dialog">
          <DialogHeader>
            <div>
              <DialogTitle>
                {defaultFilterEditor?.index === null
                  ? t(
                    isRootViewScope
                      ? "tenant.platformStudio.forms.builder.filter.addFilter"
                      : "tenant.platformStudio.forms.builder.filter.addFilterSubtable",
                  )
                  : t(
                    isRootViewScope
                      ? "tenant.platformStudio.forms.builder.filter.editFilter"
                      : "tenant.platformStudio.forms.builder.filter.editFilterSubtable",
                  )}
              </DialogTitle>
              <DialogDescription>
                {t(
                  isRootViewScope
                    ? "tenant.platformStudio.forms.builder.viewSection.filtersDescription"
                    : "tenant.platformStudio.forms.builder.filter.filtersDescriptionSubtable",
                )}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
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

            <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
              <Button onClick={() => setDefaultFilterEditor(null)} size="sm" variant="ghost">
                {t("tenant.platformStudio.forms.cancelDelete")}
              </Button>
              <Button
                disabled={!workspaceAccess.canEditSettings || !defaultFilterEditor}
                onClick={saveDefaultFilterEditor}
                size="sm"
                variant="primary"
              >
                {t("tenant.platformStudio.forms.builder.saveAction")}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setQuickFilterEditor(null);
          }
        }}
        open={Boolean(quickFilterEditor)}
      >
        <DialogContent className="tenant-web__platform-studio-filter-dialog">
          <DialogHeader>
            <div>
              <DialogTitle>
                {quickFilterEditor?.index === null
                  ? t("tenant.platformStudio.forms.builder.filter.addQuickFilter")
                  : t("tenant.platformStudio.forms.builder.filter.editFilter")}
              </DialogTitle>
              <DialogDescription>
                {t("tenant.platformStudio.forms.builder.filter.quickFilters")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="tenant-web__platform-studio-filter-dialog-body">
            {quickFilterEditor ? (
              <div className="tenant-web__platform-studio-builder-stack">
                <div className="tenant-web__platform-studio-form-group">
                  <Label htmlFor="tenant-platform-studio-quick-filter-editor-label">
                    {t("tenant.platformStudio.forms.builder.filter.quickFilterLabel")}
                  </Label>
                  <Input
                    disabled={!workspaceAccess.canEditSettings}
                    id="tenant-platform-studio-quick-filter-editor-label"
                    onChange={(event) => setQuickFilterEditor((currentValue) =>
                      currentValue
                        ? {
                            ...currentValue,
                            draft: {
                              ...currentValue.draft,
                              label: event.target.value,
                            },
                          }
                        : currentValue
                    )}
                    value={quickFilterEditor.draft.label}
                  />
                </div>

                <div className="tenant-web__platform-studio-form-group">
                  <Label htmlFor="tenant-platform-studio-quick-filter-editor-color">
                    {t("tenant.platformStudio.forms.builder.filter.quickFilterColor")}
                  </Label>
                  <Input
                    disabled={!workspaceAccess.canEditSettings}
                    id="tenant-platform-studio-quick-filter-editor-color"
                    onChange={(event) => setQuickFilterEditor((currentValue) =>
                      currentValue
                        ? {
                            ...currentValue,
                            draft: {
                              ...currentValue.draft,
                              color: normalizeHexColor(event.target.value) || undefined,
                            },
                          }
                        : currentValue
                    )}
                    placeholder="#D97706"
                    value={quickFilterEditor.draft.color ?? ""}
                  />
                </div>

                <div className="tenant-web__platform-studio-builder-stack">
                  {quickFilterEditor.draft.conditions.map((condition, conditionIndex) => (
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
                  ))}
                </div>

                <div className="tenant-web__platform-studio-button-row">
                  <Button
                    disabled={!workspaceAccess.canEditSettings || rootViewFilterTargets.length === 0}
                    onClick={() => {
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
                    size="sm"
                    variant="secondary"
                  >
                    {t("tenant.platformStudio.forms.builder.filter.addCondition")}
                  </Button>
                </div>

                <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
                  <Button onClick={() => setQuickFilterEditor(null)} size="sm" variant="ghost">
                    {t("tenant.platformStudio.forms.cancelDelete")}
                  </Button>
                  <Button
                    disabled={!workspaceAccess.canEditSettings || !quickFilterEditor.draft.label.trim() || quickFilterEditor.draft.conditions.length === 0}
                    onClick={saveQuickFilterEditor}
                    size="sm"
                    variant="primary"
                  >
                    {t("tenant.platformStudio.forms.builder.saveAction")}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={setDebugOpen}
        open={debugOpen}
        surfaceClassName="tenant-web__platform-studio-debug-surface"
      >
        <DialogContent className="tenant-web__platform-studio-debug-dialog">
          <DialogHeader>
            <div>
              <DialogTitle>{t("tenant.platformStudio.forms.builder.debugDialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("tenant.platformStudio.forms.builder.debugDialogDescription")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="tenant-web__platform-studio-debug-dialog-body">
            <div className="tenant-web__platform-studio-debug-schema-grid">
              <Card className="tenant-web__platform-studio-debug-schema-card">
                <CardHeader>
                  <div>
                    <CardTitle>{t("tenant.platformStudio.forms.builder.debugModelSchemaTitle")}</CardTitle>
                    <CardDescription>{t("tenant.platformStudio.forms.builder.debugModelSchemaDescription")}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="tenant-web__platform-studio-debug-schema-scroll">
                  <pre className="tenant-web__platform-studio-debug-schema-pre">{debugDataSchema}</pre>
                </CardContent>
              </Card>

              <Card className="tenant-web__platform-studio-debug-schema-card">
                <CardHeader>
                  <div>
                    <CardTitle>{t("tenant.platformStudio.forms.builder.debugUiSchemaTitle")}</CardTitle>
                    <CardDescription>{t("tenant.platformStudio.forms.builder.debugUiSchemaDescription")}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="tenant-web__platform-studio-debug-schema-scroll">
                  <pre className="tenant-web__platform-studio-debug-schema-pre">{debugUiSchema}</pre>
                </CardContent>
              </Card>

              <Card className="tenant-web__platform-studio-debug-schema-card">
                <CardHeader>
                  <div>
                    <CardTitle>Compiled Runtime</CardTitle>
                    <CardDescription>Derived storage and SQL mapping for scopes and fields.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="tenant-web__platform-studio-debug-schema-scroll">
                  <pre className="tenant-web__platform-studio-debug-schema-pre">{debugCompiledRuntime}</pre>
                </CardContent>
              </Card>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && leaveConfirmOpen) {
            resolveLeaveConfirmation(false);
          }
        }}
        open={leaveConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformStudio.forms.builder.unsavedLeaveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tenant.platformStudio.forms.builder.unsavedLeaveDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => resolveLeaveConfirmation(false)}
            >
              {t("tenant.platformStudio.forms.builder.stayAction")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resolveLeaveConfirmation(true)}
              variant="danger"
            >
              {t("tenant.platformStudio.forms.builder.leaveWithoutSavingAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
