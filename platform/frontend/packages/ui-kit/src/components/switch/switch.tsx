import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cx } from "../../lib/cx";
import { composeEventHandlers } from "../../lib/refs";
import { useControllableState } from "../../lib/use-controllable-state";

export type SwitchShape = "pill" | "square";
export type SwitchSize = "sm" | "md" | "lg";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  shape?: SwitchShape;
  size?: SwitchSize;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked,
    className,
    defaultChecked = false,
    disabled = false,
    onCheckedChange,
    onClick,
    shape = "pill",
    size = "md",
    type = "button",
    ...props
  },
  ref,
) {
    const [isChecked, setIsChecked] = useControllableState({
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
      value: checked,
    });

    return (
      <button
        {...props}
        aria-checked={isChecked}
        className={cx(
          "ui-switch",
          `ui-switch--${shape}`,
          `ui-switch--${size}`,
          isChecked && "ui-switch--checked",
          className,
        )}
        disabled={disabled}
        onClick={composeEventHandlers(onClick, () => setIsChecked((currentValue) => !currentValue))}
        ref={ref}
        role="switch"
        type={type}
      >
        <span aria-hidden="true" className="ui-switch__thumb" />
      </button>
    );
  });
