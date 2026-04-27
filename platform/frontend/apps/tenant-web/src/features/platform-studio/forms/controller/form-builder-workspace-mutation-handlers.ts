import {
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  createFormBuilderFieldFromDefinition,
  type FormBuilderLibraryFieldDefinition,
} from "../forms-builder-library";
import {
  addFormBuilderFieldNode,
  createPersistedFormBuilderDocument,
  getCurrentFormBuilderInsertParentId,
  normalizePersistedFormBuilderDocument,
  removeFormBuilderNode,
  type FormBuilderDocument,
  type FormBuilderNode,
  type FormBuilderScope,
  type FormBuilderWorkspaceAccess,
} from "../forms-builder-state";
import {
  cloneFormsPlaceholderModel,
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import {
  getDeleteNodeConfirmationAction,
} from "./form-builder-workspace-delete-node";
import {
  deriveModelSchemaScopes,
  getScopeSchemaScopeKey,
} from "./form-builder-workspace-schema-utils";
import {
  createSelectedFieldSettingsHandlers,
} from "./form-builder-workspace-selected-field-settings-handlers";
import {
  createSelectedNodeMutationHandlers,
} from "./form-builder-workspace-selected-node-mutations";
import {
  createSystemFieldMutationHandlers,
} from "./form-builder-workspace-system-field-mutations";
import {
  type LookupSourceModelOption,
} from "./form-builder-workspace-lookup-options";
import {
  applyLookupSourcePickerSelectionToField,
  type FormBuilderLookupSourcePickerState,
} from "./form-builder-workspace-lookup-source-picker";
import {
  isPersistedModelField,
} from "./form-builder-workspace-normalization-helpers";

type ViewOnlyBindingOption = {
  binding: FormBuilderNode["viewOnlyBinding"];
  bindingId: string;
  label: string;
};

type CreateFormBuilderWorkspaceMutationHandlersInput = {
  activeScope: FormBuilderScope;
  canCreateFieldAtCurrentLevel: boolean;
  canEditModelDefinition: boolean;
  canPlaceFieldAtCurrentLevel: boolean;
  closeLookupSourcePicker: () => void;
  currentModel: FormsPlaceholderModel;
  currentView: FormsPlaceholderView;
  document: FormBuilderDocument;
  lookupSourcePicker: FormBuilderLookupSourcePickerState | null;
  lookupSourcePickerModel: LookupSourceModelOption | null;
  newChoiceOptionLabel: string;
  selectedField: FormsPlaceholderField | null;
  selectedFieldDefaultAutocompleteValue: string;
  selectedNode: FormBuilderNode | null;
  selectedViewOnlyBindingOption: { label: string } | null;
  selectedViewOnlyBindingOptions: ReadonlyArray<ViewOnlyBindingOption>;
  setDeleteNodeOpen: Dispatch<SetStateAction<boolean>>;
  setDocument: Dispatch<SetStateAction<FormBuilderDocument>>;
  setInspectorViewTab: () => void;
  setModelDraft: Dispatch<SetStateAction<FormsPlaceholderModel>>;
  structureEditingAccess: Pick<FormBuilderWorkspaceAccess, "canAddFieldItems">;
  viewOnlyFieldDefaultTitle: string;
};

export function createFormBuilderWorkspaceMutationHandlers({
  activeScope,
  canCreateFieldAtCurrentLevel,
  canEditModelDefinition,
  canPlaceFieldAtCurrentLevel,
  closeLookupSourcePicker,
  currentModel,
  currentView,
  document,
  lookupSourcePicker,
  lookupSourcePickerModel,
  newChoiceOptionLabel,
  selectedField,
  selectedFieldDefaultAutocompleteValue,
  selectedNode,
  selectedViewOnlyBindingOption,
  selectedViewOnlyBindingOptions,
  setDeleteNodeOpen,
  setDocument,
  setInspectorViewTab,
  setModelDraft,
  structureEditingAccess,
  viewOnlyFieldDefaultTitle,
}: CreateFormBuilderWorkspaceMutationHandlersInput) {
  function updateDocument(updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument) {
    setDocument((currentDocument) => updater(currentDocument));
  }

  function updateCurrentModel(
    updater: (currentModelDraft: FormsPlaceholderModel) => FormsPlaceholderModel,
  ) {
    setModelDraft((currentValue) => cloneFormsPlaceholderModel(updater(currentValue)));
  }

  function updateFieldById(
    fieldId: string,
    updater: (field: FormsPlaceholderField) => FormsPlaceholderField,
  ) {
    if (!canEditModelDefinition) {
      return;
    }

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: currentModelDraft.fields.map((field) =>
        field.id === fieldId ? updater(field) : field
      ),
    }));
  }

  function deleteUnsavedField(fieldId: string, nodeId: string) {
    const nextModelBase = cloneFormsPlaceholderModel({
      ...currentModel,
      fields: currentModel.fields.filter((field) => field.id !== fieldId),
    });
    const documentWithoutField = normalizePersistedFormBuilderDocument(
      createPersistedFormBuilderDocument(removeFormBuilderNode(document, nodeId)),
      nextModelBase,
      currentView,
    );
    const nextModel = cloneFormsPlaceholderModel({
      ...nextModelBase,
      schemaScopes: deriveModelSchemaScopes(nextModelBase, documentWithoutField),
    });

    setModelDraft(nextModel);
    setDocument(documentWithoutField);
  }

  function updateSelectedField(
    updater: (field: FormsPlaceholderField) => FormsPlaceholderField,
  ) {
    if (!selectedField) {
      return;
    }

    updateFieldById(selectedField.id, updater);
  }

  const selectedFieldSettingsHandlers = createSelectedFieldSettingsHandlers({
    defaultViewOnlyFieldTitle: viewOnlyFieldDefaultTitle,
    newChoiceOptionLabel,
    selectedFieldDefaultAutocompleteValue,
    selectedNode,
    selectedViewOnlyBindingOption,
    selectedViewOnlyBindingOptions,
    updateDocument,
    updateSelectedField,
  });

  function updateCurrentViewMetadata(
    updater: (viewEntry: FormsPlaceholderView) => FormsPlaceholderView,
  ) {
    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      screens: currentModelDraft.screens.map((screenEntry) =>
        screenEntry.id === currentView.id
          ? updater(screenEntry)
          : screenEntry
      ),
    }));
  }

  function handleCreateLibraryField(definition: FormBuilderLibraryFieldDefinition) {
    if (!canCreateFieldAtCurrentLevel || !structureEditingAccess.canAddFieldItems || !canEditModelDefinition) {
      return;
    }

    const nextField = createFormBuilderFieldFromDefinition(
      definition,
      currentModel.fields,
      getScopeSchemaScopeKey(activeScope),
    );

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: [...currentModelDraft.fields, nextField],
    }));

    updateDocument((currentDocument) =>
      addFormBuilderFieldNode(currentDocument, getCurrentFormBuilderInsertParentId(currentDocument), nextField)
    );
  }

  function saveLookupSourcePicker() {
    if (!selectedField || selectedField.kind !== "db_lookup" || !lookupSourcePickerModel || !lookupSourcePicker) {
      return;
    }
    if (lookupSourcePickerModel.id === currentModel.id) {
      return;
    }

    if (!applyLookupSourcePickerSelectionToField({
      field: selectedField,
      picker: lookupSourcePicker,
      sourceModel: lookupSourcePickerModel,
    })) {
      return;
    }

    updateSelectedField((field) =>
      applyLookupSourcePickerSelectionToField({
        field,
        picker: lookupSourcePicker,
        sourceModel: lookupSourcePickerModel,
      }) ?? field
    );

    closeLookupSourcePicker();
  }

  function openDeleteNodeDialog() {
    setDeleteNodeOpen(true);
  }

  function confirmDeleteNode() {
    const action = getDeleteNodeConfirmationAction({
      isSelectedFieldPersisted: selectedField ? isPersistedModelField(selectedField) : false,
      selectedField,
      selectedNode,
    });

    if (action.kind === "delete-unsaved-field") {
      deleteUnsavedField(action.fieldId, action.nodeId);
      setDeleteNodeOpen(false);
      return;
    }

    if (action.kind === "remove-node") {
      updateDocument((currentDocument) => removeFormBuilderNode(currentDocument, action.nodeId));
    }

    setDeleteNodeOpen(false);
  }

  const selectedNodeMutationHandlers = createSelectedNodeMutationHandlers({
    canEditModelDefinition,
    currentFields: currentModel.fields,
    selectedField,
    selectedNode,
    updateDocument,
    updateFieldById,
  });

  const systemFieldMutationHandlers = createSystemFieldMutationHandlers({
    canEditModelDefinition,
    canPlaceFieldAtCurrentLevel,
    currentFields: currentModel.fields,
    document,
    setInspectorViewTab,
    structureEditingAccess,
    updateCurrentModel,
    updateDocument,
    updateFieldById,
  });

  return {
    ...selectedFieldSettingsHandlers,
    ...selectedNodeMutationHandlers,
    ...systemFieldMutationHandlers,
    confirmDeleteNode,
    handleCreateLibraryField,
    openDeleteNodeDialog,
    saveLookupSourcePicker,
    updateCurrentModel,
    updateCurrentViewMetadata,
    updateDocument,
  } as const;
}
