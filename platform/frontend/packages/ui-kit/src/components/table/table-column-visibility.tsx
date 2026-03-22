import { useId, type HTMLAttributes, type ReactNode } from "react";

import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cx } from "../../lib/cx";

export type TableColumnVisibilityItem = {
  checked: boolean;
  count?: ReactNode;
  disabled?: boolean;
  id: string;
  label: ReactNode;
};

export type TableColumnVisibilityProps = HTMLAttributes<HTMLDivElement> & {
  columns: readonly TableColumnVisibilityItem[];
  emptyLabel?: ReactNode;
  label?: ReactNode;
  onColumnChange?: (id: string, checked: boolean) => void;
  triggerLabel?: ReactNode;
};

export function TableColumnVisibility({
  className,
  columns,
  emptyLabel = "No configurable columns",
  label = "Toggle columns",
  onColumnChange,
  triggerLabel = "Columns",
  ...props
}: TableColumnVisibilityProps) {
  const baseId = useId();

  return (
    <div {...props} className={cx("ui-table-column-visibility", className)}>
      <Popover align="end">
        <PopoverTrigger>
          <Button size="sm" variant="outline">
            {triggerLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="ui-table-column-visibility__content">
          <div className="ui-table-column-visibility__header">
            <span className="ui-table-column-visibility__title">{label}</span>
          </div>
          {columns.length > 0 ? (
            <div className="ui-table-column-visibility__list">
              {columns.map((column, index) => {
                const inputId = `${baseId}-${index}`;

                return (
                  <label
                    className={cx(
                      "ui-table-column-visibility__item",
                      column.disabled && "ui-table-column-visibility__item--disabled",
                    )}
                    htmlFor={inputId}
                    key={column.id}
                  >
                    <span className="ui-table-column-visibility__item-main">
                      <Checkbox
                        checked={column.checked}
                        disabled={column.disabled}
                        id={inputId}
                        onChange={(event) => onColumnChange?.(column.id, event.currentTarget.checked)}
                      />
                      <span className="ui-table-column-visibility__item-label">{column.label}</span>
                    </span>
                    {column.count ? (
                      <span className="ui-table-column-visibility__item-count">{column.count}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="ui-table-column-visibility__empty">{emptyLabel}</div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
