import {
  Button,
  Combobox,
  type ComboboxOption,
  Label,
  Select,
} from "@platform/ui-kit";

import { type FormsPlaceholderLookupDisplayMode } from "../forms-placeholder-data";

export type LookupFieldSettingsSummary = {
  label: string;
  summary: string;
};

type LookupFieldSettingsLabels = {
  chooseSource: string;
  display: string;
  displayMode: string;
  displayModeCatalogModal: string;
  displayModeSearchSelect: string;
  displayTemplate: string;
  filters: string;
  loadingFilterOptions: string;
  noFilterOptions: string;
  searchFilterOptions: string;
};

type LookupFieldPresetTemplateOption = {
  key: string;
  label: string;
};

type LookupFieldPresetFilterRow = {
  field: string;
  hasMoreOptions: boolean;
  label: string;
  loading: boolean;
  loadingMore: boolean;
  options: readonly ComboboxOption[];
  placeholder: string;
  searchValue: string;
  selectedValues: readonly string[];
};

type LookupFieldSettingsProps = {
  canChooseSource: boolean;
  displayMode: FormsPlaceholderLookupDisplayMode;
  fieldTypeLabel: string;
  labels: LookupFieldSettingsLabels;
  onChooseSource: () => void;
  onDisplayModeChange: (displayMode: FormsPlaceholderLookupDisplayMode) => void;
  onPresetFilterLoadMore: (field: string) => void;
  onPresetFilterSearchChange: (field: string, searchValue: string) => void;
  onPresetFilterValueChange: (field: string, values: ReadonlyArray<string>) => void;
  onPresetTemplateChange: (templateKey: string) => void;
  presetFilterRows: ReadonlyArray<LookupFieldPresetFilterRow>;
  presetLookupSummary: LookupFieldSettingsSummary | null;
  presetTemplateKey: string;
  presetTemplateOptions: ReadonlyArray<LookupFieldPresetTemplateOption>;
  showDisplayMode: boolean;
  sourceRows: ReadonlyArray<LookupFieldSettingsSummary>;
};

export function LookupFieldSettings({
  canChooseSource,
  displayMode,
  fieldTypeLabel,
  labels,
  onChooseSource,
  onDisplayModeChange,
  onPresetFilterLoadMore,
  onPresetFilterSearchChange,
  onPresetFilterValueChange,
  onPresetTemplateChange,
  presetFilterRows,
  presetLookupSummary,
  presetTemplateKey,
  presetTemplateOptions,
  showDisplayMode,
  sourceRows,
}: LookupFieldSettingsProps) {
  const hasPresetTemplateOptions = presetTemplateOptions.length > 0;
  const hasPresetFilters = presetFilterRows.length > 0;

  return (
    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{fieldTypeLabel}</span>
      </div>

      {presetLookupSummary ? (
        <LookupSummaryRow row={presetLookupSummary} />
      ) : (
        <>
          <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
            {sourceRows.map((row) => (
              <LookupSummaryRow key={row.label} row={row} />
            ))}
          </div>

          <div className="tenant-web__platform-studio-button-row">
            <Button
              disabled={!canChooseSource}
              onClick={onChooseSource}
              size="sm"
              variant="secondary"
            >
              {labels.chooseSource}
            </Button>
          </div>
        </>
      )}

      {hasPresetTemplateOptions ? (
        <>
          <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
            <span>{labels.display}</span>
          </div>

          <div className="tenant-web__platform-studio-form-group">
            <Label htmlFor="tenant-platform-studio-preset-lookup-display-template">
              {labels.displayTemplate}
            </Label>
            <Select
              disabled={!canChooseSource}
              id="tenant-platform-studio-preset-lookup-display-template"
              onChange={(event) => onPresetTemplateChange(event.target.value)}
              value={presetTemplateKey}
            >
              {presetTemplateOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </>
      ) : null}

      {hasPresetFilters ? (
        <>
          <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
            <span>{labels.filters}</span>
          </div>

          {presetFilterRows.map((row) => (
            <div
              className="tenant-web__platform-studio-form-group"
              key={row.field}
            >
              <Label htmlFor={`tenant-platform-studio-preset-lookup-filter-${row.field}`}>
                {row.label}
              </Label>
              <Combobox
                disabled={!canChooseSource}
                emptyLabel={labels.noFilterOptions}
                filterMode="none"
                hasMoreOptions={row.hasMoreOptions}
                id={`tenant-platform-studio-preset-lookup-filter-${row.field}`}
                label={row.label}
                loading={row.loading}
                loadingMore={row.loadingMore}
                loadingLabel={labels.loadingFilterOptions}
                loadMoreLabel={labels.loadingFilterOptions}
                onLoadMore={() => onPresetFilterLoadMore(row.field)}
                onSearchValueChange={(value) => onPresetFilterSearchChange(row.field, value)}
                onValueChange={(values) => onPresetFilterValueChange(row.field, values)}
                options={row.options}
                placeholder={row.placeholder}
                searchInputAriaLabel={`${labels.searchFilterOptions} ${row.label}`}
                searchPlaceholder={`${labels.searchFilterOptions} ${row.label}`}
                searchValue={row.searchValue}
                selectionMode="multiple"
                triggerAriaLabel={row.label}
                value={row.selectedValues}
              />
            </div>
          ))}
        </>
      ) : null}

      {showDisplayMode ? (
        <>
          {!hasPresetTemplateOptions ? (
            <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
              <span>{labels.display}</span>
            </div>
          ) : null}

          <div className="tenant-web__platform-studio-form-group">
            <Label htmlFor="tenant-platform-studio-lookup-display-mode">
              {labels.displayMode}
            </Label>
            <Select
              id="tenant-platform-studio-lookup-display-mode"
              onChange={(event) => onDisplayModeChange(event.target.value as FormsPlaceholderLookupDisplayMode)}
              value={displayMode}
            >
              <option value="search_select">{labels.displayModeSearchSelect}</option>
              <option value="catalog_modal">{labels.displayModeCatalogModal}</option>
            </Select>
          </div>
        </>
      ) : null}
    </div>
  );
}

function LookupSummaryRow({ row }: { row: LookupFieldSettingsSummary }) {
  return (
    <div className="tenant-web__platform-studio-compact-row">
      <div className="tenant-web__platform-studio-compact-row-main">
        <span className="tenant-web__platform-studio-compact-row-label">
          {row.label}
        </span>
        <span className="tenant-web__platform-studio-compact-row-summary">
          {row.summary}
        </span>
      </div>
    </div>
  );
}
