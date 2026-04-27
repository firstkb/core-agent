import { DefaultFilterEditorDialog } from "./default-filter-editor-dialog";
import { FilterConditionEditor } from "./filter-condition-editor";
import { QuickFilterEditorDialog } from "./quick-filter-editor-dialog";
import {
  type WorkspaceDialogEditorState,
  type WorkspaceDialogTranslate,
} from "./workspace-dialog-types";
import {
  type FormBuilderFilterCondition,
  type FormBuilderQuickFilter,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";

export type WorkspaceFilterDialogsProps = {
  canEditSettings: boolean;
  closeDefaultFilterEditor: () => void;
  closeQuickFilterEditor: () => void;
  currentViewFilterTargets: ReadonlyArray<FormsPlaceholderField>;
  defaultFilterEditor: WorkspaceDialogEditorState<FormBuilderFilterCondition>;
  deleteDefaultFilter: (index: number) => void;
  isRootViewScope: boolean;
  onAddQuickFilterCondition: () => void;
  onDefaultFilterConditionChange: (condition: FormBuilderFilterCondition) => void;
  onQuickFilterColorChange: (color: string) => void;
  onQuickFilterConditionChange: (conditionIndex: number, condition: FormBuilderFilterCondition) => void;
  onQuickFilterConditionRemove: (conditionIndex: number) => void;
  onQuickFilterLabelChange: (label: string) => void;
  onSaveDefaultFilterEditor: () => void;
  onSaveQuickFilterEditor: () => void;
  quickFilterEditor: WorkspaceDialogEditorState<FormBuilderQuickFilter>;
  rootViewFilterTargets: ReadonlyArray<FormsPlaceholderField>;
  t: WorkspaceDialogTranslate;
};

export function WorkspaceFilterDialogs({
  canEditSettings,
  closeDefaultFilterEditor,
  closeQuickFilterEditor,
  currentViewFilterTargets,
  defaultFilterEditor,
  deleteDefaultFilter,
  isRootViewScope,
  onAddQuickFilterCondition,
  onDefaultFilterConditionChange,
  onQuickFilterColorChange,
  onQuickFilterConditionChange,
  onQuickFilterConditionRemove,
  onQuickFilterLabelChange,
  onSaveDefaultFilterEditor,
  onSaveQuickFilterEditor,
  quickFilterEditor,
  rootViewFilterTargets,
  t,
}: WorkspaceFilterDialogsProps) {
  return (
    <>
      <DefaultFilterEditorDialog
        canEdit={canEditSettings}
        canSave={Boolean(defaultFilterEditor)}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        description={t(
          isRootViewScope
            ? "tenant.platformStudio.forms.builder.viewSection.filtersDescription"
            : "tenant.platformStudio.forms.builder.filter.filtersDescriptionSubtable",
        )}
        onOpenChange={(open) => {
          if (!open) {
            closeDefaultFilterEditor();
          }
        }}
        open={Boolean(defaultFilterEditor)}
        onCancel={closeDefaultFilterEditor}
        onSave={onSaveDefaultFilterEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          defaultFilterEditor?.index === null
            ? t(
              isRootViewScope
                ? "tenant.platformStudio.forms.builder.filter.addFilter"
                : "tenant.platformStudio.forms.builder.filter.addFilterSubtable",
            )
            : t(
              isRootViewScope
                ? "tenant.platformStudio.forms.builder.filter.editFilter"
                : "tenant.platformStudio.forms.builder.filter.editFilterSubtable",
            )
        }
      >
        {defaultFilterEditor ? (
          <FilterConditionEditor
            condition={defaultFilterEditor.draft}
            disabled={!canEditSettings}
            fields={currentViewFilterTargets}
            idPrefix="tenant-platform-studio-default-filter-editor"
            onChange={onDefaultFilterConditionChange}
            onRemove={() => {
              if (defaultFilterEditor.index !== null) {
                deleteDefaultFilter(defaultFilterEditor.index);
              }

              closeDefaultFilterEditor();
            }}
            t={t}
          />
        ) : null}
      </DefaultFilterEditorDialog>

      <QuickFilterEditorDialog
        addConditionLabel={t("tenant.platformStudio.forms.builder.filter.addCondition")}
        canAddCondition={canEditSettings && rootViewFilterTargets.length > 0}
        canEdit={canEditSettings}
        canSave={Boolean(
          quickFilterEditor
          && quickFilterEditor.draft.label.trim()
          && quickFilterEditor.draft.conditions.length > 0,
        )}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        color={quickFilterEditor?.draft.color ?? ""}
        colorLabel={t("tenant.platformStudio.forms.builder.filter.quickFilterColor")}
        colorPlaceholder="#D97706"
        description={t("tenant.platformStudio.forms.builder.filter.quickFilters")}
        label={quickFilterEditor?.draft.label ?? ""}
        labelInputLabel={t("tenant.platformStudio.forms.builder.filter.quickFilterLabel")}
        onAddCondition={onAddQuickFilterCondition}
        onCancel={closeQuickFilterEditor}
        onColorChange={onQuickFilterColorChange}
        onLabelChange={onQuickFilterLabelChange}
        onOpenChange={(open) => {
          if (!open) {
            closeQuickFilterEditor();
          }
        }}
        open={Boolean(quickFilterEditor)}
        onSave={onSaveQuickFilterEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          quickFilterEditor?.index === null
            ? t("tenant.platformStudio.forms.builder.filter.addQuickFilter")
            : t("tenant.platformStudio.forms.builder.filter.editFilter")
        }
      >
        {quickFilterEditor
          ? quickFilterEditor.draft.conditions.map((condition, conditionIndex) => (
              <FilterConditionEditor
                condition={condition}
                disabled={!canEditSettings}
                fields={rootViewFilterTargets}
                idPrefix={`tenant-platform-studio-quick-filter-editor-${quickFilterEditor.draft.id}-${conditionIndex}`}
                key={`${quickFilterEditor.draft.id}-${conditionIndex}`}
                onChange={(nextCondition) => onQuickFilterConditionChange(conditionIndex, nextCondition)}
                onRemove={() => onQuickFilterConditionRemove(conditionIndex)}
                t={t}
              />
            ))
          : null}
      </QuickFilterEditorDialog>
    </>
  );
}
