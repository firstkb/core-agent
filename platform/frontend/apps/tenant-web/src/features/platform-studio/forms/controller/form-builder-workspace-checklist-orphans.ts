import {
  cloneFormsPlaceholderModel,
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { getFieldSchemaScopeId, isRecord } from "./form-builder-workspace-schema-utils";

const checklistRootOrphanFieldIds = new Set(["item", "result", "notes"]);

function getRootUnplacedFieldIds(layoutBlueprint: unknown) {
  if (!isRecord(layoutBlueprint) || !isRecord(layoutBlueprint.rootScope)) {
    return new Set<string>();
  }

  const values = Array.isArray(layoutBlueprint.rootScope.unplacedFieldIds)
    ? layoutBlueprint.rootScope.unplacedFieldIds
    : [];

  return new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0));
}

function isRootChecklistManagedField(field: FormsPlaceholderField) {
  if (getFieldSchemaScopeId(field) !== "root" || !checklistRootOrphanFieldIds.has(field.id)) {
    return false;
  }

  switch (field.id) {
    case "item":
      return field.kind === "db_lookup" && field.storageKey === "item";
    case "result":
      return field.kind === "single_select"
        && field.storageKey === "result"
        && field.options?.includes("Yes")
        && field.options?.includes("No")
        && field.options?.includes("N/A");
    case "notes":
      return field.kind === "long_text" && field.storageKey === "notes";
    default:
      return false;
  }
}

function hasChecklistSubformScope(model: FormsPlaceholderModel) {
  return (model.schemaScopes ?? []).some((scope) => scope.subformType === "CHECKLIST")
    || model.fields.some((field) =>
      getFieldSchemaScopeId(field) !== "root"
      && (field.id.startsWith("item-") || field.id.startsWith("result-") || field.id.startsWith("notes-")));
}

export function pruneLeakedChecklistRootFields(
  model: FormsPlaceholderModel,
  layoutBlueprint: unknown,
) {
  if (!hasChecklistSubformScope(model)) {
    return model;
  }

  const rootUnplacedFieldIds = getRootUnplacedFieldIds(layoutBlueprint);
  const orphanIds = new Set(
    model.fields
      .filter((field) => rootUnplacedFieldIds.has(field.id) && isRootChecklistManagedField(field))
      .map((field) => field.id),
  );

  if (orphanIds.size === 0) {
    return model;
  }

  return cloneFormsPlaceholderModel({
    ...model,
    fields: model.fields.filter((field) => !orphanIds.has(field.id)),
  });
}
