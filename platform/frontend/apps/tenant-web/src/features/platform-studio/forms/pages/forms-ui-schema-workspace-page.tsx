import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createTenantFormBuilderDraftClient,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import { useTranslation } from "@platform/i18n";
import { Button } from "@platform/ui-kit";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { platformStudioPaths } from "../../platform-studio-route-meta";
import {
  createFormBuilderWorkspaceMutationHandlers,
} from "../controller/form-builder-workspace-mutation-handlers";
import {
  getFieldById,
  getFieldLabelAndBoundField,
  getFieldLabelWithBoundField,
} from "../controller/form-builder-workspace-field-scope-grid";
import {
  type SystemFieldRole,
} from "../controller/form-builder-workspace-palette-items";
import { createFormBuilderRuleFilterHandlers } from "../controller/form-builder-workspace-rule-filter-handlers";
import { createFormBuilderWorkspaceRenderModel } from "../controller/form-builder-workspace-render-model";
import {
  createEmptyLayoutBlueprint,
} from "../controller/form-builder-workspace-schema-utils";
import { createFormBuilderViewGridHandlers } from "../controller/form-builder-workspace-view-grid-handlers";
import { useFormBuilderDebugDialog } from "../controller/use-form-builder-debug-dialog";
import { useFormBuilderDraftHydration } from "../controller/use-form-builder-draft-hydration";
import { useFormBuilderDraftSaveAction } from "../controller/use-form-builder-draft-save-action";
import { useFormBuilderLeaveGuard } from "../controller/use-form-builder-leave-guard";
import { useFormBuilderLookupSourceModels } from "../controller/use-form-builder-lookup-source-models";
import { useFormBuilderLookupSourcePicker } from "../controller/use-form-builder-lookup-source-picker";
import { useFormBuilderRuleFilterEditors } from "../controller/use-form-builder-rule-filter-editors";
import { useFormBuilderRouteWorkspace } from "../controller/use-form-builder-route-workspace";
import { useFormBuilderSelectedLookupSummaries } from "../controller/use-form-builder-selected-lookup-summaries";
import { useFormBuilderTransientUiEffects } from "../controller/use-form-builder-transient-ui-effects";
import { useFormBuilderWorkspaceDragControllers } from "../controller/use-form-builder-workspace-drag-controllers";
import { useFormBuilderWorkspaceController } from "../controller/use-form-builder-workspace-controller";
import { useFormBuilderWorkspaceDerivedState } from "../controller/use-form-builder-workspace-derived-state";
import { BuilderCanvas } from "../components/builder-canvas";
import { WorkspaceLoadingState } from "../components/empty-state";
import { WorkspaceErrorState } from "../components/error-state";
import { FieldPalette } from "../components/field-palette";
import { GridInspectorTabBody } from "../components/grid-inspector-tab-body";
import {
  type InspectorPanelTabValue,
  WorkspaceInspector,
} from "../components/workspace-inspector";
import { SelectionInspectorTabBody } from "../components/selection-inspector-tab-body";
import { ViewInspectorTabBody } from "../components/view-inspector-tab-body";
import { WorkspaceDialogStack } from "../components/workspace-dialog-stack";
import { WorkspaceTopline } from "../components/workspace-topline";
import {
  getFormBuilderDisplayLabel,
  useFormBuilderDocument,
} from "../forms-builder-state";
import {
  getFormsAuthoringActor,
} from "../forms-actors";
import { useFormBuilderAuthoring } from "../forms-authoring-context";
import {
  cloneFormsPlaceholderModel,
  findFormsPlaceholderScreenById,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { useTenantRuntimeConfig } from "../../../../app/tenant-runtime-config-context";
import { useTenantWorkspaceUser } from "../../../../app/tenant-workspace-user-context";

export function FormsViewWorkspacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const runtimeConfig = useTenantRuntimeConfig();
  const draftClient = useMemo(
    () => createTenantFormBuilderDraftClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const {
    checkAuth,
    getAccessToken,
    signOut,
  } = useAuth();
  const {
    ensureModel,
    models,
    replaceModel,
  } = useFormBuilderAuthoring();
  const workspaceUser = useTenantWorkspaceUser();
  const currentActor = getFormsAuthoringActor(workspaceUser);
  const {
    hasResolvedWorkspace,
    isBootstrappingRoute,
    resolvedModel,
    resolvedView,
    routeBootstrapError,
    routeDraftSignature,
  } = useFormBuilderRouteWorkspace({
    ensureModel,
    modelId: params.modelId,
    models,
    viewId: params.viewId,
    workspaceBootstrapErrorMessage: t("tenant.platformStudio.forms.workspaceBootstrapError"),
  });
  const [paletteQuery, setPaletteQuery] = useState("");
  const [inspectorTab, setInspectorTab] = useState<InspectorPanelTabValue>("selection");
  const [deleteNodeOpen, setDeleteNodeOpen] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [modelDraft, setModelDraft] = useState<FormsPlaceholderModel>(() => cloneFormsPlaceholderModel(resolvedModel));
  const [savedModelDraft, setSavedModelDraft] = useState<FormsPlaceholderModel>(() => cloneFormsPlaceholderModel(resolvedModel));
  const [layoutBlueprintDraft, setLayoutBlueprintDraft] = useState<Record<string, unknown>>(() =>
    createEmptyLayoutBlueprint(resolvedModel),
  );
  const [savedLayoutBlueprintDraft, setSavedLayoutBlueprintDraft] = useState<Record<string, unknown>>(() =>
    createEmptyLayoutBlueprint(resolvedModel),
  );
  const currentModel = modelDraft;
  const currentView = findFormsPlaceholderScreenById(currentModel.screens, resolvedView.id) ?? resolvedView;
  const shouldSyncHydratedFieldNodeTitlesWithModel =
    currentView.isDefault &&
    !(
      typeof currentModel.sourceType === "string" &&
      currentModel.sourceType.trim().length > 0 &&
      currentModel.sourceType !== "managed"
    );
  const [pendingDefaultFilterFieldId, setPendingDefaultFilterFieldId] = useState(
    () => currentModel.fields[0]?.id ?? "",
  );
  const {
    document,
    hydrateDocument,
    isDirty: hasUnsavedDocumentChanges,
    savedDocument,
    setDocument,
  } = useFormBuilderDocument(currentModel, currentView);
  const {
    draftSyncError,
    hasHydratedCurrentDraft,
    isDraftSyncing,
    setDraftSyncError,
  } = useFormBuilderDraftHydration({
    checkAuth,
    draftClient,
    draftLoadErrorMessage: t("tenant.platformStudio.forms.builder.draftLoadError"),
    getAccessToken,
    hasResolvedWorkspace,
    onHydratedDraft: ({
      baselineDocument,
      baselineModel,
      layoutBlueprint,
    }) => {
      replaceModel(baselineModel);
      setModelDraft(baselineModel);
      setSavedModelDraft(baselineModel);
      setLayoutBlueprintDraft(layoutBlueprint);
      setSavedLayoutBlueprintDraft(layoutBlueprint);
      // Treat the frontend-normalized workspace state as the clean baseline after load.
      // Otherwise Save becomes active immediately when reconciliation adds canonical nodes.
      hydrateDocument(baselineDocument);
    },
    resolvedModel,
    resolvedView,
    routeDraftSignature,
    shouldSyncFieldNodeTitlesWithModel: shouldSyncHydratedFieldNodeTitlesWithModel,
    signOut,
  });
  const {
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
  } = useFormBuilderWorkspaceController({
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
  });
  const {
    attentionNodeIds,
    breadcrumb,
    canCreateFieldAtCurrentLevel,
    canPlaceUnplacedFields,
    currentDataSchema,
    currentGridScopeTargets,
    currentLayoutBlueprint,
    currentModelSchemaScopes,
    currentScopePlacementLabel,
    currentScopeSortingFields,
    currentScopeUnplacedFields,
    currentScopeViewLabel,
    currentViewFilterTargets,
    paletteSections,
    rootViewFilterTargets,
    savedDataSchema,
    selectedFieldIsPresetLookup,
    selectedFieldShowsLookupDisplayMode,
    selectedLookupSourceModelId,
    selectedLookupSourceSummary,
    selectedNodeRuleFields,
    selectedRequirementRuleItems,
    selectedViewOnlyBindingOption,
    selectedViewOnlyBindingOptions,
    selectedVisibilityRuleItems,
    sortedCurrentGridScopeTargets,
    unplacedFieldsHintKey,
    workflowStatusOptions,
  } = useFormBuilderWorkspaceDerivedState({
    canPlaceFieldAtCurrentLevel,
    currentDraftViewTitle,
    currentGridColumns,
    currentModel,
    currentScopeSubformNode,
    document,
    isDefaultView,
    isRootViewScope,
    layoutBlueprintDraft,
    paletteQuery,
    persistedDocument,
    savedDocument,
    savedModelDraft,
    selectedField,
    selectedFieldIsLookup,
    selectedFieldIsLookupValue,
    selectedNode,
    structureEditingAccess,
    t,
  });
  const {
    addQuickFilterCondition,
    closeDefaultFilterEditor,
    closeQuickFilterEditor,
    closeRequirementRuleEditor,
    closeVisibilityRuleEditor,
    defaultFilterEditor,
    openDefaultFilterEditor,
    openQuickFilterEditor,
    openRequirementRuleEditor,
    openVisibilityRuleEditor,
    quickFilterEditor,
    removeQuickFilterCondition,
    requirementRuleEditor,
    setDefaultFilterCondition,
    setQuickFilterColor,
    setQuickFilterCondition,
    setQuickFilterLabel,
    setRequirementRuleCondition,
    setRequirementRuleEffect,
    setVisibilityRuleCondition,
    setVisibilityRuleEffect,
    visibilityRuleEditor,
  } = useFormBuilderRuleFilterEditors({
    currentDefaultFilterConditions: currentScopeFilterDefinitions.defaultFilters.conditions,
    currentViewFilterTargets,
    defaultQuickFilterLabel: t("tenant.platformStudio.forms.builder.filter.defaultQuickFilterLabel"),
    pendingDefaultFilterFieldId,
    quickFilters: document.filterDefinitions.quickFilters,
    rootViewFilterTargets,
    selectedNodeRuleFields,
    selectedRequirementRules: selectedNode?.rules?.requirementRules ?? [],
    selectedVisibilityRules: selectedNode?.rules?.visibilityRules ?? [],
  });
  const {
    availableLookupSourceModels,
    loadLookupSourceModel,
    lookupSourceModelsById,
  } = useFormBuilderLookupSourceModels({
    checkAuth,
    currentModelId: currentModel.id,
    draftClient,
    ensureModel,
    getAccessToken,
    models,
    prefetchModelId: selectedLookupSourceModelId,
    signOut,
  });
  const {
    closeLookupSourcePicker,
    isLookupSourcePickerLoading,
    lookupSourcePicker,
    lookupSourcePickerError,
    lookupSourcePickerModel,
    onLookupSourcePickerOpenChange,
    openLookupSourcePicker,
    setLookupSourcePickerFieldChecked,
    setLookupSourcePickerModel,
    setLookupSourcePickerSortField,
  } = useFormBuilderLookupSourcePicker({
    availableLookupSourceModels,
    loadErrorMessage: t("tenant.platformStudio.forms.builder.fieldSettings.sourcePickerLoadError"),
    loadLookupSourceModel,
    lookupSourceModelsById,
    selectedField,
    selectedFieldIsPresetLookup,
  });
  const {
    selectedGenericLookupSourceModel,
    selectedLookupSortFieldSummary,
    selectedLookupStoredValueSummary,
  } = useFormBuilderSelectedLookupSummaries({
    availableLookupSourceModels,
    selectedField,
    t,
  });
  const {
    debugCompiledRuntime,
    debugDataSchema,
    debugOpen,
    debugUiSchema,
    setDebugOpen,
  } = useFormBuilderDebugDialog({
    currentLayoutBlueprint,
    currentModel,
    currentModelSchemaScopes,
    currentView,
    document,
    t,
  });

  useEffect(() => {
    const nextModelDraft = cloneFormsPlaceholderModel(resolvedModel);
    setModelDraft(nextModelDraft);
    setSavedModelDraft(nextModelDraft);
    if (!hasResolvedWorkspace) {
      const nextLayoutBlueprint = createEmptyLayoutBlueprint(nextModelDraft);
      setLayoutBlueprintDraft(nextLayoutBlueprint);
      setSavedLayoutBlueprintDraft(nextLayoutBlueprint);
    }
  }, [hasResolvedWorkspace, resolvedModel]);

  const {
    leaveConfirmOpen,
    onLeaveConfirmOpenChange,
    requestNavigate,
    resolveLeaveConfirmation,
  } = useFormBuilderLeaveGuard({
    hasUnsavedChanges,
    onNavigate: navigate,
  });

  const {
    addSelectedFieldOption,
    confirmDeleteNode,
    handleCreateLibraryField,
    handleCreateSystemField,
    openDeleteNodeDialog,
    removeSelectedFieldOption,
    renameSelectedFieldOption,
    reorderSelectedFieldOption,
    saveLookupSourcePicker,
    updateSelectedDateDisplayFormat,
    updateSelectedDateReadonly,
    updateCurrentModel,
    updateCurrentViewMetadata,
    updateDocument,
    updateSelectedFieldAutocomplete,
    updateSelectedFieldChoiceDisplay,
    updateSelectedFieldChoiceStyle,
    updateSelectedFieldMask,
    updateSelectedFieldPlaceholder,
    updateSelectedFieldValidation,
    updateSelectedLookupDisplayMode,
    updateSelectedNodeRequired,
    updateSelectedNodeText,
    updateSelectedNodeTitle,
    updateSelectedNodeVisibility,
    updateSelectedTagsMax,
    updateSelectedTagsMode,
    updateSelectedViewOnlyBinding,
    updateSystemFieldBinding,
    updateWorkflowStatusOption,
  } = createFormBuilderWorkspaceMutationHandlers({
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
    newChoiceOptionLabel: t("tenant.platformStudio.forms.builder.fieldSettings.newOption"),
    selectedFieldDefaultAutocompleteValue,
    selectedField,
    selectedNode,
    selectedViewOnlyBindingOption,
    selectedViewOnlyBindingOptions,
    setDeleteNodeOpen,
    setDocument,
    setInspectorViewTab: () => setInspectorTab("view"),
    setModelDraft,
    structureEditingAccess,
    viewOnlyFieldDefaultTitle: t("tenant.platformStudio.forms.builder.nodeType.view_only_field"),
  });

  const {
    deleteDefaultFilter,
    deleteRequirementRuleAtIndex,
    deleteRequirementRuleEditor,
    deleteVisibilityRuleAtIndex,
    deleteVisibilityRuleEditor,
    saveDefaultFilterEditor,
    saveQuickFilterEditor,
    saveRequirementRuleEditor,
    saveVisibilityRuleEditor,
  } = createFormBuilderRuleFilterHandlers({
    activeScope,
    closeDefaultFilterEditor,
    closeQuickFilterEditor,
    closeRequirementRuleEditor,
    closeVisibilityRuleEditor,
    defaultFilterEditor,
    quickFilterEditor,
    requirementRuleEditor,
    selectedNode,
    selectedNodeRuleFields,
    updateDocument,
    visibilityRuleEditor,
  });

  const {
    addDefaultFilterCondition,
    reorderGridColumns,
    updateCorrectiveActionEnabled,
    updateCurrentScopeSubformViewSettings,
    updateCurrentViewSortDirection,
    updateCurrentViewSortField,
    updateGridColumnVisibility,
    updateModelStructureLocked,
    updateViewActive,
    updateViewDescription,
    updateViewLocked,
    updateViewSettings,
    updateViewTitle,
  } = createFormBuilderViewGridHandlers({
    activeScope,
    currentGridScopeTargets,
    isRootViewScope,
    openDefaultFilterEditor,
    openQuickFilterEditor,
    updateCurrentModel,
    updateCurrentViewMetadata,
    updateDocument,
  });

  const {
    dragOverChoiceOptionIndex,
    dragOverGridFieldId,
    dragOverNodeId,
    draggedChoiceOptionIndex,
    draggedGridFieldId,
    draggedNodeId,
    handleCanvasDragStart,
    handleCanvasDrop,
    handleChoiceOptionDragStart,
    handleChoiceOptionDrop,
    handleGridFieldDragStart,
    handleGridFieldDrop,
    openCanvasLevel,
    openCanvasRoot,
    placeCanvasUnplacedField,
    resetCanvasDragState,
    resetChoiceOptionDragState,
    resetGridFieldDragState,
    selectCanvasNode,
    setDragOverChoiceOptionIndex,
    setDragOverGridFieldId,
    setDragOverNodeId,
    setDraggedChoiceOptionIndex,
    toggleCanvasNodeVisibility,
  } = useFormBuilderWorkspaceDragControllers({
    currentScopeParentId,
    currentScopeUnplacedFields,
    reorderGridColumns,
    reorderSelectedFieldOption,
    selectInspectorSelectionTab: () => setInspectorTab("selection"),
    updateDocument,
  });

  const {
    selectionPanelTopRef,
  } = useFormBuilderTransientUiEffects({
    closeLookupSourcePicker,
    closeRequirementRuleEditor,
    closeVisibilityRuleEditor,
    currentViewFilterTargets,
    inspectorTab,
    isViewTabAvailable,
    pendingDefaultFilterFieldId,
    selectedFieldId: selectedField?.id,
    selectedNodeId: selectedNode?.id,
    setDragOverChoiceOptionIndex,
    setDraggedChoiceOptionIndex,
    setInspectorTab,
    setPendingDefaultFilterFieldId,
  });

  const currentLevelLabel = currentParentNode
    ? getFormBuilderDisplayLabel(currentParentNode, currentModel)
    : t("tenant.platformStudio.forms.builder.rootLevel");
  const canDragItems = workspaceAccess.canMoveItems && currentNodes.length > 1;
  const selectedNodeLabel = selectedNode ? getFormBuilderDisplayLabel(selectedNode, currentModel) : "";

  useEffect(() => {
    if (hasUnsavedChanges && savePulse) {
      setSavePulse(false);
    }
  }, [hasUnsavedChanges, savePulse]);

  function triggerSavePulse() {
    setSavePulse(true);
    window.setTimeout(() => setSavePulse(false), 1200);
  }

  const { handleSave } = useFormBuilderDraftSaveAction({
    checkAuth,
    currentDataSchema,
    currentLayoutBlueprint,
    currentModel,
    currentModelSchemaScopes,
    currentView,
    document,
    draftClient,
    getAccessToken,
    hasUnsavedModelChanges,
    isDefaultView,
    onSavedDraft: ({
      savedDocument,
      savedLayoutBlueprint,
      savedModel,
    }) => {
      hydrateDocument(savedDocument);
      setModelDraft(savedModel);
      setSavedModelDraft(savedModel);
      setLayoutBlueprintDraft(savedLayoutBlueprint);
      setSavedLayoutBlueprintDraft(savedLayoutBlueprint);
      replaceModel(savedModel);
      setDraftSyncError(null);
      triggerSavePulse();
    },
    saveErrorMessage: t("tenant.platformStudio.forms.builder.draftSaveError"),
    savedDataSchema,
    savedLayoutBlueprintDraft,
    savedModelDraft,
    setDraftSyncError,
    setIsSavingDraft,
    shouldSyncFieldNodeTitlesWithModel,
    signOut,
  });

  if (!hasResolvedWorkspace && isBootstrappingRoute) {
    return (
      <WorkspaceLoadingState
        description={t("tenant.platformStudio.forms.loadingWorkspaceDescription")}
        title={t("tenant.platformStudio.forms.loadingWorkspaceTitle")}
      />
    );
  }

  if (hasResolvedWorkspace && !hasHydratedCurrentDraft && !draftSyncError) {
    return (
      <WorkspaceLoadingState
        description={t("tenant.platformStudio.forms.loadingWorkspaceDescription")}
        title={t("tenant.platformStudio.forms.loadingWorkspaceTitle")}
      />
    );
  }

  if (!hasResolvedWorkspace) {
    return (
      <WorkspaceErrorState
        actions={(
          <>
            <Button onClick={() => navigate(platformStudioPaths.forms)} variant="outline">
              {t("tenant.platformStudio.forms.backToForms")}
            </Button>
            {params.modelId ? (
              <Button onClick={() => navigate(platformStudioPaths.model(params.modelId ?? ""))} variant="ghost">
                {t("tenant.platformStudio.forms.backToModel")}
              </Button>
            ) : null}
          </>
        )}
        description={routeBootstrapError ?? t("tenant.platformStudio.forms.missingDescription")}
        title={t("tenant.platformStudio.forms.missingTitle")}
      />
    );
  }

  const {
    canvasBreadcrumbItems,
    canvasNodeItems,
    canvasUnplacedFields,
    gridSettingsFieldItems,
    lookupSourcePickerModelItems,
    lookupSourcePickerSelectedFieldsSummary,
    paletteDisplaySections,
    viewSettingsActionItems,
    viewSettingsDefaultFilterItems,
    viewSettingsFilterFieldOptions,
    viewSettingsSortingFields,
    viewSettingsSystemFields,
  } = createFormBuilderWorkspaceRenderModel({
    attentionNodeIds,
    availableLookupSourceModels,
    breadcrumb,
    currentGridColumns,
    currentModel,
    currentNodes,
    currentScopeFilterDefinitions,
    currentScopeSortingFields,
    currentScopeUnplacedFields,
    currentScopeViewSettings,
    currentViewFilterTargets,
    document,
    getFieldById,
    getFieldLabelAndBoundField,
    getFieldLabelWithBoundField,
    isRootViewScope,
    lookupSourceModelsById,
    lookupSourcePicker,
    lookupSourcePickerModel,
    onCreateLibraryField: handleCreateLibraryField,
    onCreateSystemField: handleCreateSystemField,
    paletteSections,
    sortedCurrentGridScopeTargets,
    t,
    updateCurrentScopeSubformViewSettings,
    updateDocument,
    updateViewSettings,
    workflowStatusOptions,
  });

  return (
    <div className="tenant-web__platform-studio-shell tenant-web__platform-studio-shell--desktop-panels">
      <PlatformStudioTabs onFormsNavigate={() => requestNavigate(platformStudioPaths.forms)} />

      <WorkspaceTopline
        canEditViewsOnly={currentModel.canEditViewsOnly ?? false}
        draftSyncError={draftSyncError}
        isDefaultView={isDefaultView}
        isDraftSyncing={isDraftSyncing}
        isRootActor={currentActor.isRoot}
        isSaveButtonDisabled={isSaveButtonDisabled}
        isSavingDraft={isSavingDraft}
        isStructureLocked={currentModel.isStructureLocked ?? false}
        isViewLocked={currentView.isViewLocked ?? false}
        labels={{
          backToModel: t("tenant.platformStudio.forms.backToModel"),
          canEditViewsOnly: t("tenant.platformStudio.forms.canEditViewsOnly"),
          debugAction: t("tenant.platformStudio.forms.builder.debugAction"),
          defaultView: t("tenant.platformStudio.forms.builder.viewMode.default"),
          saveAction: t("tenant.platformStudio.forms.builder.saveAction"),
          savedAction: t("tenant.platformStudio.forms.builder.savedAction"),
          savingAction: t("tenant.platformStudio.forms.builder.savingAction"),
          structureLocked: t("tenant.platformStudio.forms.structureLocked"),
          syncingDraft: t("tenant.platformStudio.forms.builder.syncingDraft"),
          viewLocked: t("tenant.platformStudio.forms.viewLocked"),
        }}
        modelTitle={currentModel.title}
        onBackToModel={() => requestNavigate(platformStudioPaths.model(currentModelRouteId))}
        onDebugOpen={() => setDebugOpen(true)}
        onSave={() => {
          void handleSave();
        }}
        savePulse={savePulse}
      />

      <section className="tenant-web__platform-studio-builder-grid">
        <FieldPalette
          emptyText={t("tenant.platformStudio.forms.builder.noPaletteResults")}
          onQueryChange={setPaletteQuery}
          placeholder={t("tenant.platformStudio.forms.builder.searchPlaceholder")}
          query={paletteQuery}
          searchInputId="tenant-platform-studio-palette-search"
          sections={paletteDisplaySections}
        />

        <BuilderCanvas
          breadcrumbItems={canvasBreadcrumbItems}
          canEditVisibility={workspaceAccess.canEditSettings}
          canMoveItems={canDragItems}
          canPlaceUnplacedFields={canPlaceUnplacedFields}
          canvasEmptyText={
            structureEditingAccess.canAddElementItems || structureEditingAccess.canAddFieldItems
              ? t("tenant.platformStudio.forms.builder.canvasEmpty")
              : t("tenant.platformStudio.forms.builder.canvasEmptyLocked")
          }
          currentLevelId={currentScopeParentId}
          currentLevelBadgeLabel={t("tenant.platformStudio.forms.builder.currentLevelBadge")}
          currentLevelLabel={currentLevelLabel}
          dragToReorderLabel={t("tenant.platformStudio.forms.builder.dragToReorder")}
          dragOverNodeId={dragOverNodeId}
          draggedNodeId={draggedNodeId}
          nodeItems={canvasNodeItems}
          onDragEnd={resetCanvasDragState}
          onDragOverNode={setDragOverNodeId}
          onDragStartNode={handleCanvasDragStart}
          onDropNode={handleCanvasDrop}
          onOpenBreadcrumb={openCanvasLevel}
          onOpenLevel={openCanvasLevel}
          onOpenRoot={openCanvasRoot}
          onPlaceUnplacedField={placeCanvasUnplacedField}
          onSelectNode={selectCanvasNode}
          onToggleVisibility={toggleCanvasNodeVisibility}
          openWorkspaceLabel={t("tenant.platformStudio.forms.openWorkspace")}
          rootLevelLabel={t("tenant.platformStudio.forms.builder.rootLevel")}
          selectedNodeId={currentScopeSelectedNodeId}
          title={currentDraftViewTitle}
          unplacedFields={canvasUnplacedFields}
          unplacedFieldsDescription={t("tenant.platformStudio.forms.builder.unplacedFieldsDescription", {
            scope: currentScopePlacementLabel,
          })}
          unplacedFieldsHint={unplacedFieldsHintKey ? t(unplacedFieldsHintKey) : null}
          unplacedFieldsPlaceActionLabel={t("tenant.platformStudio.forms.builder.unplacedFieldsPlaceAction")}
          unplacedFieldsTitle={t("tenant.platformStudio.forms.builder.unplacedFieldsTitle")}
          visibilityLabels={{
            hidden: t("tenant.platformStudio.forms.builder.visibility.hidden"),
            readonly: t("tenant.platformStudio.forms.builder.visibility.readonly"),
            visible: t("tenant.platformStudio.forms.builder.visibility.visible"),
          }}
        />

        <WorkspaceInspector
          activeTab={inspectorTab}
          gridTab={
                    <GridInspectorTabBody
                      canEditSettings={workspaceAccess.canEditSettings}
                      canMoveItems={workspaceAccess.canEditSettings && sortedCurrentGridScopeTargets.length > 1}
                      dragOverFieldId={dragOverGridFieldId}
                      draggedFieldId={draggedGridFieldId}
                      fieldItems={gridSettingsFieldItems}
                      isChecklistGridScope={isChecklistGridScope}
                      meta={
                        isSubformGridScope
                          ? (currentScopeSubformNode?.title ?? t("tenant.platformStudio.forms.builder.nodeType.subform"))
                          : currentDraftViewTitle
                      }
                      onDragEnd={resetGridFieldDragState}
                      onDragOverField={setDragOverGridFieldId}
                      onDragStartField={handleGridFieldDragStart}
                      onDropField={handleGridFieldDrop}
                      onToggleVisible={updateGridColumnVisibility}
                      t={t}
                      title={t(
                        isSubformGridScope
                          ? "tenant.platformStudio.forms.builder.grid.subtable"
                          : "tenant.platformStudio.forms.builder.grid.mainTable",
                      )}
                    />
                  }
          isViewTabAvailable={isViewTabAvailable}
          onTabChange={setInspectorTab}
          selectionTab={
                    <SelectionInspectorTabBody
                      canEditModelDefinition={canEditModelDefinition}
                      canEditSettings={workspaceAccess.canEditSettings}
                      canRemoveItems={structureEditingAccess.canRemoveItems}
                      currentModel={currentModel}
                      dragOverOptionIndex={dragOverChoiceOptionIndex}
                      draggedOptionIndex={draggedChoiceOptionIndex}
                      isDefaultView={isDefaultView}
                      isStaticModel={isStaticModel}
                      lockedStructureHint={!structureEditingAccess.canRemoveItems
                        ? t(structureEditingAccess.lockReasonKey ?? "tenant.platformStudio.forms.builder.lockedStructureHint")
                        : null}
                      onAddFieldOption={addSelectedFieldOption}
                      onAutocompleteChange={updateSelectedFieldAutocomplete}
                      onChoiceDisplayChange={updateSelectedFieldChoiceDisplay}
                      onChooseLookupSource={openLookupSourcePicker}
                      onDateDisplayFormatChange={updateSelectedDateDisplayFormat}
                      onDateReadonlyChange={updateSelectedDateReadonly}
                      onDeleteNode={openDeleteNodeDialog}
                      onDeleteRequirementRule={deleteRequirementRuleAtIndex}
                      onDeleteVisibilityRule={deleteVisibilityRuleAtIndex}
                      onDragEnd={resetChoiceOptionDragState}
                      onDragOverOption={setDragOverChoiceOptionIndex}
                      onDragStartOption={handleChoiceOptionDragStart}
                      onDropOption={handleChoiceOptionDrop}
                      onLookupDisplayModeChange={updateSelectedLookupDisplayMode}
                      onMaskChange={updateSelectedFieldMask}
                      onOpenRequirementRuleEditor={openRequirementRuleEditor}
                      onOpenVisibilityRuleEditor={openVisibilityRuleEditor}
                      onOptionChange={renameSelectedFieldOption}
                      onOptionRemove={removeSelectedFieldOption}
                      onOptionStyleChange={updateSelectedFieldChoiceStyle}
                      onPlaceholderChange={updateSelectedFieldPlaceholder}
                      onRequiredChange={updateSelectedNodeRequired}
                      onRichTextChange={updateSelectedNodeText}
                      onTagModeChange={updateSelectedTagsMode}
                      onTagsMaxChange={updateSelectedTagsMax}
                      onTextChange={updateSelectedNodeText}
                      onTitleChange={updateSelectedNodeTitle}
                      onValidationChange={updateSelectedFieldValidation}
                      onViewOnlyBindingChange={updateSelectedViewOnlyBinding}
                      onVisibilityChange={updateSelectedNodeVisibility}
                      readonlyText={t(access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly")}
                      requirementRules={selectedRequirementRuleItems}
                      ruleFieldsAvailable={selectedNodeRuleFields.length > 0}
                      selectedField={selectedField}
                      selectedFieldAutocompleteChecked={selectedFieldAutocompleteChecked}
                      selectedFieldIsChoice={selectedFieldIsChoice}
                      selectedFieldIsDateToday={selectedFieldIsDateToday}
                      selectedFieldIsLookup={selectedFieldIsLookup}
                      selectedFieldIsLookupValue={selectedFieldIsLookupValue}
                      selectedFieldIsPresetLookup={selectedFieldIsPresetLookup}
                      selectedFieldIsTags={selectedFieldIsTags}
                      selectedFieldShowsLookupDisplayMode={selectedFieldShowsLookupDisplayMode}
                      selectedFieldSupportsTextInputSettings={selectedFieldSupportsTextInputSettings}
                      selectedFieldSupportsTextPreset={selectedFieldSupportsTextPreset}
                      selectedGenericLookupSourceModel={selectedGenericLookupSourceModel}
                      selectedLookupSortFieldSummary={selectedLookupSortFieldSummary}
                      selectedLookupSourceSummary={selectedLookupSourceSummary}
                      selectedLookupStoredValueSummary={selectedLookupStoredValueSummary}
                      selectedNode={selectedNode}
                      selectedNodeSupportsRules={selectedNodeSupportsRules}
                      selectedViewOnlyBindingId={selectedViewOnlyBindingOption?.bindingId ?? ""}
                      selectionPanelTopRef={selectionPanelTopRef}
                      t={t}
                      viewOnlyBindingOptions={selectedViewOnlyBindingOptions.map((option) => ({
                        bindingId: option.bindingId,
                        label: option.label,
                      }))}
                      visibilityRules={selectedVisibilityRuleItems}
                    />
                  }
          t={t}
          viewTab={
                    <ViewInspectorTabBody
                      actionItems={viewSettingsActionItems}
                      canEditModelDefinition={canEditModelDefinition}
                      canEditSettings={workspaceAccess.canEditSettings}
                      canToggleModelLocks={canToggleModelLocks}
                      canToggleViewLocks={canToggleViewLocks}
                      correctiveActionEnabled={document.viewSettings.correctiveAction.enabled}
                      currentScopeViewLabel={currentScopeViewLabel}
                      defaultFilterItems={viewSettingsDefaultFilterItems}
                      filterFieldOptions={viewSettingsFilterFieldOptions}
                      isRootActor={currentActor.isRoot}
                      isRootViewScope={isRootViewScope}
                      isStaticModel={isStaticModel}
                      modelStructureLocked={currentModel.isStructureLocked}
                      onAddDefaultFilter={addDefaultFilterCondition}
                      onCorrectiveActionChange={updateCorrectiveActionEnabled}
                      onDeleteDefaultFilter={deleteDefaultFilter}
                      onEditDefaultFilter={openDefaultFilterEditor}
                      onModelStructureLockedChange={updateModelStructureLocked}
                      onPendingDefaultFilterFieldChange={setPendingDefaultFilterFieldId}
                      onSortDirectionChange={updateCurrentViewSortDirection}
                      onSortFieldChange={updateCurrentViewSortField}
                      onSystemFieldChange={(role, fieldId) => updateSystemFieldBinding(role as SystemFieldRole, fieldId)}
                      onViewActiveChange={updateViewActive}
                      onViewDescriptionChange={updateViewDescription}
                      onViewLockedChange={updateViewLocked}
                      onViewTitleChange={updateViewTitle}
                      onWorkflowStatusOptionChange={updateWorkflowStatusOption}
                      pendingDefaultFilterFieldId={pendingDefaultFilterFieldId}
                      sortDirection={isRootViewScope
                        ? document.viewSettings.list.sorting.direction
                        : (currentScopeViewSettings?.list.sorting.direction ?? "asc")}
                      sortFieldId={isRootViewScope
                        ? (document.viewSettings.list.sorting.fieldId ?? "")
                        : (currentScopeViewSettings?.list.sorting.fieldId ?? "")}
                      sortingFieldItems={viewSettingsSortingFields}
                      systemFields={viewSettingsSystemFields}
                      t={t}
                      viewActive={currentView.isActive}
                      viewDescription={document.viewDescription}
                      viewLocked={currentView.isViewLocked ?? false}
                      viewTitle={document.viewTitle}
                    />
                  }
        />
      </section>

      <WorkspaceDialogStack
        canEditSettings={workspaceAccess.canEditSettings}
        closeDefaultFilterEditor={closeDefaultFilterEditor}
        closeLookupSourcePicker={closeLookupSourcePicker}
        closeQuickFilterEditor={closeQuickFilterEditor}
        closeRequirementRuleEditor={closeRequirementRuleEditor}
        closeVisibilityRuleEditor={closeVisibilityRuleEditor}
        currentViewFilterTargets={currentViewFilterTargets}
        debugCompiledRuntime={debugCompiledRuntime}
        debugDataSchema={debugDataSchema}
        debugOpen={debugOpen}
        debugUiSchema={debugUiSchema}
        defaultFilterEditor={defaultFilterEditor}
        deleteDefaultFilter={deleteDefaultFilter}
        deleteNodeOpen={deleteNodeOpen}
        deleteRequirementRuleEditor={deleteRequirementRuleEditor}
        deleteVisibilityRuleEditor={deleteVisibilityRuleEditor}
        isLookupSourcePickerLoading={isLookupSourcePickerLoading}
        isRootViewScope={isRootViewScope}
        leaveConfirmOpen={leaveConfirmOpen}
        lookupSourcePicker={lookupSourcePicker}
        lookupSourcePickerError={lookupSourcePickerError}
        lookupSourcePickerModel={lookupSourcePickerModel}
        lookupSourcePickerModelItems={lookupSourcePickerModelItems}
        lookupSourcePickerSelectedFieldsSummary={lookupSourcePickerSelectedFieldsSummary}
        onAddQuickFilterCondition={addQuickFilterCondition}
        onConfirmDeleteNode={confirmDeleteNode}
        onDefaultFilterConditionChange={setDefaultFilterCondition}
        onDeleteNodeOpenChange={setDeleteNodeOpen}
        onDebugOpenChange={setDebugOpen}
        onLeaveConfirmOpenChange={onLeaveConfirmOpenChange}
        onLookupSourcePickerFieldCheckedChange={setLookupSourcePickerFieldChecked}
        onLookupSourcePickerModelChange={setLookupSourcePickerModel}
        onLookupSourcePickerOpenChange={onLookupSourcePickerOpenChange}
        onLookupSourcePickerSortFieldChange={setLookupSourcePickerSortField}
        onQuickFilterColorChange={setQuickFilterColor}
        onQuickFilterConditionChange={setQuickFilterCondition}
        onQuickFilterConditionRemove={removeQuickFilterCondition}
        onQuickFilterLabelChange={setQuickFilterLabel}
        onRequirementRuleConditionChange={setRequirementRuleCondition}
        onRequirementRuleEffectChange={setRequirementRuleEffect}
        onResolveLeaveConfirmation={resolveLeaveConfirmation}
        onSaveDefaultFilterEditor={saveDefaultFilterEditor}
        onSaveLookupSourcePicker={saveLookupSourcePicker}
        onSaveQuickFilterEditor={saveQuickFilterEditor}
        onSaveRequirementRuleEditor={saveRequirementRuleEditor}
        onSaveVisibilityRuleEditor={saveVisibilityRuleEditor}
        onVisibilityRuleConditionChange={setVisibilityRuleCondition}
        onVisibilityRuleEffectChange={setVisibilityRuleEffect}
        quickFilterEditor={quickFilterEditor}
        requirementRuleEditor={requirementRuleEditor}
        rootViewFilterTargets={rootViewFilterTargets}
        selectedNodeLabel={selectedNodeLabel}
        selectedNodeRuleFields={selectedNodeRuleFields}
        t={t}
        visibilityRuleEditor={visibilityRuleEditor}
      />
    </div>
  );
}
