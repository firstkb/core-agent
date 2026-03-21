import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

import { cx } from "../../lib/cx";
import type { InputSize } from "../input";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  size?: InputSize;
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, size = "md", invalid = false, ...props },
  ref,
) {
  return (
    <select
      {...props}
      ref={ref}
      className={cx(
        "ui-select",
        `ui-select--${size}`,
        invalid && "ui-select--invalid",
        className,
      )}
    />
  );
});
