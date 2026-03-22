import {
  useMemo,
  useRef,
  type ClipboardEvent,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";

export type InputOtpKind = "numeric" | "alphanumeric";

export type InputOtpProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  autoFocus?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  inputMode?: "numeric" | "text";
  invalid?: boolean;
  kind?: InputOtpKind;
  length?: number;
  name?: string;
  onValueChange?: (value: string) => void;
  separatorAfter?: readonly number[];
  value?: string;
};

function sanitizeValue(value: string, kind: InputOtpKind) {
  const normalized = kind === "numeric"
    ? value.replace(/\D+/g, "")
    : value.replace(/[^a-z0-9]/gi, "").toUpperCase();

  return normalized;
}

export function InputOtp({
  autoFocus = false,
  className,
  defaultValue = "",
  disabled = false,
  id,
  inputMode,
  invalid = false,
  kind = "numeric",
  length = 6,
  name,
  onValueChange,
  separatorAfter = [],
  value,
  ...props
}: InputOtpProps) {
  const [currentValue, setCurrentValue] = useControllableState({
    defaultValue: sanitizeValue(defaultValue, kind).slice(0, length),
    onChange: onValueChange,
    value: value === undefined ? undefined : sanitizeValue(value, kind).slice(0, length),
  });
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const slots = useMemo(
    () => Array.from({ length }, (_, index) => currentValue[index] ?? ""),
    [currentValue, length],
  );
  const effectiveInputMode = inputMode ?? (kind === "numeric" ? "numeric" : "text");
  const separatorSet = useMemo(() => new Set(separatorAfter), [separatorAfter]);

  function focusSlot(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function applyCharacters(startIndex: number, rawValue: string) {
    const nextChars = sanitizeValue(rawValue, kind);

    if (!nextChars) {
      const nextValue =
        currentValue.slice(0, startIndex) + currentValue.slice(Math.min(startIndex + 1, currentValue.length));
      setCurrentValue(nextValue.slice(0, length));
      return;
    }

    const characters = slots.slice();
    let cursor = startIndex;

    for (const character of nextChars) {
      if (cursor >= length) {
        break;
      }

      characters[cursor] = character;
      cursor += 1;
    }

    setCurrentValue(characters.join("").slice(0, length));

    const focusIndex = Math.min(cursor, length - 1);
    queueMicrotask(() => {
      focusSlot(focusIndex);
    });
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusSlot(Math.max(index - 1, 0));
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusSlot(Math.min(index + 1, length - 1));
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();

      if (slots[index]) {
        const nextSlots = slots.slice();
        nextSlots[index] = "";
        setCurrentValue(nextSlots.join("").slice(0, length));
        return;
      }

      const previousIndex = Math.max(index - 1, 0);
      if (previousIndex !== index) {
        const nextSlots = slots.slice();
        nextSlots[previousIndex] = "";
        setCurrentValue(nextSlots.join("").slice(0, length));
        queueMicrotask(() => {
          focusSlot(previousIndex);
        });
      }
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pastedValue = event.clipboardData.getData("text");

    if (!pastedValue) {
      return;
    }

    event.preventDefault();
    applyCharacters(index, pastedValue);
  }

  return (
    <div
      {...props}
      className={cx(
        "ui-input-otp",
        disabled && "ui-input-otp--disabled",
        invalid && "ui-input-otp--invalid",
        className,
      )}
      id={id}
    >
      {name ? <input name={name} readOnly type="hidden" value={currentValue} /> : null}
      {slots.map((slotValue, index) => (
        <div className="ui-input-otp__slot-shell" key={`otp-slot-${index}`}>
          <input
            aria-invalid={invalid || undefined}
            aria-label={`Verification code character ${index + 1}`}
            autoComplete={kind === "numeric" ? "one-time-code" : "off"}
            autoFocus={autoFocus && index === 0}
            className={cx("ui-input-otp__slot", slotValue && "ui-input-otp__slot--filled")}
            disabled={disabled}
            id={id ? `${id}-slot-${index + 1}` : undefined}
            inputMode={effectiveInputMode}
            maxLength={1}
            name={name ? `${name}-slot-${index + 1}` : undefined}
            onChange={(event) => applyCharacters(index, event.currentTarget.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            pattern={kind === "numeric" ? "[0-9]*" : undefined}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            value={slotValue}
          />
          {separatorSet.has(index + 1) && index < length - 1 ? (
            <span aria-hidden="true" className="ui-input-otp__separator">
              -
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
