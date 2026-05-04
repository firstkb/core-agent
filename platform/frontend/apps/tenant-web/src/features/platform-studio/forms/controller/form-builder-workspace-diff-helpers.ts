import {
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { type FormsPlaceholderModel } from "../forms-placeholder-data";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSchemaFieldId(field: unknown) {
  if (!isRecord(field)) {
    return "";
  }

  return getStringValue(field.id)
    || getStringValue(field.fieldId)
    || getStringValue(field.key);
}

function getSchemaFieldIds(fields: unknown) {
  if (!Array.isArray(fields)) {
    return [];
  }

  return [...new Set(fields.map(getSchemaFieldId).filter(Boolean))].sort();
}

function getSchemaScopeId(scope: Record<string, unknown>, fallback: string) {
  return getStringValue(scope.schemaScopeId)
    || getStringValue(scope.tableKey)
    || fallback;
}

function buildDataSchemaStructureSnapshot(dataSchema: Record<string, unknown>) {
  const rootScope = isRecord(dataSchema.rootScope) ? dataSchema.rootScope : {};
  const subformScopes = Array.isArray(dataSchema.subformScopes)
    ? dataSchema.subformScopes
    : [];

  return {
    rootScope: {
      fieldIds: getSchemaFieldIds(rootScope.fields),
      schemaScopeId: "root",
    },
    subformScopes: subformScopes
      .flatMap((entry, index) => {
        if (!isRecord(entry)) {
          return [];
        }

        return [{
          fieldIds: getSchemaFieldIds(entry.fields),
          schemaScopeId: getSchemaScopeId(entry, `subform-${index}`),
          subformType: getStringValue(entry.subformType) || "DEFAULT",
          tableKey: getStringValue(entry.tableKey) || getSchemaScopeId(entry, `subform-${index}`),
        }];
      })
      .sort((left, right) => left.schemaScopeId.localeCompare(right.schemaScopeId)),
  };
}

export function buildDataSchemaStructureSignature(dataSchema: Record<string, unknown>) {
  return JSON.stringify(buildDataSchemaStructureSnapshot(dataSchema));
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
