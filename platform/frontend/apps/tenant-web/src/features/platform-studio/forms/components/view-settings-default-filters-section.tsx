import { Fragment } from "react";

import {
  Button,
  Label,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Select,
} from "@platform/ui-kit";

export type ViewSettingsFilterFieldOption = {
  id: string;
  label: string;
};

export type ViewSettingsDefaultFilterItem = {
  actionItems?: ReadonlyArray<{
    fieldLabel: string;
    index: number;
  }>;
  connective?: "or";
  fieldLabel: string;
  fieldLabels?: ReadonlyArray<string>;
  id?: string;
  index: number;
  summary: string;
};

type ViewSettingsDefaultFiltersSectionProps = {
  actionsMenuLabel: string;
  addFilterLabel: string;
  canEdit: boolean;
  deleteFilterLabel: string;
  editFilterLabel: string;
  emptyText: string;
  fieldLabel: string;
  filterFieldOptions: ReadonlyArray<ViewSettingsFilterFieldOption>;
  filters: ReadonlyArray<ViewSettingsDefaultFilterItem>;
  onAddFilter: () => void;
  onDeleteFilter: (index: number) => void;
  onEditFilter: (index: number) => void;
  onPendingFieldChange: (fieldId: string) => void;
  pendingFieldId: string;
  sectionTitle: string;
};

export function ViewSettingsDefaultFiltersSection({
  actionsMenuLabel,
  addFilterLabel,
  canEdit,
  deleteFilterLabel,
  editFilterLabel,
  emptyText,
  fieldLabel,
  filterFieldOptions,
  filters,
  onAddFilter,
  onDeleteFilter,
  onEditFilter,
  onPendingFieldChange,
  pendingFieldId,
  sectionTitle,
}: ViewSettingsDefaultFiltersSectionProps) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-labeled-divider">
        <span>{sectionTitle}</span>
      </div>
      <div className="tenant-web__platform-studio-builder-stack">
        <div className="tenant-web__platform-studio-filter-group">
          <div className="tenant-web__platform-studio-sort-row">
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor="tenant-platform-studio-default-filter-field">
                {fieldLabel}
              </Label>
              <Select
                disabled={!canEdit || filterFieldOptions.length === 0}
                id="tenant-platform-studio-default-filter-field"
                onChange={(event) => onPendingFieldChange(event.target.value)}
                value={pendingFieldId}
              >
                {filterFieldOptions.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
              <Button
                disabled={!canEdit || filterFieldOptions.length === 0}
                onClick={onAddFilter}
                size="sm"
                variant="secondary"
              >
                {addFilterLabel}
              </Button>
            </div>
          </div>
          {filters.length === 0 ? (
            <p className="tenant-web__platform-studio-inline-help">
              {emptyText}
            </p>
          ) : (
            filters.map((filter) => {
              const actionItems = filter.actionItems ?? [{
                fieldLabel: filter.fieldLabel,
                index: filter.index,
              }];
              const fieldLabels = filter.fieldLabels ?? [filter.fieldLabel];
              const isOrGroup = filter.connective === "or" && fieldLabels.length > 1;

              return (
                <div
                  className="tenant-web__platform-studio-compact-row"
                  key={filter.id ?? `default-filter-${filter.index}`}
                >
                  <div className="tenant-web__platform-studio-compact-row-main">
                    <span className="tenant-web__platform-studio-compact-row-title-wrap">
                      {fieldLabels.map((label, labelIndex) => (
                        <Fragment key={`${filter.id ?? filter.index}-${label}-${labelIndex}`}>
                          <span className="tenant-web__platform-studio-compact-row-label">
                            {label}
                          </span>
                          {isOrGroup && labelIndex < fieldLabels.length - 1 ? (
                            <span className="tenant-web__platform-studio-compact-row-or-chip">
                              OR
                            </span>
                          ) : null}
                        </Fragment>
                      ))}
                    </span>
                    <span className="tenant-web__platform-studio-compact-row-summary">
                      {filter.summary}
                    </span>
                  </div>
                  <Menu align="end">
                    <MenuTrigger>
                      <button
                        aria-label={actionsMenuLabel}
                        className="tenant-web__platform-studio-menu-trigger tenant-web__platform-studio-menu-trigger--compact"
                        type="button"
                      >
                        <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">
                          ⋮
                        </span>
                      </button>
                    </MenuTrigger>
                    <MenuContent className="tenant-web__platform-studio-menu">
                      {actionItems.map((action) => (
                        <MenuItem key={`edit-${action.index}`} onClick={() => onEditFilter(action.index)}>
                          {actionItems.length > 1 ? `${editFilterLabel} ${action.fieldLabel}` : editFilterLabel}
                        </MenuItem>
                      ))}
                      {actionItems.map((action) => (
                        <MenuItem
                          key={`delete-${action.index}`}
                          onClick={() => onDeleteFilter(action.index)}
                          tone="danger"
                        >
                          {actionItems.length > 1 ? `${deleteFilterLabel} ${action.fieldLabel}` : deleteFilterLabel}
                        </MenuItem>
                      ))}
                    </MenuContent>
                  </Menu>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
