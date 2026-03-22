import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export type StatusSize = "sm" | "md" | "lg";

export type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  size?: StatusSize;
  tone?: StatusTone;
};

export type InlineStatusProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  size?: StatusSize;
  tone?: StatusTone;
};

export function StatusDot({
  className,
  size = "md",
  tone = "neutral",
  ...props
}: StatusDotProps) {
  return (
    <span
      {...props}
      className={cx("ui-status-dot", `ui-status-dot--${tone}`, `ui-status-dot--${size}`, className)}
    />
  );
}

export function InlineStatus({
  children,
  className,
  size = "md",
  tone = "neutral",
  ...props
}: InlineStatusProps) {
  return (
    <span
      {...props}
      className={cx("ui-inline-status", `ui-inline-status--${size}`, className)}
    >
      <StatusDot aria-hidden="true" size={size} tone={tone} />
      <span className="ui-inline-status__label">{children}</span>
    </span>
  );
}
