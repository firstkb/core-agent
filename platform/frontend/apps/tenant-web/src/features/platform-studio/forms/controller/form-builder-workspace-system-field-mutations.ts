import {
  addFormBuilderFieldNode,
  getCurrentFormBuilderInsertParentId,
  type FormBuilderDocument,
  type FormBuilderWorkspaceAccess,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import {
  type SystemFieldRole,
} from "./form-builder-workspace-palette-items";
import {
  findFormBuilderNodeByFieldId,
} from "./form-builder-workspace-field-scope-grid";
import {
  applyCreatedSystemFieldDocumentBinding,
  applySystemFieldDocumentBinding,
  applySystemFieldSemanticRoleBinding,
  applyWorkflowStatusOptionUpdate,
  prepareSystemFieldCreation,
} from "./form-builder-workspace-system-field-derivation";
import {
  getBoundSystemFieldIdByRole,
} from "./form-builder-workspace-system-fields";

type UpdateDocument = (
  updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
) => void;

type UpdateCurrentModel = (
  updater: (currentModelDraft: FormsPlaceholderModel) => FormsPlaceholderModel,
) => void;

type UpdateFieldById = (
  fieldId: string,
  updater: (field: FormsPlaceholderField) => FormsPlaceholderField,
) => void;

type CreateSystemFieldMutationHandlersInput = {
  canEditModelDefinition: boolean;
  canPlaceFieldAtCurrentLevel: boolean;
  currentFields: ReadonlyArray<FormsPlaceholderField>;
  document: FormBuilderDocument;
  setInspectorViewTab: () => void;
  structureEditingAccess: Pick<FormBuilderWorkspaceAccess, "canAddFieldItems">;
  updateCurrentModel: UpdateCurrentModel;
  updateDocument: UpdateDocument;
  updateFieldById: UpdateFieldById;
};

export function createSystemFieldMutationHandlers({
  canEditModelDefinition,
  canPlaceFieldAtCurrentLevel,
  currentFields,
  document,
  setInspectorViewTab,
  structureEditingAccess,
  updateCurrentModel,
  updateDocument,
  updateFieldById,
}: CreateSystemFieldMutationHandlersInput) {
  function updateSystemFieldBinding(
    role: SystemFieldRole,
    fieldId: string,
  ) {
    if (!canEditModelDefinition) {
      return;
    }

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: applySystemFieldSemanticRoleBinding(currentModelDraft.fields, role, fieldId),
    }));

    updateDocument((currentDocument) => ({
      ...currentDocument,
      systemFields: applySystemFieldDocumentBinding(currentDocument.systemFields, role, fieldId),
    }));
  }

  function updateWorkflowStatusOption(
    key: "finalValue" | "initialValue",
    value: string,
  ) {
    updateDocument((currentDocument) => {
      const nextSystemFields = applyWorkflowStatusOptionUpdate(currentDocument.systemFields, key, value);
      if (nextSystemFields === currentDocument.systemFields) {
        return currentDocument;
      }

      return {
        ...currentDocument,
        systemFields: nextSystemFields,
      };
    });
  }

  function handleCreateSystemField(role: SystemFieldRole) {
    if (getBoundSystemFieldIdByRole(document, role)) {
      return;
    }

    if (!canPlaceFieldAtCurrentLevel || !structureEditingAccess.canAddFieldItems || !canEditModelDefinition) {
      return;
    }

    const {
      existingField,
      nextField,
    } = prepareSystemFieldCreation(currentFields, role);

    if (!existingField) {
      updateCurrentModel((currentModelDraft) => ({
        ...currentModelDraft,
        fields: [...currentModelDraft.fields, nextField],
      }));
    } else if (existingField.schemaScopeKey !== "root") {
      updateFieldById(existingField.id, (field) => ({
        ...field,
        schemaScopeKey: "root",
      }));
    }

    updateDocument((currentDocument) => {
      const nextDocument = {
        ...currentDocument,
        systemFields: applyCreatedSystemFieldDocumentBinding(currentDocument.systemFields, role, nextField),
      };

      const existingNode = findFormBuilderNodeByFieldId(nextDocument, nextField.id);
      if (existingNode || !canPlaceFieldAtCurrentLevel) {
        return nextDocument;
      }

      return addFormBuilderFieldNode(nextDocument, getCurrentFormBuilderInsertParentId(nextDocument), nextField);
    });

    setInspectorViewTab();
  }

  return {
    handleCreateSystemField,
    updateSystemFieldBinding,
    updateWorkflowStatusOption,
  } as const;
}
