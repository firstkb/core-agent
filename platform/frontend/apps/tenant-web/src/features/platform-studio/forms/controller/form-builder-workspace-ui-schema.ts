import {
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { type FormsPlaceholderModel } from "../forms-placeholder-data";
import { getModelFieldLabel } from "./form-builder-workspace-field-scope-grid";
import { compileAuthoringScope } from "./form-builder-workspace-layout-compile";
import {
  compactFilterDefinitionsForUiSchema,
  compactSchemaRecord,
  compactSystemFieldsForUiSchema,
  compactUiNodeForSchema,
  compactViewSettingsForUiSchema,
} from "./form-builder-workspace-schema-compact";

export function buildCanonicalUiSchema(
  document: FormBuilderDocument,
  model: Pick<FormsPlaceholderModel, "fields">,
) {
  const fieldLabelById = new Map(
    model.fields.map((field) => [field.id, getModelFieldLabel(field)] as const),
  );
  const rootScope = compileAuthoringScope(
    "root",
    document.rootScope.uiSchema.nodes,
    document.rootScope.uiSchema.unplacedFieldIds,
  );
  const subformScopes = document.subformScopes.map((scope) => {
    const compiled = compileAuthoringScope(
      scope.tableKey,
      scope.uiSchema.nodes,
      scope.uiSchema.unplacedFieldIds,
    );

    return compactSchemaRecord({
      ...compiled.uiScope,
      nodes: compiled.uiScope.nodes
        .map((node) => compactUiNodeForSchema(node as FormBuilderNode, fieldLabelById)),
      ...(compactFilterDefinitionsForUiSchema(scope.filterDefinitions)
        ? { filterDefinitions: compactFilterDefinitionsForUiSchema(scope.filterDefinitions) }
        : {}),
      parentSubformNodeId: scope.parentSubformNodeId,
      ...(scope.runtime ? { runtime: scope.runtime } : {}),
      subformType: scope.subformType,
      tableKey: scope.tableKey,
      ...(compactViewSettingsForUiSchema(scope.viewSettings)
        ? { viewSettings: compactViewSettingsForUiSchema(scope.viewSettings) }
        : {}),
    });
  });

  return {
    rootScope: compactSchemaRecord({
      ...rootScope.uiScope,
      nodes: rootScope.uiScope.nodes
        .map((node) => compactUiNodeForSchema(node as FormBuilderNode, fieldLabelById)),
      ...(compactFilterDefinitionsForUiSchema(document.filterDefinitions)
        ? { filterDefinitions: compactFilterDefinitionsForUiSchema(document.filterDefinitions) }
        : {}),
      ...(document.rootScope.runtime ? { runtime: document.rootScope.runtime } : {}),
      ...(compactSystemFieldsForUiSchema(document.systemFields)
        ? { systemFields: compactSystemFieldsForUiSchema(document.systemFields) }
        : {}),
      ...(compactViewSettingsForUiSchema(document.viewSettings)
        ? { viewSettings: compactViewSettingsForUiSchema(document.viewSettings) }
        : {}),
    }),
    subformScopes,
  } satisfies Record<string, unknown>;
}
