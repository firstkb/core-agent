import {
  RadioGroup,
  RadioGroupItem,
} from "@platform/ui-kit";

import {
  getStringValue,
} from "../runtime-form-utils";
import {
  getChoiceOrientation,
} from "./choice-field-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function RadioField({
  controlId,
  disabled,
  error,
  field,
  groupName,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  const stringValue = getStringValue(value);

  return (
    <RadioGroup
      aria-labelledby={`${controlId}-label`}
      className="platform-runtime-form__choice-group"
      orientation={getChoiceOrientation(field)}
    >
      {(field.options ?? []).map((option) => {
        const optionId = `${controlId}-${option.value}`;

        return (
          <label className="platform-runtime-form__choice" htmlFor={optionId} key={option.value}>
            <RadioGroupItem
              checked={stringValue === option.value}
              disabled={disabled}
              id={optionId}
              invalid={Boolean(error)}
              name={groupName}
              onChange={() => onFieldChange(field.id, option.value, field)}
              value={option.value}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
