import type { HTMLAttributes } from "react";

import { Skeleton, SkeletonText } from "../../components/skeleton";
import { cx } from "../../lib/cx";

export type TableLoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  columns?: number;
  rows?: number;
  title?: string;
  description?: string;
};

export function TableLoadingState({
  className,
  columns = 5,
  description = "Preparing filters, controls, and table rows.",
  rows = 6,
  title = "Loading table",
  ...props
}: TableLoadingStateProps) {
  return (
    <div {...props} className={cx("ui-pattern ui-table-loading-state", className)}>
      <span aria-hidden="true" className="ui-loading-state__bar" />
      <h2 className="ui-pattern__title">{title}</h2>
      <p className="ui-pattern__description">{description}</p>

      <div className="ui-table-loading-state__toolbar">
        <Skeleton height="2.5rem" width="16rem" />
        <div className="ui-table-loading-state__toolbar-actions">
          <Skeleton height="2rem" width="7rem" />
          <Skeleton height="2rem" width="6rem" />
        </div>
      </div>

      <div className="ui-table-loading-state__surface">
        <div className="ui-table-loading-state__head">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton
              height="0.75rem"
              key={index}
              variant="text"
              width={index === 0 ? "78%" : index === columns - 1 ? "52%" : "66%"}
            />
          ))}
        </div>

        <div className="ui-table-loading-state__body">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div className="ui-table-loading-state__row" key={rowIndex}>
              {Array.from({ length: columns }, (_, columnIndex) => (
                <div className="ui-table-loading-state__cell" key={columnIndex}>
                  {columnIndex === 0 ? (
                    <SkeletonText lines={2} widths={["74%", "46%"]} />
                  ) : (
                    <Skeleton
                      height="0.875rem"
                      variant="text"
                      width={columnIndex === columns - 1 ? "48%" : "68%"}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
