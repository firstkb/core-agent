import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export function EmptyState({
  className,
  title,
  description,
  icon,
  actions,
  ...props
}: EmptyStateProps) {
  return (
    <div {...props} className={cx("ui-pattern", className)}>
      {icon}
      <h2 className="ui-pattern__title">{title}</h2>
      {description ? <p className="ui-pattern__description">{description}</p> : null}
      {actions ? <div className="ui-pattern__actions">{actions}</div> : null}
    </div>
  );
}
