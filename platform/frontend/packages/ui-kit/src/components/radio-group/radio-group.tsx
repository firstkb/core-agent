import { forwardRef } from "react";
import type { HTMLAttributes, InputHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type RadioGroupOrientation = "horizontal" | "vertical";
export type RadioSize = "sm" | "md" | "lg";

export type RadioGroupProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: RadioGroupOrientation;
};

export type RadioGroupItemProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  invalid?: boolean;
  size?: RadioSize;
};

export function RadioGroup({
  className,
  orientation = "vertical",
  ...props
}: RadioGroupProps) {
  return <div {...props} className={cx("ui-radio-group", `ui-radio-group--${orientation}`, className)} role="radiogroup" />;
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(function RadioGroupItem(
  { className, invalid = false, size = "md", ...props },
  ref,
) {
  return (
    <input
      {...props}
      className={cx("ui-radio", `ui-radio--${size}`, invalid && "ui-radio--invalid", className)}
      ref={ref}
      type="radio"
    />
  );
});
