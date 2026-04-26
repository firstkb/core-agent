import {
  Input,
  Label,
  Switch,
} from "@platform/ui-kit";

type DateTodayFieldSettingsLabels = {
  dateToday: string;
  defaultValueMode: string;
  defaultValueToday: string;
  displayFormat: string;
  readonly: string;
};

type DateTodayFieldSettingsProps = {
  displayFormat: string;
  labels: DateTodayFieldSettingsLabels;
  onDisplayFormatChange: (value: string) => void;
  onReadonlyChange: (checked: boolean) => void;
  readonly: boolean;
};

export function DateTodayFieldSettings({
  displayFormat,
  labels,
  onDisplayFormatChange,
  onReadonlyChange,
  readonly,
}: DateTodayFieldSettingsProps) {
  return (
    <div className="tenant-web__platform-studio-filter-group">
      <p className="tenant-web__platform-studio-filter-group-title">
        {labels.dateToday}
      </p>
      <div className="tenant-web__platform-studio-sort-row">
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-date-today-default">
            {labels.defaultValueMode}
          </Label>
          <Input
            disabled
            id="tenant-platform-studio-date-today-default"
            value={labels.defaultValueToday}
          />
        </div>
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-date-today-format">
            {labels.displayFormat}
          </Label>
          <Input
            id="tenant-platform-studio-date-today-format"
            onChange={(event) => onDisplayFormatChange(event.target.value)}
            value={displayFormat}
          />
        </div>
      </div>
      <div className="tenant-web__platform-studio-switch-row">
        <span className="tenant-web__platform-studio-compact-row-label">
          {labels.readonly}
        </span>
        <Switch
          checked={readonly}
          onCheckedChange={onReadonlyChange}
          size="sm"
        />
      </div>
    </div>
  );
}
