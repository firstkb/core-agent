import { type useTranslation } from "@platform/i18n";

import { getLookupPresetFromField } from "../components/lookup-filter-editor-helpers";
import {
  type FormBuilderDocument,
  type FormBuilderGridColumnDefinition,
  type FormBuilderNode,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
  type FormsPlaceholderFieldKind,
} from "../forms-placeholder-data";
import { toStorageKey } from "./form-builder-workspace-storage-keys";

type Translate = ReturnType<typeof useTranslation>["t"];

export type LookupDerivedOutputDefinition = {
  bindingId: string;
  columnName: string;
  fieldKind: FormsPlaceholderFieldKind;
  label: string;
  outputKey: string;
};

export type ViewOnlyBindingOption = {
  binding: NonNullable<FormBuilderNode["viewOnlyBinding"]>;
  bindingId: string;
  columnName: string;
  fieldKind: FormsPlaceholderFieldKind;
  label: string;
};

type FieldLabelResolver = (
  field: FormsPlaceholderField,
  document: FormBuilderDocument,
) => {
  boundField: string;
  labelField: string;
};

function getLookupDerivedOutputFieldKind(outputKey: string): FormsPlaceholderFieldKind {
  if (outputKey.endsWith("_id") || outputKey === "count") {
    return "integer";
  }

  return "short_text";
}

function createLookupDerivedOutputBindingId(fieldId: string, outputKey: string) {
  return `${fieldId}::lookup_output::${outputKey}`;
}

export function createRootRecordIdBindingId() {
  return "root::record_id";
}

function getScopeViewOnlyNodes(
  document: FormBuilderDocument,
  scopeSubformId: string | null,
) {
  if (scopeSubformId === null) {
    return document.rootScope.uiSchema.nodes.filter((node) => node.type === "view_only_field");
  }

  return document.subformScopes
    .find((scope) => scope.parentSubformNodeId === scopeSubformId || scope.scopeId === scopeSubformId)
    ?.uiSchema.nodes.filter((node) => node.type === "view_only_field") ?? [];
}

export function getLookupDerivedOutputDefinitions(
  field: FormsPlaceholderField,
  t: Translate,
): ReadonlyArray<LookupDerivedOutputDefinition> {
  if (field.preset === "db_lookup_value") {
    return [];
  }

  const fieldStorageKey = toStorageKey(field.id);
  const preset = getLookupPresetFromField(field);
  const selectionMode = field.selectionMode ?? "single";

  if (selectionMode === "multiple") {
    return [
      createLookupDerivedOutput(field.id, fieldStorageKey, "labels", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabels")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "count", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCount")),
    ];
  }

  if (preset === "contact_lookup") {
    return [
      createLookupDerivedOutput(field.id, fieldStorageKey, "label", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "company_name", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCompanyName")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "company_id", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCompanyId")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "title", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputTitle")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "phone", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputPhone")),
    ];
  }

  if (preset === "company_lookup") {
    return [
      createLookupDerivedOutput(field.id, fieldStorageKey, "label", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "type", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputType")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "main_company_name", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputMainCompanyName")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "state", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputState")),
    ];
  }

  if (preset === "project_lookup") {
    return [
      createLookupDerivedOutput(field.id, fieldStorageKey, "label", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "num", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputProjectNumber")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "name", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputProjectName")),
      createLookupDerivedOutput(field.id, fieldStorageKey, "company_name", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputCompanyName")),
    ];
  }

  return [
    createLookupDerivedOutput(field.id, fieldStorageKey, "label", t("tenant.platformStudio.forms.builder.fieldSettings.derivedOutputLabel")),
  ];
}

function createLookupDerivedOutput(
  fieldId: string,
  fieldStorageKey: string,
  outputKey: string,
  label: string,
): LookupDerivedOutputDefinition {
  return {
    bindingId: createLookupDerivedOutputBindingId(fieldId, outputKey),
    columnName: `${fieldStorageKey}__${outputKey}`,
    fieldKind: getLookupDerivedOutputFieldKind(outputKey),
    label,
    outputKey,
  };
}

export function getLookupDerivedOutputBindingOptionsForField({
  document,
  field,
  getFieldLabelAndBoundField,
  t,
}: {
  document: FormBuilderDocument;
  field: FormsPlaceholderField;
  getFieldLabelAndBoundField: FieldLabelResolver;
  t: Translate;
}): ReadonlyArray<ViewOnlyBindingOption> {
  const prefix = getFieldLabelAndBoundField(field, document).labelField;

  return getLookupDerivedOutputDefinitions(field, t).map((output) => ({
    binding: {
      kind: "lookup_derived_output" as const,
      outputKey: output.outputKey,
      sourceFieldId: field.id,
    },
    ...output,
    label: `${prefix} / ${output.label}`,
  }));
}

export function createLookupDerivedOutputPseudoFields({
  document,
  fields,
  getFieldLabelAndBoundField,
  t,
}: {
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldLabelAndBoundField: FieldLabelResolver;
  t: Translate;
}) {
  return fields.flatMap((field) =>
    field.kind === "db_lookup"
      ? getLookupDerivedOutputBindingOptionsForField({
          document,
          field,
          getFieldLabelAndBoundField,
          t,
        }).map((output) => ({
          family: "advanced" as const,
          id: output.bindingId,
          isLocked: false,
          kind: output.fieldKind,
          label: output.label,
          readonly: true,
          sourceLabel: output.columnName,
        }))
      : []
  );
}

export function getViewFilterBaseFields(fields: ReadonlyArray<FormsPlaceholderField>) {
  return fields.filter((field) => !(field.kind === "db_lookup" && (field.selectionMode ?? "single") === "multiple"));
}

export function getViewFilterTargetFields({
  document,
  fields,
  getFieldLabelAndBoundField,
}: {
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldLabelAndBoundField: FieldLabelResolver;
}) {
  return getViewFilterBaseFields(fields).map((field) => {
    if (field.kind !== "db_lookup") {
      return field;
    }

    return {
      ...field,
      label: getFieldLabelAndBoundField(field, document).labelField,
    };
  });
}

export function getFieldsWithLookupDerivedOutputs({
  document,
  fields,
  getFieldLabelAndBoundField,
  t,
}: {
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldLabelAndBoundField: FieldLabelResolver;
  t: Translate;
}) {
  return fields.flatMap((field) => {
    if (field.kind !== "db_lookup") {
      return [field];
    }

    const lookupFieldLabel = getFieldLabelAndBoundField(field, document).labelField;

    return [
      {
        ...field,
        label: lookupFieldLabel,
      },
      ...createLookupDerivedOutputPseudoFields({
        document,
        fields: [field],
        getFieldLabelAndBoundField,
        t,
      }),
    ];
  });
}

export function getFieldsWithViewOnlyGridTargets({
  columns,
  document,
  fields,
  getFieldLabelAndBoundField,
  scopeSubformId,
  t,
}: {
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>;
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldLabelAndBoundField: FieldLabelResolver;
  scopeSubformId: string | null;
  t: Translate;
}) {
  const baseFields = fields.map((field) =>
    field.kind === "db_lookup"
      ? {
          ...field,
          label: getFieldLabelAndBoundField(field, document).labelField,
        }
      : field
  );
  const explicitViewOnlyTargets = getScopeViewOnlyNodes(document, scopeSubformId)
    .flatMap((node) => createViewOnlyGridTarget({
      document,
      fields,
      getFieldLabelAndBoundField,
      node,
      scopeSubformId,
      t,
    }));
  const explicitViewOnlyTargetIds = new Set(explicitViewOnlyTargets.map((field) => field.id));
  const legacyVisibleLookupOutputTargetIds = new Set(
    columns
      .filter((column) => (column.visible ?? true) && column.fieldId.includes("::lookup_output::"))
      .map((column) => column.fieldId),
  );
  const legacyLookupOutputTargets = createLookupDerivedOutputPseudoFields({
    document,
    fields,
    getFieldLabelAndBoundField,
    t,
  }).filter((field) =>
    legacyVisibleLookupOutputTargetIds.has(field.id) && !explicitViewOnlyTargetIds.has(field.id)
  );

  return [
    ...baseFields,
    ...explicitViewOnlyTargets,
    ...legacyLookupOutputTargets,
  ];
}

function createViewOnlyGridTarget({
  document,
  fields,
  getFieldLabelAndBoundField,
  node,
  scopeSubformId,
  t,
}: {
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldLabelAndBoundField: FieldLabelResolver;
  node: FormBuilderNode;
  scopeSubformId: string | null;
  t: Translate;
}): ReadonlyArray<FormsPlaceholderField> {
  const title = node.title?.trim() ?? "";
  const binding = node.viewOnlyBinding;
  if (!binding) {
    return [];
  }

  if (binding.kind === "root_record_id") {
    if (scopeSubformId !== null) {
      return [];
    }

    return [
      {
        family: "advanced",
        id: createRootRecordIdBindingId(),
        isLocked: false,
        kind: "short_text",
        label: title || t("tenant.platformStudio.forms.builder.fieldSettings.rootRecordId"),
        readonly: true,
        sourceLabel: "doc_id",
      },
    ];
  }

  const sourceField = fields.find((field) => field.id === binding.sourceFieldId);
  if (!sourceField || sourceField.kind !== "db_lookup") {
    return [];
  }

  const output = getLookupDerivedOutputBindingOptionsForField({
    document,
    field: sourceField,
    getFieldLabelAndBoundField,
    t,
  }).find((option) =>
    option.binding.kind === "lookup_derived_output" && option.binding.outputKey === binding.outputKey
  );

  if (!output) {
    return [];
  }

  return [
    {
      family: "advanced",
      id: output.bindingId,
      isLocked: false,
      kind: output.fieldKind,
      label: title || output.label,
      readonly: true,
      sourceLabel: output.columnName,
    },
  ];
}
