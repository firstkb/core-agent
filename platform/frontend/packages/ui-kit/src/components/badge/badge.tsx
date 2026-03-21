import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export type BadgeAppearance = "solid" | "soft" | "outline";
export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  appearance?: BadgeAppearance;
  size?: BadgeSize;
  dot?: boolean;
};

/**
 * Status marker for compact state and category labeling.
 */
export function Badge({
  className,
  variant = "neutral",
  appearance = "soft",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={cx(
        "ui-badge",
        `ui-badge--${variant}`,
        `ui-badge--${appearance}`,
        `ui-badge--${size}`,
        className,
      )}
    >
      {dot ? <span aria-hidden="true" className="ui-badge__dot" /> : null}
      <span>{children}</span>
    </span>
  );
}
