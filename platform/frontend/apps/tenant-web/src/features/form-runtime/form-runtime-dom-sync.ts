import {
  findRuntimeFormField,
  type RuntimeFormDefinition,
  type RuntimeFormValue,
  type RuntimeFormValues,
} from "@platform/forms";

import {
  runtimeFormValueToDomString,
} from "./form-runtime-value-helpers";

export type RuntimeFormDomControl = {
  dataset?: {
    runtimeFieldId?: string;
  };
  disabled?: boolean;
  readOnly?: boolean;
  value: string;
};

export function collectRuntimeControlValueChanges(
  definition: RuntimeFormDefinition,
  controls: Iterable<RuntimeFormDomControl>,
  currentValues: RuntimeFormValues,
) {
  const changedValues: Record<string, RuntimeFormValue> = {};

  Array.from(controls).forEach((control) => {
    const fieldId = control.dataset?.runtimeFieldId?.trim();
    if (!fieldId || control.disabled || control.readOnly) {
      return;
    }

    const field = findRuntimeFormField(definition, fieldId);
    if (!field || field.disabled || field.readonly) {
      return;
    }

    const nextValue = control.value;
    if (nextValue !== runtimeFormValueToDomString(currentValues[fieldId])) {
      changedValues[fieldId] = nextValue;
    }
  });

  return changedValues;
}
