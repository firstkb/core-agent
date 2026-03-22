import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type CodeVariant = "default" | "outline" | "danger";
export type CodeSize = "sm" | "md" | "lg";

export type CodeProps = HTMLAttributes<HTMLElement> & {
  size?: CodeSize;
  variant?: CodeVariant;
};

export function Code({
  children,
  className,
  size = "md",
  variant = "default",
  ...props
}: CodeProps) {
  return (
    <code
      {...props}
      className={cx("ui-code", `ui-code--${variant}`, `ui-code--${size}`, className)}
    >
      {children}
    </code>
  );
}
