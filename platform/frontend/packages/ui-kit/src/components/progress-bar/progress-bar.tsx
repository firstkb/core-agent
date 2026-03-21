import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type ProgressBarTone = "brand" | "success" | "warning" | "danger" | "neutral";

export type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  max?: number;
  tone?: ProgressBarTone;
};

function clampValue(value: number, max: number) {
  return Math.min(Math.max(value, 0), max);
}

export function ProgressBar({
  className,
  value,
  max = 100,
  tone = "brand",
  ...props
}: ProgressBarProps) {
  const safeValue = clampValue(value, max);
  const percentage = max === 0 ? 0 : Math.round((safeValue / max) * 100);

  return (
    <div
      {...props}
      className={cx("ui-progress", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={safeValue}
      aria-valuetext={`${percentage}%`}
    >
      <div className="ui-progress__track">
        <div
          aria-hidden="true"
          className={cx("ui-progress__indicator", `ui-progress__indicator--${tone}`)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
