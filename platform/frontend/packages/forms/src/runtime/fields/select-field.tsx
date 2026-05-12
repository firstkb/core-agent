import { useMemo } from "react";

import {
  Combobox,
  ToggleGroup,
  ToggleGroupItem,
} from "@platform/ui-kit";

import {
  cx,
  getStringValue,
} from "../runtime-form-utils";
import {
  getChoiceOrientation,
  getChoiceOptionStyleClassName,
  getChoiceRenderStyle,
  getComboboxOptions,
} from "./choice-field-utils";
import type { RuntimeFieldControlProps } from "./field-types";
import { LookupField } from "./lookup-field";

export function SelectField({
  controlId,
  disabled,
  error,
  field,
  groupName,
  labels,
  loadLookupOptions,
  onFieldChange,
  required,
  value,
}: RuntimeFieldControlProps) {
  const stringValue = getStringValue(value);
  const comboboxOptions = useMemo(() => getComboboxOptions(field), [field.options]);
  const choiceOrientation = getChoiceOrientation(field);

  if (field.lookup) {
    return <LookupField
      controlId={controlId}
      disabled={disabled}
      error={error}
      field={field}
      groupName={groupName}
      labels={labels}
      loadLookupOptions={loadLookupOptions}
      onFieldChange={onFieldChange}
      required={required}
      value={value}
    />;
  }

  if (getChoiceRenderStyle(field) === "buttons") {
    return (
      <ToggleGroup
        aria-invalid={error ? "true" : undefined}
        aria-labelledby={`${controlId}-label`}
        className={cx(
          "platform-runtime-form__choice-button-group",
          choiceOrientation === "horizontal" && "platform-runtime-form__choice-button-group--segmented-horizontal",
        )}
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
        orientation={choiceOrientation}
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
      emptyLabel={labels.noOptions}
      id={controlId}
      invalid={Boolean(error)}
      label={field.label}
      onValueChange={(nextValue) => onFieldChange(field.id, nextValue ?? "", field)}
      options={comboboxOptions}
      placeholder={field.placeholder ?? labels.selectPlaceholder}
      searchInputAriaLabel={`${labels.search} ${field.label}`}
      searchPlaceholder={`${labels.search} ${field.label}`}
      selectionMode="single"
      triggerAriaLabel={field.label}
      value={stringValue || null}
    />
  );
}
