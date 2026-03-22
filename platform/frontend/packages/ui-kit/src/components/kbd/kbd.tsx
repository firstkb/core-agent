import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type KbdVariant = "default" | "outline";
export type KbdSize = "xs" | "sm" | "md";

export type KbdProps = HTMLAttributes<HTMLElement> & {
  size?: KbdSize;
  variant?: KbdVariant;
};

export function Kbd({
  children,
  className,
  size = "md",
  variant = "default",
  ...props
}: KbdProps) {
  return (
    <kbd
      {...props}
      className={cx("ui-kbd", `ui-kbd--${variant}`, `ui-kbd--${size}`, className)}
    >
      {children}
    </kbd>
  );
}
