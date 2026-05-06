import { type useTranslation } from "@platform/i18n";

import { type FormBuilderDocument } from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import { getLookupDerivedOutputDefinitions } from "./form-builder-workspace-lookup-derived-outputs";
import { toStorageKey } from "./form-builder-workspace-storage-keys";
import { buildCanonicalDataSchema } from "./form-builder-workspace-data-schema";
import { getFieldSchemaScopeId } from "./form-builder-workspace-schema-utils";
import { buildCanonicalUiSchema } from "./form-builder-workspace-ui-schema";

type Translate = ReturnType<typeof useTranslation>["t"];

function buildCompiledRuntimeFieldMappings(
  fields: ReadonlyArray<FormsPlaceholderField>,
  t: Translate,
) {
  return fields.map((field) => {
    const storageKey = field.storageKey ?? toStorageKey(field.id);
    const selectionMode = field.selectionMode ?? "single";
    const storageMode = field.kind === "db_lookup" && selectionMode === "multiple"
      ? "multi_value"
      : "column";

    return {
      fieldId: field.id,
      kind: field.kind,
      storageKey,
      storageMode,
      physicalColumnName: storageMode === "multi_value"
        ? null
        : field.kind === "db_lookup"
          ? `${storageKey}_id`
          : storageKey,
      dataViewColumnName: storageKey,
      lookupOutputColumns: field.kind === "db_lookup"
        ? Object.fromEntries(
            getLookupDerivedOutputDefinitions(field, t).map((output) => [output.outputKey, output.columnName] as const),
          )
        : {},
    };
  });
}

function buildCompiledRuntimeMapping(
  document: FormBuilderDocument,
  model: Pick<FormsPlaceholderModel, "fields">,
  t: Translate,
) {
  const rootFields = model.fields.filter((field) => getFieldSchemaScopeId(field) === "root");

  return {
    dataScopes: [
      {
        schemaScopeId: "root",
        ...document.rootScope.dataSchema.runtime,
        fields: buildCompiledRuntimeFieldMappings(rootFields, t),
      },
      ...document.subformScopes.map((scope) => ({
        schemaScopeId: scope.tableKey,
        ...scope.dataSchema.runtime,
        fields: buildCompiledRuntimeFieldMappings(
          model.fields.filter((field) => getFieldSchemaScopeId(field) === scope.tableKey),
          t,
        ),
      })),
    ],
    viewScopes: [
      {
        schemaScopeId: "root",
        ...document.rootScope.runtime,
      },
      ...document.subformScopes.map((scope) => ({
        schemaScopeId: scope.tableKey,
        ...scope.runtime,
      })),
    ],
  } satisfies Record<string, unknown>;
}

export function compileDebugSchemas(
  document: FormBuilderDocument,
  model: FormsPlaceholderModel,
  view: FormsPlaceholderView,
  layoutBlueprint: Record<string, unknown>,
  t: Translate,
) {
  return {
    modelSchema: {
      dataSchema: buildCanonicalDataSchema(model, document),
      layoutBlueprint,
    },
    compiledRuntime: buildCompiledRuntimeMapping(document, model, t),
    uiSchema: {
      isDefault: view.isDefault,
      viewId: view.id,
      viewKey: view.key,
      ...buildCanonicalUiSchema(document, model),
    },
  };
}
