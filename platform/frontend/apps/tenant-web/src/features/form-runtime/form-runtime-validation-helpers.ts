import {
  findRuntimeFormField,
  type RuntimeFormDefinition,
  type RuntimeFormLabels,
  type RuntimeFormValidationErrors,
} from "@platform/forms";

import type { FormRuntimeRecordValidationError } from "./form-runtime-collection-table-client";

export function hasRuntimeValidationErrors(errors: RuntimeFormValidationErrors) {
  return Object.values(errors).some(Boolean);
}

export function inputValidationErrorsOnly(errors: RuntimeFormValidationErrors, requiredError: string) {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message && message !== requiredError),
  );
}

export function findFirstValidationError(
  definition: RuntimeFormDefinition,
  errors: RuntimeFormValidationErrors,
) {
  const fieldId = Object.keys(errors).find((candidateFieldId) => errors[candidateFieldId]);
  const field = fieldId ? findRuntimeFormField(definition, fieldId) : null;
  return {
    fieldId,
    label: field?.label ?? "this field",
    message: fieldId ? errors[fieldId] : undefined,
  };
}

export function translatedTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{{${key}}}`, value),
    template,
  );
}

export function runtimeClientValidationDialogMessage(
  error: ReturnType<typeof findFirstValidationError>,
  labels: RuntimeFormLabels & {
    requiredError: string;
    validationFillField: string;
    validationFillFieldCorrectly: string;
  },
) {
  const fieldLabel = String(error.label);
  if (error.message === labels.requiredError) {
    return translatedTemplate(labels.validationFillField, { field: fieldLabel });
  }

  return translatedTemplate(labels.validationFillFieldCorrectly, { field: fieldLabel });
}

export function runtimeValidationErrorsFromServer(
  validationErrors: ReadonlyArray<FormRuntimeRecordValidationError> | undefined,
) {
  const errors: RuntimeFormValidationErrors = {};
  validationErrors?.forEach((error) => {
    if (error.fieldId) {
      errors[error.fieldId] = error.message;
    }
  });
  return errors;
}

export function firstRuntimeValidationMessage(
  validationErrors: ReadonlyArray<FormRuntimeRecordValidationError> | undefined,
) {
  return validationErrors?.find((error) => error.message.trim().length > 0)?.message;
}
