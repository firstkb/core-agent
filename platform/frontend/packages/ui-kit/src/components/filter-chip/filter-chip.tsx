import type { ButtonHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  count?: number;
};

export function FilterChip({
  children,
  className,
  active = false,
  count,
  type = "button",
  ...props
}: FilterChipProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={active}
      className={cx("ui-filter-chip", active && "ui-filter-chip--active", className)}
    >
      <span>{children}</span>
      {typeof count === "number" ? <span className="ui-filter-chip__count">{count}</span> : null}
    </button>
  );
}
