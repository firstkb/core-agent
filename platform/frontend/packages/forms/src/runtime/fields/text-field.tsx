import type { ChangeEvent } from "react";

import {
  Textarea,
} from "@platform/ui-kit";

import {
  getStringValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function LongTextField({
  controlId,
  disabled,
  error,
  field,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  return (
    <Textarea
      aria-invalid={error ? "true" : undefined}
      disabled={disabled}
      id={controlId}
      invalid={Boolean(error)}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onFieldChange(field.id, event.currentTarget.value, field)}
      placeholder={field.placeholder}
      rows={field.rows}
      value={getStringValue(value)}
    />
  );
}
