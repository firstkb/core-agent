import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";
import { composeEventHandlers } from "../../lib/refs";
import { useControllableState } from "../../lib/use-controllable-state";

export type ToggleVariant = "default" | "outline";
export type ToggleSize = "sm" | "md" | "lg";

export type ToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  defaultPressed?: boolean;
  leadingIcon?: ReactNode;
  onPressedChange?: (pressed: boolean) => void;
  pressed?: boolean;
  size?: ToggleSize;
  trailingIcon?: ReactNode;
  variant?: ToggleVariant;
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    children,
    className,
    defaultPressed = false,
    disabled = false,
    leadingIcon,
    onClick,
    onPressedChange,
    pressed,
    size = "md",
    trailingIcon,
    type = "button",
    variant = "default",
    ...props
  },
  ref,
) {
  const [isPressed, setIsPressed] = useControllableState({
    defaultValue: defaultPressed,
    onChange: onPressedChange,
    value: pressed,
  });

  return (
    <button
      {...props}
      ref={ref}
      aria-pressed={isPressed}
      className={cx(
        "ui-toggle",
        `ui-toggle--${variant}`,
        `ui-toggle--${size}`,
        isPressed && "ui-toggle--pressed",
        className,
      )}
      disabled={disabled}
      onClick={composeEventHandlers(onClick, () => setIsPressed((currentValue) => !currentValue))}
      type={type}
    >
      {leadingIcon ? <span className="ui-toggle__icon">{leadingIcon}</span> : null}
      {children ? <span>{children}</span> : null}
      {trailingIcon ? <span className="ui-toggle__icon">{trailingIcon}</span> : null}
    </button>
  );
});
