import {
  Button,
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
};

type LookupFieldSettingsProps = {
  canChooseSource: boolean;
  displayMode: FormsPlaceholderLookupDisplayMode;
  fieldTypeLabel: string;
  labels: LookupFieldSettingsLabels;
  onChooseSource: () => void;
  onDisplayModeChange: (displayMode: FormsPlaceholderLookupDisplayMode) => void;
  presetLookupSummary: LookupFieldSettingsSummary | null;
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
  presetLookupSummary,
  showDisplayMode,
  sourceRows,
}: LookupFieldSettingsProps) {
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

      {showDisplayMode ? (
        <>
          <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
            <span>{labels.display}</span>
          </div>

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
