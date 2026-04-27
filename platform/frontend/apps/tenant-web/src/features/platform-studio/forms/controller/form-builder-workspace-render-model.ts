import {
  type useTranslation,
} from "@platform/i18n";

import {
  type FormBuilderLibraryFieldDefinition,
} from "../forms-builder-library";
import {
  addFormBuilderElementNode,
  getCurrentFormBuilderInsertParentId,
  type FormBuilderDocument,
  type FormBuilderFilterDefinitions,
  type FormBuilderGridColumnDefinition,
  type FormBuilderNode,
  type FormBuilderSubformViewSettings,
  type FormBuilderViewSettings,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import {
  applyRootViewActionUpdate,
  applySubformViewActionUpdate,
} from "./form-builder-workspace-document-updates";
import {
  getFieldPaletteDescription,
  getFieldTypeKey,
  getSummaryText,
} from "./form-builder-workspace-display-helpers";
import {
  createCanvasBreadcrumbItems,
  createCanvasNodeItems,
  createCanvasUnplacedFields,
  createGridSettingsFieldItems,
  createLookupSourcePickerModelItems,
  createLookupSourcePickerSelectedFieldsSummary,
  createViewSettingsDefaultFilterItems,
  createViewSettingsFilterFieldOptions,
  createViewSettingsSortingFields,
} from "./form-builder-workspace-display-items";
import {
  getFilterConditionSummary,
} from "./form-builder-workspace-filter-helpers";
import {
  getLookupModelFieldLabels,
  type LookupSourceModelOption,
} from "./form-builder-workspace-lookup-options";
import {
  type FormBuilderLookupSourcePickerState,
} from "./form-builder-workspace-lookup-source-picker";
import {
  createPaletteDisplaySections,
  type SystemFieldRole,
} from "./form-builder-workspace-palette-items";
import {
  createViewSettingsSystemFields,
} from "./form-builder-workspace-system-fields";

type Translate = ReturnType<typeof useTranslation>["t"];

type PaletteSections = Parameters<typeof createPaletteDisplaySections>[0]["sections"];
type ViewSettingsSystemFieldsInput = Parameters<typeof createViewSettingsSystemFields>[0];

type UpdateDocument = (
  updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
) => void;

type CreateFormBuilderWorkspaceRenderModelInput = {
  attentionNodeIds: ReadonlySet<string>;
  availableLookupSourceModels: ReadonlyArray<LookupSourceModelOption>;
  breadcrumb: ReadonlyArray<FormBuilderNode>;
  currentGridColumns: ReadonlyArray<FormBuilderGridColumnDefinition>;
  currentModel: FormsPlaceholderModel;
  currentNodes: ReadonlyArray<FormBuilderNode>;
  currentScopeFilterDefinitions: FormBuilderFilterDefinitions;
  currentScopeSortingFields: ReadonlyArray<FormsPlaceholderField>;
  currentScopeUnplacedFields: ReadonlyArray<FormsPlaceholderField>;
  currentScopeViewSettings: FormBuilderSubformViewSettings | null | undefined;
  currentViewFilterTargets: ReadonlyArray<FormsPlaceholderField>;
  document: FormBuilderDocument;
  getFieldById: ViewSettingsSystemFieldsInput["getFieldById"];
  getFieldLabelAndBoundField: ViewSettingsSystemFieldsInput["getFieldLabelAndBoundField"];
  getFieldLabelWithBoundField: ViewSettingsSystemFieldsInput["getFieldLabelWithBoundField"];
  isRootViewScope: boolean;
  lookupSourceModelsById: Readonly<Record<string, LookupSourceModelOption>>;
  lookupSourcePicker: FormBuilderLookupSourcePickerState | null;
  lookupSourcePickerModel: LookupSourceModelOption | null;
  onCreateLibraryField: (definition: FormBuilderLibraryFieldDefinition) => void;
  onCreateSystemField: (role: SystemFieldRole) => void;
  paletteSections: PaletteSections;
  sortedCurrentGridScopeTargets: ReadonlyArray<FormsPlaceholderField>;
  t: Translate;
  updateCurrentScopeSubformViewSettings: (
    updater: (viewSettings: FormBuilderSubformViewSettings) => FormBuilderSubformViewSettings,
  ) => void;
  updateDocument: UpdateDocument;
  updateViewSettings: (
    updater: (viewSettings: FormBuilderViewSettings) => FormBuilderViewSettings,
  ) => void;
  workflowStatusOptions: ReadonlyArray<string>;
};

export function createFormBuilderWorkspaceRenderModel({
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
  onCreateLibraryField,
  onCreateSystemField,
  paletteSections,
  sortedCurrentGridScopeTargets,
  t,
  updateCurrentScopeSubformViewSettings,
  updateDocument,
  updateViewSettings,
  workflowStatusOptions,
}: CreateFormBuilderWorkspaceRenderModelInput) {
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
    onCreateLibraryField,
    onCreateSystemField,
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
  const viewSettingsSortingFields = createViewSettingsSortingFields(currentScopeSortingFields);
  const viewSettingsFilterFieldOptions = createViewSettingsFilterFieldOptions(currentViewFilterTargets);
  const viewSettingsDefaultFilterItems = createViewSettingsDefaultFilterItems({
    conditions: currentScopeFilterDefinitions.defaultFilters.conditions,
    fields: currentViewFilterTargets,
    getFilterConditionSummary,
    t,
  });
  const viewSettingsSystemFields = createViewSettingsSystemFields({
    document,
    fields: currentModel.fields,
    getFieldById,
    getFieldLabelAndBoundField,
    getFieldLabelWithBoundField,
    t,
    workflowStatusOptions,
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

  return {
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
  } as const;
}
