import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

type UseControllableStateProps<T> = {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
};

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateProps<T>): [T, Dispatch<SetStateAction<T>>] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (nextValue) => {
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (previousValue: T) => T)(currentValue)
          : nextValue;

      if (!isControlled) {
        setInternalValue(resolvedValue);
      }

      if (!Object.is(resolvedValue, currentValue)) {
        onChange?.(resolvedValue);
      }
    },
    [currentValue, isControlled, onChange],
  );

  return [currentValue, setValue];
}
