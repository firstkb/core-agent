import type { Ref } from "react";

export function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

export function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    refs.forEach((ref) => assignRef(ref, value));
  };
}

type EventLike = {
  defaultPrevented?: boolean;
};

export function composeEventHandlers<E extends EventLike>(
  theirHandler?: (event: E) => void,
  ourHandler?: (event: E) => void,
) {
  return (event: E) => {
    theirHandler?.(event);

    if (!event.defaultPrevented) {
      ourHandler?.(event);
    }
  };
}
