import type {
  RuntimeFormDefinition,
  RuntimeFormLabels,
  RuntimeFormNodeDefinition,
  RuntimeFormValidationErrors,
  RuntimeFormValues,
} from "./runtime-form-types";
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

function validateRuntimeFormNodes(
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>,
  values: RuntimeFormValues,
  errors: RuntimeFormValidationErrors,
  requiredError: string,
) {
  for (const node of nodes) {
    if (!isRuntimeNodeVisible(node, values)) {
      continue;
    }

    if (isRuntimeFormFieldNode(node)) {
      const required = isRuntimeFieldRequired(node, values, node.required);
      if (!required || node.readonly || node.disabled) {
        continue;
      }

      if (isRuntimeFormValueEmpty(values[node.id])) {
        errors[node.id] = requiredError;
      }
      continue;
    }

    if (isRuntimeFormLayoutNode(node)) {
      validateRuntimeFormNodes(getRuntimeLayoutChildNodes(node), values, errors, requiredError);
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
    validateRuntimeFormNodes(resolveRuntimeSectionNodes(section), values, errors, resolvedLabels.requiredError);
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
