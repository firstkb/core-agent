import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type PageToolbarProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageToolbar({
  className,
  title,
  description,
  eyebrow,
  actions,
  ...props
}: PageToolbarProps) {
  return (
    <div {...props} className={cx("ui-page-toolbar", className)}>
      <div>
        {eyebrow ? <p className="ui-page-toolbar__eyebrow">{eyebrow}</p> : null}
        <h1 className="ui-page-toolbar__title">{title}</h1>
        {description ? <p className="ui-page-toolbar__description">{description}</p> : null}
      </div>
      {actions ? <div className="ui-page-toolbar__actions">{actions}</div> : null}
    </div>
  );
}
