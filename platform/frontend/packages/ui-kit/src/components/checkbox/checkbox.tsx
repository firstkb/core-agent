import { forwardRef, useEffect, useRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  indeterminate?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, indeterminate = false, type = "checkbox", ...props },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      {...props}
      ref={(node) => {
        inputRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cx("ui-checkbox", className)}
      type={type}
    />
  );
});
