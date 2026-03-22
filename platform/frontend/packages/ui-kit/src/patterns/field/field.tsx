import type { HTMLAttributes, LabelHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type FieldLayout = "stacked" | "responsive-inline";

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  invalid?: boolean;
  layout?: FieldLayout;
  required?: boolean;
};

export function Field({ className, invalid = false, layout = "stacked", required = false, ...props }: FieldProps) {
  return (
    <div
      {...props}
      className={cx(
        "ui-field",
        `ui-field--${layout}`,
        invalid && "ui-field--invalid",
        required && "ui-field--required",
        className,
      )}
    />
  );
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cx("ui-field__label", className)} />;
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-field__hint", className)} />;
}

export function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-field__error", className)} role="alert" />;
}
