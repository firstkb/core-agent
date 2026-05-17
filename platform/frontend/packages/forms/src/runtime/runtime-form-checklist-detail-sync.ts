import type {
  RuntimeFormChecklistItemChange,
  RuntimeFormValues,
} from "./runtime-form-types";
import {
  getStringValue,
} from "./runtime-form-utils";

export type RuntimeChecklistDetailControl = {
  dataset?: {
    runtimeFieldId?: string;
  };
  disabled?: boolean;
  readOnly?: boolean;
  value: string;
};

export function collectRuntimeChecklistDetailChanges(
  controls: Iterable<RuntimeChecklistDetailControl>,
  currentValues: RuntimeFormValues,
  notesFieldId?: string,
): RuntimeFormChecklistItemChange {
  const values: RuntimeFormValues = {};
  let notes: string | undefined;

  Array.from(controls).forEach((control) => {
    const fieldId = control.dataset?.runtimeFieldId?.trim();
    if (!fieldId || control.disabled || control.readOnly) {
      return;
    }

    const nextValue = control.value;
    if (nextValue === getStringValue(currentValues[fieldId])) {
      return;
    }

    values[fieldId] = nextValue;
    if (fieldId === notesFieldId) {
      notes = nextValue;
    }
  });

  const change: RuntimeFormChecklistItemChange = {};
  if (Object.keys(values).length > 0) {
    change.values = values;
  }
  if (notes !== undefined) {
    change.notes = notes;
  }
  return change;
}

export function hasRuntimeChecklistDetailChanges(change: RuntimeFormChecklistItemChange) {
  return change.notes !== undefined || Object.keys(change.values ?? {}).length > 0;
}
