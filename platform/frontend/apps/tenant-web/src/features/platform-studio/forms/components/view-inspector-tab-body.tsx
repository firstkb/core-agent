import { type useTranslation } from "@platform/i18n";

import {
  type ViewSettingsActionItem,
  type ViewSettingsSortingFieldItem,
} from "./view-settings-actions-sorting-section";
import {
  type ViewSettingsDefaultFilterItem,
  type ViewSettingsFilterFieldOption,
} from "./view-settings-default-filters-section";
import { ViewSettingsPanel } from "./view-settings-panel";
import { type ViewSettingsSystemFieldItem } from "./view-settings-system-fields-section";

type Translate = ReturnType<typeof useTranslation>["t"];

type ViewInspectorTabBodyProps = {
  actionItems: ReadonlyArray<ViewSettingsActionItem>;
  canEditModelDefinition: boolean;
  canEditSettings: boolean;
  canToggleModelLocks: boolean;
  canToggleViewLocks: boolean;
  correctiveActionEnabled: boolean;
  currentScopeViewLabel: string;
  defaultFilterItems: ReadonlyArray<ViewSettingsDefaultFilterItem>;
  filterFieldOptions: ReadonlyArray<ViewSettingsFilterFieldOption>;
  isRootActor: boolean;
  isRootViewScope: boolean;
  isStaticModel: boolean;
  modelStructureLocked: boolean;
  onAddDefaultFilter: () => void;
  onCorrectiveActionChange: (checked: boolean) => void;
  onDeleteDefaultFilter: (index: number) => void;
  onEditDefaultFilter: (index: number) => void;
  onModelStructureLockedChange: (checked: boolean) => void;
  onPendingDefaultFilterFieldChange: (fieldId: string) => void;
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  onSortFieldChange: (fieldId: string) => void;
  onSubformTitleChange: (title: string) => void;
  onSystemFieldChange: (role: string, fieldId: string) => void;
  onViewDescriptionChange: (description: string) => void;
  onViewLockedChange: (checked: boolean) => void;
  onViewTitleChange: (title: string) => void;
  onWorkflowStatusOptionChange: (key: "finalValue" | "initialValue", value: string) => void;
  pendingDefaultFilterFieldId: string;
  sortDirection: "asc" | "desc";
  sortFieldId: string;
  sortingFieldItems: ReadonlyArray<ViewSettingsSortingFieldItem>;
  subformTitle: string;
  systemFields: ReadonlyArray<ViewSettingsSystemFieldItem>;
  t: Translate;
  viewDescription: string;
  viewLocked: boolean;
  viewTitle: string;
};

export function ViewInspectorTabBody({
  actionItems,
  canEditModelDefinition,
  canEditSettings,
  canToggleModelLocks,
  canToggleViewLocks,
  correctiveActionEnabled,
  currentScopeViewLabel,
  defaultFilterItems,
  filterFieldOptions,
  isRootActor,
  isRootViewScope,
  isStaticModel,
  modelStructureLocked,
  onAddDefaultFilter,
  onCorrectiveActionChange,
  onDeleteDefaultFilter,
  onEditDefaultFilter,
  onModelStructureLockedChange,
  onPendingDefaultFilterFieldChange,
  onSortDirectionChange,
  onSortFieldChange,
  onSubformTitleChange,
  onSystemFieldChange,
  onViewDescriptionChange,
  onViewLockedChange,
  onViewTitleChange,
  onWorkflowStatusOptionChange,
  pendingDefaultFilterFieldId,
  sortDirection,
  sortFieldId,
  sortingFieldItems,
  subformTitle,
  systemFields,
  t,
  viewDescription,
  viewLocked,
  viewTitle,
}: ViewInspectorTabBodyProps) {
  return (
    <ViewSettingsPanel
      actionItems={actionItems}
      actionsMenuLabel={t("tenant.platformStudio.forms.builder.rule.actionsMenu")}
      addFilterLabel={t("tenant.platformStudio.forms.builder.filter.addFilter")}
      canEditModelDefinition={canEditModelDefinition}
      canEditSettings={canEditSettings}
      canToggleModelLocks={canToggleModelLocks}
      canToggleViewLocks={canToggleViewLocks}
      correctiveActionEnabled={correctiveActionEnabled}
      currentScopeViewLabel={currentScopeViewLabel}
      defaultFilterEmptyText={t("tenant.platformStudio.forms.builder.filter.emptyDefaultFilters")}
      defaultFilterFieldLabel={t("tenant.platformStudio.forms.builder.filter.fieldLabel")}
      defaultFilterItems={defaultFilterItems}
      deleteFilterLabel={t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
      editFilterLabel={t("tenant.platformStudio.forms.builder.filter.editFilter")}
      filterFieldOptions={filterFieldOptions}
      isRootActor={isRootActor}
      isRootViewScope={isRootViewScope}
      isStaticModel={isStaticModel}
      labels={{
        actionsSection: t("tenant.platformStudio.forms.builder.viewSection.actions"),
        authoringLocksSection: t("tenant.platformStudio.forms.builder.viewSection.authoringLocks"),
        correctiveAction: t("tenant.platformStudio.forms.builder.viewSettings.correctiveAction"),
        correctiveActionSource: t("tenant.platformStudio.forms.builder.viewSettings.correctiveActionSource"),
        defaultViewStructureOnlyNotice: t("tenant.platformStudio.forms.builder.defaultViewStructureOnlyNotice"),
        filtersSection: t("tenant.platformStudio.forms.builder.viewSection.filters"),
        finalValue: t("tenant.platformStudio.forms.builder.systemField.finalValue"),
        initialValue: t("tenant.platformStudio.forms.builder.systemField.initialValue"),
        locked: t("tenant.platformStudio.forms.builder.locking.locked"),
        modelLock: t("tenant.platformStudio.forms.builder.locking.model"),
        sortDirection: t("tenant.platformStudio.forms.builder.viewSettings.sortDirection"),
        sortDirectionAsc: t("tenant.platformStudio.forms.builder.viewSettings.sortDirectionAsc"),
        sortDirectionDesc: t("tenant.platformStudio.forms.builder.viewSettings.sortDirectionDesc"),
        sortField: t(
          isRootViewScope
            ? "tenant.platformStudio.forms.builder.viewSettings.sortField"
            : "tenant.platformStudio.forms.builder.viewSettings.sortFieldSubtable",
        ),
        sortingSection: t(
          isRootViewScope
            ? "tenant.platformStudio.forms.builder.viewSettings.sorting"
            : "tenant.platformStudio.forms.builder.viewSettings.sortingSubtable",
        ),
        subformTitle: t("tenant.platformStudio.forms.builder.viewSettings.subformTitle"),
        subtableTitle: t("tenant.platformStudio.forms.builder.grid.subtable"),
        systemFieldsSection: t("tenant.platformStudio.forms.builder.viewSection.systemFields"),
        unbound: t("tenant.platformStudio.forms.builder.systemField.unbound"),
        unlocked: t("tenant.platformStudio.forms.builder.locking.unlocked"),
        viewDescription: t("tenant.platformStudio.forms.builder.viewDescriptionLabel"),
        viewLock: t("tenant.platformStudio.forms.builder.locking.view"),
        viewTitle: t("tenant.platformStudio.forms.builder.viewTitleLabel"),
        workflowSection: t("tenant.platformStudio.forms.builder.viewSection.workflow"),
      }}
      modelStructureLocked={modelStructureLocked}
      onAddDefaultFilter={onAddDefaultFilter}
      onCorrectiveActionChange={onCorrectiveActionChange}
      onDeleteDefaultFilter={onDeleteDefaultFilter}
      onEditDefaultFilter={onEditDefaultFilter}
      onModelStructureLockedChange={onModelStructureLockedChange}
      onPendingDefaultFilterFieldChange={onPendingDefaultFilterFieldChange}
      onSortDirectionChange={onSortDirectionChange}
      onSortFieldChange={onSortFieldChange}
      onSubformTitleChange={onSubformTitleChange}
      onSystemFieldChange={onSystemFieldChange}
      onViewDescriptionChange={onViewDescriptionChange}
      onViewLockedChange={onViewLockedChange}
      onViewTitleChange={onViewTitleChange}
      onWorkflowStatusOptionChange={onWorkflowStatusOptionChange}
      pendingDefaultFilterFieldId={pendingDefaultFilterFieldId}
      sortDirection={sortDirection}
      sortFieldId={sortFieldId}
      sortingFieldItems={sortingFieldItems}
      subformTitle={subformTitle}
      systemFields={systemFields}
      viewDescription={viewDescription}
      viewLocked={viewLocked}
      viewTitle={viewTitle}
    />
  );
}
