import type { HTMLAttributes } from "react";
import { useMemo } from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";

export type CalendarMode = "single" | "range";

export type CalendarRangeValue = {
  from: Date | null;
  to: Date | null;
};

type CalendarBaseProps = HTMLAttributes<HTMLDivElement> & {
  defaultMonth?: Date;
  isDateDisabled?: (date: Date) => boolean;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  showOutsideDays?: boolean;
};

type CalendarSingleProps = CalendarBaseProps & {
  defaultValue?: Date | null;
  mode?: "single";
  onValueChange?: (value: Date | null) => void;
  value?: Date | null;
};

type CalendarRangeProps = CalendarBaseProps & {
  defaultRange?: CalendarRangeValue | null;
  mode: "range";
  onRangeChange?: (value: CalendarRangeValue | null) => void;
  range?: CalendarRangeValue | null;
};

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("en-US", { day: "numeric" });

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(left: Date | null | undefined, right: Date | null | undefined) {
  if (!left || !right) {
    return false;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isDateBefore(left: Date, right: Date) {
  return startOfDay(left).getTime() < startOfDay(right).getTime();
}

function isDateInRange(date: Date, range: CalendarRangeValue | null | undefined) {
  if (!range?.from || !range.to) {
    return false;
  }

  const current = startOfDay(date).getTime();
  const from = startOfDay(range.from).getTime();
  const to = startOfDay(range.to).getTime();

  return current > Math.min(from, to) && current < Math.max(from, to);
}

function normalizeRange(range: CalendarRangeValue | null | undefined): CalendarRangeValue | null {
  if (!range?.from && !range?.to) {
    return null;
  }

  return {
    from: range?.from ? startOfDay(range.from) : null,
    to: range?.to ? startOfDay(range.to) : null,
  };
}

function getSelectionAnchor(props: CalendarProps) {
  if (props.mode === "range") {
    return props.range?.from ?? props.defaultRange?.from ?? new Date();
  }

  return props.value ?? props.defaultValue ?? new Date();
}

function getNextRange(currentRange: CalendarRangeValue | null, nextDate: Date): CalendarRangeValue {
  const normalizedDate = startOfDay(nextDate);

  if (!currentRange?.from || (currentRange.from && currentRange.to)) {
    return { from: normalizedDate, to: null };
  }

  if (isDateBefore(normalizedDate, currentRange.from)) {
    return { from: normalizedDate, to: currentRange.from };
  }

  return { from: currentRange.from, to: normalizedDate };
}

export function Calendar({
  className,
  defaultMonth,
  isDateDisabled,
  month,
  onMonthChange,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useControllableState({
    defaultValue: startOfMonth(defaultMonth ?? getSelectionAnchor(props)),
    onChange: onMonthChange,
    value: month ? startOfMonth(month) : undefined,
  });

  const [selectedDate, setSelectedDate] = useControllableState<Date | null>({
    defaultValue: props.mode === "range" ? null : props.defaultValue ?? null,
    onChange: props.mode === "range" ? undefined : props.onValueChange,
    value: props.mode === "range" ? undefined : props.value,
  });

  const [selectedRange, setSelectedRange] = useControllableState<CalendarRangeValue | null>({
    defaultValue: props.mode === "range" ? normalizeRange(props.defaultRange) : null,
    onChange: props.mode === "range" ? props.onRangeChange : undefined,
    value: props.mode === "range" ? normalizeRange(props.range) : undefined,
  });

  const weekdays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const weekday = new Date(2026, 2, 22 + index);
      return weekdayFormatter.format(weekday);
    });
  }, []);

  const visibleDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const calendarStart = addDays(monthStart, -monthStart.getDay());

    return Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
  }, [currentMonth]);

  function handleMonthShift(amount: number) {
    setCurrentMonth(addMonths(currentMonth, amount));
  }

  function handleDaySelect(date: Date) {
    if (isDateDisabled?.(date)) {
      return;
    }

    if (props.mode === "range") {
      setSelectedRange(getNextRange(selectedRange, date));
      return;
    }

    setSelectedDate(date);
  }

  return (
    <div className={cx("ui-calendar", className)}>
      <div className="ui-calendar__header">
        <button
          aria-label="Previous month"
          className="ui-calendar__nav-button"
          onClick={() => handleMonthShift(-1)}
          type="button"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="ui-calendar__title">{monthFormatter.format(currentMonth)}</div>
        <button
          aria-label="Next month"
          className="ui-calendar__nav-button"
          onClick={() => handleMonthShift(1)}
          type="button"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="ui-calendar__weekdays">
        {weekdays.map((weekday) => (
          <span className="ui-calendar__weekday" key={weekday}>
            {weekday}
          </span>
        ))}
      </div>

      <div className="ui-calendar__grid">
        {visibleDays.map((date) => {
          const outside = !isSameMonth(date, currentMonth);
          const disabled = Boolean(isDateDisabled?.(date));
          const today = isSameDay(date, new Date());
          const singleSelected = props.mode !== "range" && isSameDay(date, selectedDate);
          const rangeStart = props.mode === "range" && isSameDay(date, selectedRange?.from);
          const rangeEnd = props.mode === "range" && isSameDay(date, selectedRange?.to);
          const rangeMiddle = props.mode === "range" && isDateInRange(date, selectedRange);
          const selected = Boolean(singleSelected || rangeStart || rangeEnd || rangeMiddle);

          if (!showOutsideDays && outside) {
            return <span aria-hidden="true" className="ui-calendar__day ui-calendar__day--placeholder" key={date.toISOString()} />;
          }

          return (
            <span
              className={cx(
                "ui-calendar__day",
                outside && "ui-calendar__day--outside",
                disabled && "ui-calendar__day--disabled",
                today && "ui-calendar__day--today",
                singleSelected && "ui-calendar__day--selected",
                rangeStart && "ui-calendar__day--range-start",
                rangeEnd && "ui-calendar__day--range-end",
                rangeMiddle && "ui-calendar__day--range-middle",
              )}
              key={date.toISOString()}
            >
              <button
                aria-pressed={selected}
                className="ui-calendar__day-button"
                disabled={disabled}
                onClick={() => handleDaySelect(date)}
                type="button"
              >
                {dayFormatter.format(date)}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
