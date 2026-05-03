import type {
  ComboboxOption,
} from "@platform/ui-kit";

import type {
  RuntimeFormChoiceOrientation,
  RuntimeFormFieldDefinition,
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
    label: option.label,
    searchText: `${option.label} ${option.value}`,
    value: option.value,
  }));
}
