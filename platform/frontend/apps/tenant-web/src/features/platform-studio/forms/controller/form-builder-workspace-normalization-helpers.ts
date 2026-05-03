import {
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderFieldOptionStyle,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { getModelFieldLabel } from "./form-builder-workspace-field-scope-grid";

export function isPersistedModelField(field: FormsPlaceholderField) {
  return field.isPersisted ?? field.status !== "draft";
}

export function syncFieldNodeTitlesWithModel(
  document: FormBuilderDocument,
  model: FormsPlaceholderModel,
) {
  const fieldLabelById = new Map(
    model.fields.map((field) => [field.id, getModelFieldLabel(field)] as const),
  );
  let hasChanges = false;

  const syncNodes = (nodes: ReadonlyArray<FormBuilderNode>) => {
    let nodesChanged = false;
    const nextNodes = nodes.map((node) => {
      if (node.type !== "field" || !node.fieldId) {
        return node;
      }

      const nextTitle = fieldLabelById.get(node.fieldId);
      if (!nextTitle || node.title === nextTitle) {
        return node;
      }

      nodesChanged = true;
      hasChanges = true;
      return {
        ...node,
        title: nextTitle,
      };
    });

    return nodesChanged ? nextNodes : nodes;
  };

  const nextRootNodes = syncNodes(document.rootScope.uiSchema.nodes);
  const nextSubformScopes = document.subformScopes.map((scope) => {
    const nextNodes = syncNodes(scope.uiSchema.nodes);
    if (nextNodes === scope.uiSchema.nodes) {
      return scope;
    }

    return {
      ...scope,
      uiSchema: {
        ...scope.uiSchema,
        nodes: nextNodes,
      },
    };
  });

  if (!hasChanges) {
    return document;
  }

  return {
    ...document,
    rootScope: {
      ...document.rootScope,
      uiSchema: {
        ...document.rootScope.uiSchema,
        nodes: nextRootNodes,
      },
    },
    subformScopes: nextSubformScopes,
  };
}

export function syncChoiceOptionStyles(
  options: ReadonlyArray<string> | undefined,
  optionStyles: ReadonlyArray<FormsPlaceholderFieldOptionStyle> | undefined,
) {
  const optionSet = new Set(options ?? []);
  const nextStyles = (optionStyles ?? []).filter((entry) =>
    optionSet.has(entry.option) && entry.variant && entry.variant !== "default"
  );
  return nextStyles.length > 0 ? nextStyles : undefined;
}

export function cycleNodeVisibility(currentVisibility: FormBuilderNode["visibility"]): FormBuilderNode["visibility"] {
  switch (currentVisibility) {
    case "visible":
      return "readonly";
    case "readonly":
      return "hidden";
    default:
      return "visible";
  }
}
