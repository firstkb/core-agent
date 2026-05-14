import { useMemo } from "react";

import { type useTranslation } from "@platform/i18n";

import { isPresetLookupField } from "../components/lookup-filter-editor-helpers";
import {
  getFormBuilderBreadcrumb,
  getFormBuilderNodeScopeId,
  getFormBuilderScopeUnplacedFieldIds,
  type FormBuilderDocument,
  type FormBuilderGridColumnDefinition,
  type FormBuilderNode,
  type FormBuilderWorkspaceAccess,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { buildCanonicalDataSchema } from "./form-builder-workspace-data-schema";
import { getCanvasAttentionNodeIds } from "./form-builder-workspace-diff-helpers";
import {
  createRulesPanelRuleItems,
} from "./form-builder-workspace-display-items";
import {
  getFieldById,
  getFieldLabelAndBoundField,
  getRuleScopeFields,
  getScopeFields,
  getVisibleGridScopeFields,
  sortGridScopeFields,
} from "./form-builder-workspace-field-scope-grid";
import {
  getFieldsWithViewOnlyGridTargets,
  getViewFilterTargetFields,
} from "./form-builder-workspace-lookup-derived-outputs";
import {
  getLookupSourceSummary,
} from "./form-builder-workspace-lookup-options";
import {
  createFormBuilderWorkspacePaletteSections,
  getCurrentScopeUnplacedFields,
} from "./form-builder-workspace-palette-sections";
import {
  getRuleSummary,
} from "./form-builder-workspace-rule-helpers";
import {
  deriveModelSchemaScopes,
} from "./form-builder-workspace-schema-utils";
import { buildCanonicalUiSchema } from "./form-builder-workspace-ui-schema";
import {
  getViewOnlyBindingOption,
  getViewOnlyBindingOptions,
} from "./form-builder-workspace-view-only-bindings";
import { buildCanonicalLayoutBlueprint } from "./form-builder-workspace-layout-compile";

type Translate = ReturnType<typeof useTranslation>["t"];

type UseFormBuilderWorkspaceDerivedStateInput = {
  canPlaceFieldAtCurrentLevel: boolean;
  currentDraftViewTitle: string;
  currentGridColumns: ReadonlyArray<FormBuilderGridColumnDefinition>;
  currentModel: FormsPlaceholderModel;
  currentScopeSubformNode: FormBuilderNode | null | undefined;
  document: FormBuilderDocument;
  isDefaultView: boolean;
  isRootViewScope: boolean;
  layoutBlueprintDraft: Record<string, unknown>;
  paletteQuery: string;
  persistedDocument: FormBuilderDocument;
  savedDocument: FormBuilderDocument;
  savedModelDraft: FormsPlaceholderModel;
  selectedField: FormsPlaceholderField | null;
  selectedFieldIsLookup: boolean;
  selectedFieldIsLookupValue: boolean;
  selectedNode: FormBuilderNode | null;
  structureEditingAccess: FormBuilderWorkspaceAccess;
  t: Translate;
};

export function useFormBuilderWorkspaceDerivedState({
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
}: UseFormBuilderWorkspaceDerivedStateInput) {
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
    () => getFieldsWithViewOnlyGridTargets({
      columns: currentGridColumns,
      document,
      fields: currentGridScopeFields,
      getFieldLabelAndBoundField,
      scopeSubformId: currentScopeSubformNode?.id ?? null,
      t,
    }),
    [currentGridColumns, currentGridScopeFields, currentScopeSubformNode?.id, document, getFieldLabelAndBoundField, t],
  );
  const sortedCurrentGridScopeTargets = useMemo(
    () => sortGridScopeFields(currentGridScopeTargets, currentGridColumns),
    [currentGridColumns, currentGridScopeTargets],
  );
  const rootViewScopeFields = useMemo(
    () => getScopeFields(document, currentModel.fields, null),
    [currentModel.fields, document],
  );
  const currentGridViewFilterTargets = useMemo(
    () => getViewFilterTargetFields({
      document,
      fields: currentGridScopeFields,
      getFieldLabelAndBoundField,
    }),
    [currentGridScopeFields, document, getFieldLabelAndBoundField],
  );
  const rootViewFilterTargets = useMemo(
    () => getViewFilterTargetFields({
      document,
      fields: rootViewScopeFields,
      getFieldLabelAndBoundField,
    }),
    [document, getFieldLabelAndBoundField, rootViewScopeFields],
  );
  const currentViewFilterTargets = isRootViewScope ? rootViewFilterTargets : currentGridViewFilterTargets;
  const currentScopeViewLabel = isRootViewScope
    ? currentDraftViewTitle
    : (currentScopeSubformNode?.title?.trim() || t("tenant.platformStudio.forms.builder.nodeType.subform"));
  const currentScopeSortingFields = useMemo(
    () => getVisibleGridScopeFields(currentGridScopeTargets, currentGridColumns),
    [currentGridColumns, currentGridScopeTargets],
  );
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
  const currentUiSchema = useMemo(
    () => buildCanonicalUiSchema(document, currentModel),
    [currentModel, document],
  );
  const currentLayoutBlueprint = useMemo(
    () => (isDefaultView ? buildCanonicalLayoutBlueprint(document) : layoutBlueprintDraft),
    [document, isDefaultView, layoutBlueprintDraft],
  );
  const breadcrumb = getFormBuilderBreadcrumb(document);
  const workflowStatusField = getFieldById(currentModel.fields, document.systemFields.workflowStatus?.fieldId);
  const workflowStatusOptions = workflowStatusField?.options ?? [];
  const currentScopePlacementLabel = isRootViewScope
    ? t("tenant.platformStudio.forms.builder.rootLevel")
    : currentScopeViewLabel;
  const currentScopeUnplacedFieldIds = useMemo(
    () => getFormBuilderScopeUnplacedFieldIds(document, currentScopeSubformNode?.id ?? null),
    [currentScopeSubformNode?.id, document],
  );
  const currentScopeUnplacedFields = useMemo(
    () => getCurrentScopeUnplacedFields({
      currentScopeUnplacedFieldIds,
      document,
      fields: currentModel.fields,
    }),
    [currentModel.fields, currentScopeUnplacedFieldIds, document],
  );
  const canCreateFieldAtCurrentLevel = canPlaceFieldAtCurrentLevel;
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
  const paletteSections = useMemo(
    () => createFormBuilderWorkspacePaletteSections({
      canPlaceFieldAtCurrentLevel,
      document,
      paletteQuery,
      structureEditingAccess,
    }),
    [canPlaceFieldAtCurrentLevel, document, paletteQuery, structureEditingAccess],
  );

  return {
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
    currentUiSchema,
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
  } as const;
}
