import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
};

export function LoadingState({
  className,
  title = "Loading",
  description,
  ...props
}: LoadingStateProps) {
  return (
    <div {...props} className={cx("ui-pattern ui-loading-state", className)}>
      <span aria-hidden="true" className="ui-loading-state__bar" />
      <h2 className="ui-pattern__title">{title}</h2>
      {description ? <p className="ui-pattern__description">{description}</p> : null}
    </div>
  );
}
