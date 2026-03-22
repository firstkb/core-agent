import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export function SecondaryTabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-secondary-tabs", className)} role="tablist" />;
}

export type SecondaryTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  badge?: string;
};

export function SecondaryTab({
  active = false,
  badge,
  children,
  className,
  type = "button",
  ...props
}: SecondaryTabProps) {
  return (
    <button
      {...props}
      aria-selected={active}
      className={cx("ui-secondary-tab", active && "ui-secondary-tab--active", className)}
      role="tab"
      tabIndex={active ? 0 : -1}
      type={type}
    >
      <span>{children}</span>
      {badge ? <span className="ui-secondary-tab__badge">{badge}</span> : null}
    </button>
  );
}
