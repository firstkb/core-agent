import {
  formBuilderScopeRootPlacementKey,
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { toStorageKey } from "./form-builder-workspace-storage-keys";
import {
  dedupeStringValues,
  humanizeAuthoringSchemaScopeKey,
} from "./form-builder-workspace-schema-utils";

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

export function compileAuthoringScope(
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
              checklistConfig: node.subformType === "CHECKLIST" ? node.checklistConfig : undefined,
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

export function buildCanonicalLayoutBlueprint(
  document: FormBuilderDocument,
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
