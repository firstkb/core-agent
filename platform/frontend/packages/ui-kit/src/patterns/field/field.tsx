import type { HTMLAttributes, LabelHTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  invalid?: boolean;
};

export function Field({ className, invalid = false, ...props }: FieldProps) {
  return <div {...props} className={cx("ui-field", invalid && "ui-field--invalid", className)} />;
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
