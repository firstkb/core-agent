import type { FormBuilderSystemFields } from "../forms-builder-state";

export function createDefaultSystemFields(): FormBuilderSystemFields {
  return {
    version: 1,
  };
}

function normalizeSystemFieldBinding(
  value: unknown,
  fieldIds: ReadonlySet<string>,
) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as { fieldId?: unknown };
  if (typeof candidate.fieldId !== "string" || !fieldIds.has(candidate.fieldId)) {
    return undefined;
  }

  return {
    fieldId: candidate.fieldId,
  };
}

function normalizeWorkflowStatusBinding(
  value: unknown,
  fieldIds: ReadonlySet<string>,
) {
  const binding = normalizeSystemFieldBinding(value, fieldIds);
  if (!binding || !value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as { finalValue?: unknown; initialValue?: unknown };

  return {
    ...binding,
    finalValue: typeof candidate.finalValue === "string" && candidate.finalValue.trim().length > 0
      ? candidate.finalValue
      : undefined,
    initialValue: typeof candidate.initialValue === "string" && candidate.initialValue.trim().length > 0
      ? candidate.initialValue
      : undefined,
  };
}

export function normalizeSystemFields(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderSystemFields {
  if (!value || typeof value !== "object") {
    return createDefaultSystemFields();
  }

  const candidate = value as Partial<FormBuilderSystemFields>;

  return {
    reportedBy: normalizeSystemFieldBinding(candidate.reportedBy, fieldIds),
    reportedDate: normalizeSystemFieldBinding(candidate.reportedDate, fieldIds),
    version: 1,
    workflowStatus: normalizeWorkflowStatusBinding(candidate.workflowStatus, fieldIds),
  };
}
