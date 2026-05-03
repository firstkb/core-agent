import type {
  RuntimeFormDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormLabels,
  RuntimeFormNodeDefinition,
  RuntimeFormResolvedLabels,
  RuntimeFormValidationErrors,
  RuntimeFormValues,
} from "./runtime-form-types";
import {
  isRuntimeTextMaskComplete,
} from "./runtime-form-input-mask";
import { resolveRuntimeFormLabels } from "./runtime-form-labels";
import {
  isRuntimeFieldRequired,
  isRuntimeNodeVisible,
} from "./runtime-form-rules";
import {
  findRuntimeFormField,
  getRuntimeLayoutChildNodes,
  isRuntimeFormFieldNode,
  isRuntimeFormValueEmpty,
  isRuntimeFormLayoutNode,
  resolveRuntimeSectionNodes,
} from "./runtime-form-utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{7,15}$/;

function getRuntimeTextValidation(field: RuntimeFormFieldDefinition) {
  if (field.validation) {
    return field.validation;
  }

  if (field.inputType === "email" || field.inputType === "url") {
    return field.inputType;
  }

  if (field.inputType === "tel") {
    return "phone";
  }

  return undefined;
}

function validateRuntimeTextField(
  field: RuntimeFormFieldDefinition,
  values: RuntimeFormValues,
  labels: RuntimeFormResolvedLabels,
) {
  if (field.type !== "short_text") {
    return undefined;
  }

  const value = values[field.id];
  if (typeof value !== "string") {
    return undefined;
  }

  const textValue = value.trim();
  if (!textValue) {
    return undefined;
  }

  if (!isRuntimeTextMaskComplete(textValue, field.mask)) {
    return labels.invalidMaskError;
  }

  switch (getRuntimeTextValidation(field)) {
    case "email":
      return emailPattern.test(textValue) ? undefined : labels.invalidEmailError;
    case "phone": {
      const digits = textValue.replace(/\D/g, "");
      return phonePattern.test(digits) ? undefined : labels.invalidPhoneError;
    }
    case "url": {
      try {
        const url = new URL(textValue);
        return url.protocol === "http:" || url.protocol === "https:" ? undefined : labels.invalidUrlError;
      } catch {
        return labels.invalidUrlError;
      }
    }
    default:
      return undefined;
  }
}

function validateRuntimeFormNodes(
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>,
  values: RuntimeFormValues,
  errors: RuntimeFormValidationErrors,
  labels: RuntimeFormResolvedLabels,
) {
  for (const node of nodes) {
    if (!isRuntimeNodeVisible(node, values)) {
      continue;
    }

    if (isRuntimeFormFieldNode(node)) {
      const required = isRuntimeFieldRequired(node, values, node.required);
      if (node.readonly || node.disabled) {
        continue;
      }

      if (required && isRuntimeFormValueEmpty(values[node.id])) {
        errors[node.id] = labels.requiredError;
        continue;
      }

      const inputError = validateRuntimeTextField(node, values, labels);
      if (inputError) {
        errors[node.id] = inputError;
      }
      continue;
    }

    if (isRuntimeFormLayoutNode(node)) {
      validateRuntimeFormNodes(getRuntimeLayoutChildNodes(node), values, errors, labels);
    }
  }
}

export function validateRuntimeForm(
  definition: RuntimeFormDefinition,
  values: RuntimeFormValues,
  labels?: RuntimeFormLabels,
): RuntimeFormValidationErrors {
  const resolvedLabels = resolveRuntimeFormLabels(labels);
  const errors: RuntimeFormValidationErrors = {};

  for (const section of definition.sections) {
    validateRuntimeFormNodes(resolveRuntimeSectionNodes(section), values, errors, resolvedLabels);
  }

  return errors;
}

export function applyRuntimeWorkflowStatus(
  definition: RuntimeFormDefinition,
  values: RuntimeFormValues,
  target: "initial" | "final",
): RuntimeFormValues {
  const binding = definition.workflowStatus;
  if (!binding?.fieldId) {
    return values;
  }

  const statusValue = target === "initial" ? binding.initialValue : binding.finalValue;
  const statusField = findRuntimeFormField(definition, binding.fieldId);
  if (!statusValue || !statusField) {
    return values;
  }

  if (statusField.options?.length && !statusField.options.some((option) => option.value === statusValue)) {
    return values;
  }

  return {
    ...values,
    [binding.fieldId]: statusValue,
  };
}

export {
  findRuntimeFormField,
  isRuntimeFormValueEmpty,
} from "./runtime-form-utils";
