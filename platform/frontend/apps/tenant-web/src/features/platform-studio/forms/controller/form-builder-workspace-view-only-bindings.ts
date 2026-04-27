import { type useTranslation } from "@platform/i18n";

import {
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import {
  createRootRecordIdBindingId,
  getLookupDerivedOutputBindingOptionsForField,
} from "./form-builder-workspace-lookup-derived-outputs";

type Translate = ReturnType<typeof useTranslation>["t"];

type FieldLabelResolver = (
  field: FormsPlaceholderField,
  document: FormBuilderDocument,
) => {
  boundField: string;
  labelField: string;
};

type FieldByIdResolver = (
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId: string | null | undefined,
) => FormsPlaceholderField | null;

type ScopeFieldsResolver = (
  document: FormBuilderDocument,
  fields: ReadonlyArray<FormsPlaceholderField>,
  scopeSubformId: string | null,
) => ReadonlyArray<FormsPlaceholderField>;

type ViewOnlyBindingNodeUpdateOption = {
  binding: FormBuilderNode["viewOnlyBinding"];
  label: string;
};

export function getViewOnlyBindingNodeUpdate({
  currentBindingLabel,
  defaultTitle,
  nextOption,
  nodeTitle,
}: {
  currentBindingLabel: string | undefined;
  defaultTitle: string;
  nextOption: ViewOnlyBindingNodeUpdateOption | null;
  nodeTitle: string | undefined;
}): Pick<FormBuilderNode, "title" | "viewOnlyBinding"> {
  const trimmedTitle = nodeTitle?.trim() ?? "";
  const shouldAutofillTitle =
    trimmedTitle.length === 0 ||
    trimmedTitle === defaultTitle ||
    (currentBindingLabel ? trimmedTitle === currentBindingLabel : false);

  return {
    title: nextOption && shouldAutofillTitle ? nextOption.label : nodeTitle,
    viewOnlyBinding: nextOption?.binding,
  };
}

export function getViewOnlyBindingOptions({
  document,
  fields,
  getFieldLabelAndBoundField,
  getScopeFields,
  scopeSubformId,
  t,
}: {
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldLabelAndBoundField: FieldLabelResolver;
  getScopeFields: ScopeFieldsResolver;
  scopeSubformId: string | null;
  t: Translate;
}) {
  const lookupOptions = getScopeFields(document, fields, scopeSubformId)
    .filter((field) => field.kind === "db_lookup")
    .flatMap((field) => getLookupDerivedOutputBindingOptionsForField({
      document,
      field,
      getFieldLabelAndBoundField,
      t,
    }));

  if (scopeSubformId !== null) {
    return lookupOptions;
  }

  return [
    {
      binding: {
        kind: "root_record_id" as const,
      },
      bindingId: createRootRecordIdBindingId(),
      columnName: "doc_id",
      fieldKind: "integer",
      label: t("tenant.platformStudio.forms.builder.fieldSettings.rootRecordId"),
    },
    ...lookupOptions,
  ];
}

export function getViewOnlyBindingOption({
  binding,
  document,
  fields,
  getFieldById,
  getFieldLabelAndBoundField,
  t,
}: {
  binding: FormBuilderNode["viewOnlyBinding"] | undefined;
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
  getFieldById: FieldByIdResolver;
  getFieldLabelAndBoundField: FieldLabelResolver;
  t: Translate;
}) {
  if (!binding || binding.kind !== "lookup_derived_output") {
    return binding?.kind === "root_record_id"
      ? {
          binding,
          bindingId: createRootRecordIdBindingId(),
          columnName: "doc_id",
          fieldKind: "integer" as const,
          label: t("tenant.platformStudio.forms.builder.fieldSettings.rootRecordId"),
        }
      : null;
  }

  const sourceField = getFieldById(fields, binding.sourceFieldId);
  if (!sourceField || sourceField.kind !== "db_lookup") {
    return null;
  }

  return getLookupDerivedOutputBindingOptionsForField({
    document,
    field: sourceField,
    getFieldLabelAndBoundField,
    t,
  }).find((option) =>
    option.binding.kind === "lookup_derived_output" && option.binding.outputKey === binding.outputKey
  ) ?? null;
}
