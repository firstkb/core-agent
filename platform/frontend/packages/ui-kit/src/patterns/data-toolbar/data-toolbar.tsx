import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export function DataToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-data-toolbar", className)} />;
}

export type DataToolbarGroupProps = HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end";
};

export function DataToolbarGroup({
  className,
  align = "start",
  ...props
}: DataToolbarGroupProps) {
  return <div {...props} className={cx("ui-data-toolbar__group", `ui-data-toolbar__group--${align}`, className)} />;
}

export function DataToolbarMeta({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-data-toolbar__meta", className)} />;
}
