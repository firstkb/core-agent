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
import { createFormBuilderCanvasHandlers } from "../controller/form-builder-workspace-canvas-handlers";
import {
  createSelectedFieldSettingsHandlers,
} from "../controller/form-builder-workspace-selected-field-settings-handlers";
import { buildCanonicalDataSchema } from "../controller/form-builder-workspace-data-schema";
import { getDeleteNodeConfirmationAction } from "../controller/form-builder-workspace-delete-node";
import { getCanvasAttentionNodeIds } from "../controller/form-builder-workspace-diff-helpers";
import {
  applyRootViewActionUpdate,
  applySubformViewActionUpdate,
} from "../controller/form-builder-workspace-document-updates";
import {
  getFieldPaletteDescription,
  getFieldTypeKey,
  getSummaryText,
} from "../controller/form-builder-workspace-display-helpers";
import { buildCanonicalLayoutBlueprint } from "../controller/form-builder-workspace-layout-compile";
import {
  createCanvasBreadcrumbItems,
  createCanvasNodeItems,
  createCanvasUnplacedFields,
  createGridSettingsFieldItems,
  createLookupSourcePickerModelItems,
  createLookupSourcePickerSelectedFieldsSummary,
  createRulesPanelRuleItems,
  createViewSettingsDefaultFilterItems,
  createViewSettingsFilterFieldOptions,
  createViewSettingsSortingFields,
} from "../controller/form-builder-workspace-display-items";
import {
  findFormBuilderNodeByFieldId,
  getAuthoringFieldLabel,
  getFieldById,
  getFieldLabelAndBoundField,
  getFieldLabelWithBoundField,
  getRuleScopeFields,
  getScopeFields,
  sortGridScopeFields,
} from "../controller/form-builder-workspace-field-scope-grid";
import {
  getFilterConditionSummary,
  getQuickFilterSummary,
} from "../controller/form-builder-workspace-filter-helpers";
import {
  getLookupModelFieldLabels,
  getLookupSortFieldSummary,
  getLookupSourceModelById,
  getLookupSourceSummary,
  getLookupStoredValueSummary,
} from "../controller/form-builder-workspace-lookup-options";
import {
  applyLookupSourcePickerSelectionToField,
} from "../controller/form-builder-workspace-lookup-source-picker";
import {
  getFieldsWithLookupDerivedOutputs,
} from "../controller/form-builder-workspace-lookup-derived-outputs";
import {
  createPaletteDisplaySections,
  type SystemFieldRole,
} from "../controller/form-builder-workspace-palette-items";
import {
  isPersistedModelField,
} from "../controller/form-builder-workspace-normalization-helpers";
import { createFormBuilderRuleFilterHandlers } from "../controller/form-builder-workspace-rule-filter-handlers";
import {
  getRuleSummary,
} from "../controller/form-builder-workspace-rule-helpers";
import {
  createEmptyLayoutBlueprint,
  deriveModelSchemaScopes,
  getScopeSchemaScopeKey,
} from "../controller/form-builder-workspace-schema-utils";
import {
  applySelectedFieldTitleUpdate,
  applySelectedNodeRequiredUpdate,
  applySelectedNodeTextUpdate,
  applySelectedNodeTitleUpdate,
  applySelectedNodeVisibilityUpdate,
} from "../controller/form-builder-workspace-selected-node-updates";
import {
  applyCreatedSystemFieldDocumentBinding,
  applySystemFieldDocumentBinding,
  applySystemFieldSemanticRoleBinding,
  applyWorkflowStatusOptionUpdate,
  prepareSystemFieldCreation,
} from "../controller/form-builder-workspace-system-field-derivation";
import {
  createSystemFieldPaletteItems,
  createViewSettingsSystemFields,
  getBoundSystemFieldIdByRole,
} from "../controller/form-builder-workspace-system-fields";
import { buildCanonicalUiSchema } from "../controller/form-builder-workspace-ui-schema";
import { createFormBuilderViewGridHandlers } from "../controller/form-builder-workspace-view-grid-handlers";
import {
  getViewOnlyBindingOption,
  getViewOnlyBindingOptions,
} from "../controller/form-builder-workspace-view-only-bindings";
import { useFormBuilderDebugDialog } from "../controller/use-form-builder-debug-dialog";
import { useFormBuilderDraftHydration } from "../controller/use-form-builder-draft-hydration";
import { useFormBuilderDraftSaveAction } from "../controller/use-form-builder-draft-save-action";
import { useFormBuilderLeaveGuard } from "../controller/use-form-builder-leave-guard";
import { useFormBuilderLookupSourceModels } from "../controller/use-form-builder-lookup-source-models";
import { useFormBuilderLookupSourcePicker } from "../controller/use-form-builder-lookup-source-picker";
import { useFormBuilderRuleFilterEditors } from "../controller/use-form-builder-rule-filter-editors";
import { useFormBuilderRouteWorkspace } from "../controller/use-form-builder-route-workspace";
import { useFormBuilderTransientUiEffects } from "../controller/use-form-builder-transient-ui-effects";
import { useFormBuilderWorkspaceController } from "../controller/use-form-builder-workspace-controller";
import { BuilderCanvas } from "../components/builder-canvas";
import { WorkspaceLoadingState } from "../components/empty-state";
import { WorkspaceErrorState } from "../components/error-state";
import { FieldPalette } from "../components/field-palette";
import { GridInspectorTabBody } from "../components/grid-inspector-tab-body";
import {
  type InspectorPanelTabValue,
  WorkspaceInspector,
} from "../components/workspace-inspector";
import {
  isPresetLookupField,
} from "../components/lookup-filter-editor-helpers";
import { SelectionInspectorTabBody } from "../components/selection-inspector-tab-body";
import { ViewInspectorTabBody } from "../components/view-inspector-tab-body";
import { WorkspaceDialogStack } from "../components/workspace-dialog-stack";
import { WorkspaceTopline } from "../components/workspace-topline";
import {
  createFormBuilderFieldFromDefinition,
  formBuilderPaletteSectionDefinitions,
  type FormBuilderLibraryFieldDefinition,
} from "../forms-builder-library";
import {
  addFormBuilderElementNode,
  addFormBuilderFieldNode,
  getCurrentFormBuilderInsertParentId,
  getElementPaletteItems,
  getFieldPaletteItems,
  getFormBuilderBreadcrumb,
  getFormBuilderDisplayLabel,
  getFormBuilderNodeScopeId,
  getFormBuilderScopeUnplacedFieldIds,
  createPersistedFormBuilderDocument,
  isFormBuilderContainer,
  normalizePersistedFormBuilderDocument,
  removeFormBuilderNode,
  useFormBuilderDocument,
  type FormBuilderNode,
  type FormBuilderFieldPaletteCategory,
} from "../forms-builder-state";
import {
  getFormsAuthoringActor,
} from "../forms-actors";
import { useFormBuilderAuthoring } from "../forms-authoring-context";
import {
  cloneFormsPlaceholderModel,
  findFormsPlaceholderScreenById,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
  type FormsPlaceholderField,
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
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [draggedGridFieldId, setDraggedGridFieldId] = useState<string | null>(null);
  const [dragOverGridFieldId, setDragOverGridFieldId] = useState<string | null>(null);
  const [draggedChoiceOptionIndex, setDraggedChoiceOptionIndex] = useState<number | null>(null);
  const [dragOverChoiceOptionIndex, setDragOverChoiceOptionIndex] = useState<number | null>(null);
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
  const currentModelSchemaScopes = useMemo(
    () => deriveModelSchemaScopes(currentModel, document),
    [currentModel, document],
  );
  const savedModelSchemaScopes = useMemo(
    () => deriveModelSchemaScopes(savedModelDraft, savedDocument),
    [savedDocument, savedModelDraft],
  );
  const currentDataSchema = useMemo(
    () => buildCanonicalDataSchema({
      ...currentModel,
      schemaScopes: currentModelSchemaScopes,
    }, document),
    [currentModel, currentModelSchemaScopes, document],
  );
  const savedDataSchema = useMemo(
    () => buildCanonicalDataSchema({
      ...savedModelDraft,
      schemaScopes: savedModelSchemaScopes,
    }, savedDocument),
    [savedDocument, savedModelDraft, savedModelSchemaScopes],
  );
  const attentionNodeIds = useMemo(
    () => getCanvasAttentionNodeIds(persistedDocument, savedDocument, currentModel, savedModelDraft),
    [currentModel, persistedDocument, savedDocument, savedModelDraft],
  );
  const selectedNodeScopeFields = useMemo(
    () => selectedNode ? getRuleScopeFields(document, currentModel.fields, selectedNode.id) : [],
    [currentModel.fields, document, selectedNode],
  );
  const selectedNodeRuleFields = useMemo(
    () => selectedNode?.type === "field" && selectedField
      ? selectedNodeScopeFields.filter((field) => field.id !== selectedField.id)
      : selectedNodeScopeFields,
    [selectedField, selectedNode?.type, selectedNodeScopeFields],
  );
  const selectedVisibilityRuleItems = createRulesPanelRuleItems({
    fields: selectedNodeRuleFields,
    getRuleSummary,
    rules: selectedNode?.rules?.visibilityRules ?? [],
    t,
  });
  const selectedRequirementRuleItems = createRulesPanelRuleItems({
    fields: selectedNodeRuleFields,
    getRuleSummary,
    rules: selectedNode?.rules?.requirementRules ?? [],
    t,
  });
  const currentGridScopeFields = useMemo(
    () => getScopeFields(document, currentModel.fields, currentScopeSubformNode?.id ?? null),
    [currentModel.fields, currentScopeSubformNode?.id, document],
  );
  const currentGridScopeTargets = useMemo(
    () => getFieldsWithLookupDerivedOutputs({
      document,
      fields: currentGridScopeFields,
      getFieldLabelAndBoundField,
      t,
    }),
    [currentGridScopeFields, document, t],
  );
  const sortedCurrentGridScopeTargets = useMemo(
    () => sortGridScopeFields(currentGridScopeTargets, currentGridColumns),
    [currentGridColumns, currentGridScopeTargets],
  );
  const rootViewScopeFields = useMemo(
    () => getScopeFields(document, currentModel.fields, null),
    [currentModel.fields, document],
  );
  const rootViewFilterTargets = useMemo(
    () => getFieldsWithLookupDerivedOutputs({
      document,
      fields: rootViewScopeFields,
      getFieldLabelAndBoundField,
      t,
    }),
    [document, rootViewScopeFields, t],
  );
  const currentViewFilterTargets = isRootViewScope ? rootViewFilterTargets : currentGridScopeTargets;
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
  const currentScopeViewLabel = isRootViewScope
    ? currentDraftViewTitle
    : (currentScopeSubformNode?.title ?? t("tenant.platformStudio.forms.builder.nodeType.subform"));
  const currentScopeSortingFields = isRootViewScope ? rootViewScopeFields : currentGridScopeFields;
  const selectedFieldIsPresetLookup = selectedField ? isPresetLookupField(selectedField) : false;
  const selectedFieldShowsLookupDisplayMode = selectedFieldIsLookup
    && !selectedFieldIsPresetLookup
    && !selectedFieldIsLookupValue
    && (selectedField?.selectionMode ?? "single") === "single";
  const selectedLookupSourceSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup" ? getLookupSourceSummary(selectedField, t) : null,
    [selectedField, t],
  );
  const selectedLookupSourceModelId =
    selectedField?.kind === "db_lookup" && !selectedFieldIsPresetLookup
      ? selectedField.lookupConfig?.sourceModel?.trim() ?? ""
      : "";
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
  const selectedNodeScopeSubformId = selectedNode
    ? getFormBuilderNodeScopeId(document, selectedNode.id)
    : "root";
  const selectedViewOnlyBindingOptions = useMemo(
    () => selectedNode?.type === "view_only_field"
      ? getViewOnlyBindingOptions({
          document,
          fields: currentModel.fields,
          getFieldLabelAndBoundField,
          getScopeFields,
          scopeSubformId: selectedNodeScopeSubformId === "root" ? null : selectedNodeScopeSubformId,
          t,
        })
      : [],
    [currentModel.fields, document, selectedNode?.id, selectedNode?.type, selectedNodeScopeSubformId, t],
  );
  const selectedViewOnlyBindingOption = useMemo(
    () => selectedNode?.type === "view_only_field"
      ? getViewOnlyBindingOption({
          binding: selectedNode.viewOnlyBinding,
          document,
          fields: currentModel.fields,
          getFieldById,
          getFieldLabelAndBoundField,
          t,
        })
      : null,
    [currentModel.fields, document, selectedNode, t],
  );
  const selectedGenericLookupSourceModel = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupSourceModelById(availableLookupSourceModels, selectedField.lookupConfig?.sourceModel)
      : null,
    [availableLookupSourceModels, selectedField],
  );
  const selectedLookupStoredValueSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupStoredValueSummary(selectedField, selectedGenericLookupSourceModel, t)
      : null,
    [selectedField, selectedGenericLookupSourceModel, t],
  );
  const selectedLookupSortFieldSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupSortFieldSummary(selectedField, selectedGenericLookupSourceModel, t)
      : null,
    [selectedField, selectedGenericLookupSourceModel, t],
  );
  const currentUiSchema = useMemo(
    () => buildCanonicalUiSchema(document, currentModel),
    [currentModel, document],
  );
  const currentLayoutBlueprint = useMemo(
    () => (isDefaultView ? buildCanonicalLayoutBlueprint(document) : layoutBlueprintDraft),
    [document, isDefaultView, layoutBlueprintDraft],
  );
  const breadcrumb = getFormBuilderBreadcrumb(document);
  const elementItems = getElementPaletteItems(document, structureEditingAccess, paletteQuery);
  const workflowStatusField = getFieldById(currentModel.fields, document.systemFields.workflowStatus?.fieldId);
  const workflowStatusOptions = workflowStatusField?.options ?? [];
  const currentScopePlacementLabel = isRootViewScope
    ? t("tenant.platformStudio.forms.builder.rootLevel")
    : currentScopeViewLabel;
  const currentScopeUnplacedFieldIds = useMemo(
    () => getFormBuilderScopeUnplacedFieldIds(document, currentScopeSubformNode?.id ?? null),
    [currentScopeSubformNode?.id, document],
  );
  const currentScopeUnplacedFields = useMemo(() => {
    const fieldById = new Map(currentModel.fields.map((field) => [field.id, {
      ...field,
      label: getAuthoringFieldLabel(field, document),
    }]));
    return currentScopeUnplacedFieldIds.flatMap((fieldId) => {
      const field = fieldById.get(fieldId);
      return field ? [field] : [];
    });
  }, [currentModel.fields, currentScopeUnplacedFieldIds, document]);
  const canCreateFieldAtCurrentLevel = canPlaceFieldAtCurrentLevel;
  const fieldPlacementAccess = structureEditingAccess;
  const fieldItems = getFieldPaletteItems(document, fieldPlacementAccess, paletteQuery);
  const canPlaceUnplacedFields = isDefaultView
    && canPlaceFieldAtCurrentLevel
    && structureEditingAccess.canAddFieldItems;
  const unplacedFieldsHintKey = !isDefaultView
    ? "tenant.platformStudio.forms.builder.unplacedFieldsDefaultOnlyHint"
    : !canPlaceFieldAtCurrentLevel
      ? "tenant.platformStudio.forms.builder.unplacedFieldsOpenContainerHint"
      : (!structureEditingAccess.canAddFieldItems
        ? (structureEditingAccess.structureLockReasonKey ?? structureEditingAccess.lockReasonKey)
        : null);
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

  const {
    leaveConfirmOpen,
    onLeaveConfirmOpenChange,
    requestNavigate,
    resolveLeaveConfirmation,
  } = useFormBuilderLeaveGuard({
    hasUnsavedChanges,
    onNavigate: navigate,
  });

  const systemFieldItems = useMemo(
    () => createSystemFieldPaletteItems({
      canPlaceFieldAtCurrentLevel,
      document,
      fieldPlacementAccess,
      paletteQuery,
    }),
    [canPlaceFieldAtCurrentLevel, document, fieldPlacementAccess, paletteQuery],
  );

  const paletteSections = useMemo(
    () =>
      formBuilderPaletteSectionDefinitions
        .map((section) => {
          if (section.key === "layout" || section.key === "content") {
            return {
              items: elementItems.filter((item) => item.category === section.key),
              key: section.key,
              labelKey: section.labelKey,
            };
          }

          if (section.key === "systemFields") {
            return {
              items: systemFieldItems,
              key: section.key,
              labelKey: section.labelKey,
            };
          }

          return {
            items: fieldItems.filter((item) => item.category === section.key as FormBuilderFieldPaletteCategory),
            key: section.key,
            labelKey: section.labelKey,
          };
        })
        .filter((section) => section.items.length > 0),
    [elementItems, fieldItems, systemFieldItems],
  );

  function updateDocument(updater: (currentDocument: typeof document) => typeof document) {
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

  const {
    addSelectedFieldOption,
    removeSelectedFieldOption,
    renameSelectedFieldOption,
    reorderSelectedFieldOption,
    updateSelectedDateDisplayFormat,
    updateSelectedDateReadonly,
    updateSelectedFieldAutocomplete,
    updateSelectedFieldChoiceDisplay,
    updateSelectedFieldChoiceStyle,
    updateSelectedFieldMask,
    updateSelectedFieldPlaceholder,
    updateSelectedFieldValidation,
    updateSelectedLookupDisplayMode,
    updateSelectedTagsMax,
    updateSelectedTagsMode,
    updateSelectedViewOnlyBinding,
  } = createSelectedFieldSettingsHandlers({
    defaultViewOnlyFieldTitle: t("tenant.platformStudio.forms.builder.nodeType.view_only_field"),
    newChoiceOptionLabel: t("tenant.platformStudio.forms.builder.fieldSettings.newOption"),
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

  function resetChoiceOptionDragState() {
    setDraggedChoiceOptionIndex(null);
    setDragOverChoiceOptionIndex(null);
  }

  function handleChoiceOptionDragStart(optionIndex: number) {
    setDraggedChoiceOptionIndex(optionIndex);
    setDragOverChoiceOptionIndex(optionIndex);
  }

  function handleChoiceOptionDrop(optionIndex: number) {
    if (draggedChoiceOptionIndex === null || draggedChoiceOptionIndex === optionIndex) {
      setDragOverChoiceOptionIndex(null);
      return;
    }

    reorderSelectedFieldOption(draggedChoiceOptionIndex, optionIndex);
    resetChoiceOptionDragState();
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
    updateDefaultFilters,
    updateQuickFilters,
    updateRequirementRules,
    updateSelectedNodeRules,
    updateVisibilityRules,
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

  const {
    addDefaultFilterCondition,
    addQuickFilter,
    reorderGridColumns,
    updateCorrectiveActionEnabled,
    updateCurrentGridColumns,
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

  function resetGridFieldDragState() {
    setDraggedGridFieldId(null);
    setDragOverGridFieldId(null);
  }

  function handleGridFieldDragStart(fieldId: string) {
    setDraggedGridFieldId(fieldId);
    setDragOverGridFieldId(fieldId);
  }

  function handleGridFieldDrop(fieldId: string) {
    if (!draggedGridFieldId || draggedGridFieldId === fieldId) {
      return;
    }

    reorderGridColumns(draggedGridFieldId, fieldId);
    resetGridFieldDragState();
  }

  const {
    handleCanvasDragStart,
    handleCanvasDrop,
    openCanvasLevel,
    openCanvasRoot,
    placeCanvasUnplacedField,
    resetCanvasDragState,
    selectCanvasNode,
    toggleCanvasNodeVisibility,
  } = createFormBuilderCanvasHandlers({
    currentScopeParentId,
    currentScopeUnplacedFields,
    draggedNodeId,
    selectInspectorSelectionTab: () => setInspectorTab("selection"),
    setDragOverNodeId,
    setDraggedNodeId,
    updateDocument,
  });

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
            fields: currentModel.fields,
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
    } = prepareSystemFieldCreation(currentModel.fields, role);

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

    setInspectorTab("view");
  }

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

  const paletteDisplaySections = createPaletteDisplaySections({
    getFieldPaletteDescription,
    onAddElement: (nodeType, initialNode) => updateDocument((currentDocument) =>
      addFormBuilderElementNode(
        currentDocument,
        getCurrentFormBuilderInsertParentId(currentDocument),
        nodeType,
        initialNode,
      )
    ),
    onCreateLibraryField: handleCreateLibraryField,
    onCreateSystemField: handleCreateSystemField,
    sections: paletteSections,
    t,
  });
  const canvasBreadcrumbItems = createCanvasBreadcrumbItems({
    breadcrumb,
    currentModel,
  });
  const canvasNodeItems = createCanvasNodeItems({
    attentionNodeIds,
    currentModel,
    currentNodes,
    document,
    getSummaryText,
    t,
  });
  const canvasUnplacedFields = createCanvasUnplacedFields({
    fields: currentScopeUnplacedFields,
    getFieldTypeKey,
    t,
  });
  const gridSettingsFieldItems = createGridSettingsFieldItems({
    columns: currentGridColumns,
    fields: sortedCurrentGridScopeTargets,
  });
  const viewSettingsActionItems = isRootViewScope
    ? ([
        ["canAdd", "tenant.platformStudio.forms.builder.viewSettings.action.add"],
        ["canView", "tenant.platformStudio.forms.builder.viewSettings.action.view"],
        ["canEdit", "tenant.platformStudio.forms.builder.viewSettings.action.edit"],
        ["canDelete", "tenant.platformStudio.forms.builder.viewSettings.action.delete"],
      ] as const).map(([actionKey, labelKey]) => ({
        checked: document.viewSettings.actions[actionKey],
        key: actionKey,
        label: t(labelKey),
        onChange: (checked: boolean) =>
          updateViewSettings((viewSettings) => applyRootViewActionUpdate(viewSettings, actionKey, checked)),
      }))
    : ([
        ["canAdd", "tenant.platformStudio.forms.builder.viewSettings.action.add"],
        ["canEdit", "tenant.platformStudio.forms.builder.viewSettings.action.edit"],
        ["canDelete", "tenant.platformStudio.forms.builder.viewSettings.action.delete"],
      ] as const).map(([actionKey, labelKey]) => ({
        checked: Boolean(currentScopeViewSettings?.actions[actionKey]),
        key: actionKey,
        label: t(labelKey),
        onChange: (checked: boolean) =>
          updateCurrentScopeSubformViewSettings((viewSettings) =>
            applySubformViewActionUpdate(viewSettings, actionKey, checked)
          ),
      }));
  const viewSettingsSystemFields = createViewSettingsSystemFields({
    document,
    fields: currentModel.fields,
    getFieldById,
    getFieldLabelAndBoundField,
    getFieldLabelWithBoundField,
    t,
    workflowStatusOptions,
  });
  const viewSettingsSortingFields = createViewSettingsSortingFields(currentScopeSortingFields);
  const viewSettingsFilterFieldOptions = createViewSettingsFilterFieldOptions(currentViewFilterTargets);
  const viewSettingsDefaultFilterItems = createViewSettingsDefaultFilterItems({
    conditions: currentScopeFilterDefinitions.defaultFilters.conditions,
    fields: currentViewFilterTargets,
    getFilterConditionSummary,
    t,
  });
  const lookupSourcePickerModelItems = createLookupSourcePickerModelItems({
    sourceModels: availableLookupSourceModels,
    sourceModelsById: lookupSourceModelsById,
  });
  const lookupSourcePickerSelectedFieldsSummary = createLookupSourcePickerSelectedFieldsSummary({
    getLookupModelFieldLabels,
    lookupSourcePicker,
    selectedModel: lookupSourcePickerModel,
    t,
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
