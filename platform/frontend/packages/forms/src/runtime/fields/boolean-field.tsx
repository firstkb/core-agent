import type { ChangeEvent } from "react";

import {
  Checkbox,
} from "@platform/ui-kit";

import {
  getBooleanValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function BooleanField({
  controlId,
  disabled,
  field,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  return (
    <label className="platform-runtime-form__boolean-control" htmlFor={controlId}>
      <Checkbox
        checked={getBooleanValue(value)}
        disabled={disabled}
        id={controlId}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onFieldChange(field.id, event.currentTarget.checked, field)}
      />
      <span>{field.placeholder ?? field.label}</span>
    </label>
  );
}
