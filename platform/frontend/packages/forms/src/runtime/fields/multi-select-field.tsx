import { useMemo } from "react";

import {
  Combobox,
  ToggleGroup,
  ToggleGroupItem,
} from "@platform/ui-kit";

import {
  getArrayValue,
} from "../runtime-form-utils";
import {
  getChoiceOrientation,
  getChoiceRenderStyle,
  getComboboxOptions,
} from "./choice-field-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function MultiSelectField({
  controlId,
  disabled,
  error,
  field,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  const selectedValues = getArrayValue(value);
  const comboboxOptions = useMemo(() => getComboboxOptions(field), [field.options]);

  if (getChoiceRenderStyle(field) === "buttons") {
    return (
      <ToggleGroup
        aria-invalid={error ? "true" : undefined}
        aria-labelledby={`${controlId}-label`}
        className="platform-runtime-form__choice-button-group"
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (!Array.isArray(nextValue)) {
            return;
          }

          onFieldChange(field.id, nextValue, field);
        }}
        orientation={getChoiceOrientation(field)}
        type="multiple"
        value={[...selectedValues]}
        variant="outline"
      >
        {(field.options ?? []).map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
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
      onValueChange={(nextValues) => onFieldChange(field.id, nextValues, field)}
      options={comboboxOptions}
      placeholder={field.placeholder ?? "Select values"}
      searchInputAriaLabel={`Search ${field.label}`}
      searchPlaceholder={`Search ${field.label}`}
      selectionMode="multiple"
      triggerAriaLabel={field.label}
      value={selectedValues}
    />
  );
}
