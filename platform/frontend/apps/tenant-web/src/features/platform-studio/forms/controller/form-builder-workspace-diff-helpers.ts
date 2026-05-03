import {
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { type FormsPlaceholderModel } from "../forms-placeholder-data";

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

export function buildDataSchemaStructureSignature(dataSchema: Record<string, unknown>) {
  return JSON.stringify(pruneStructureMetadata(dataSchema));
}

function getAllFormBuilderDocumentNodes(document: FormBuilderDocument) {
  return [
    ...document.rootScope.uiSchema.nodes,
    ...document.subformScopes.flatMap((scope) => scope.uiSchema.nodes),
  ];
}

function createFormBuilderDocumentNodeIndex(document: FormBuilderDocument) {
  const nodeById = new Map<string, FormBuilderNode>();
  const parentSubformNodeIdByNodeId = new Map<string, string>();

  document.rootScope.uiSchema.nodes.forEach((node) => {
    nodeById.set(node.id, node);
  });
  document.subformScopes.forEach((scope) => {
    scope.uiSchema.nodes.forEach((node) => {
      nodeById.set(node.id, node);
      parentSubformNodeIdByNodeId.set(node.id, scope.parentSubformNodeId);
    });
  });

  return {
    nodeById,
    parentSubformNodeIdByNodeId,
  };
}

export function getCanvasAttentionNodeIds(
  currentDocument: FormBuilderDocument,
  savedDocument: FormBuilderDocument,
  currentModel: FormsPlaceholderModel,
  savedModel: FormsPlaceholderModel,
) {
  const currentNodes = getAllFormBuilderDocumentNodes(currentDocument);
  const currentNodeIndex = createFormBuilderDocumentNodeIndex(currentDocument);
  const savedNodeIndex = createFormBuilderDocumentNodeIndex(savedDocument);
  const currentNodeById = currentNodeIndex.nodeById;
  const savedNodeById = savedNodeIndex.nodeById;
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
    nodeIndex: ReturnType<typeof createFormBuilderDocumentNodeIndex>,
    startNodeId: string,
  ) => {
    let cursor: string | null = startNodeId;
    const visitedNodeIds = new Set<string>();

    while (cursor && !visitedNodeIds.has(cursor)) {
      visitedNodeIds.add(cursor);
      if (currentNodeById.has(cursor)) {
        attentionNodeIds.add(cursor);
      }

      const node = nodeIndex.nodeById.get(cursor);
      if (!node) {
        break;
      }

      cursor = node.parentId ?? nodeIndex.parentSubformNodeIdByNodeId.get(cursor) ?? null;
    }
  };

  directlyChangedNodeIds.forEach((nodeId) => {
    appendAncestorChain(currentNodeIndex, nodeId);
    appendAncestorChain(savedNodeIndex, nodeId);
  });

  return attentionNodeIds;
}
