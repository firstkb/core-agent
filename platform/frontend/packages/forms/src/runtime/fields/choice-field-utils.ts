import type {
  ComboboxOption,
} from "@platform/ui-kit";

import type {
  RuntimeFormChoiceOrientation,
  RuntimeFormFieldDefinition,
  RuntimeFormFieldOption,
} from "../runtime-form-types";

export function getChoiceOrientation(field: RuntimeFormFieldDefinition): RuntimeFormChoiceOrientation {
  if (field.choiceOrientation) {
    return field.choiceOrientation;
  }

  if (field.choiceLayout === "inline") {
    return "horizontal";
  }

  return "vertical";
}

export function getChoiceRenderStyle(field: RuntimeFormFieldDefinition) {
  return field.choiceRenderStyle ?? "native";
}

export function getComboboxOptions(field: RuntimeFormFieldDefinition): ComboboxOption[] {
  return (field.options ?? []).map((option) => ({
    description: option.description,
    label: option.label,
    searchText: `${option.label} ${option.description ?? ""} ${option.value}`,
    value: option.value,
  }));
}

export function getChoiceOptionStyleClassName(option: RuntimeFormFieldOption) {
  return option.styleVariant && option.styleVariant !== "default"
    ? `platform-runtime-form__choice-button--${option.styleVariant}`
    : undefined;
}
