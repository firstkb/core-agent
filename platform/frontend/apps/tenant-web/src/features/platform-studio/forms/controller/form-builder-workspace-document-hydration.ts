import {
  normalizeDataScopeRuntime,
  normalizePersistedFormBuilderDocument,
  normalizeViewScopeRuntime,
} from "../forms-builder-state";
import {
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import { isRecord } from "./form-builder-workspace-schema-utils";

export function buildWorkspaceDocumentFromCanonicalSchemas(
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
