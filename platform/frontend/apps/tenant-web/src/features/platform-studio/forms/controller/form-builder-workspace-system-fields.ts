import { type useTranslation } from "@platform/i18n";

import { type ViewSettingsSystemFieldItem } from "../components/view-settings-system-fields-section";
import {
  type FormBuilderDocument,
  type FormBuilderWorkspaceAccess,
} from "../forms-builder-state";
import {
  createFormsPlaceholderStorageKey,
  type FormsPlaceholderField,
  type FormsPlaceholderFieldSemanticRole,
} from "../forms-placeholder-data";
import {
  systemFieldRoles,
  type SystemFieldPaletteItem,
  type SystemFieldRole,
} from "./form-builder-workspace-palette-items";

type Translate = ReturnType<typeof useTranslation>["t"];

type FieldByIdResolver = (
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId: string | null | undefined,
) => FormsPlaceholderField | null;

type FieldLabelWithBoundFieldResolver = (
  field: FormsPlaceholderField,
  document: FormBuilderDocument,
) => string;

type FieldLabelAndBoundFieldResolver = (
  field: FormsPlaceholderField,
  document: FormBuilderDocument,
) => {
  boundField: string;
  labelField: string;
};

export function getSystemFieldKey(role: SystemFieldRole) {
  return `tenant.platformStudio.forms.builder.systemField.${role}`;
}

export function getSystemFieldPaletteDescriptionKey(role: SystemFieldRole) {
  return `tenant.platformStudio.forms.builder.systemField.palette.${role}Description`;
}

export function getSystemFieldSemanticRole(role: SystemFieldRole): FormsPlaceholderFieldSemanticRole {
  return role === "reportedBy"
    ? "reportedBy"
    : role === "reportedDate"
      ? "reportedDate"
      : "workflowStatus";
}

export function getSystemFieldExistingCandidate(
  fields: ReadonlyArray<FormsPlaceholderField>,
  role: SystemFieldRole,
) {
  const semanticRole = getSystemFieldSemanticRole(role);
  return fields.find((field) => field.semanticRole === semanticRole) ?? null;
}

function isCompatibleSystemField(
  field: FormsPlaceholderField,
  role: SystemFieldRole,
) {
  if (role === "reportedBy") {
    return field.kind === "db_lookup";
  }

  if (role === "reportedDate") {
    return field.kind === "date" || field.kind === "date_time";
  }

  return field.kind === "single_select";
}

export function getBoundSystemFieldIdByRole(
  document: FormBuilderDocument,
  role: SystemFieldRole,
) {
  if (role === "reportedBy") {
    return document.systemFields.reportedBy?.fieldId ?? null;
  }

  if (role === "reportedDate") {
    return document.systemFields.reportedDate?.fieldId ?? null;
  }

  return document.systemFields.workflowStatus?.fieldId ?? null;
}

export function getSystemFieldOptions(
  fields: ReadonlyArray<FormsPlaceholderField>,
  document: FormBuilderDocument,
  role: SystemFieldRole,
) {
  const currentFieldId = getBoundSystemFieldIdByRole(document, role);
  const blockedFieldIds = new Set(
    systemFieldRoles
      .filter((entry) => entry !== role)
      .map((entry) => getBoundSystemFieldIdByRole(document, entry))
      .filter((entry): entry is string => Boolean(entry)),
  );

  return fields.filter((field) =>
    isCompatibleSystemField(field, role) && (!blockedFieldIds.has(field.id) || field.id === currentFieldId),
  );
}

export function getSystemFieldTemplate(
  fields: ReadonlyArray<FormsPlaceholderField>,
  role: SystemFieldRole,
): FormsPlaceholderField {
  const baseId =
    role === "reportedBy"
      ? "reported-by"
      : role === "reportedDate"
        ? "reported-date"
        : "status";
  const existingIds = new Set(fields.map((field) => field.id));
  let nextId = baseId;
  let suffix = 2;

  while (existingIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  if (role === "reportedBy") {
    return {
      displayName: "Reported By",
      displayFields: ["Full name", "Email"],
      family: "preset",
      id: nextId,
      isPersisted: false,
      isLocked: false,
      kind: "db_lookup",
      label: "Reported By",
      preset: "contact_lookup",
      semanticRole: "reportedBy",
      selectionMode: "single",
      sourceFilters: ["Only active contacts"],
      sourceLabel: "Contacts",
      status: "draft",
      storageKey: createFormsPlaceholderStorageKey("Reported By", nextId),
    };
  }

  if (role === "reportedDate") {
    return {
      displayName: "Reported Date",
      family: "core",
      id: nextId,
      isPersisted: false,
      isLocked: false,
      kind: "date",
      label: "Reported Date",
      semanticRole: "reportedDate",
      status: "draft",
      storageKey: createFormsPlaceholderStorageKey("Reported Date", nextId),
    };
  }

  return {
    displayName: "Status",
    family: "choice",
    id: nextId,
    isPersisted: false,
    isLocked: false,
    kind: "single_select",
    label: "Status",
    options: ["Draft", "Open", "Closed"],
    semanticRole: "workflowStatus",
    status: "draft",
    storageKey: createFormsPlaceholderStorageKey("Status", nextId),
  };
}

export function createSystemFieldPaletteItems({
  canPlaceFieldAtCurrentLevel,
  document,
  fieldPlacementAccess,
  paletteQuery,
}: {
  canPlaceFieldAtCurrentLevel: boolean;
  document: FormBuilderDocument;
  fieldPlacementAccess: FormBuilderWorkspaceAccess;
  paletteQuery: string;
}): ReadonlyArray<SystemFieldPaletteItem> {
  if (!canPlaceFieldAtCurrentLevel || document.activeScopeId !== "root") {
    return [];
  }

  const normalizedSearch = paletteQuery.trim().toLowerCase();

  return systemFieldRoles
    .map((role) => {
      const alreadyConfigured = Boolean(getBoundSystemFieldIdByRole(document, role));

      return {
        descriptionKey: getSystemFieldPaletteDescriptionKey(role),
        disabled: !fieldPlacementAccess.canAddFieldItems || alreadyConfigured,
        disabledReasonKey: alreadyConfigured
          ? "tenant.platformStudio.forms.builder.systemField.alreadyConfigured"
          : (!fieldPlacementAccess.canAddFieldItems ? fieldPlacementAccess.structureLockReasonKey : null),
        iconKey:
          role === "reportedBy"
            ? "db_lookup"
            : role === "reportedDate"
              ? "date"
              : "status",
        key: role,
        kind: "systemField" as const,
        labelKey: getSystemFieldKey(role),
        searchTerms: [
          role,
          role === "reportedBy"
            ? "reported by contact user"
            : role === "reportedDate"
              ? "reported date date"
              : "status workflow state",
        ],
      };
    })
    .filter((item) =>
      !normalizedSearch || item.searchTerms.some((term) => term.toLowerCase().includes(normalizedSearch)),
    );
}

export function getSystemFieldBindingSummary({
  document,
  fields,
  getFieldById,
  getFieldLabelAndBoundField,
  role,
  t,
}: {
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldById: FieldByIdResolver;
  getFieldLabelAndBoundField: FieldLabelAndBoundFieldResolver;
  role: SystemFieldRole;
  t: Translate;
}) {
  const boundFieldId = getBoundSystemFieldIdByRole(document, role);
  const boundField = getFieldById(fields, boundFieldId);

  if (!boundField) {
    return t("tenant.platformStudio.forms.builder.systemField.unbound");
  }

  const binding = getFieldLabelAndBoundField(boundField, document);

  return `${t("tenant.platformStudio.forms.builder.systemField.labelField")}: ${binding.labelField} / ${t("tenant.platformStudio.forms.builder.systemField.boundField")}: ${binding.boundField}`;
}

export function createViewSettingsSystemFields({
  document,
  fields,
  getFieldById,
  getFieldLabelAndBoundField,
  getFieldLabelWithBoundField,
  t,
  workflowStatusOptions,
}: {
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldById: FieldByIdResolver;
  getFieldLabelAndBoundField: FieldLabelAndBoundFieldResolver;
  getFieldLabelWithBoundField: FieldLabelWithBoundFieldResolver;
  t: Translate;
  workflowStatusOptions: ReadonlyArray<string>;
}): ReadonlyArray<ViewSettingsSystemFieldItem> {
  return systemFieldRoles.map((role) => ({
    boundFieldId: getBoundSystemFieldIdByRole(document, role) ?? "",
    compatibleFields: getSystemFieldOptions(fields, document, role).map((field) => ({
      id: field.id,
      label: getFieldLabelWithBoundField(field, document),
    })),
    finalValue: document.systemFields.workflowStatus?.finalValue ?? "",
    initialValue: document.systemFields.workflowStatus?.initialValue ?? "",
    label: t(getSystemFieldKey(role)),
    noCompatibleText: t("tenant.platformStudio.forms.builder.systemField.noCompatibleField"),
    role,
    summary: getSystemFieldBindingSummary({
      document,
      fields,
      getFieldById,
      getFieldLabelAndBoundField,
      role,
      t,
    }),
    workflowStatusOptions,
  }));
}
