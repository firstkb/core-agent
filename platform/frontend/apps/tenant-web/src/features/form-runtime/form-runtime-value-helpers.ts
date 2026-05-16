import {
  findRuntimeFormField,
  type RuntimeFormDefinition,
  type RuntimeFormFieldType,
  type RuntimeFormValue,
  type RuntimeFormValues,
} from "@platform/forms";

export function coerceRuntimeFormValue(
  fieldType: RuntimeFormFieldType,
  value: unknown,
): RuntimeFormValue | undefined {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === "string");
    return items;
  }

  if (fieldType === "boolean") {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      return value.trim().toLowerCase() === "true";
    }
  }

  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

export function coerceRuntimeFormValues(
  definition: RuntimeFormDefinition,
  rawValues: Record<string, unknown> | undefined,
) {
  const values: RuntimeFormValues = {};
  if (!rawValues) {
    return values;
  }

  Object.entries(rawValues).forEach(([fieldId, value]) => {
    const field = findRuntimeFormField(definition, fieldId);
    if (!field) {
      return;
    }
    const coerced = coerceRuntimeFormValue(field.type, value);
    if (coerced !== undefined) {
      values[fieldId] = coerced;
    }
  });
  return values;
}

export function isEmptyRuntimeFormValue(value: RuntimeFormValue | undefined) {
  return value === undefined
    || value === ""
    || (Array.isArray(value) && value.length === 0);
}

export function serializeRuntimeFormValues(values: RuntimeFormValues) {
  const out: Record<string, unknown> = {};
  Object.entries(values).forEach(([fieldId, value]) => {
    if (value !== undefined) {
      out[fieldId] = value;
    }
  });
  return out;
}

export function coerceLooseRuntimeValues(rawValues: Record<string, unknown> | undefined): RuntimeFormValues | undefined {
  if (!rawValues) {
    return undefined;
  }
  const values: RuntimeFormValues = {};
  Object.entries(rawValues).forEach(([fieldId, value]) => {
    if (typeof value === "string" || typeof value === "boolean") {
      values[fieldId] = value;
      return;
    }
    if (typeof value === "number") {
      values[fieldId] = String(value);
      return;
    }
    if (Array.isArray(value)) {
      values[fieldId] = value.map((item) => String(item));
    }
  });
  return values;
}

export function mergeServerValues(
  currentValues: RuntimeFormValues,
  serverValues: RuntimeFormValues,
  serverWins: boolean,
) {
  const nextValues: RuntimeFormValues = {
    ...currentValues,
  };

  Object.entries(serverValues).forEach(([fieldId, value]) => {
    if (serverWins || isEmptyRuntimeFormValue(nextValues[fieldId])) {
      nextValues[fieldId] = value;
    }
  });
  return nextValues;
}

export function hasUserEnteredCreateValues(values: RuntimeFormValues, initialValues: RuntimeFormValues) {
  return Object.entries(values).some(([fieldId, value]) => {
    const initialValue = initialValues[fieldId];
    if (Array.isArray(value) || Array.isArray(initialValue)) {
      return JSON.stringify(value ?? []) !== JSON.stringify(initialValue ?? []);
    }
    return value !== initialValue && !isEmptyRuntimeFormValue(value);
  });
}

export function runtimeFormValueToDomString(value: RuntimeFormValue | undefined) {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.join(",");
  }
  return "";
}
