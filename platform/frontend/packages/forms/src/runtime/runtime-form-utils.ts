import type {
  RuntimeFormContentDefinition,
  RuntimeFormDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormLayoutDefinition,
  RuntimeFormNodeDefinition,
  RuntimeFormSectionDefinition,
  RuntimeFormValue,
} from "./runtime-form-types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function isRuntimeFormStringArray(value: RuntimeFormValue | undefined): value is ReadonlyArray<string> {
  return Array.isArray(value);
}

export function isRuntimeFormValueEmpty(value: RuntimeFormValue | undefined) {
  if (isRuntimeFormStringArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "boolean") {
    return false;
  }

  return !value?.trim();
}

export function isRuntimeFormFieldNode(node: RuntimeFormNodeDefinition): node is RuntimeFormFieldDefinition {
  return node.nodeType === undefined || node.nodeType === "field";
}

export function isRuntimeFormContentNode(node: RuntimeFormNodeDefinition): node is RuntimeFormContentDefinition {
  return node.nodeType === "content";
}

export function isRuntimeFormLayoutNode(node: RuntimeFormNodeDefinition): node is RuntimeFormLayoutDefinition {
  return node.nodeType === "layout";
}

export function resolveRuntimeSectionNodes(section: RuntimeFormSectionDefinition): ReadonlyArray<RuntimeFormNodeDefinition> {
  return section.nodes ?? section.fields ?? [];
}

export function getStringValue(value: RuntimeFormValue | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return "";
}

export function getArrayValue(value: RuntimeFormValue | undefined) {
  return isRuntimeFormStringArray(value) ? value : [];
}

export function getBooleanValue(value: RuntimeFormValue | undefined) {
  return typeof value === "boolean" ? value : false;
}

export function getOptionLabel(field: RuntimeFormFieldDefinition, value: string) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function formatUsDateParts(year: string, month: string, day: string) {
  return `${month}/${day}/${year}`;
}

function formatUsTimeParts(hourValue: string | undefined, minute: string | undefined) {
  if (!hourValue || !minute) {
    return "";
  }

  const hour24 = Number(hourValue);
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) {
    return "";
  }

  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

function formatUsDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return value;
  }

  return formatUsDateParts(match[1], match[2], match[3]);
}

function formatUsDateTimeValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(value.trim());
  if (!match) {
    return value;
  }

  const date = formatUsDateParts(match[1], match[2], match[3]);
  const time = formatUsTimeParts(match[4], match[5]);
  return time ? `${date} ${time}` : date;
}

export function formatReadonlyValue(field: RuntimeFormFieldDefinition, value: RuntimeFormValue | undefined) {
  if (isRuntimeFormStringArray(value)) {
    return value.length > 0 ? value.map((item) => getOptionLabel(field, item)).join(", ") : "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (!value?.trim()) {
    return "-";
  }

  if (field.type === "date") {
    return formatUsDateValue(value);
  }

  if (field.type === "date_time") {
    return formatUsDateTimeValue(value);
  }

  if (field.options?.length) {
    return getOptionLabel(field, value);
  }

  return value;
}

export function toggleMultiSelectValue(
  currentValue: RuntimeFormValue | undefined,
  optionValue: string,
  checked: boolean,
) {
  const currentValues = getArrayValue(currentValue);
  if (checked) {
    return currentValues.includes(optionValue)
      ? currentValues
      : [...currentValues, optionValue];
  }

  return currentValues.filter((value) => value !== optionValue);
}

export function getRuntimeLayoutChildNodes(layout: RuntimeFormLayoutDefinition): ReadonlyArray<RuntimeFormNodeDefinition> {
  if (layout.layoutType === "group" || layout.layoutType === "grid") {
    return layout.nodes;
  }

  if (layout.layoutType === "tabs") {
    return layout.tabs.flatMap((tab) => tab.nodes);
  }

  if (layout.layoutType === "accordion") {
    return layout.items.flatMap((item) => item.nodes);
  }

  return [];
}

function findRuntimeFormFieldInNodes(
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>,
  fieldId: string,
): RuntimeFormFieldDefinition | null {
  for (const node of nodes) {
    if (isRuntimeFormFieldNode(node) && node.id === fieldId) {
      return node;
    }

    if (isRuntimeFormLayoutNode(node)) {
      const childField = findRuntimeFormFieldInNodes(getRuntimeLayoutChildNodes(node), fieldId);
      if (childField) {
        return childField;
      }
    }
  }

  return null;
}

export function findRuntimeFormField(definition: RuntimeFormDefinition, fieldId: string) {
  for (const section of definition.sections) {
    const field = findRuntimeFormFieldInNodes(resolveRuntimeSectionNodes(section), fieldId);
    if (field) {
      return field;
    }
  }

  return null;
}

export function walkRuntimeFormFields(
  definition: RuntimeFormDefinition,
  visit: (field: RuntimeFormFieldDefinition) => void,
) {
  function walkNodes(nodes: ReadonlyArray<RuntimeFormNodeDefinition>) {
    for (const node of nodes) {
      if (isRuntimeFormFieldNode(node)) {
        visit(node);
        continue;
      }

      if (isRuntimeFormLayoutNode(node)) {
        walkNodes(getRuntimeLayoutChildNodes(node));
      }
    }
  }

  for (const section of definition.sections) {
    walkNodes(resolveRuntimeSectionNodes(section));
  }
}
