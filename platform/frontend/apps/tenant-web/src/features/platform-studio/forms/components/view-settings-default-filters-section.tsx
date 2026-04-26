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
  fieldLabel: string;
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
            filters.map((filter) => (
              <div className="tenant-web__platform-studio-compact-row" key={`default-filter-${filter.index}`}>
                <div className="tenant-web__platform-studio-compact-row-main">
                  <span className="tenant-web__platform-studio-compact-row-label">
                    {filter.fieldLabel}
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
                      <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">⋮</span>
                    </button>
                  </MenuTrigger>
                  <MenuContent className="tenant-web__platform-studio-menu">
                    <MenuItem onClick={() => onEditFilter(filter.index)}>
                      {editFilterLabel}
                    </MenuItem>
                    <MenuItem
                      onClick={() => onDeleteFilter(filter.index)}
                      tone="danger"
                    >
                      {deleteFilterLabel}
                    </MenuItem>
                  </MenuContent>
                </Menu>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
