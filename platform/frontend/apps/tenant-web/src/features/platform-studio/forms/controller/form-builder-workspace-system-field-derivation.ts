import {
  type FormBuilderSystemFields,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";
import {
  type SystemFieldRole,
} from "./form-builder-workspace-palette-items";
import {
  getSystemFieldExistingCandidate,
  getSystemFieldSemanticRole,
  getSystemFieldTemplate,
} from "./form-builder-workspace-system-fields";

export function applySystemFieldSemanticRoleBinding(
  fields: ReadonlyArray<FormsPlaceholderField>,
  role: SystemFieldRole,
  fieldId: string,
) {
  const semanticRole = getSystemFieldSemanticRole(role);

  return fields.map((field) =>
    field.semanticRole === semanticRole && field.id !== fieldId
      ? {
          ...field,
          semanticRole: undefined,
        }
      : field.id === fieldId
        ? {
            ...field,
            semanticRole,
          }
        : field
  );
}

export function applySystemFieldDocumentBinding(
  systemFields: FormBuilderSystemFields,
  role: SystemFieldRole,
  fieldId: string,
) {
  const normalizedFieldId = fieldId.trim();
  const nextSystemFields = {
    ...systemFields,
  };

  if (!normalizedFieldId) {
    if (role === "reportedBy") {
      delete nextSystemFields.reportedBy;
    } else if (role === "reportedDate") {
      delete nextSystemFields.reportedDate;
    } else {
      delete nextSystemFields.workflowStatus;
    }

    return {
      ...nextSystemFields,
      version: 1,
    } satisfies FormBuilderSystemFields;
  }

  if (role === "reportedBy") {
    nextSystemFields.reportedBy = {
      fieldId: normalizedFieldId,
    };
  } else if (role === "reportedDate") {
    nextSystemFields.reportedDate = {
      fieldId: normalizedFieldId,
    };
  } else {
    const currentStatus = systemFields.workflowStatus;
    nextSystemFields.workflowStatus = {
      fieldId: normalizedFieldId,
      finalValue: currentStatus?.fieldId === normalizedFieldId ? currentStatus.finalValue : undefined,
      initialValue: currentStatus?.fieldId === normalizedFieldId ? currentStatus.initialValue : undefined,
    };
  }

  return {
    ...nextSystemFields,
    version: 1,
  } satisfies FormBuilderSystemFields;
}

export function applyWorkflowStatusOptionUpdate(
  systemFields: FormBuilderSystemFields,
  key: "finalValue" | "initialValue",
  value: string,
) {
  const workflowStatus = systemFields.workflowStatus;
  if (!workflowStatus) {
    return systemFields;
  }

  return {
    ...systemFields,
    version: 1,
    workflowStatus: {
      ...workflowStatus,
      [key]: value.trim() ? value : undefined,
    },
  } satisfies FormBuilderSystemFields;
}

export function prepareSystemFieldCreation(
  fields: ReadonlyArray<FormsPlaceholderField>,
  role: SystemFieldRole,
) {
  const existingField = getSystemFieldExistingCandidate(fields, role);
  const nextField = {
    ...(existingField ?? getSystemFieldTemplate(fields, role)),
    schemaScopeKey: "root",
  };

  return {
    existingField,
    nextField,
  } as const;
}

export function applyCreatedSystemFieldDocumentBinding(
  systemFields: FormBuilderSystemFields,
  role: SystemFieldRole,
  field: FormsPlaceholderField,
) {
  if (role === "reportedBy") {
    return {
      ...systemFields,
      reportedBy: {
        fieldId: field.id,
      },
      version: 1,
    } satisfies FormBuilderSystemFields;
  }

  if (role === "reportedDate") {
    return {
      ...systemFields,
      reportedDate: {
        fieldId: field.id,
      },
      version: 1,
    } satisfies FormBuilderSystemFields;
  }

  const options = field.options ?? [];

  return {
    ...systemFields,
    version: 1,
    workflowStatus: {
      fieldId: field.id,
      finalValue: options.length > 0 ? options[options.length - 1] : undefined,
      initialValue: options[0],
    },
  } satisfies FormBuilderSystemFields;
}
