import { useMemo } from "react";

import {
  Combobox,
  ToggleGroup,
  ToggleGroupItem,
} from "@platform/ui-kit";

import {
  getStringValue,
} from "../runtime-form-utils";
import {
  getChoiceOrientation,
  getChoiceOptionStyleClassName,
  getChoiceRenderStyle,
  getComboboxOptions,
} from "./choice-field-utils";
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
  const stringValue = getStringValue(value);
  const comboboxOptions = useMemo(() => getComboboxOptions(field), [field.options]);

  if (getChoiceRenderStyle(field) === "buttons") {
    return (
      <ToggleGroup
        aria-invalid={error ? "true" : undefined}
        aria-labelledby={`${controlId}-label`}
        className="platform-runtime-form__choice-button-group"
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (Array.isArray(nextValue)) {
            return;
          }

          if (!nextValue && !field.choiceAllowEmpty && stringValue) {
            return;
          }

          onFieldChange(field.id, nextValue, field);
        }}
        orientation={getChoiceOrientation(field)}
        type="single"
        value={stringValue}
        variant="outline"
      >
        {(field.options ?? []).map((option) => (
          <ToggleGroupItem
            className={getChoiceOptionStyleClassName(option)}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  return (
    <Combobox
      aria-invalid={error ? "true" : undefined}
      disabled={disabled}
      emptyLabel="No options"
      id={controlId}
      invalid={Boolean(error)}
      label={field.label}
      onValueChange={(nextValue) => onFieldChange(field.id, nextValue ?? "", field)}
      options={comboboxOptions}
      placeholder={field.placeholder ?? labels.selectPlaceholder}
      searchInputAriaLabel={`Search ${field.label}`}
      searchPlaceholder={`Search ${field.label}`}
      selectionMode="single"
      triggerAriaLabel={field.label}
      value={stringValue || null}
    />
  );
}
