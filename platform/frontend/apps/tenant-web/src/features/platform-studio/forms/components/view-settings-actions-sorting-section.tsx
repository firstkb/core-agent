import {
  Label,
  Select,
  Switch,
} from "@platform/ui-kit";

export type ViewSettingsActionItem = {
  checked: boolean;
  key: string;
  label: string;
  onChange: (checked: boolean) => void;
};

export type ViewSettingsSortingFieldItem = {
  id: string;
  label: string;
};

type ViewSettingsActionSortingLabels = {
  actionsSection: string;
  rowLayoutSection: string;
  secondRowField: string;
  sortDirection: string;
  sortDirectionAsc: string;
  sortDirectionDesc: string;
  sortField: string;
  sortingSection: string;
  unbound: string;
};

export function ViewActionsSection({
  actionItems,
  canEditSettings,
  labels,
}: {
  actionItems: ReadonlyArray<ViewSettingsActionItem>;
  canEditSettings: boolean;
  labels: Pick<ViewSettingsActionSortingLabels, "actionsSection">;
}) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-labeled-divider">
        <span>{labels.actionsSection}</span>
      </div>

      <div className="tenant-web__platform-studio-switch-grid">
        {actionItems.map((item) => (
          <div className="tenant-web__platform-studio-switch-row" key={item.key}>
            <span className="tenant-web__platform-studio-compact-row-label">
              {item.label}
            </span>
            <Switch
              checked={item.checked}
              disabled={!canEditSettings}
              onCheckedChange={item.onChange}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RowLayoutSection({
  canEditSettings,
  labels,
  onSecondaryRowFieldChange,
  secondaryRowFieldId,
  rowLayoutFieldItems,
}: {
  canEditSettings: boolean;
  labels: Pick<ViewSettingsActionSortingLabels, "rowLayoutSection" | "secondRowField" | "unbound">;
  onSecondaryRowFieldChange: (fieldId: string) => void;
  secondaryRowFieldId: string;
  rowLayoutFieldItems: ReadonlyArray<ViewSettingsSortingFieldItem>;
}) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-labeled-divider">
        <span>{labels.rowLayoutSection}</span>
      </div>

      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor="tenant-platform-studio-second-row-field">
          {labels.secondRowField}
        </Label>
        <Select
          disabled={!canEditSettings || rowLayoutFieldItems.length === 0}
          id="tenant-platform-studio-second-row-field"
          onChange={(event) => onSecondaryRowFieldChange(event.target.value)}
          value={secondaryRowFieldId}
        >
          <option value="">{labels.unbound}</option>
          {rowLayoutFieldItems.map((field) => (
            <option key={field.id} value={field.id}>
              {field.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export function SortingSection({
  canEditSettings,
  labels,
  onSortDirectionChange,
  onSortFieldChange,
  sortDirection,
  sortFieldId,
  sortingFieldItems,
}: {
  canEditSettings: boolean;
  labels: Pick<ViewSettingsActionSortingLabels, "sortDirection" | "sortDirectionAsc" | "sortDirectionDesc" | "sortField" | "sortingSection" | "unbound">;
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  onSortFieldChange: (fieldId: string) => void;
  sortDirection: "asc" | "desc";
  sortFieldId: string;
  sortingFieldItems: ReadonlyArray<ViewSettingsSortingFieldItem>;
}) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      <div className="tenant-web__platform-studio-labeled-divider">
        <span>{labels.sortingSection}</span>
      </div>

      <div className="tenant-web__platform-studio-builder-stack">
        <div className="tenant-web__platform-studio-sort-row">
          <div className="tenant-web__platform-studio-form-group">
            <Label htmlFor="tenant-platform-studio-sort-field">
              {labels.sortField}
            </Label>
            <Select
              disabled={!canEditSettings}
              id="tenant-platform-studio-sort-field"
              onChange={(event) => onSortFieldChange(event.target.value)}
              value={sortFieldId}
            >
              <option value="">{labels.unbound}</option>
              {sortingFieldItems.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="tenant-web__platform-studio-form-group">
            <Label htmlFor="tenant-platform-studio-sort-direction">
              {labels.sortDirection}
            </Label>
            <Select
              disabled={!canEditSettings}
              id="tenant-platform-studio-sort-direction"
              onChange={(event) => onSortDirectionChange(event.target.value === "desc" ? "desc" : "asc")}
              value={sortDirection}
            >
              <option value="asc">{labels.sortDirectionAsc}</option>
              <option value="desc">{labels.sortDirectionDesc}</option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
