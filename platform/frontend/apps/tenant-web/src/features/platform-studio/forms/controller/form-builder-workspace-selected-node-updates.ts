import {
  updateFormBuilderNode,
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import {
  createUniqueFormsPlaceholderStorageKey,
  type FormsPlaceholderField,
} from "../forms-placeholder-data";
import { getModelFieldLabel } from "./form-builder-workspace-field-scope-grid";
import { isPersistedModelField } from "./form-builder-workspace-normalization-helpers";
import { getCompatibleRuntimePresets } from "./form-builder-workspace-rule-helpers";

export function applySelectedNodeRequiredUpdate(
  document: FormBuilderDocument,
  nodeId: string,
  required: boolean,
) {
  return updateFormBuilderNode(document, nodeId, { required });
}

export function applySelectedNodeTextUpdate(
  document: FormBuilderDocument,
  nodeId: string,
  text: string,
) {
  return updateFormBuilderNode(document, nodeId, { text });
}

export function applySelectedNodeTitleUpdate(
  document: FormBuilderDocument,
  nodeId: string,
  title: string,
) {
  return updateFormBuilderNode(document, nodeId, { title });
}

export function applySelectedNodeVisibilityUpdate(
  document: FormBuilderDocument,
  node: Pick<FormBuilderNode, "id" | "runtimePreset" | "type">,
  field: FormsPlaceholderField | null,
  visibility: FormBuilderNode["visibility"],
) {
  if (node.type !== "field") {
    return updateFormBuilderNode(document, node.id, { visibility });
  }

  const nextRuntimePresets = field
    ? getCompatibleRuntimePresets(field, visibility)
    : [];

  return updateFormBuilderNode(document, node.id, {
    runtimePreset: node.runtimePreset && !nextRuntimePresets.includes(node.runtimePreset)
      ? undefined
      : node.runtimePreset,
    visibility,
  });
}

export function applySelectedFieldTitleUpdate({
  field,
  fields,
  title,
}: {
  field: FormsPlaceholderField;
  fields: ReadonlyArray<FormsPlaceholderField>;
  title: string;
}) {
  const nextModelLabel = title.trim() || getModelFieldLabel(field);

  return {
    ...field,
    displayName: nextModelLabel,
    label: nextModelLabel,
    ...(!isPersistedModelField(field)
      ? {
          storageKey: createUniqueFormsPlaceholderStorageKey(
            nextModelLabel,
            field.id,
            fields,
            {
              excludeFieldId: field.id,
              schemaScopeKey: field.schemaScopeKey,
            },
          ),
        }
      : {}),
  };
}
