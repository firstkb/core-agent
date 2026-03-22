import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ForwardedRef,
  type InputHTMLAttributes,
  type MouseEvent,
  type SVGProps,
} from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";
import { Calendar } from "../calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

export type DateFieldSize = "sm" | "md" | "lg";
export type DateFieldPicker = "native" | "calendar";

export type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  defaultMonth?: Date;
  invalid?: boolean;
  isDateDisabled?: (date: Date) => boolean;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  openOnFieldClick?: boolean;
  picker?: DateFieldPicker;
  placeholderText?: string;
  showOutsideDays?: boolean;
  size?: DateFieldSize;
};

const displayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
      <rect height="10" rx="2.5" stroke="currentColor" strokeWidth="1.25" width="11" x="2.5" y="3.25" />
      <path d="M5 1.75V4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" />
      <path d="M11 1.75V4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" />
      <path d="M2.5 6H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" />
    </svg>
  );
}

function normalizeDateInputValue(value: InputHTMLAttributes<HTMLInputElement>["value"] | undefined) {
  return typeof value === "string" ? value : "";
}

function parseDateInputValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((segment) => Number(segment));
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isDateBefore(left: Date, right: Date) {
  return left.getTime() < right.getTime();
}

function NativeDateField(
  {
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    autoFocus,
    className,
    defaultMonth: _defaultMonth,
    disabled = false,
    id,
    isDateDisabled: _isDateDisabled,
    invalid = false,
    month: _month,
    onChange,
    onMonthChange: _onMonthChange,
    openOnFieldClick: _openOnFieldClick,
    picker: _picker,
    placeholderText: _placeholderText,
    readOnly = false,
    showOutsideDays: _showOutsideDays,
    size = "md",
    title,
    value,
    ...props
  }: DateFieldProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  void _defaultMonth;
  void _isDateDisabled;
  void _month;
  void _onMonthChange;
  void _openOnFieldClick;
  void _picker;
  void _placeholderText;
  void _showOutsideDays;

  return (
    <input
      {...props}
      autoFocus={autoFocus}
      ref={ref}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cx(
        "ui-input",
        "ui-date-field",
        `ui-input--${size}`,
        invalid && "ui-input--invalid",
        className,
      )}
      disabled={disabled}
      id={id}
      onChange={onChange}
      readOnly={readOnly}
      title={title}
      type="date"
      value={value}
    />
  );
}

function CalendarDateField(
  {
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    autoFocus,
    className,
    defaultMonth,
    defaultValue,
    disabled = false,
    id,
    invalid = false,
    isDateDisabled,
    month,
    onChange,
    onMonthChange,
    openOnFieldClick = false,
    placeholder,
    placeholderText,
    readOnly = false,
    showOutsideDays = true,
    size = "md",
    title,
    value,
    ...props
  }: DateFieldProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useControllableState<string>({
    defaultValue: normalizeDateInputValue(defaultValue),
    value: typeof value === "string" ? value : undefined,
  });

  const selectedDate = useMemo(() => parseDateInputValue(selectedValue), [selectedValue]);
  const minDate = useMemo(() => parseDateInputValue(typeof props.min === "string" ? props.min : ""), [props.min]);
  const maxDate = useMemo(() => parseDateInputValue(typeof props.max === "string" ? props.max : ""), [props.max]);
  const displayValue = selectedDate ? displayFormatter.format(selectedDate) : placeholderText ?? placeholder ?? "Select date";

  function setInputRef(node: HTMLInputElement | null) {
    hiddenInputRef.current = node;

    if (typeof ref === "function") {
      ref(node);
      return;
    }

    if (ref) {
      ref.current = node;
    }
  }

  function emitChange(nextValue: string) {
    const inputNode = hiddenInputRef.current;

    if (!inputNode) {
      return;
    }

    inputNode.value = nextValue;
    onChange?.({
      currentTarget: inputNode,
      target: inputNode,
    } as ChangeEvent<HTMLInputElement>);
  }

  function handleDateSelect(nextDate: Date | null) {
    const nextValue = nextDate ? formatDateInputValue(nextDate) : "";
    setSelectedValue(nextValue);
    emitChange(nextValue);
    setOpen(false);
  }

  function handleFieldBodyPointer(event: MouseEvent<HTMLElement>) {
    if (openOnFieldClick || disabled || readOnly) {
      return;
    }

    event.stopPropagation();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (disabled || readOnly) {
      return;
    }

    setOpen(nextOpen);
  }

  return (
    <>
      <input
        {...props}
        ref={setInputRef}
        disabled={disabled}
        id={undefined}
        name={props.name}
        readOnly
        required={props.required}
        type="hidden"
        value={selectedValue}
      />

      <Popover align="start" onOpenChange={handleOpenChange} open={open} side="bottom">
        <PopoverTrigger>
          <button
            aria-describedby={ariaDescribedBy}
            aria-invalid={invalid || undefined}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-readonly={readOnly || undefined}
            autoFocus={autoFocus}
            className={cx(
              "ui-input",
              "ui-date-field-trigger",
              `ui-input--${size}`,
              invalid && "ui-input--invalid",
              className,
            )}
            disabled={disabled}
            id={id}
            title={title}
            type="button"
          >
            <span
              className={cx(
                "ui-date-field-trigger__value",
                !selectedDate && "ui-date-field-trigger__value--placeholder",
              )}
              onClick={handleFieldBodyPointer}
              onMouseDown={handleFieldBodyPointer}
            >
              {displayValue}
            </span>
            <span className="ui-date-field-trigger__icon-shell">
              <CalendarIcon className="ui-date-field-trigger__icon" />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent className="ui-date-field__popover">
          <Calendar
            defaultMonth={defaultMonth ?? selectedDate ?? minDate ?? maxDate ?? new Date()}
            isDateDisabled={(date) => {
              if (minDate && isDateBefore(date, minDate)) {
                return true;
              }

              if (maxDate && isDateBefore(maxDate, date)) {
                return true;
              }

              return isDateDisabled?.(date) ?? false;
            }}
            key={selectedValue || "__empty__"}
            month={month}
            onMonthChange={onMonthChange}
            onValueChange={handleDateSelect}
            showOutsideDays={showOutsideDays}
            value={selectedDate}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(props, ref) {
  if (props.picker === "calendar") {
    return CalendarDateField(props, ref);
  }

  return NativeDateField(props, ref);
});
