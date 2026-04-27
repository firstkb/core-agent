import { useMemo } from "react";

import {
  createPersistedFormBuilderDocument,
  getActiveFormBuilderScope,
  getAllowedChildNodeTypes,
  getCurrentFormBuilderChildren,
  getCurrentFormBuilderParentId,
  getCurrentFormBuilderScopeSubformNode,
  getCurrentFormBuilderSelectedNodeId,
  getFormBuilderNode,
  getFormsWorkspaceAccess,
  isFormBuilderContainer,
  type FormBuilderDocument,
} from "../forms-builder-state";
import {
  getFormsAuthoringAccess,
  type FormsAuthoringActor,
} from "../forms-actors";
import {
  getFormsPlaceholderModelRouteId,
  isDefaultFormsPlaceholderView,
} from "../forms-route-helpers";
import {
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";

type UseFormBuilderWorkspaceControllerInput = {
  currentActor: FormsAuthoringActor;
  currentModel: FormsPlaceholderModel;
  currentView: FormsPlaceholderView;
  document: FormBuilderDocument;
  hasUnsavedDocumentChanges: boolean;
  isDraftSyncing: boolean;
  isSavingDraft: boolean;
  modelDraft: FormsPlaceholderModel;
  savePulse: boolean;
  savedModelDraft: FormsPlaceholderModel;
};

export function useFormBuilderWorkspaceController({
  currentActor,
  currentModel,
  currentView,
  document,
  hasUnsavedDocumentChanges,
  isDraftSyncing,
  isSavingDraft,
  modelDraft,
  savePulse,
  savedModelDraft,
}: UseFormBuilderWorkspaceControllerInput) {
  const isDefaultView = isDefaultFormsPlaceholderView(currentView);
  const isStaticModel = typeof currentModel.sourceType === "string"
    && currentModel.sourceType.trim().length > 0
    && currentModel.sourceType !== "managed";
  const currentModelRouteId = getFormsPlaceholderModelRouteId(currentModel);
  const access = getFormsAuthoringAccess(currentActor, currentModel, currentView);
  const workspaceAccess = getFormsWorkspaceAccess(access, currentModel, currentView);
  const hasUnsavedModelChanges = useMemo(
    () => JSON.stringify(modelDraft) !== JSON.stringify(savedModelDraft),
    [modelDraft, savedModelDraft],
  );
  const hasUnsavedChanges = hasUnsavedDocumentChanges || hasUnsavedModelChanges;
  const isSaveButtonDisabled = !hasUnsavedChanges || savePulse || isSavingDraft || isDraftSyncing;
  const activeScope = getActiveFormBuilderScope(document);
  const currentScopeParentId = getCurrentFormBuilderParentId(document);
  const currentScopeSelectedNodeId = getCurrentFormBuilderSelectedNodeId(document);
  const currentNodes = getCurrentFormBuilderChildren(document);
  const persistedDocument = useMemo(
    () => createPersistedFormBuilderDocument(document),
    [document],
  );
  const selectedNode = getFormBuilderNode(document, currentScopeSelectedNodeId);
  const selectedField =
    selectedNode?.type === "field"
      ? currentModel.fields.find((field) => field.id === selectedNode.fieldId) ?? null
      : null;
  const selectedNodeSupportsRules = Boolean(
    selectedNode && (
      selectedNode.type === "field"
      || selectedNode.type === "view_only_field"
      || isFormBuilderContainer(selectedNode.type)
    ),
  );
  const currentParentNode = getFormBuilderNode(document, currentScopeParentId);
  const currentScopeSubformNode = getCurrentFormBuilderScopeSubformNode(document);
  const currentGridColumns = activeScope.scopeType === "SUBFORM"
    ? activeScope.viewSettings.list.columns
    : document.viewSettings.list.columns;
  const isChecklistGridScope = currentScopeSubformNode?.subformType === "CHECKLIST";
  const isSubformGridScope = Boolean(currentScopeSubformNode);
  const isRootViewScope = activeScope.scopeType === "ROOT";
  const isDefaultSubformViewScope = activeScope.scopeType === "SUBFORM" && activeScope.subformType === "DEFAULT";
  const isViewTabAvailable = isRootViewScope || isDefaultSubformViewScope;
  const currentScopeFilterDefinitions = activeScope.scopeType === "SUBFORM"
    ? activeScope.filterDefinitions
    : document.filterDefinitions;
  const currentDraftViewTitle = document.viewTitle.trim() || currentView.title;
  const currentScopeViewSettings = activeScope.scopeType === "SUBFORM"
    ? activeScope.viewSettings
    : null;
  const selectedFieldIsChoice = selectedField?.kind === "single_select" || selectedField?.kind === "multi_select";
  const selectedFieldIsLookup = selectedField?.kind === "db_lookup";
  const selectedFieldIsLookupValue = selectedField?.preset === "db_lookup_value";
  const selectedFieldSupportsTextInputSettings = selectedField?.kind === "short_text";
  const selectedFieldSupportsTextPreset =
    selectedField?.preset === "email" || selectedField?.preset === "phone" || selectedField?.preset === "url";
  const selectedFieldIsDateToday = selectedField?.preset === "date_today";
  const selectedFieldIsTags = selectedField?.preset === "tags";
  const selectedFieldAutocompleteChecked = selectedField ? selectedField.autocomplete !== "off" : true;
  const canEditModelDefinition = access.canManageStructure && isDefaultView;
  const shouldSyncFieldNodeTitlesWithModel = isDefaultView && !isStaticModel;
  const canToggleModelLocks = currentActor.isRoot && !isStaticModel;
  const canToggleViewLocks = currentActor.isRoot;
  const selectedFieldDefaultAutocompleteValue = useMemo(() => {
    if (!selectedField) {
      return "on";
    }

    switch (selectedField.preset) {
      case "email":
        return "email";
      case "phone":
        return "tel";
      case "url":
        return "url";
      default:
        return "on";
    }
  }, [selectedField]);
  const currentScopeContainerType = currentScopeParentId
    ? currentParentNode?.type ?? null
    : (activeScope.scopeType === "SUBFORM" ? "subform" : null);
  const canPlaceFieldAtCurrentLevel = getAllowedChildNodeTypes(currentScopeContainerType).includes("field");
  const structureEditingAccess = useMemo(
    () => (isDefaultView
      ? workspaceAccess
      : {
          ...workspaceAccess,
          canAddElementItems: false,
          canAddFieldItems: false,
          canRemoveItems: false,
          lockReasonKey: "tenant.platformStudio.forms.builder.defaultViewBlueprintOnlyNotice",
          structureLockReasonKey: "tenant.platformStudio.forms.builder.defaultViewStructureOnlyNotice",
        }),
    [isDefaultView, workspaceAccess],
  );

  return {
    access,
    activeScope,
    canEditModelDefinition,
    canPlaceFieldAtCurrentLevel,
    canToggleModelLocks,
    canToggleViewLocks,
    currentDraftViewTitle,
    currentGridColumns,
    currentModelRouteId,
    currentNodes,
    currentParentNode,
    currentScopeFilterDefinitions,
    currentScopeParentId,
    currentScopeSelectedNodeId,
    currentScopeSubformNode,
    currentScopeViewSettings,
    hasUnsavedChanges,
    hasUnsavedModelChanges,
    isChecklistGridScope,
    isDefaultSubformViewScope,
    isDefaultView,
    isRootViewScope,
    isSaveButtonDisabled,
    isStaticModel,
    isSubformGridScope,
    isViewTabAvailable,
    persistedDocument,
    selectedField,
    selectedFieldAutocompleteChecked,
    selectedFieldDefaultAutocompleteValue,
    selectedFieldIsChoice,
    selectedFieldIsDateToday,
    selectedFieldIsLookup,
    selectedFieldIsLookupValue,
    selectedFieldIsTags,
    selectedFieldSupportsTextInputSettings,
    selectedFieldSupportsTextPreset,
    selectedNode,
    selectedNodeSupportsRules,
    shouldSyncFieldNodeTitlesWithModel,
    structureEditingAccess,
    workspaceAccess,
  };
}
