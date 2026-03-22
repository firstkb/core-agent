import type { CSSProperties, InputHTMLAttributes } from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";

export type SliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "onChange" | "type" | "value"
> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
};

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toFiniteNumber(value: number | string | undefined, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function Slider({
  className,
  defaultValue,
  disabled = false,
  max = 100,
  min = 0,
  onValueChange,
  step = 1,
  value,
  ...props
}: SliderProps) {
  const numericMin = toFiniteNumber(min, 0);
  const numericMax = toFiniteNumber(max, 100);
  const [currentValue, setCurrentValue] = useControllableState({
    defaultValue: defaultValue ?? numericMin,
    onChange: onValueChange,
    value,
  });
  const safeValue = clampValue(currentValue, numericMin, numericMax);
  const percentage =
    numericMax <= numericMin ? 0 : ((safeValue - numericMin) / (numericMax - numericMin)) * 100;

  return (
    <div
      className={cx("ui-slider", disabled && "ui-slider--disabled", className)}
      style={{ "--ui-slider-percent": `${percentage}%` } as CSSProperties}
    >
      <input
        {...props}
        aria-valuemax={numericMax}
        aria-valuemin={numericMin}
        aria-valuenow={safeValue}
        className="ui-slider__input"
        disabled={disabled}
        max={numericMax}
        min={numericMin}
        onChange={(event) => {
          setCurrentValue(event.currentTarget.valueAsNumber);
        }}
        step={step}
        type="range"
        value={safeValue}
      />
    </div>
  );
}
