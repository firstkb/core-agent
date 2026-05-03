import type { ChangeEvent } from "react";

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
  return (
    <Input
      aria-invalid={error ? "true" : undefined}
      disabled={disabled}
      id={controlId}
      invalid={Boolean(error)}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onFieldChange(field.id, event.currentTarget.value, field)}
      placeholder={field.placeholder}
      step={getInputStep(field.type)}
      type={getInputType(field.type)}
      value={getStringValue(value)}
    />
  );
}
