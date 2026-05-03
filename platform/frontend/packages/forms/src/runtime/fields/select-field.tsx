import type { ChangeEvent } from "react";

import {
  Select,
} from "@platform/ui-kit";

import {
  getStringValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function SelectField({
  controlId,
  disabled,
  error,
  field,
  labels,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  return (
    <Select
      aria-invalid={error ? "true" : undefined}
      disabled={disabled}
      id={controlId}
      invalid={Boolean(error)}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onFieldChange(field.id, event.currentTarget.value, field)}
      value={getStringValue(value)}
    >
      <option value="">{field.placeholder ?? labels.selectPlaceholder}</option>
      {(field.options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
