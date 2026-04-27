import {
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";
import {
  applySelectedFieldTitleUpdate,
  applySelectedNodeRequiredUpdate,
  applySelectedNodeTextUpdate,
  applySelectedNodeTitleUpdate,
  applySelectedNodeVisibilityUpdate,
} from "./form-builder-workspace-selected-node-updates";

type UpdateDocument = (
  updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
) => void;

type UpdateFieldById = (
  fieldId: string,
  updater: (field: FormsPlaceholderField) => FormsPlaceholderField,
) => void;

type CreateSelectedNodeMutationHandlersInput = {
  canEditModelDefinition: boolean;
  currentFields: ReadonlyArray<FormsPlaceholderField>;
  selectedField: FormsPlaceholderField | null;
  selectedNode: FormBuilderNode | null;
  updateDocument: UpdateDocument;
  updateFieldById: UpdateFieldById;
};

export function createSelectedNodeMutationHandlers({
  canEditModelDefinition,
  currentFields,
  selectedField,
  selectedNode,
  updateDocument,
  updateFieldById,
}: CreateSelectedNodeMutationHandlersInput) {
  function updateSelectedNodeRequired(checked: boolean) {
    if (!selectedNode) {
      return;
    }

    updateDocument((currentDocument) => applySelectedNodeRequiredUpdate(currentDocument, selectedNode.id, checked));
  }

  function updateSelectedNodeText(text: string) {
    if (!selectedNode) {
      return;
    }

    updateDocument((currentDocument) => applySelectedNodeTextUpdate(currentDocument, selectedNode.id, text));
  }

  function updateSelectedNodeTitle(nextTitle: string) {
    if (!selectedNode) {
      return;
    }

    if (selectedNode.type === "field") {
      if (!selectedField) {
        return;
      }

      if (canEditModelDefinition) {
        updateFieldById(selectedField.id, (field) =>
          applySelectedFieldTitleUpdate({
            field,
            fields: currentFields,
            title: nextTitle,
          })
        );
      }
    }

    updateDocument((currentDocument) => applySelectedNodeTitleUpdate(currentDocument, selectedNode.id, nextTitle));
  }

  function updateSelectedNodeVisibility(nextVisibility: FormBuilderNode["visibility"]) {
    if (!selectedNode) {
      return;
    }

    updateDocument((currentDocument) =>
      applySelectedNodeVisibilityUpdate(currentDocument, selectedNode, selectedField, nextVisibility)
    );
  }

  return {
    updateSelectedNodeRequired,
    updateSelectedNodeText,
    updateSelectedNodeTitle,
    updateSelectedNodeVisibility,
  } as const;
}
