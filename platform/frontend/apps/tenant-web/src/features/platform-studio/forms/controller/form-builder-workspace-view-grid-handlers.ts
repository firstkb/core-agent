import {
  type FormBuilderDocument,
  type FormBuilderGridColumnDefinition,
  type FormBuilderScope,
  type FormBuilderSubformViewSettings,
  type FormBuilderViewSettings,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import {
  applyCurrentScopeSubformViewSettingsUpdate,
  applyRootCorrectiveActionEnabledUpdate,
  applyRootViewGridColumnsUpdate,
  applyRootViewSettingsUpdate,
  applyRootViewSortingDirectionUpdate,
  applyRootViewSortingFieldUpdate,
  applySubformViewGridColumnsUpdate,
  applySubformViewSortingDirectionUpdate,
  applySubformViewSortingFieldUpdate,
} from "./form-builder-workspace-document-updates";
import {
  reorderGridColumnsByFieldId,
  updateGridColumnVisibility,
} from "./form-builder-workspace-field-scope-grid";
import {
  applyDocumentViewDescriptionUpdate,
  applyDocumentViewTitleUpdate,
  applyModelStructureLockedUpdate,
  applyViewActiveUpdate,
  applyViewLockedUpdate,
} from "./form-builder-workspace-view-metadata";

type CreateViewGridHandlersInput = {
  activeScope: Pick<FormBuilderScope, "scopeId" | "scopeType">;
  currentGridScopeTargets: ReadonlyArray<FormsPlaceholderField>;
  isRootViewScope: boolean;
  openDefaultFilterEditor: (index: number | null, fieldId?: string) => void;
  openQuickFilterEditor: (index: number | null) => void;
  updateCurrentModel: (
    updater: (currentModelDraft: FormsPlaceholderModel) => FormsPlaceholderModel,
  ) => void;
  updateCurrentViewMetadata: (
    updater: (viewEntry: FormsPlaceholderView) => FormsPlaceholderView,
  ) => void;
  updateDocument: (
    updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
  ) => void;
};

export function createFormBuilderViewGridHandlers({
  activeScope,
  currentGridScopeTargets,
  isRootViewScope,
  openDefaultFilterEditor,
  openQuickFilterEditor,
  updateCurrentModel,
  updateCurrentViewMetadata,
  updateDocument,
}: CreateViewGridHandlersInput) {
  function updateViewSettings(
    updater: (viewSettings: FormBuilderViewSettings) => FormBuilderViewSettings,
  ) {
    updateDocument((currentDocument) => applyRootViewSettingsUpdate(currentDocument, updater));
  }

  function updateCurrentScopeSubformViewSettings(
    updater: (viewSettings: FormBuilderSubformViewSettings) => FormBuilderSubformViewSettings,
  ) {
    updateDocument((currentDocument) =>
      applyCurrentScopeSubformViewSettingsUpdate(currentDocument, activeScope, updater)
    );
  }

  function updateCurrentGridColumns(
    updater: (
      columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
    ) => ReadonlyArray<FormBuilderGridColumnDefinition>,
  ) {
    if (activeScope.scopeType === "SUBFORM") {
      updateCurrentScopeSubformViewSettings((viewSettings) => applySubformViewGridColumnsUpdate(viewSettings, updater));
      return;
    }

    updateViewSettings((viewSettings) => applyRootViewGridColumnsUpdate(viewSettings, updater));
  }

  function updateGridColumnVisibilityState(
    fieldId: string,
    visible: boolean,
  ) {
    updateCurrentGridColumns((columns) =>
      updateGridColumnVisibility(
        columns,
        fieldId,
        visible,
        () => `grid-column-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      )
    );
  }

  function reorderGridColumns(
    sourceFieldId: string,
    targetFieldId: string,
  ) {
    if (sourceFieldId === targetFieldId) {
      return;
    }

    updateCurrentGridColumns((columns) =>
      reorderGridColumnsByFieldId(columns, currentGridScopeTargets, sourceFieldId, targetFieldId)
    );
  }

  function addDefaultFilterCondition() {
    openDefaultFilterEditor(null);
  }

  function addQuickFilter() {
    openQuickFilterEditor(null);
  }

  function updateCorrectiveActionEnabled(checked: boolean) {
    updateViewSettings((viewSettings) => applyRootCorrectiveActionEnabledUpdate(viewSettings, checked));
  }

  function updateCurrentViewSortDirection(direction: "asc" | "desc") {
    if (isRootViewScope) {
      updateViewSettings((viewSettings) => applyRootViewSortingDirectionUpdate(viewSettings, direction));
      return;
    }

    updateCurrentScopeSubformViewSettings((viewSettings) =>
      applySubformViewSortingDirectionUpdate(viewSettings, direction)
    );
  }

  function updateCurrentViewSortField(fieldId: string) {
    if (isRootViewScope) {
      updateViewSettings((viewSettings) => applyRootViewSortingFieldUpdate(viewSettings, fieldId));
      return;
    }

    updateCurrentScopeSubformViewSettings((viewSettings) =>
      applySubformViewSortingFieldUpdate(viewSettings, fieldId)
    );
  }

  function updateModelStructureLocked(checked: boolean) {
    updateCurrentModel((currentModelDraft) => applyModelStructureLockedUpdate(currentModelDraft, checked));
  }

  function updateViewActive(checked: boolean) {
    updateCurrentViewMetadata((viewEntry) => applyViewActiveUpdate(viewEntry, checked));
  }

  function updateViewDescription(description: string) {
    updateDocument((currentDocument) => applyDocumentViewDescriptionUpdate(currentDocument, description));
  }

  function updateViewLocked(checked: boolean) {
    updateCurrentViewMetadata((viewEntry) => applyViewLockedUpdate(viewEntry, checked));
  }

  function updateViewTitle(title: string) {
    updateDocument((currentDocument) => applyDocumentViewTitleUpdate(currentDocument, title));
  }

  return {
    addDefaultFilterCondition,
    addQuickFilter,
    reorderGridColumns,
    updateCorrectiveActionEnabled,
    updateCurrentGridColumns,
    updateCurrentScopeSubformViewSettings,
    updateCurrentViewSortDirection,
    updateCurrentViewSortField,
    updateGridColumnVisibility: updateGridColumnVisibilityState,
    updateModelStructureLocked,
    updateViewActive,
    updateViewDescription,
    updateViewLocked,
    updateViewSettings,
    updateViewTitle,
  } as const;
}
