import type {
  FormBuilderDocument,
  FormBuilderFilterDefinitions,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderScopeUiSchema,
  FormBuilderSubformScope,
  FormBuilderSubformViewSettings,
} from "../forms-builder-state";
import { createFormBuilderScopeUiHelpers } from "./form-builder-scope-ui";

type ScopedDocumentInternals = {
  dedupeFieldIds: (values: ReadonlyArray<string>) => string[];
  isFormBuilderContainer: (nodeType: FormBuilderNodeType) => boolean;
  normalizeFilterDefinitions: (
    value: unknown,
    fieldIds: ReadonlySet<string>,
  ) => FormBuilderFilterDefinitions;
  normalizeSubformViewSettings: (
    value: unknown,
    fieldIds: ReadonlySet<string>,
  ) => FormBuilderSubformViewSettings;
  slugifyScopeKey: (value: string) => string;
};

export function createFormBuilderScopedDocumentHelpers({
  dedupeFieldIds,
  isFormBuilderContainer,
  normalizeFilterDefinitions,
  normalizeSubformViewSettings,
  slugifyScopeKey,
}: ScopedDocumentInternals) {
  const scopeUiHelpers = createFormBuilderScopeUiHelpers({
    dedupeFieldIds,
    isFormBuilderContainer,
  });
  const {
    appendScopeUnplacedFieldIds,
    getDefaultSelectedNodeIdForScope,
    getScopedFieldIds,
    normalizeScopeCurrentParentId,
    normalizeScopeSelectedNodeId,
    normalizeScopeUnplacedFieldIds,
    removeScopeUnplacedFieldId,
  } = scopeUiHelpers;

  function getSubformScope(
    document: Pick<FormBuilderDocument, "activeScopeId" | "subformScopes">,
    scopeId: string | null | undefined,
  ) {
    if (!scopeId || scopeId === "root") {
      return null;
    }

    return document.subformScopes.find((scope) => scope.scopeId === scopeId) ?? null;
  }

  function getScopeNodes(
    document: FormBuilderDocument,
    scopeId: "root" | string,
  ) {
    return scopeId === "root"
      ? document.rootScope.uiSchema.nodes
      : (document.subformScopes.find((scope) => scope.scopeId === scopeId)?.uiSchema.nodes ?? []);
  }

  function createSubformScopeFromNode(
    subformNode: FormBuilderNode,
    existingScope?: FormBuilderSubformScope,
  ): FormBuilderSubformScope {
    const fieldIds = new Set(existingScope?.dataSchema.fieldIds ?? []);
    const nextColumns = subformNode.childGridColumns && subformNode.childGridColumns.length > 0
      ? subformNode.childGridColumns
      : existingScope?.viewSettings.list.columns ?? [];
    const scopeTableKey = subformNode.tableKey?.trim()
      || subformNode.schemaScopeId?.trim()
      || existingScope?.tableKey
      || `pb_${slugifyScopeKey(subformNode.title?.trim() || subformNode.id)}`;

    return {
      dataSchema: {
        fieldIds: existingScope?.dataSchema.fieldIds ?? [],
        runtime: existingScope?.dataSchema.runtime,
      },
      filterDefinitions: normalizeFilterDefinitions(existingScope?.filterDefinitions, fieldIds),
      parentSubformNodeId: subformNode.id,
      runtime: existingScope?.runtime,
      scopeId: subformNode.id,
      scopeType: "SUBFORM",
      subformType: subformNode.subformType ?? existingScope?.subformType ?? "DEFAULT",
      tableKey: scopeTableKey,
      uiSchema: existingScope?.uiSchema ?? {
        currentParentId: null,
        nodes: [],
        selectedNodeId: null,
        unplacedFieldIds: [],
      },
      viewSettings: normalizeSubformViewSettings(
        {
          ...existingScope?.viewSettings,
          list: {
            ...existingScope?.viewSettings.list,
            columns: nextColumns,
          },
        },
        fieldIds,
      ),
    };
  }

  function finalizeScopedDocument(
    document: FormBuilderDocument,
    extraFieldIds: ReadonlyArray<string> = [],
  ): FormBuilderDocument {
    const rootSubformNodes = document.rootScope.uiSchema.nodes
      .filter((node): node is FormBuilderNode & { type: "subform" } => node.type === "subform")
      .sort((left, right) => left.order - right.order);
    const subformScopes = rootSubformNodes.map((subformNode) =>
      createSubformScopeFromNode(
        subformNode,
        document.subformScopes.find((scope) => scope.parentSubformNodeId === subformNode.id),
      ),
    ).map((scope) => ({
      ...scope,
      uiSchema: {
        ...scope.uiSchema,
        currentParentId: normalizeScopeCurrentParentId(scope.uiSchema.nodes, scope.uiSchema.currentParentId),
        selectedNodeId: normalizeScopeSelectedNodeId(scope.uiSchema.nodes, scope.uiSchema.selectedNodeId, { allowNull: true }),
        unplacedFieldIds: normalizeScopeUnplacedFieldIds(scope.uiSchema, scope.dataSchema.fieldIds),
      },
    }));
    const subformFieldIds = new Set<string>();
    const normalizedSubformScopes = subformScopes.map((scope) => {
      const fieldIds = getScopedFieldIds(scope.uiSchema);
      fieldIds.forEach((fieldId) => subformFieldIds.add(fieldId));

      return {
        ...scope,
        dataSchema: {
          ...scope.dataSchema,
          fieldIds,
        },
        filterDefinitions: normalizeFilterDefinitions(scope.filterDefinitions, new Set(fieldIds)),
        uiSchema: {
          ...scope.uiSchema,
          unplacedFieldIds: normalizeScopeUnplacedFieldIds(scope.uiSchema, fieldIds),
        },
        viewSettings: normalizeSubformViewSettings(
          {
            ...scope.viewSettings,
            list: {
              ...scope.viewSettings.list,
              columns: scope.viewSettings.list.columns,
            },
          },
          new Set(fieldIds),
        ),
      };
    });
    const knownFieldIds = dedupeFieldIds([
      ...document.rootScope.dataSchema.fieldIds,
      ...normalizedSubformScopes.flatMap((scope) => scope.dataSchema.fieldIds),
      ...document.rootScope.uiSchema.nodes
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
      ...extraFieldIds,
    ]);
    const activeScopeId = document.activeScopeId === "root" || normalizedSubformScopes.some((scope) => scope.scopeId === document.activeScopeId)
      ? document.activeScopeId
      : "root";

    return withFlatCompatibilityCache({
      ...document,
      activeScopeId,
      rootScope: {
        ...document.rootScope,
        dataSchema: {
          ...document.rootScope.dataSchema,
          fieldIds: knownFieldIds.filter((fieldId) => !subformFieldIds.has(fieldId)),
        },
        uiSchema: {
          ...document.rootScope.uiSchema,
          currentParentId: normalizeScopeCurrentParentId(document.rootScope.uiSchema.nodes, document.rootScope.uiSchema.currentParentId),
          selectedNodeId: normalizeScopeSelectedNodeId(document.rootScope.uiSchema.nodes, document.rootScope.uiSchema.selectedNodeId),
          unplacedFieldIds: normalizeScopeUnplacedFieldIds(
            document.rootScope.uiSchema,
            knownFieldIds.filter((fieldId) => !subformFieldIds.has(fieldId)),
          ),
        },
      },
      subformScopes: normalizedSubformScopes,
    });
  }

  function updateScopeUiSchema(
    document: FormBuilderDocument,
    scopeId: "root" | string,
    updater: (uiSchema: FormBuilderScopeUiSchema) => FormBuilderScopeUiSchema,
    options?: { extraFieldIds?: ReadonlyArray<string> },
  ) {
    if (scopeId === "root") {
      return finalizeScopedDocument({
        ...document,
        rootScope: {
          ...document.rootScope,
          uiSchema: updater(document.rootScope.uiSchema),
        },
      }, options?.extraFieldIds);
    }

    return finalizeScopedDocument({
      ...document,
      subformScopes: document.subformScopes.map((scope) =>
        scope.scopeId === scopeId
          ? {
              ...scope,
              uiSchema: updater(scope.uiSchema),
            }
          : scope,
      ),
    }, options?.extraFieldIds);
  }

  function flattenScopedNodes(
    document: Pick<FormBuilderDocument, "rootScope" | "subformScopes">,
  ) {
    const childGridColumnsBySubformId = new Map(
      document.subformScopes.map((scope) => [scope.parentSubformNodeId, scope.viewSettings.list.columns]),
    );
    const rootNodes = document.rootScope.uiSchema.nodes.map((node) =>
      node.type === "subform"
        ? {
            ...node,
            childGridColumns: childGridColumnsBySubformId.get(node.id) ?? [],
          }
        : node,
    );
    const subformNodes = document.subformScopes.flatMap((scope) =>
      scope.uiSchema.nodes.map((node) => ({
        ...node,
        parentId: node.parentId === null ? scope.parentSubformNodeId : node.parentId,
      })),
    );

    return [...rootNodes, ...subformNodes];
  }

  function getFlatCurrentParentId(
    document: Pick<FormBuilderDocument, "activeScopeId" | "rootScope" | "subformScopes">,
  ) {
    const activeSubformScope = getSubformScope(document, document.activeScopeId);
    return activeSubformScope
      ? activeSubformScope.uiSchema.currentParentId ?? activeSubformScope.parentSubformNodeId
      : document.rootScope.uiSchema.currentParentId;
  }

  function getFlatSelectedNodeId(
    document: Pick<FormBuilderDocument, "activeScopeId" | "rootScope" | "subformScopes">,
  ) {
    const activeSubformScope = getSubformScope(document, document.activeScopeId);
    return activeSubformScope
      ? activeSubformScope.uiSchema.selectedNodeId ?? activeSubformScope.parentSubformNodeId
      : document.rootScope.uiSchema.selectedNodeId;
  }

  function withFlatCompatibilityCache(document: FormBuilderDocument): FormBuilderDocument {
    const activeScopeId = document.activeScopeId === "root" || document.subformScopes.some((scope) => scope.scopeId === document.activeScopeId)
      ? document.activeScopeId
      : "root";
    const nextDocument = {
      ...document,
      activeScopeId,
    };

    return {
      ...nextDocument,
      currentParentId: getFlatCurrentParentId(nextDocument),
      nodes: flattenScopedNodes(nextDocument),
      selectedNodeId: getFlatSelectedNodeId(nextDocument),
    };
  }

  return {
    appendScopeUnplacedFieldIds,
    finalizeScopedDocument,
    getDefaultSelectedNodeIdForScope,
    getScopeNodes,
    getScopedFieldIds,
    getSubformScope,
    normalizeScopeCurrentParentId,
    normalizeScopeSelectedNodeId,
    normalizeScopeUnplacedFieldIds,
    removeScopeUnplacedFieldId,
    updateScopeUiSchema,
    withFlatCompatibilityCache,
  } as const;
}
