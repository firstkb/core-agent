import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type SeparatorOrientation = "horizontal" | "vertical";

export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  decorative?: boolean;
  orientation?: SeparatorOrientation;
};

export function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
  role,
  ...props
}: SeparatorProps) {
  return (
    <div
      {...props}
      aria-hidden={decorative ? true : undefined}
      aria-orientation={decorative ? undefined : orientation}
      className={cx("ui-separator", `ui-separator--${orientation}`, className)}
      role={decorative ? undefined : role ?? "separator"}
    />
  );
}
