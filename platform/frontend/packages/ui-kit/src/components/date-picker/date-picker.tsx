import { DateField, type DateFieldPicker, type DateFieldProps, type DateFieldSize } from "../date-field";
import { DateRangeField, type DateRangeFieldProps, type DateRangePreset } from "../../patterns/date-range-field";

type DatePickerBaseProps = {
  className?: string;
  openOnFieldClick?: boolean;
  picker?: DateFieldPicker;
  size?: DateFieldSize;
};

type DatePickerSingleProps = DatePickerBaseProps &
  Omit<DateFieldProps, "className" | "defaultValue" | "onChange" | "picker" | "size" | "type" | "value"> & {
    defaultValue?: string;
    mode?: "single";
    onValueChange?: (value: string) => void;
    value?: string;
  };

type DatePickerRangeProps = DatePickerBaseProps &
  Omit<DateRangeFieldProps, "className" | "openOnFieldClick" | "picker"> & {
    mode: "range";
  };

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;
export type { DateRangePreset };

export function DatePicker(props: DatePickerProps) {
  if (props.mode === "range") {
    const {
      className,
      mode: _mode,
      openOnFieldClick = false,
      picker = "calendar",
      size,
      ...rangeProps
    } = props;
    void _mode;
    void size;

    return (
      <DateRangeField
        {...rangeProps}
        className={className}
        openOnFieldClick={openOnFieldClick}
        picker={picker}
      />
    );
  }

  const {
    className,
    defaultValue,
    mode,
    onValueChange,
    openOnFieldClick = false,
    picker = "native",
    size = "md",
    value,
    ...fieldProps
  } = props;
  void mode;

  return (
    <DateField
      {...fieldProps}
      className={className}
      defaultValue={defaultValue}
      onChange={(event) => onValueChange?.(event.target.value)}
      openOnFieldClick={openOnFieldClick}
      picker={picker}
      size={size}
      value={value}
    />
  );
}
