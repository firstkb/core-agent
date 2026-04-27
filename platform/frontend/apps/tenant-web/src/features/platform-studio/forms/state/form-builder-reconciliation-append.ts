import type { FormsPlaceholderField } from "../forms-placeholder-data";
import { getFormsPlaceholderFieldDisplayName } from "../forms-placeholder-data";
import type {
  FormBuilderDocument,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderScopeUiSchema,
} from "../forms-builder-state";
import type { FormBuilderModelSubformSchemaScope } from "./form-builder-default-document";

type ReconciliationAppendInternals = {
  createNode: (
    type: FormBuilderNodeType,
    parentId: string | null,
    order: number,
    partial?: Partial<FormBuilderNode>,
    idFactory?: (prefix: string) => string,
  ) => FormBuilderNode;
  getNextOrderValue: (
    nodes: ReadonlyArray<FormBuilderNode>,
    parentId: string | null,
  ) => number;
  getScopeNodes: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
  ) => ReadonlyArray<FormBuilderNode>;
  removeScopeUnplacedFieldId: (
    uiSchema: FormBuilderScopeUiSchema,
    fieldId: string,
  ) => FormBuilderScopeUiSchema;
  updateScopeUiSchema: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
    updater: (uiSchema: FormBuilderScopeUiSchema) => FormBuilderScopeUiSchema,
    options?: { extraFieldIds?: ReadonlyArray<string> },
  ) => FormBuilderDocument;
  withFlatCompatibilityCache: (document: FormBuilderDocument) => FormBuilderDocument;
};

export function createFormBuilderReconciliationAppendHelpers({
  createNode,
  getNextOrderValue,
  getScopeNodes,
  removeScopeUnplacedFieldId,
  updateScopeUiSchema,
  withFlatCompatibilityCache,
}: ReconciliationAppendInternals) {
  function appendFieldNodeToScope(
    document: FormBuilderDocument,
    scopeId: "root" | string,
    field: FormsPlaceholderField,
    idFactory?: (prefix: string) => string,
  ) {
    const scopeNodes = getScopeNodes(document, scopeId);
    const preferredParentId = findPreferredFieldParentIdInScopeNodes(scopeNodes, null);
    const nextNode = createNode(
      "field",
      preferredParentId,
      getNextOrderValue(scopeNodes, preferredParentId),
      {
        fieldId: field.id,
        helperText: "",
        title: getFormsPlaceholderFieldDisplayName(field),
      },
      idFactory,
    );

    return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
      ...removeScopeUnplacedFieldId(uiSchema, field.id),
      nodes: [...uiSchema.nodes, nextNode],
    }), { extraFieldIds: [field.id] });
  }

  function appendSubformNodeToRoot(
    document: FormBuilderDocument,
    schemaScope: FormBuilderModelSubformSchemaScope,
    idFactory?: (prefix: string) => string,
  ) {
    const nextNode = createNode(
      "subform",
      null,
      getNextOrderValue(document.rootScope.uiSchema.nodes, null),
      {
        schemaScopeId: schemaScope.key,
        subformType: schemaScope.subformType,
        tableKey: schemaScope.key,
        title: schemaScope.displayName,
      },
      idFactory,
    );

    const nextDocument = updateScopeUiSchema(document, "root", (uiSchema) => ({
      ...uiSchema,
      nodes: [...uiSchema.nodes, nextNode],
    }));

    return {
      document: withFlatCompatibilityCache({
        ...nextDocument,
        subformScopes: nextDocument.subformScopes.map((scope) =>
          scope.parentSubformNodeId === nextNode.id
            ? {
                ...scope,
                subformType: schemaScope.subformType,
                tableKey: schemaScope.key,
              }
            : scope,
        ),
      }),
      scopeId: nextNode.id,
    };
  }

  function appendFieldNodeToScopeParent(
    document: FormBuilderDocument,
    scopeId: "root" | string,
    parentId: string | null,
    field: FormsPlaceholderField,
    order?: number,
    idFactory?: (prefix: string) => string,
  ) {
    const scopeNodes = getScopeNodes(document, scopeId);
    const nextNode = createNode(
      "field",
      parentId,
      order ?? getNextOrderValue(scopeNodes, parentId),
      {
        fieldId: field.id,
        helperText: "",
        title: getFormsPlaceholderFieldDisplayName(field),
      },
      idFactory,
    );

    return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
      ...removeScopeUnplacedFieldId(uiSchema, field.id),
      nodes: [...uiSchema.nodes, nextNode],
    }), { extraFieldIds: [field.id] });
  }

  return {
    appendFieldNodeToScope,
    appendFieldNodeToScopeParent,
    appendSubformNodeToRoot,
  } as const;
}

function findPreferredFieldParentIdInScopeNodes(
  nodes: ReadonlyArray<FormBuilderNode>,
  parentId: string | null,
): string | null {
  const children = [...nodes]
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order);

  for (const child of children) {
    if (
      child.type === "section" ||
      child.type === "accordion_item" ||
      child.type === "group" ||
      child.type === "column" ||
      child.type === "tab_item"
    ) {
      return child.id;
    }

    if (child.type === "grid" || child.type === "tabs" || child.type === "accordion") {
      const nestedParentId = findPreferredFieldParentIdInScopeNodes(nodes, child.id);
      if (nestedParentId) {
        return nestedParentId;
      }
    }
  }

  return null;
}
