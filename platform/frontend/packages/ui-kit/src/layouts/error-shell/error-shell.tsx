import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type ErrorShellProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function ErrorShell({
  className,
  title,
  description,
  actions,
  ...props
}: ErrorShellProps) {
  return (
    <div {...props} className={cx("ui-error-shell", className)}>
      <div className="ui-shell-panel">
        <h1 className="ui-pattern__title">{title}</h1>
        {description ? <p className="ui-pattern__description">{description}</p> : null}
        {actions ? <div className="ui-pattern__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
