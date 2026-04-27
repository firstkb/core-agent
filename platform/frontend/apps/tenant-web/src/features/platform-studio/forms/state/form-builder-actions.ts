import type { FormsPlaceholderField } from "../forms-placeholder-data";
import { getFormsPlaceholderFieldDisplayName } from "../forms-placeholder-data";
import type { FormBuilderDocument, FormBuilderNode, FormBuilderNodeType, FormBuilderScopeUiSchema, FormBuilderSubformScope } from "../forms-builder-state";
import { isFormBuilderContainer } from "./form-builder-palette-selectors";
import { createFormBuilderNodeActions } from "./form-builder-node-actions";
import { getActiveFormBuilderScope, getAllowedChildNodeTypes, getBoundFieldIds, getFormBuilderNode, getFormBuilderNodeScopeId } from "./form-builder-selectors";

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
type AppendScopeUnplacedFieldIds = (uiSchema: FormBuilderScopeUiSchema, fieldIds: ReadonlyArray<string>) => FormBuilderScopeUiSchema;
type FinalizeScopedDocument = (document: FormBuilderDocument, extraFieldIds?: ReadonlyArray<string>) => FormBuilderDocument;

type CreateNode = (
  type: FormBuilderNodeType,
  parentId: string | null,
  order: number,
  partial?: Partial<FormBuilderNode>,
  idFactory?: (prefix: string) => string,
) => FormBuilderNode;

export type FormBuilderActionInternals = {
  appendScopeUnplacedFieldIds: AppendScopeUnplacedFieldIds;
  createNode: CreateNode;
  finalizeScopedDocument: FinalizeScopedDocument;
  getDefaultSelectedNodeIdForScope: (
    nodes: ReadonlyArray<FormBuilderNode>,
    allowNull: boolean,
  ) => string | null;
  getNextOrderValue: (
    nodes: ReadonlyArray<FormBuilderNode>,
    parentId: string | null,
  ) => number;
  getScopeNodes: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
  ) => ReadonlyArray<FormBuilderNode>;
  getSubformScope: GetSubformScope;
  removeScopeUnplacedFieldId: (
    uiSchema: FormBuilderScopeUiSchema,
    fieldId: string,
  ) => FormBuilderScopeUiSchema;
  updateScopeUiSchema: UpdateScopeUiSchema;
  withFlatCompatibilityCache: (document: FormBuilderDocument) => FormBuilderDocument;
};

export function createFormBuilderActions({
  appendScopeUnplacedFieldIds,
  createNode,
  finalizeScopedDocument,
  getDefaultSelectedNodeIdForScope,
  getNextOrderValue,
  getScopeNodes,
  getSubformScope,
  removeScopeUnplacedFieldId,
  updateScopeUiSchema,
  withFlatCompatibilityCache,
}: FormBuilderActionInternals) {
  function updateFormBuilderNode(
    document: FormBuilderDocument,
    nodeId: string,
    updates: Partial<FormBuilderNode>,
  ): FormBuilderDocument {
    const scopeId = getFormBuilderNodeScopeId(document, nodeId);
    if (!scopeId) {
      return document;
    }

    return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
      ...uiSchema,
      nodes: uiSchema.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              ...updates,
            }
          : node),
    }));
  }

  function setFormBuilderCurrentParent(
    document: FormBuilderDocument,
    parentId: string | null,
  ): FormBuilderDocument {
    if (!parentId) {
      return withFlatCompatibilityCache({
        ...document,
        activeScopeId: "root",
        rootScope: {
          ...document.rootScope,
          uiSchema: {
            ...document.rootScope.uiSchema,
            currentParentId: null,
            selectedNodeId:
              document.rootScope.uiSchema.selectedNodeId ??
              getDefaultSelectedNodeIdForScope(document.rootScope.uiSchema.nodes, false),
          },
        },
      });
    }

    const parentNode = getFormBuilderNode(document, parentId);
    if (!parentNode || !isFormBuilderContainer(parentNode.type)) {
      return document;
    }

    const scopeId = parentNode.type === "subform"
      ? parentNode.id
      : (getFormBuilderNodeScopeId(document, parentNode.id) ?? "root");

    if (scopeId === "root") {
      return withFlatCompatibilityCache({
        ...document,
        activeScopeId: "root",
        rootScope: {
          ...document.rootScope,
          uiSchema: {
            ...document.rootScope.uiSchema,
            currentParentId: parentNode.id,
            selectedNodeId: parentNode.id,
          },
        },
      });
    }

    const subformScope = getSubformScope(document, scopeId);
    if (!subformScope) {
      return document;
    }

    return withFlatCompatibilityCache({
      ...document,
      activeScopeId: scopeId,
      subformScopes: document.subformScopes.map((scope) =>
        scope.scopeId === scopeId
          ? {
              ...scope,
              uiSchema: {
                ...scope.uiSchema,
                currentParentId: parentNode.type === "subform" ? null : parentNode.id,
                selectedNodeId: parentNode.type === "subform"
                  ? (scope.uiSchema.nodes.find((node) => node.parentId === null)?.id ?? null)
                  : parentNode.id,
              },
            }
          : scope,
      ),
    });
  }

  function selectFormBuilderNode(
    document: FormBuilderDocument,
    nodeId: string | null,
  ): FormBuilderDocument {
    if (!nodeId) {
      const activeScope = getActiveFormBuilderScope(document);
      return updateScopeUiSchema(document, activeScope.scopeId, (uiSchema) => ({
        ...uiSchema,
        selectedNodeId: null,
      }));
    }

    const scopeId = getFormBuilderNodeScopeId(document, nodeId);
    if (!scopeId || !getFormBuilderNode(document, nodeId)) {
      return document;
    }

    if (scopeId === "root") {
      return withFlatCompatibilityCache({
        ...document,
        activeScopeId: "root",
        rootScope: {
          ...document.rootScope,
          uiSchema: {
            ...document.rootScope.uiSchema,
            selectedNodeId: nodeId,
          },
        },
      });
    }

    return withFlatCompatibilityCache({
      ...document,
      activeScopeId: scopeId,
      subformScopes: document.subformScopes.map((scope) =>
        scope.scopeId === scopeId
          ? {
              ...scope,
              uiSchema: {
                ...scope.uiSchema,
                selectedNodeId: nodeId,
              },
            }
          : scope,
      ),
    });
  }

  function addFormBuilderElementNode(
    document: FormBuilderDocument,
    parentId: string | null,
    nodeType: Exclude<FormBuilderNodeType, "field">,
    initialNode?: Partial<FormBuilderNode>,
    idFactory?: (prefix: string) => string,
  ): FormBuilderDocument {
    const parentNode = getFormBuilderNode(document, parentId);
    const activeScope = getActiveFormBuilderScope(document);
    const targetScopeId = parentNode?.type === "subform"
      ? parentNode.id
      : (parentNode ? (getFormBuilderNodeScopeId(document, parentNode.id) ?? "root") : activeScope.scopeId);
    const localParentId = parentNode?.type === "subform" ? null : parentId;
    const parentType = parentNode?.type ?? (activeScope.scopeType === "SUBFORM" ? "subform" : null);
    const allowedTypes = getAllowedChildNodeTypes(parentType);
    if (!allowedTypes.includes(nodeType)) {
      return document;
    }

    const scopeNodes = getScopeNodes(document, targetScopeId);
    const nextNode = createNode(nodeType, localParentId, getNextOrderValue(scopeNodes, localParentId), initialNode, idFactory);

    return updateScopeUiSchema(document, targetScopeId, (uiSchema) => ({
      ...uiSchema,
      nodes: [...uiSchema.nodes, nextNode],
      selectedNodeId: nextNode.id,
    }));
  }

  function addFormBuilderFieldNode(
    document: FormBuilderDocument,
    parentId: string | null,
    field: FormsPlaceholderField,
    idFactory?: (prefix: string) => string,
  ): FormBuilderDocument {
    const parentNode = getFormBuilderNode(document, parentId);
    const activeScope = getActiveFormBuilderScope(document);
    const targetScopeId = parentNode?.type === "subform"
      ? parentNode.id
      : (parentNode ? (getFormBuilderNodeScopeId(document, parentNode.id) ?? "root") : activeScope.scopeId);
    const localParentId = parentNode?.type === "subform" ? null : parentId;
    const parentType = parentNode?.type ?? (activeScope.scopeType === "SUBFORM" ? "subform" : null);
    const allowedTypes = getAllowedChildNodeTypes(parentType);
    if (!allowedTypes.includes("field")) {
      return document;
    }

    if (getBoundFieldIds(document).has(field.id)) {
      return document;
    }

    const nextNode = createNode(
      "field",
      localParentId,
      getNextOrderValue(getScopeNodes(document, targetScopeId), localParentId),
      {
        fieldId: field.id,
        helperText: "",
        title: getFormsPlaceholderFieldDisplayName(field),
      },
      idFactory,
    );

    return updateScopeUiSchema(document, targetScopeId, (uiSchema) => ({
      ...removeScopeUnplacedFieldId(uiSchema, field.id),
      nodes: [...uiSchema.nodes, nextNode],
      selectedNodeId: nextNode.id,
    }), { extraFieldIds: [field.id] });
  }

  const nodeActions = createFormBuilderNodeActions({
    appendScopeUnplacedFieldIds,
    finalizeScopedDocument,
    getDefaultSelectedNodeIdForScope,
    getScopeNodes,
    getSubformScope,
    updateScopeUiSchema,
  });

  return {
    addFormBuilderElementNode,
    addFormBuilderFieldNode,
    ...nodeActions,
    selectFormBuilderNode,
    setFormBuilderCurrentParent,
    updateFormBuilderNode,
  } as const;
}
