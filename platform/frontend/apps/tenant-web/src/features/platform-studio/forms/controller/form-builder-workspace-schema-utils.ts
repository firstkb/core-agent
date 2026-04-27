import {
  type FormBuilderDocument,
} from "../forms-builder-state";
import {
  cloneFormsPlaceholderModel,
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
  type FormsPlaceholderSchemaScope,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function dedupeStringValues(values: ReadonlyArray<string>) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function getFieldSchemaScopeId(field: Pick<FormsPlaceholderField, "schemaScopeKey">) {
  const normalizedScopeKey = field.schemaScopeKey?.trim();
  return normalizedScopeKey && normalizedScopeKey.length > 0
    ? normalizedScopeKey
    : "root";
}

export function humanizeAuthoringSchemaScopeKey(value: string) {
  return value
    .replace(/^pb_/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Subform";
}

export function getModelSubformScopeDefinitions(model: FormsPlaceholderModel) {
  const scopes = new Map(
    (model.schemaScopes ?? []).map((scope) => [scope.key, scope]),
  );

  model.fields.forEach((field) => {
    const scopeId = getFieldSchemaScopeId(field);
    if (scopeId === "root" || scopes.has(scopeId)) {
      return;
    }

    scopes.set(scopeId, {
      displayName: humanizeAuthoringSchemaScopeKey(scopeId),
      key: scopeId,
      scopeType: "SUBFORM" as const,
      subformType: "DEFAULT" as const,
    });
  });

  return [...scopes.values()];
}

export function createEmptyLayoutBlueprint(model: FormsPlaceholderModel) {
  return {
    rootScope: {
      containers: [],
      fieldPlacements: [],
      schemaScopeId: "root",
      unplacedFieldIds: [],
    },
    subformScopes: getModelSubformScopeDefinitions(model).map((scope) => ({
      containers: [],
      fieldPlacements: [],
      schemaScopeId: scope.key,
      unplacedFieldIds: [],
    })),
  } satisfies Record<string, unknown>;
}

export function getScopeSchemaScopeKey(scope: { scopeType: "ROOT" } | { scopeType: "SUBFORM"; tableKey: string }) {
  return scope.scopeType === "SUBFORM" ? scope.tableKey : "root";
}

export function getDocumentFieldSchemaScopeKey(
  currentDocument: FormBuilderDocument,
  fieldId: string,
) {
  const subformScope = currentDocument.subformScopes.find((scope) => scope.dataSchema.fieldIds.includes(fieldId));
  if (subformScope) {
    return subformScope.tableKey;
  }

  return currentDocument.rootScope.dataSchema.fieldIds.includes(fieldId) ? "root" : null;
}

export function deriveModelSchemaScopes(
  modelDraft: FormsPlaceholderModel,
  currentDocument: FormBuilderDocument,
): ReadonlyArray<FormsPlaceholderSchemaScope> {
  const nextScopes = new Map(
    (modelDraft.schemaScopes ?? []).map((scope) => [scope.key, scope]),
  );
  const subformNodeById = new Map(
    currentDocument.rootScope.uiSchema.nodes
      .filter((node) => node.type === "subform")
      .map((node) => [node.id, node]),
  );

  currentDocument.subformScopes.forEach((scope) => {
    const key = scope.tableKey.trim();
    if (!key) {
      return;
    }

    nextScopes.set(key, {
      displayName:
        subformNodeById.get(scope.parentSubformNodeId)?.title?.trim()
        || nextScopes.get(key)?.displayName
        || humanizeAuthoringSchemaScopeKey(key),
      key,
      scopeType: "SUBFORM",
      subformType: scope.subformType,
    });
  });

  return [...nextScopes.values()];
}

export function replaceModelViewById(
  model: FormsPlaceholderModel,
  nextView: FormsPlaceholderView,
) {
  const hasExistingView = model.screens.some((screen) => screen.id === nextView.id);
  return cloneFormsPlaceholderModel({
    ...model,
    screens: hasExistingView
      ? model.screens.map((screen) => (screen.id === nextView.id ? nextView : screen))
      : [...model.screens, nextView],
  });
}
