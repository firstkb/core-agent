import type { ChangeEvent, FocusEvent } from "react";
import { useEffect, useState } from "react";

import {
  Input,
} from "@platform/ui-kit";

import {
  applyRuntimeTextMask,
  hasRuntimeTextMask,
} from "../runtime-form-input-mask";
import {
  getStringValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

function getInputType(fieldType: RuntimeFieldControlProps["field"]["type"]) {
  if (fieldType === "date") {
    return "date";
  }

  if (fieldType === "date_time") {
    return "datetime-local";
  }

  if (fieldType === "integer" || fieldType === "decimal" || fieldType === "currency") {
    return "number";
  }

  return "text";
}

function getTextInputType(field: RuntimeFieldControlProps["field"]) {
  if (field.type === "short_text" && field.inputType) {
    return field.inputType;
  }

  return getInputType(field.type);
}

function getInputStep(fieldType: RuntimeFieldControlProps["field"]["type"]) {
  if (fieldType === "integer") {
    return "1";
  }

  if (fieldType === "decimal" || fieldType === "currency") {
    return "0.01";
  }

  return undefined;
}

function formatInputValue(value: string, field: RuntimeFieldControlProps["field"]) {
  if (field.type !== "short_text") {
    return value;
  }

  return applyRuntimeTextMask(value, field.mask);
}

export function InputField({
  controlId,
  disabled,
  error,
  field,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  const externalValue = getStringValue(value);
  const displayedExternalValue = formatInputValue(externalValue, field);
  const [draftValue, setDraftValue] = useState(displayedExternalValue);

  useEffect(() => {
    setDraftValue(displayedExternalValue);
  }, [displayedExternalValue]);

  function commitDraft(event: FocusEvent<HTMLInputElement>) {
    const nextValue = formatInputValue(event.currentTarget.value, field);
    if (nextValue !== displayedExternalValue) {
      onFieldChange(field.id, nextValue, field);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraftValue(formatInputValue(event.currentTarget.value, field));
  }

  return (
    <Input
      aria-invalid={error ? "true" : undefined}
      autoComplete={field.autocomplete}
      disabled={disabled}
      id={controlId}
      inputMode={field.inputMode}
      invalid={Boolean(error)}
      maxLength={hasRuntimeTextMask(field.mask) ? field.mask?.trim().length : undefined}
      onBlur={commitDraft}
      onChange={handleChange}
      placeholder={field.placeholder}
      step={getInputStep(field.type)}
      type={getTextInputType(field)}
      value={draftValue}
    />
  );
}
