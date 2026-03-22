import type { LabelHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type LabelVariant = "primary" | "secondary";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  variant?: LabelVariant;
};

export function Label({
  className,
  variant = "primary",
  ...props
}: LabelProps) {
  return <label {...props} className={cx("ui-label", `ui-label--${variant}`, className)} />;
}
