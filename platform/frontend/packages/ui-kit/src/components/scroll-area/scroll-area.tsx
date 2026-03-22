import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type ScrollAreaOrientation = "both" | "horizontal" | "vertical";

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: ScrollAreaOrientation;
  viewportClassName?: string;
};

export function ScrollArea({
  children,
  className,
  orientation = "vertical",
  viewportClassName,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      {...props}
      className={cx("ui-scroll-area", `ui-scroll-area--${orientation}`, className)}
    >
      <div className={cx("ui-scroll-area__viewport", viewportClassName)}>{children}</div>
    </div>
  );
}
