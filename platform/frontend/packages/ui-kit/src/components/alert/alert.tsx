import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type AlertTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export type AlertAppearance = "soft" | "outline" | "solid";
export type AlertSize = "sm" | "md" | "lg";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  appearance?: AlertAppearance;
  size?: AlertSize;
  tone?: AlertTone;
};

export function Alert({
  appearance = "soft",
  className,
  size = "md",
  tone = "neutral",
  ...props
}: AlertProps) {
  return (
    <div
      {...props}
      className={cx("ui-alert", `ui-alert--${appearance}`, `ui-alert--${size}`, `ui-alert--${tone}`, className)}
    />
  );
}

export function AlertIcon({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-alert__icon", className)} />;
}

export function AlertBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-alert__body", className)} />;
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-alert__title", className)} />;
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-alert__description", className)} />;
}

export function AlertActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-alert__actions", className)} />;
}
