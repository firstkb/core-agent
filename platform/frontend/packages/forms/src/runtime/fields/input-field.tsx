import type { ChangeEvent, FocusEvent } from "react";
import { useEffect, useState } from "react";

import {
  Input,
} from "@platform/ui-kit";

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

function getInputStep(fieldType: RuntimeFieldControlProps["field"]["type"]) {
  if (fieldType === "integer") {
    return "1";
  }

  if (fieldType === "decimal" || fieldType === "currency") {
    return "0.01";
  }

  return undefined;
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
  const [draftValue, setDraftValue] = useState(externalValue);

  useEffect(() => {
    setDraftValue(externalValue);
  }, [externalValue]);

  function commitDraft(event: FocusEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value;
    if (nextValue !== externalValue) {
      onFieldChange(field.id, nextValue, field);
    }
  }

  return (
    <Input
      aria-invalid={error ? "true" : undefined}
      disabled={disabled}
      id={controlId}
      invalid={Boolean(error)}
      onBlur={commitDraft}
      onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftValue(event.currentTarget.value)}
      placeholder={field.placeholder}
      step={getInputStep(field.type)}
      type={getInputType(field.type)}
      value={draftValue}
    />
  );
}
