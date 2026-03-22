import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "info" | "success" | "warning" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  pending?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

/**
 * Product-owned button foundation extracted from Metronic design ideas,
 * but rewritten against local tokens and a stable API.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    variant = "primary",
    size = "md",
    block = false,
    pending = false,
    disabled,
    leadingIcon,
    trailingIcon,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cx(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        block && "ui-button--block",
        className,
      )}
    >
      {pending ? <span aria-hidden="true" className="ui-button__spinner" /> : null}
      {!pending && leadingIcon ? <span className="ui-button__icon">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="ui-button__icon">{trailingIcon}</span> : null}
    </button>
  );
});
