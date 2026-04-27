import type { FormBuilderDocument, FormBuilderNode, FormBuilderScopeUiSchema, FormBuilderSubformScope } from "../forms-builder-state";
import { getFormBuilderNode, getFormBuilderNodeScopeId } from "./form-builder-selectors";

type UpdateScopeUiSchema = (
  document: FormBuilderDocument,
  scopeId: "root" | string,
  updater: (uiSchema: FormBuilderScopeUiSchema) => FormBuilderScopeUiSchema,
  options?: {
    extraFieldIds?: ReadonlyArray<string>;
  },
) => FormBuilderDocument;

type GetSubformScope = (
  document: Pick<FormBuilderDocument, "activeScopeId" | "subformScopes">,
  scopeId: string | null | undefined,
) => FormBuilderSubformScope | null;
type AppendScopeUnplacedFieldIds = (
  uiSchema: FormBuilderScopeUiSchema,
  fieldIds: ReadonlyArray<string>,
) => FormBuilderScopeUiSchema;
type FinalizeScopedDocument = (
  document: FormBuilderDocument,
  extraFieldIds?: ReadonlyArray<string>,
) => FormBuilderDocument;

export type FormBuilderNodeActionInternals = {
  appendScopeUnplacedFieldIds: AppendScopeUnplacedFieldIds;
  finalizeScopedDocument: FinalizeScopedDocument;
  getDefaultSelectedNodeIdForScope: (
    nodes: ReadonlyArray<FormBuilderNode>,
    allowNull: boolean,
  ) => string | null;
  getScopeNodes: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
  ) => ReadonlyArray<FormBuilderNode>;
  getSubformScope: GetSubformScope;
  updateScopeUiSchema: UpdateScopeUiSchema;
};

export function createFormBuilderNodeActions({
  appendScopeUnplacedFieldIds,
  finalizeScopedDocument,
  getDefaultSelectedNodeIdForScope,
  getScopeNodes,
  getSubformScope,
  updateScopeUiSchema,
}: FormBuilderNodeActionInternals) {
  function removeFormBuilderNode(
    document: FormBuilderDocument,
    nodeId: string,
  ): FormBuilderDocument {
    const node = getFormBuilderNode(document, nodeId);
    if (!node) {
      return document;
    }

    const scopeId = getFormBuilderNodeScopeId(document, nodeId);
    if (!scopeId) {
      return document;
    }

    const scopeNodes = getScopeNodes(document, scopeId);
    const descendants = collectDescendantIds(scopeNodes, nodeId);
    const removedFieldIds = dedupeFieldIds(
      scopeNodes
        .filter((entry): entry is FormBuilderNode & { fieldId: string } =>
          descendants.has(entry.id) && entry.type === "field" && typeof entry.fieldId === "string")
        .map((entry) => entry.fieldId),
    );
    const nextNodes = resequenceSiblingOrders(
      scopeNodes.filter((entry) => !descendants.has(entry.id)),
      node.parentId,
    );

    if (scopeId === "root") {
      const currentParentRemoved = document.rootScope.uiSchema.currentParentId
        ? descendants.has(document.rootScope.uiSchema.currentParentId)
        : false;
      const selectedRemoved = document.rootScope.uiSchema.selectedNodeId
        ? descendants.has(document.rootScope.uiSchema.selectedNodeId)
        : false;

      return finalizeScopedDocument({
        ...document,
        activeScopeId: document.activeScopeId === nodeId ? "root" : document.activeScopeId,
        rootScope: {
          ...document.rootScope,
          uiSchema: {
            ...appendScopeUnplacedFieldIds(document.rootScope.uiSchema, removedFieldIds),
            currentParentId: currentParentRemoved ? node.parentId : document.rootScope.uiSchema.currentParentId,
            nodes: nextNodes,
            selectedNodeId: selectedRemoved
              ? getFallbackSelectedNodeId(
                  nextNodes,
                  node.parentId,
                  getDefaultSelectedNodeIdForScope,
                  { allowNull: false },
                )
              : document.rootScope.uiSchema.selectedNodeId,
          },
        },
        subformScopes: document.subformScopes.filter((scope) => scope.parentSubformNodeId !== nodeId),
      });
    }

    const currentScope = getSubformScope(document, scopeId);
    if (!currentScope) {
      return document;
    }

    const currentParentRemoved = currentScope.uiSchema.currentParentId
      ? descendants.has(currentScope.uiSchema.currentParentId)
      : false;
    const selectedRemoved = currentScope.uiSchema.selectedNodeId
      ? descendants.has(currentScope.uiSchema.selectedNodeId)
      : false;

    return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
      ...appendScopeUnplacedFieldIds(uiSchema, removedFieldIds),
      currentParentId: currentParentRemoved ? node.parentId : uiSchema.currentParentId,
      nodes: nextNodes,
      selectedNodeId: selectedRemoved
        ? getFallbackSelectedNodeId(
            nextNodes,
            node.parentId,
            getDefaultSelectedNodeIdForScope,
            { allowNull: true },
          )
        : uiSchema.selectedNodeId,
    }));
  }

  function moveFormBuilderNode(
    document: FormBuilderDocument,
    nodeId: string,
    direction: -1 | 1,
  ): FormBuilderDocument {
    const node = getFormBuilderNode(document, nodeId);
    if (!node) {
      return document;
    }

    const scopeId = getFormBuilderNodeScopeId(document, nodeId);
    if (!scopeId) {
      return document;
    }

    const scopeNodes = getScopeNodes(document, scopeId);
    const siblings = [...scopeNodes]
      .filter((entry) => entry.parentId === node.parentId)
      .sort((left, right) => left.order - right.order);
    const currentIndex = siblings.findIndex((entry) => entry.id === nodeId);
    if (currentIndex === -1) {
      return document;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= siblings.length) {
      return document;
    }

    const reordered = [...siblings];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);
    const nextOrderMap = new Map(reordered.map((entry, index) => [entry.id, index]));

    return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
      ...uiSchema,
      nodes: uiSchema.nodes.map((entry) => {
        if (entry.parentId !== node.parentId) {
          return entry;
        }

        return {
          ...entry,
          order: nextOrderMap.get(entry.id) ?? entry.order,
        };
      }),
    }));
  }

  function reorderFormBuilderNode(
    document: FormBuilderDocument,
    activeNodeId: string,
    overNodeId: string,
  ): FormBuilderDocument {
    const activeNode = getFormBuilderNode(document, activeNodeId);
    const overNode = getFormBuilderNode(document, overNodeId);

    const scopeId = getFormBuilderNodeScopeId(document, activeNodeId);
    if (
      !activeNode ||
      !overNode ||
      !scopeId ||
      scopeId !== getFormBuilderNodeScopeId(document, overNodeId) ||
      activeNode.parentId !== overNode.parentId ||
      activeNode.id === overNode.id
    ) {
      return document;
    }

    const scopeNodes = getScopeNodes(document, scopeId);
    const siblings = [...scopeNodes]
      .filter((node) => node.parentId === activeNode.parentId)
      .sort((left, right) => left.order - right.order);
    const activeIndex = siblings.findIndex((node) => node.id === activeNodeId);
    const overIndex = siblings.findIndex((node) => node.id === overNodeId);

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return document;
    }

    const reordered = [...siblings];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);
    const nextOrderMap = new Map(reordered.map((entry, index) => [entry.id, index]));

    return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
      ...uiSchema,
      nodes: uiSchema.nodes.map((entry) => {
        if (entry.parentId !== activeNode.parentId) {
          return entry;
        }

        return {
          ...entry,
          order: nextOrderMap.get(entry.id) ?? entry.order,
        };
      }),
    }));
  }

  return {
    moveFormBuilderNode,
    removeFormBuilderNode,
    reorderFormBuilderNode,
  } as const;
}

function dedupeFieldIds(values: ReadonlyArray<string>) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function collectDescendantIds(nodes: ReadonlyArray<FormBuilderNode>, nodeId: string) {
  const descendantIds = new Set<string>([nodeId]);
  let changed = true;

  while (changed) {
    changed = false;

    nodes.forEach((node) => {
      if (node.parentId && descendantIds.has(node.parentId) && !descendantIds.has(node.id)) {
        descendantIds.add(node.id);
        changed = true;
      }
    });
  }

  return descendantIds;
}

function resequenceSiblingOrders(nodes: ReadonlyArray<FormBuilderNode>, parentId: string | null) {
  const siblings = [...nodes]
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order);
  const nextOrders = new Map(siblings.map((node, index) => [node.id, index]));

  return nodes.map((node) =>
    node.parentId === parentId
      ? {
          ...node,
          order: nextOrders.get(node.id) ?? node.order,
        }
      : node,
  );
}

function getFallbackSelectedNodeId(
  nodes: ReadonlyArray<FormBuilderNode>,
  parentId: string | null,
  getDefaultSelectedNodeIdForScope: (
    nodes: ReadonlyArray<FormBuilderNode>,
    allowNull: boolean,
  ) => string | null,
  options?: {
    allowNull?: boolean;
  },
) {
  const siblingCandidate = [...nodes]
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order)[0]?.id;

  if (siblingCandidate) {
    return siblingCandidate;
  }

  return getDefaultSelectedNodeIdForScope(nodes, options?.allowNull ?? false);
}
