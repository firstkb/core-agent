import {
  SortingSection,
  ViewActionsSection,
  type ViewSettingsActionItem,
  type ViewSettingsSortingFieldItem,
} from "./view-settings-actions-sorting-section";
import {
  ViewSettingsDefaultFiltersSection,
  type ViewSettingsDefaultFilterItem,
  type ViewSettingsFilterFieldOption,
} from "./view-settings-default-filters-section";
import {
  AuthoringLocksSection,
  RootViewDetailsSection,
  WorkflowSection,
  type ViewSettingsRootLabels,
} from "./view-settings-root-sections";
import {
  ViewSettingsSystemFieldsSection,
  type ViewSettingsSystemFieldItem,
} from "./view-settings-system-fields-section";

type ViewSettingsPanelLabels = ViewSettingsRootLabels & {
  actionsSection: string;
  filtersSection: string;
  finalValue: string;
  initialValue: string;
  sortDirection: string;
  sortDirectionAsc: string;
  sortDirectionDesc: string;
  sortField: string;
  sortingSection: string;
  subtableTitle: string;
  systemFieldsSection: string;
};

type ViewSettingsPanelProps = {
  actionItems: ReadonlyArray<ViewSettingsActionItem>;
  actionsMenuLabel: string;
  addFilterLabel: string;
  canEditModelDefinition: boolean;
  canEditSettings: boolean;
  canToggleModelLocks: boolean;
  canToggleViewLocks: boolean;
  correctiveActionEnabled: boolean;
  currentScopeViewLabel: string;
  defaultFilterEmptyText: string;
  defaultFilterFieldLabel: string;
  defaultFilterItems: ReadonlyArray<ViewSettingsDefaultFilterItem>;
  deleteFilterLabel: string;
  editFilterLabel: string;
  filterFieldOptions: ReadonlyArray<ViewSettingsFilterFieldOption>;
  isRootActor: boolean;
  isRootViewScope: boolean;
  isStaticModel: boolean;
  labels: ViewSettingsPanelLabels;
  modelStructureLocked: boolean;
  onAddDefaultFilter: () => void;
  onCorrectiveActionChange: (checked: boolean) => void;
  onDeleteDefaultFilter: (index: number) => void;
  onEditDefaultFilter: (index: number) => void;
  onModelStructureLockedChange: (checked: boolean) => void;
  onPendingDefaultFilterFieldChange: (fieldId: string) => void;
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  onSortFieldChange: (fieldId: string) => void;
  onSystemFieldChange: (role: string, fieldId: string) => void;
  onViewActiveChange: (checked: boolean) => void;
  onViewDescriptionChange: (description: string) => void;
  onViewLockedChange: (checked: boolean) => void;
  onViewTitleChange: (title: string) => void;
  onWorkflowStatusOptionChange: (key: "finalValue" | "initialValue", value: string) => void;
  pendingDefaultFilterFieldId: string;
  sortDirection: "asc" | "desc";
  sortFieldId: string;
  sortingFieldItems: ReadonlyArray<ViewSettingsSortingFieldItem>;
  systemFields: ReadonlyArray<ViewSettingsSystemFieldItem>;
  viewActive: boolean;
  viewDescription: string;
  viewLocked: boolean;
  viewTitle: string;
};

export function ViewSettingsPanel({
  actionItems,
  actionsMenuLabel,
  addFilterLabel,
  canEditModelDefinition,
  canEditSettings,
  canToggleModelLocks,
  canToggleViewLocks,
  correctiveActionEnabled,
  currentScopeViewLabel,
  defaultFilterEmptyText,
  defaultFilterFieldLabel,
  defaultFilterItems,
  deleteFilterLabel,
  editFilterLabel,
  filterFieldOptions,
  isRootActor,
  isRootViewScope,
  isStaticModel,
  labels,
  modelStructureLocked,
  onAddDefaultFilter,
  onCorrectiveActionChange,
  onDeleteDefaultFilter,
  onEditDefaultFilter,
  onModelStructureLockedChange,
  onPendingDefaultFilterFieldChange,
  onSortDirectionChange,
  onSortFieldChange,
  onSystemFieldChange,
  onViewActiveChange,
  onViewDescriptionChange,
  onViewLockedChange,
  onViewTitleChange,
  onWorkflowStatusOptionChange,
  pendingDefaultFilterFieldId,
  sortDirection,
  sortFieldId,
  sortingFieldItems,
  systemFields,
  viewActive,
  viewDescription,
  viewLocked,
  viewTitle,
}: ViewSettingsPanelProps) {
  return (
    <div className="tenant-web__platform-studio-builder-stack">
      {isRootViewScope ? (
        <>
          <RootViewDetailsSection
            canEditSettings={canEditSettings}
            labels={labels}
            onViewDescriptionChange={onViewDescriptionChange}
            onViewTitleChange={onViewTitleChange}
            viewDescription={viewDescription}
            viewTitle={viewTitle}
          />
          <AuthoringLocksSection
            canEditSettings={canEditSettings}
            canToggleModelLocks={canToggleModelLocks}
            canToggleViewLocks={canToggleViewLocks}
            isRootActor={isRootActor}
            isStaticModel={isStaticModel}
            labels={labels}
            modelStructureLocked={modelStructureLocked}
            onModelStructureLockedChange={onModelStructureLockedChange}
            onViewActiveChange={onViewActiveChange}
            onViewLockedChange={onViewLockedChange}
            viewActive={viewActive}
            viewLocked={viewLocked}
          />
          <WorkflowSection
            canEditSettings={canEditSettings}
            correctiveActionEnabled={correctiveActionEnabled}
            labels={labels}
            onCorrectiveActionChange={onCorrectiveActionChange}
          />
          <ViewSettingsSystemFieldsSection
            canEdit={canEditSettings}
            disabled={!canEditModelDefinition}
            finalValueLabel={labels.finalValue}
            initialValueLabel={labels.initialValue}
            onSystemFieldChange={onSystemFieldChange}
            onWorkflowStatusOptionChange={onWorkflowStatusOptionChange}
            sectionTitle={labels.systemFieldsSection}
            systemFields={systemFields}
            unboundLabel={labels.unbound}
          />
        </>
      ) : (
        <div className="tenant-web__platform-studio-inspector-section">
          <div className="tenant-web__platform-studio-inspector-header tenant-web__platform-studio-inspector-header--grid">
            <div>
              <p className="tenant-web__platform-studio-inspector-title">
                {labels.subtableTitle}
              </p>
              <p className="tenant-web__platform-studio-inspector-meta">
                {currentScopeViewLabel}
              </p>
            </div>
          </div>
        </div>
      )}

      <ViewActionsSection actionItems={actionItems} canEditSettings={canEditSettings} labels={labels} />
      <SortingSection
        canEditSettings={canEditSettings}
        labels={labels}
        onSortDirectionChange={onSortDirectionChange}
        onSortFieldChange={onSortFieldChange}
        sortDirection={sortDirection}
        sortFieldId={sortFieldId}
        sortingFieldItems={sortingFieldItems}
      />
      {isRootViewScope ? (
        <ViewSettingsDefaultFiltersSection
          actionsMenuLabel={actionsMenuLabel}
          addFilterLabel={addFilterLabel}
          canEdit={canEditSettings}
          deleteFilterLabel={deleteFilterLabel}
          editFilterLabel={editFilterLabel}
          emptyText={defaultFilterEmptyText}
          fieldLabel={defaultFilterFieldLabel}
          filterFieldOptions={filterFieldOptions}
          filters={defaultFilterItems}
          onAddFilter={onAddDefaultFilter}
          onDeleteFilter={onDeleteDefaultFilter}
          onEditFilter={onEditDefaultFilter}
          onPendingFieldChange={onPendingDefaultFilterFieldChange}
          pendingFieldId={pendingDefaultFilterFieldId}
          sectionTitle={labels.filtersSection}
        />
      ) : null}
    </div>
  );
}
