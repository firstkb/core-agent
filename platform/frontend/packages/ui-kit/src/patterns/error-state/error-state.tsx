import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function ErrorState({
  className,
  title = "Something went wrong",
  description,
  actions,
  ...props
}: ErrorStateProps) {
  return (
    <div {...props} className={cx("ui-pattern", className)}>
      <h2 className="ui-pattern__title">{title}</h2>
      {description ? <p className="ui-pattern__description">{description}</p> : null}
      {actions ? <div className="ui-pattern__actions">{actions}</div> : null}
    </div>
  );
}
