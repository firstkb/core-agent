import type { HTMLAttributes } from "react";

import { Skeleton, SkeletonText } from "../../components/skeleton";
import { cx } from "../../lib/cx";

export type CollectionLoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  items?: number;
  layout?: "grid" | "list";
  title?: string;
  description?: string;
};

export function CollectionLoadingState({
  className,
  description = "Preparing collection data and interface state.",
  items = 3,
  layout = "grid",
  title = "Loading collection",
  ...props
}: CollectionLoadingStateProps) {
  return (
    <div {...props} className={cx("ui-pattern ui-collection-loading-state", className)}>
      <span aria-hidden="true" className="ui-loading-state__bar" />
      <h2 className="ui-pattern__title">{title}</h2>
      <p className="ui-pattern__description">{description}</p>
      <div
        className={cx(
          "ui-collection-loading-state__items",
          layout === "list" && "ui-collection-loading-state__items--list",
        )}
      >
        {Array.from({ length: items }, (_, index) => (
          <section className="ui-collection-loading-state__item" key={index}>
            <div className="ui-collection-loading-state__item-header">
              <Skeleton height="1rem" variant="text" width={index % 2 === 0 ? "42%" : "56%"} />
              <Skeleton height="1.75rem" width="4.5rem" />
            </div>
            <SkeletonText lines={3} widths={["100%", "86%", "58%"]} />
          </section>
        ))}
      </div>
    </div>
  );
}
