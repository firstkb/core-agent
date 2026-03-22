import { createContext, useContext, useMemo } from "react";
import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";
import { Toggle, type ToggleProps, type ToggleSize, type ToggleVariant } from "../toggle";

export type ToggleGroupType = "multiple" | "single";
export type ToggleGroupOrientation = "horizontal" | "vertical";

type ToggleGroupValue = string | string[];

type ToggleGroupContextValue = {
  disabled: boolean;
  onItemPressedChange: (itemValue: string, pressed: boolean) => void;
  orientation: ToggleGroupOrientation;
  size: ToggleSize;
  type: ToggleGroupType;
  value: ToggleGroupValue;
  variant: ToggleVariant;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext() {
  const context = useContext(ToggleGroupContext);

  if (!context) {
    throw new Error("ToggleGroupItem must be rendered inside ToggleGroup.");
  }

  return context;
}

export type ToggleGroupProps = HTMLAttributes<HTMLDivElement> & {
  defaultValue?: ToggleGroupValue;
  disabled?: boolean;
  onValueChange?: (value: ToggleGroupValue) => void;
  orientation?: ToggleGroupOrientation;
  size?: ToggleSize;
  type?: ToggleGroupType;
  value?: ToggleGroupValue;
  variant?: ToggleVariant;
};

export function ToggleGroup({
  children,
  className,
  defaultValue,
  disabled = false,
  onValueChange,
  orientation = "horizontal",
  size = "md",
  type = "single",
  value,
  variant = "default",
  ...props
}: ToggleGroupProps) {
  const [currentValue, setCurrentValue] = useControllableState<ToggleGroupValue>({
    defaultValue: defaultValue ?? (type === "multiple" ? [] : ""),
    onChange: onValueChange,
    value,
  });

  const contextValue = useMemo<ToggleGroupContextValue>(
    () => ({
      disabled,
      onItemPressedChange(itemValue, pressed) {
        if (type === "single") {
          setCurrentValue(pressed ? itemValue : "");
          return;
        }

        setCurrentValue((previousValue) => {
          const nextValues = Array.isArray(previousValue) ? [...previousValue] : [];
          const existingIndex = nextValues.indexOf(itemValue);

          if (pressed && existingIndex === -1) {
            nextValues.push(itemValue);
          }

          if (!pressed && existingIndex >= 0) {
            nextValues.splice(existingIndex, 1);
          }

          return nextValues;
        });
      },
      orientation,
      size,
      type,
      value: currentValue,
      variant,
    }),
    [currentValue, disabled, orientation, setCurrentValue, size, type, variant],
  );

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <div
        {...props}
        className={cx(
          "ui-toggle-group",
          `ui-toggle-group--${orientation}`,
          `ui-toggle-group--${variant}`,
          className,
        )}
        role="group"
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

export type ToggleGroupItemProps = Omit<ToggleProps, "defaultPressed" | "onPressedChange" | "pressed" | "variant" | "size"> & {
  value: string;
};

export function ToggleGroupItem({
  className,
  disabled,
  value,
  ...props
}: ToggleGroupItemProps) {
  const context = useToggleGroupContext();
  const isPressed = Array.isArray(context.value) ? context.value.includes(value) : context.value === value;

  return (
    <Toggle
      {...props}
      className={cx("ui-toggle-group__item", className)}
      disabled={context.disabled || disabled}
      onPressedChange={(pressed) => context.onItemPressedChange(value, pressed)}
      pressed={isPressed}
      size={context.size}
      variant={context.variant}
    />
  );
}
