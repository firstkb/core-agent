import { useState, type HTMLAttributes, type MouseEvent as ReactMouseEvent } from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";

export type RatingSize = "sm" | "md" | "lg";

export type RatingProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  defaultValue?: number;
  disabled?: boolean;
  max?: number;
  onValueChange?: (value: number) => void;
  readOnly?: boolean;
  showValue?: boolean;
  size?: RatingSize;
  value?: number;
};

function StarIcon(props: HTMLAttributes<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 20 20"
      {...props}
    >
      <path d="m10 2.25 2.39 4.85 5.36.78-3.88 3.78.92 5.34L10 14.5 5.21 17l.92-5.34-3.88-3.78 5.36-.78L10 2.25Z" />
    </svg>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatRatingValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function Rating({
  className,
  defaultValue = 0,
  disabled = false,
  max = 5,
  onValueChange,
  readOnly = false,
  showValue = false,
  size = "md",
  value,
  ...props
}: RatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value,
  });
  const safeValue = clamp(currentValue, 0, max);
  const displayValue = !readOnly && hoveredValue !== null ? hoveredValue : safeValue;
  const interactive = !readOnly && !disabled;

  function handleStarClick(nextValue: number) {
    if (!interactive) {
      return;
    }

    setCurrentValue(nextValue);
  }

  function handlePointerEnter(nextValue: number) {
    if (!interactive) {
      return;
    }

    setHoveredValue(nextValue);
  }

  function handlePointerLeave() {
    if (!interactive) {
      return;
    }

    setHoveredValue(null);
  }

  return (
    <div
      {...props}
      className={cx(
        "ui-rating",
        `ui-rating--${size}`,
        interactive && "ui-rating--interactive",
        disabled && "ui-rating--disabled",
        className,
      )}
      onMouseLeave={handlePointerLeave}
    >
      <div className="ui-rating__stars" role={interactive ? "radiogroup" : "img"} aria-label={`Rating ${formatRatingValue(safeValue)} out of ${max}`}>
        {Array.from({ length: max }, (_, index) => {
          const itemValue = index + 1;
          const filled = displayValue >= itemValue;
          const partial = displayValue > index && displayValue < itemValue;
          const fillPercent = partial ? (displayValue - index) * 100 : filled ? 100 : 0;

          if (!interactive) {
            return (
              <span className="ui-rating__star" key={`rating-star-${itemValue}`}>
                <StarIcon className="ui-rating__star-empty" />
                <span className="ui-rating__star-fill" style={{ width: `${fillPercent}%` }}>
                  <StarIcon className="ui-rating__star-filled" />
                </span>
              </span>
            );
          }

          return (
            <button
              aria-checked={safeValue === itemValue}
              aria-label={`Set rating to ${itemValue}`}
              className="ui-rating__star-button"
              disabled={disabled}
              key={`rating-star-${itemValue}`}
              onClick={() => handleStarClick(itemValue)}
              onMouseEnter={() => handlePointerEnter(itemValue)}
              onMouseLeave={(event: ReactMouseEvent<HTMLButtonElement>) => {
                if (!event.currentTarget.matches(":hover")) {
                  handlePointerLeave();
                }
              }}
              role="radio"
              type="button"
            >
              <span className="ui-rating__star">
                <StarIcon className="ui-rating__star-empty" />
                <span className="ui-rating__star-fill" style={{ width: `${fillPercent}%` }}>
                  <StarIcon className="ui-rating__star-filled" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {showValue ? <span className="ui-rating__value">{formatRatingValue(safeValue)}</span> : null}
    </div>
  );
}
