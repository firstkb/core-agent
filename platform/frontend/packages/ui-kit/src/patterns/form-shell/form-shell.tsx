import type { FormHTMLAttributes, HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export function FormShell({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props} className={cx("ui-form-shell", className)} />;
}

export function FormSection({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={cx("ui-form-section", className)} />;
}

export function FormSectionHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-form-section__header", className)} />;
}

export function FormSectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cx("ui-form-section__title", className)} />;
}

export function FormSectionDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-form-section__description", className)} />;
}

export type FormGridProps = HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2;
};

export function FormGrid({ className, columns = 2, ...props }: FormGridProps) {
  return <div {...props} className={cx("ui-form-grid", `ui-form-grid--${columns}`, className)} />;
}
