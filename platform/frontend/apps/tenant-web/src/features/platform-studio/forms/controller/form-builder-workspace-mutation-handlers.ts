import {
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  createChecklistSubformDraftFields,
} from "../forms-builder-checklist";
import {
  createFormBuilderFieldFromDefinition,
  type FormBuilderLibraryFieldDefinition,
} from "../forms-builder-library";
import {
  addFormBuilderElementNode,
  addFormBuilderFieldNode,
  createPersistedFormBuilderDocument,
  getCurrentFormBuilderInsertParentId,
  normalizePersistedFormBuilderDocument,
  removeFormBuilderNode,
  selectFormBuilderNode,
  updateFormBuilderNode,
  type FormBuilderDocument,
  type FormBuilderElementPaletteItem,
  type FormBuilderChecklistConfig,
  type FormBuilderChecklistGrouping,
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
  removeFormBuilderSubformFromDocumentAndModel,
} from "./form-builder-workspace-delete-subform";
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

function normalizeIdentifier(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createUniqueIdentifier(base: string, usedValues: ReadonlySet<string>) {
  const normalizedBase = normalizeIdentifier(base) || "checklist";
  if (!usedValues.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  let nextValue = `${normalizedBase}_${suffix}`;
  while (usedValues.has(nextValue)) {
    suffix += 1;
    nextValue = `${normalizedBase}_${suffix}`;
  }

  return nextValue;
}

function createUniqueNodeId(baseId: string, document: FormBuilderDocument) {
  const usedNodeIds = new Set(document.nodes.map((node) => node.id));
  if (!usedNodeIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let nextId = `${baseId}-${suffix}`;
  while (usedNodeIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  return nextId;
}

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

  function handleCreateElementNode(
    nodeType: FormBuilderElementPaletteItem["nodeType"],
    initialNode: FormBuilderElementPaletteItem["initialNode"],
  ) {
    const parentId = getCurrentFormBuilderInsertParentId(document);
    if (nodeType !== "subform" || initialNode?.subformType !== "CHECKLIST") {
      updateDocument((currentDocument) =>
        addFormBuilderElementNode(currentDocument, parentId, nodeType, initialNode)
      );
      return;
    }

    if (!canCreateFieldAtCurrentLevel || !structureEditingAccess.canAddFieldItems || !canEditModelDefinition) {
      return;
    }

    const usedScopeKeys = new Set([
      ...(currentModel.schemaScopes ?? []).map((scope) => scope.key),
      ...currentModel.fields.flatMap((field) => field.schemaScopeKey ? [field.schemaScopeKey] : []),
      ...document.subformScopes.map((scope) => scope.tableKey),
    ]);
    const scopeSeed = [
      "pb",
      initialNode.title ?? "Checklist",
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 6),
    ].join("_");
    const schemaScopeKey = createUniqueIdentifier(scopeSeed, usedScopeKeys);
    const checklistDraft = createChecklistSubformDraftFields(currentModel.fields, schemaScopeKey);

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: [...currentModelDraft.fields, ...checklistDraft.fields],
    }));

    updateDocument((currentDocument) => {
      const subformNodeId = createUniqueNodeId(`subform-${schemaScopeKey.replace(/_/g, "-")}`, currentDocument);
      const idFactory = (prefix: string) =>
        prefix === "subform"
          ? subformNodeId
          : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let nextDocument = addFormBuilderElementNode(
        currentDocument,
        parentId,
        "subform",
        {
          ...initialNode,
          checklistConfig: checklistDraft.config,
          schemaScopeId: schemaScopeKey,
          tableKey: schemaScopeKey,
        },
        idFactory,
      );

      checklistDraft.fields.forEach((field) => {
        nextDocument = addFormBuilderFieldNode(nextDocument, subformNodeId, field);
      });

      return selectFormBuilderNode(nextDocument, subformNodeId);
    });
  }

  function saveLookupSourcePicker() {
    if (!lookupSourcePickerModel || !lookupSourcePicker) {
      return;
    }

    updateCurrentModel((currentModelDraft) => ({
      ...currentModelDraft,
      fields: currentModelDraft.fields.map((field) => {
        if (field.id !== lookupSourcePicker.fieldId || field.kind !== "db_lookup") {
          return field;
        }

        return applyLookupSourcePickerSelectionToField({
          field,
          picker: lookupSourcePicker,
          sourceModel: lookupSourcePickerModel,
        }) ?? field;
      }),
    }));

    closeLookupSourcePicker();
  }

  function updateSelectedChecklistConfig(
    updater: (config: FormBuilderChecklistConfig) => FormBuilderChecklistConfig,
  ) {
    if (selectedNode?.type !== "subform" || selectedNode.subformType !== "CHECKLIST") {
      return;
    }

    updateDocument((currentDocument) =>
      updateFormBuilderNode(currentDocument, selectedNode.id, {
        checklistConfig: updater(selectedNode.checklistConfig ?? {}),
      })
    );
  }

  function updateSelectedChecklistLookupField(fieldId: string) {
    updateSelectedChecklistConfig((config) => ({
      ...config,
      lookupFieldId: fieldId || undefined,
    }));
  }

  function updateSelectedChecklistResultField(fieldId: string) {
    updateSelectedChecklistConfig((config) => ({
      ...config,
      resultFieldId: fieldId || undefined,
    }));
  }

  function updateSelectedChecklistGrouping(grouping: FormBuilderChecklistGrouping) {
    updateSelectedChecklistConfig((config) => ({
      ...config,
      grouping,
    }));
  }

  function openDeleteNodeDialog() {
    setDeleteNodeOpen(true);
  }

  function confirmDeleteNode() {
    const action = getDeleteNodeConfirmationAction({
      isSelectedFieldLocked: Boolean(selectedField?.isLocked),
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
      if (selectedNode?.type === "subform" && !canEditModelDefinition) {
        setDeleteNodeOpen(false);
        return;
      }

      if (selectedNode?.type === "subform") {
        const nextState = removeFormBuilderSubformFromDocumentAndModel({
          document,
          model: currentModel,
          node: selectedNode,
          view: currentView,
        });

        setModelDraft(nextState.model);
        setDocument(nextState.document);
        setDeleteNodeOpen(false);
        return;
      }

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
    handleCreateElementNode,
    handleCreateLibraryField,
    openDeleteNodeDialog,
    saveLookupSourcePicker,
    updateCurrentModel,
    updateCurrentViewMetadata,
    updateDocument,
    updateSelectedChecklistGrouping,
    updateSelectedChecklistLookupField,
    updateSelectedChecklistResultField,
  } as const;
}
