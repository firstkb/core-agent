import type {
  FormsPlaceholderField,
  FormsPlaceholderObject,
} from "../forms-placeholder-data";
import type { FormBuilderSubformType } from "../forms-builder-contract";
import type {
  FormBuilderDocument,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderScopeUiSchema,
} from "../forms-builder-state";
import {
  getFieldSchemaScopeKey,
  getModelSubformSchemaScopes,
} from "./form-builder-default-document";
import { reconcileFormBuilderDocumentWithLayoutBlueprint } from "./form-builder-blueprint-reconciliation";
import { createFormBuilderReconciliationAppendHelpers } from "./form-builder-reconciliation-append";
import { getBoundFieldIds } from "./form-builder-selectors";

type ReconciliationInternals = {
  appendScopeUnplacedFieldIds: (
    uiSchema: FormBuilderScopeUiSchema,
    fieldIds: ReadonlyArray<string>,
  ) => FormBuilderScopeUiSchema;
  createNode: (
    type: FormBuilderNodeType,
    parentId: string | null,
    order: number,
    partial?: Partial<FormBuilderNode>,
    idFactory?: (prefix: string) => string,
  ) => FormBuilderNode;
  dedupeFieldIds: (values: ReadonlyArray<string>) => string[];
  defaultNodeId: (prefix: string) => string;
  getNextOrderValue: (
    nodes: ReadonlyArray<FormBuilderNode>,
    parentId: string | null,
  ) => number;
  getScopeNodes: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
  ) => ReadonlyArray<FormBuilderNode>;
  isSubformType: (value: unknown) => value is FormBuilderSubformType;
  removeScopeUnplacedFieldId: (
    uiSchema: FormBuilderScopeUiSchema,
    fieldId: string,
  ) => FormBuilderScopeUiSchema;
  updateFormBuilderNode: (
    document: FormBuilderDocument,
    nodeId: string,
    patch: Partial<FormBuilderNode>,
  ) => FormBuilderDocument;
  updateScopeUiSchema: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
    updater: (uiSchema: FormBuilderScopeUiSchema) => FormBuilderScopeUiSchema,
    options?: { extraFieldIds?: ReadonlyArray<string> },
  ) => FormBuilderDocument;
  withFlatCompatibilityCache: (document: FormBuilderDocument) => FormBuilderDocument;
};

export function createFormBuilderReconciliationHelpers(internals: ReconciliationInternals) {
  const {
    appendFieldNodeToScope,
    appendFieldNodeToScopeParent,
    appendSubformNodeToRoot,
  } = createFormBuilderReconciliationAppendHelpers(internals);

  function reconcileFormBuilderDocumentWithModel(
    document: FormBuilderDocument,
    object: FormsPlaceholderObject,
    layoutBlueprint?: unknown,
    options?: {
      enforceCanonicalFieldPlacements?: boolean;
    },
  ) {
    const fieldById = new Map(object.fields.map((field) => [field.id, field]));
    let nextDocument = document;
    const scopeIdBySchemaScopeKey = new Map(
      document.subformScopes.map((scope) => [scope.tableKey, scope.scopeId]),
    );
    getModelSubformSchemaScopes(object).forEach((schemaScope) => {
      if (scopeIdBySchemaScopeKey.has(schemaScope.key)) {
        return;
      }

      const appended = appendSubformNodeToRoot(nextDocument, schemaScope);
      nextDocument = appended.document;
      scopeIdBySchemaScopeKey.set(schemaScope.key, appended.scopeId);
    });

    if (layoutBlueprint && typeof layoutBlueprint === "object") {
      return reconcileFormBuilderDocumentWithLayoutBlueprint({
        document: nextDocument,
        fieldById,
        internals: {
          appendFieldNodeToScopeParent,
          appendScopeUnplacedFieldIds: internals.appendScopeUnplacedFieldIds,
          createNode: internals.createNode,
          dedupeFieldIds: internals.dedupeFieldIds,
          defaultNodeId: internals.defaultNodeId,
          getScopeNodes: internals.getScopeNodes,
          isSubformType: internals.isSubformType,
          updateFormBuilderNode: internals.updateFormBuilderNode,
          updateScopeUiSchema: internals.updateScopeUiSchema,
        },
        layoutBlueprint,
        object,
        options,
      });
    }

    const assignedSubformFieldIds = new Set(
      nextDocument.subformScopes.flatMap((scope) =>
        scope.dataSchema.fieldIds.filter((fieldId) => fieldById.has(fieldId))
      ),
    );
    const boundFieldIds = getBoundFieldIds(nextDocument);

    nextDocument.subformScopes.forEach((scope) => {
      scope.dataSchema.fieldIds.forEach((fieldId) => {
        const field = fieldById.get(fieldId);
        if (!field || boundFieldIds.has(fieldId)) {
          return;
        }

        nextDocument = appendFieldNodeToScope(nextDocument, scope.scopeId, field);
        boundFieldIds.add(fieldId);
      });
    });

    object.fields.forEach((field: FormsPlaceholderField) => {
      if (boundFieldIds.has(field.id)) {
        return;
      }

      const schemaScopeKey = getFieldSchemaScopeKey(field);
      if (schemaScopeKey && schemaScopeKey !== "root") {
        const targetScopeId = scopeIdBySchemaScopeKey.get(schemaScopeKey);
        if (!targetScopeId) {
          return;
        }

        nextDocument = appendFieldNodeToScope(nextDocument, targetScopeId, field);
        boundFieldIds.add(field.id);
        return;
      }

      if (assignedSubformFieldIds.has(field.id)) {
        return;
      }

      nextDocument = appendFieldNodeToScope(nextDocument, "root", field);
      boundFieldIds.add(field.id);
    });

    return nextDocument;
  }

  return {
    reconcileFormBuilderDocumentWithModel,
  } as const;
}
