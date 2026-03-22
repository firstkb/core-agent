import type { HTMLAttributes, ReactNode } from "react";

import type { BadgeVariant } from "../../components/badge";
import { cx } from "../../lib/cx";

export type ToolbarNoticeProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  detail?: ReactNode;
  tone?: BadgeVariant;
};

export function ToolbarNotice({
  className,
  detail,
  role = "status",
  title,
  tone = "brand",
  ...props
}: ToolbarNoticeProps) {
  return (
    <div
      {...props}
      className={cx("ui-toolbar-notice", `ui-toolbar-notice--${tone}`, className)}
      role={role}
    >
      <span aria-hidden="true" className="ui-toolbar-notice__marker" />
      <span className="ui-toolbar-notice__content">
        <span className="ui-toolbar-notice__title">{title}</span>
        {detail ? <span className="ui-toolbar-notice__detail">{detail}</span> : null}
      </span>
    </div>
  );
}
