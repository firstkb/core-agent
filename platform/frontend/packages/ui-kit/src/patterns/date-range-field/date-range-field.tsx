import type { HTMLAttributes } from "react";

import { DateField, type DateFieldPicker } from "../../components/date-field";
import { FilterChip } from "../../components/filter-chip";
import { InputGroup } from "../../components/input";
import { cx } from "../../lib/cx";

export type DateRangePreset = {
  id: string;
  label: string;
};

export type DateRangeFieldProps = HTMLAttributes<HTMLDivElement> & {
  endDate: string;
  endDateFieldId?: string;
  endDateFieldName?: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  picker?: DateFieldPicker;
  presetLabel?: string;
  presets?: ReadonlyArray<DateRangePreset>;
  activePresetId?: string | null;
  onPresetSelect?: (presetId: string) => void;
  openOnFieldClick?: boolean;
  startDate: string;
  startDateFieldId?: string;
  startDateFieldName?: string;
};

export function DateRangeField({
  activePresetId = null,
  className,
  endDate,
  endDateFieldId,
  endDateFieldName,
  onEndDateChange,
  onPresetSelect,
  onStartDateChange,
  openOnFieldClick = false,
  picker = "native",
  presetLabel = "Range presets",
  presets,
  startDate,
  startDateFieldId,
  startDateFieldName,
  ...props
}: DateRangeFieldProps) {
  return (
    <div {...props} className={cx("ui-date-range-field", className)}>
      {picker === "native" ? (
        <InputGroup className="ui-date-range-field__inputs">
          <DateField
            aria-label="Start date"
            id={startDateFieldId}
            max={endDate || undefined}
            name={startDateFieldName}
            onChange={(event) => onStartDateChange(event.target.value)}
            value={startDate}
          />
          <DateField
            aria-label="End date"
            id={endDateFieldId}
            min={startDate || undefined}
            name={endDateFieldName}
            onChange={(event) => onEndDateChange(event.target.value)}
            value={endDate}
          />
        </InputGroup>
      ) : (
        <div className="ui-date-range-field__inputs ui-date-range-field__inputs--calendar">
          <DateField
            aria-label="Start date"
            id={startDateFieldId}
            max={endDate || undefined}
            name={startDateFieldName}
            onChange={(event) => onStartDateChange(event.target.value)}
            openOnFieldClick={openOnFieldClick}
            picker={picker}
            placeholderText="Start date"
            value={startDate}
          />
          <DateField
            aria-label="End date"
            id={endDateFieldId}
            min={startDate || undefined}
            name={endDateFieldName}
            onChange={(event) => onEndDateChange(event.target.value)}
            openOnFieldClick={openOnFieldClick}
            picker={picker}
            placeholderText="End date"
            value={endDate}
          />
        </div>
      )}

      {presets?.length && onPresetSelect ? (
        <div className="ui-date-range-field__presets">
          <span className="ui-date-range-field__presets-label">{presetLabel}</span>
          <div className="ui-date-range-field__presets-row">
            {presets.map((preset) => (
              <FilterChip
                active={preset.id === activePresetId}
                key={preset.id}
                onClick={() => onPresetSelect(preset.id)}
              >
                {preset.label}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
