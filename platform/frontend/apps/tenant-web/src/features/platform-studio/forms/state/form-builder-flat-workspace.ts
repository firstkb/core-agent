import type {
  FormBuilderDocument,
  FormBuilderFilterDefinitions,
  FormBuilderNode,
  FormBuilderScopeUiSchema,
  FormBuilderSubformViewSettings,
} from "../forms-builder-state";

export type FormBuilderFlatWorkspaceState = {
  currentParentId: string | null;
  nodes: ReadonlyArray<FormBuilderNode>;
  selectedNodeId: string | null;
};

type FlatWorkspaceInternals = {
  dedupeFieldIds: (values: ReadonlyArray<string>) => string[];
  getScopedFieldIds: (
    uiSchema: Pick<FormBuilderScopeUiSchema, "nodes" | "unplacedFieldIds">,
  ) => string[];
  normalizeFilterDefinitions: (
    value: unknown,
    fieldIds: ReadonlySet<string>,
  ) => FormBuilderFilterDefinitions;
  normalizeScopeCurrentParentId: (
    nodes: ReadonlyArray<FormBuilderNode>,
    candidate: string | null | undefined,
  ) => string | null;
  normalizeScopeSelectedNodeId: (
    nodes: ReadonlyArray<FormBuilderNode>,
    candidate: string | null | undefined,
    options?: {
      allowNull?: boolean;
    },
  ) => string | null;
  normalizeScopeUnplacedFieldIds: (
    uiSchema: Pick<FormBuilderScopeUiSchema, "nodes" | "unplacedFieldIds">,
    availableFieldIds: ReadonlyArray<string>,
  ) => string[];
  normalizeSubformViewSettings: (
    value: unknown,
    fieldIds: ReadonlySet<string>,
  ) => FormBuilderSubformViewSettings;
  slugifyScopeKey: (value: string) => string;
  withFlatCompatibilityCache: (document: FormBuilderDocument) => FormBuilderDocument;
};

export function createFormBuilderFlatWorkspaceHelpers({
  dedupeFieldIds,
  getScopedFieldIds,
  normalizeFilterDefinitions,
  normalizeScopeCurrentParentId,
  normalizeScopeSelectedNodeId,
  normalizeScopeUnplacedFieldIds,
  normalizeSubformViewSettings,
  slugifyScopeKey,
  withFlatCompatibilityCache,
}: FlatWorkspaceInternals) {
  function getNodeMap(nodes: ReadonlyArray<FormBuilderNode>) {
    return new Map(nodes.map((node) => [node.id, node]));
  }

  function getContainingSubformScopeId(
    node: FormBuilderNode,
    nodeMap: ReadonlyMap<string, FormBuilderNode>,
  ) {
    const visited = new Set<string>();
    let currentParentId = node.parentId;

    while (typeof currentParentId === "string") {
      if (visited.has(currentParentId)) {
        return null;
      }

      visited.add(currentParentId);
      const parentNode = nodeMap.get(currentParentId);
      if (!parentNode) {
        return null;
      }

      if (parentNode.type === "subform") {
        return parentNode.id;
      }

      currentParentId = parentNode.parentId;
    }

    return null;
  }

  function getScopeIdForFlatCurrentParent(
    nodeId: string | null | undefined,
    nodeMap: ReadonlyMap<string, FormBuilderNode>,
  ): "root" | string | null {
    if (!nodeId) {
      return null;
    }

    const node = nodeMap.get(nodeId);
    if (!node) {
      return null;
    }

    if (node.type === "subform") {
      return node.id;
    }

    return getContainingSubformScopeId(node, nodeMap) ?? "root";
  }

  function getScopeIdForFlatSelection(
    nodeId: string | null | undefined,
    nodeMap: ReadonlyMap<string, FormBuilderNode>,
  ): "root" | string | null {
    if (!nodeId) {
      return null;
    }

    const node = nodeMap.get(nodeId);
    if (!node) {
      return null;
    }

    return getContainingSubformScopeId(node, nodeMap) ?? "root";
  }

  function buildScopeUiNodes(
    nodes: ReadonlyArray<FormBuilderNode>,
    parentScopeNodeId: string | null,
  ): ReadonlyArray<FormBuilderNode> {
    return nodes.map((node) => ({
      ...node,
      childGridColumns: node.type === "subform" ? undefined : node.childGridColumns,
      parentId: parentScopeNodeId !== null && node.parentId === parentScopeNodeId
        ? null
        : node.parentId,
    }));
  }

  function localizeFlatNodeIdForSubformScope(
    nodeId: string | null | undefined,
    scopeId: string,
  ) {
    if (!nodeId || nodeId === scopeId) {
      return null;
    }

    return nodeId;
  }

  function getKnownFieldIds(
    document: FormBuilderDocument,
    nodes: ReadonlyArray<FormBuilderNode>,
    extraFieldIds: ReadonlyArray<string> = [],
  ) {
    return dedupeFieldIds([
      ...document.rootScope.dataSchema.fieldIds,
      ...document.subformScopes.flatMap((scope) => scope.dataSchema.fieldIds),
      ...nodes
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
      ...extraFieldIds,
    ]);
  }

  function buildScopedDocumentFromFlatWorkspace(
    flatState: FormBuilderFlatWorkspaceState,
    baseDocument: FormBuilderDocument,
    extraFieldIds: ReadonlyArray<string> = [],
  ) {
    const nodes = [...flatState.nodes];
    const nodeMap = getNodeMap(nodes);
    const currentParentScopeId = getScopeIdForFlatCurrentParent(flatState.currentParentId, nodeMap);
    const selectedNodeScopeId = getScopeIdForFlatSelection(flatState.selectedNodeId, nodeMap);
    const subformNodes = nodes
      .filter((node) => node.type === "subform")
      .sort((left, right) => left.order - right.order);
    const activeScopeIdCandidate =
      currentParentScopeId ??
      selectedNodeScopeId ??
      (baseDocument.activeScopeId === "root" || subformNodes.some((node) => node.id === baseDocument.activeScopeId)
        ? baseDocument.activeScopeId
        : "root");
    const knownFieldIds = getKnownFieldIds(baseDocument, nodes, extraFieldIds);
    const rootScopeNodes = buildScopeUiNodes(
      nodes.filter((node) => getContainingSubformScopeId(node, nodeMap) === null),
      null,
    );
    const rootCurrentParentCandidate =
      activeScopeIdCandidate === "root" && (currentParentScopeId === "root" || flatState.currentParentId === null)
        ? (flatState.currentParentId ?? null)
        : baseDocument.rootScope.uiSchema.currentParentId;
    const rootSelectedCandidate =
      activeScopeIdCandidate === "root" && (selectedNodeScopeId === "root" || flatState.selectedNodeId === null)
        ? (flatState.selectedNodeId ?? null)
        : baseDocument.rootScope.uiSchema.selectedNodeId;
    const subformFieldIds = new Set<string>();
    const subformScopes = subformNodes.map((subformNode) => {
      const scopedNodes = buildScopeUiNodes(
        nodes.filter((node) => getContainingSubformScopeId(node, nodeMap) === subformNode.id),
        subformNode.id,
      );
      const existingScope = baseDocument.subformScopes.find((scope) => scope.scopeId === subformNode.id);
      const currentParentCandidate =
        activeScopeIdCandidate === subformNode.id && currentParentScopeId === subformNode.id
          ? localizeFlatNodeIdForSubformScope(flatState.currentParentId, subformNode.id)
          : existingScope?.uiSchema.currentParentId;
      const selectedCandidate =
        activeScopeIdCandidate === subformNode.id && selectedNodeScopeId === subformNode.id
          ? localizeFlatNodeIdForSubformScope(flatState.selectedNodeId, subformNode.id)
          : existingScope?.uiSchema.selectedNodeId;
      const fieldIds = getScopedFieldIds({
        nodes: scopedNodes,
        unplacedFieldIds: existingScope?.uiSchema.unplacedFieldIds ?? [],
      });
      fieldIds.forEach((fieldId) => subformFieldIds.add(fieldId));
      const scopeTableKey = subformNode.tableKey?.trim()
        || subformNode.schemaScopeId?.trim()
        || existingScope?.tableKey
        || `pb_${slugifyScopeKey(subformNode.title?.trim() || subformNode.id)}`;

      return {
        dataSchema: {
          fieldIds,
          runtime: existingScope?.dataSchema.runtime,
        },
        filterDefinitions: normalizeFilterDefinitions(
          existingScope?.filterDefinitions,
          new Set(fieldIds),
        ),
        parentSubformNodeId: subformNode.id,
        runtime: existingScope?.runtime,
        scopeId: subformNode.id,
        scopeType: "SUBFORM" as const,
        subformType: subformNode.subformType ?? existingScope?.subformType ?? "DEFAULT",
        tableKey: scopeTableKey,
        uiSchema: {
          currentParentId: normalizeScopeCurrentParentId(scopedNodes, currentParentCandidate),
          nodes: scopedNodes,
          selectedNodeId: normalizeScopeSelectedNodeId(scopedNodes, selectedCandidate, { allowNull: true }),
          unplacedFieldIds: normalizeScopeUnplacedFieldIds(
            existingScope?.uiSchema ?? { nodes: scopedNodes, unplacedFieldIds: [] },
            fieldIds,
          ),
        },
        viewSettings: normalizeSubformViewSettings(
          {
            ...existingScope?.viewSettings,
            list: {
              ...existingScope?.viewSettings.list,
              columns: subformNode.childGridColumns ?? existingScope?.viewSettings.list.columns ?? [],
            },
          },
          new Set(fieldIds),
        ),
      };
    });

    return withFlatCompatibilityCache({
      ...baseDocument,
      activeScopeId: activeScopeIdCandidate,
      rootScope: {
        dataSchema: {
          ...baseDocument.rootScope.dataSchema,
          fieldIds: knownFieldIds.filter((fieldId) => !subformFieldIds.has(fieldId)),
        },
        runtime: baseDocument.rootScope.runtime,
        scopeId: "root",
        scopeType: "ROOT",
        uiSchema: {
          currentParentId: normalizeScopeCurrentParentId(rootScopeNodes, rootCurrentParentCandidate),
          nodes: rootScopeNodes,
          selectedNodeId: normalizeScopeSelectedNodeId(rootScopeNodes, rootSelectedCandidate),
          unplacedFieldIds: normalizeScopeUnplacedFieldIds(
            baseDocument.rootScope.uiSchema,
            knownFieldIds.filter((fieldId) => !subformFieldIds.has(fieldId)),
          ),
        },
      },
      subformScopes,
    });
  }

  return {
    buildScopedDocumentFromFlatWorkspace,
  } as const;
}
