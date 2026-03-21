import type { HTMLAttributes } from "react";

import { FilterChip } from "../../components/filter-chip";
import { Input, InputGroup } from "../../components/input";
import { cx } from "../../lib/cx";

export type DateRangePreset = {
  id: string;
  label: string;
};

export type DateRangeFieldProps = HTMLAttributes<HTMLDivElement> & {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  presetLabel?: string;
  presets?: ReadonlyArray<DateRangePreset>;
  activePresetId?: string | null;
  onPresetSelect?: (presetId: string) => void;
};

export function DateRangeField({
  activePresetId = null,
  className,
  endDate,
  onEndDateChange,
  onPresetSelect,
  onStartDateChange,
  presetLabel = "Range presets",
  presets,
  startDate,
  ...props
}: DateRangeFieldProps) {
  return (
    <div {...props} className={cx("ui-date-range-field", className)}>
      <InputGroup className="ui-date-range-field__inputs">
        <Input
          aria-label="Start date"
          max={endDate || undefined}
          onChange={(event) => onStartDateChange(event.target.value)}
          type="date"
          value={startDate}
        />
        <Input
          aria-label="End date"
          min={startDate || undefined}
          onChange={(event) => onEndDateChange(event.target.value)}
          type="date"
          value={endDate}
        />
      </InputGroup>

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
