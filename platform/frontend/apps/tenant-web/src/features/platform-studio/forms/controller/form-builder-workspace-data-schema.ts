import { type FormBuilderDocument } from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { compactSchemaRecord } from "./form-builder-workspace-schema-compact";
import {
  getFieldSchemaScopeId,
  getModelSubformScopeDefinitions,
} from "./form-builder-workspace-schema-utils";

function serializeModelFieldForDataSchema(field: FormsPlaceholderField) {
  const serializedField: Record<string, unknown> = {
    ...field,
  };

  delete serializedField.displayName;
  delete serializedField.fieldId;
  delete serializedField.isPersisted;
  delete serializedField.key;
  delete serializedField.schemaScopeId;
  delete serializedField.schemaScopeKey;

  if (serializedField.autocomplete === "on") {
    delete serializedField.autocomplete;
  }
  if (serializedField.isLocked === false) {
    delete serializedField.isLocked;
  }
  if (serializedField.status === "persisted") {
    delete serializedField.status;
  }

  return compactSchemaRecord(serializedField);
}

export function buildCanonicalDataSchema(
  model: FormsPlaceholderModel,
  document?: FormBuilderDocument,
) {
  const rootFields = model.fields
    .filter((field) => getFieldSchemaScopeId(field) === "root")
    .map(serializeModelFieldForDataSchema);
  const subformDataRuntimeByTableKey = new Map(
    (document?.subformScopes ?? []).flatMap((scope) =>
      scope.dataSchema.runtime ? [[scope.tableKey, scope.dataSchema.runtime] as const] : []),
  );
  const subformScopes = getModelSubformScopeDefinitions(model).map((scope) => ({
    displayName: scope.displayName,
    fields: model.fields
      .filter((field) => getFieldSchemaScopeId(field) === scope.key)
      .map(serializeModelFieldForDataSchema),
    ...(subformDataRuntimeByTableKey.get(scope.key)
      ? { runtime: subformDataRuntimeByTableKey.get(scope.key) }
      : {}),
    schemaScopeId: scope.key,
    subformType: scope.subformType,
    tableKey: scope.key,
  }));

  return {
    modelId: model.id,
    modelTitle: model.title,
    rootScope: {
      fields: rootFields,
      ...(document?.rootScope.dataSchema.runtime
        ? { runtime: document.rootScope.dataSchema.runtime }
        : {}),
      schemaScopeId: "root",
    },
    subformScopes,
  } satisfies Record<string, unknown>;
}
