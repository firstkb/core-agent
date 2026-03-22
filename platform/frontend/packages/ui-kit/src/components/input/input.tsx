import { forwardRef } from "react";
import type { HTMLAttributes, InputHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type InputSize = "sm" | "md" | "lg";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  invalid?: boolean;
};

export type InputAddonProps = HTMLAttributes<HTMLDivElement> & {
  size?: InputSize;
};

export type InputGroupProps = HTMLAttributes<HTMLDivElement>;

/**
 * Product-owned text input with a small, stable API.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size = "md", invalid = false, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      className={cx(
        "ui-input",
        `ui-input--${size}`,
        invalid && "ui-input--invalid",
        className,
      )}
    />
  );
});

export function InputGroup({ className, ...props }: InputGroupProps) {
  return <div {...props} className={cx("ui-input-group", className)} />;
}

export function InputAddon({ className, size = "md", ...props }: InputAddonProps) {
  return <div {...props} className={cx("ui-input-addon", `ui-input-addon--${size}`, className)} />;
}
