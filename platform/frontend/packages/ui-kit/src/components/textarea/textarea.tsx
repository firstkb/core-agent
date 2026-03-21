import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  resize?: "vertical" | "none";
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid = false, resize = "vertical", ...props },
  ref,
) {
  return (
    <textarea
      {...props}
      ref={ref}
      className={cx(
        "ui-textarea",
        `ui-textarea--${resize}`,
        invalid && "ui-textarea--invalid",
        className,
      )}
    />
  );
});
