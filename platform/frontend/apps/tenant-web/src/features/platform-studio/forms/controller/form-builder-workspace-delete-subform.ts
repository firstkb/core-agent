import {
  createPersistedFormBuilderDocument,
  normalizePersistedFormBuilderDocument,
  removeFormBuilderNode,
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import {
  cloneFormsPlaceholderModel,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import {
  deriveModelSchemaScopes,
  getFieldSchemaScopeId,
} from "./form-builder-workspace-schema-utils";

function getSubformRemovalScopeKeys(
  document: FormBuilderDocument,
  node: Pick<FormBuilderNode, "id" | "schemaScopeId" | "tableKey">,
) {
  const scope = document.subformScopes.find((entry) => entry.parentSubformNodeId === node.id);

  return new Set(
    [
      scope?.tableKey,
      node.tableKey,
      node.schemaScopeId,
    ].filter((value): value is string => Boolean(value?.trim())),
  );
}

function getSubformRemovalFieldIds(
  document: FormBuilderDocument,
  node: Pick<FormBuilderNode, "id">,
) {
  const scope = document.subformScopes.find((entry) => entry.parentSubformNodeId === node.id);

  return new Set(scope?.dataSchema.fieldIds ?? []);
}

export function removeFormBuilderSubformFromDocumentAndModel({
  document,
  model,
  node,
  view,
}: {
  document: FormBuilderDocument;
  model: FormsPlaceholderModel;
  node: Pick<FormBuilderNode, "id" | "schemaScopeId" | "tableKey" | "type">;
  view: FormsPlaceholderView;
}) {
  if (node.type !== "subform") {
    return {
      document: removeFormBuilderNode(document, node.id),
      model,
    };
  }

  const removedScopeKeys = getSubformRemovalScopeKeys(document, node);
  const removedFieldIds = getSubformRemovalFieldIds(document, node);
  const documentWithoutSubform = removeFormBuilderNode(document, node.id);
  const nextModelBase = cloneFormsPlaceholderModel({
    ...model,
    fields: model.fields.filter((field) =>
      !removedFieldIds.has(field.id) && !removedScopeKeys.has(getFieldSchemaScopeId(field)),
    ),
    schemaScopes: (model.schemaScopes ?? []).filter((scope) => !removedScopeKeys.has(scope.key)),
  });
  const nextDocument = normalizePersistedFormBuilderDocument(
    createPersistedFormBuilderDocument(documentWithoutSubform),
    nextModelBase,
    view,
  );
  const nextModel = cloneFormsPlaceholderModel({
    ...nextModelBase,
    schemaScopes: deriveModelSchemaScopes(nextModelBase, nextDocument),
  });

  return {
    document: nextDocument,
    model: nextModel,
  };
}
