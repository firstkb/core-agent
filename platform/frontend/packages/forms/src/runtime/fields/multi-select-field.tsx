import type { ChangeEvent } from "react";

import {
  Checkbox,
} from "@platform/ui-kit";

import {
  getArrayValue,
  toggleMultiSelectValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function MultiSelectField({
  controlId,
  disabled,
  field,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  const selectedValues = getArrayValue(value);

  return (
    <div className="platform-runtime-form__choice-group" role="group" aria-labelledby={`${controlId}-label`}>
      {(field.options ?? []).map((option) => {
        const optionId = `${controlId}-${option.value}`;

        return (
          <label className="platform-runtime-form__choice" htmlFor={optionId} key={option.value}>
            <Checkbox
              checked={selectedValues.includes(option.value)}
              disabled={disabled}
              id={optionId}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onFieldChange(
                  field.id,
                  toggleMultiSelectValue(value, option.value, event.currentTarget.checked),
                  field,
                );
              }}
              value={option.value}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
