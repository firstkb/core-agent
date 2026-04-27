import { type useTranslation } from "@platform/i18n";

import {
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";

type Translate = ReturnType<typeof useTranslation>["t"];

export function getNodeTypeKey(nodeType: FormBuilderNode["type"]) {
  return `tenant.platformStudio.forms.builder.nodeType.${nodeType}`;
}

export function getFieldTypeKey(field: Pick<FormsPlaceholderField, "historicalUpdates" | "kind">) {
  if (field.kind === "long_text" && field.historicalUpdates) {
    return "tenant.platformStudio.forms.builder.fieldType.long_text_historical";
  }

  return `tenant.platformStudio.forms.builder.fieldType.${field.kind}`;
}

function getLookupPresetLabelKey(field: Pick<FormsPlaceholderField, "kind" | "preset" | "selectionMode">) {
  if (field.kind !== "db_lookup") {
    return null;
  }

  if (field.preset === "db_lookup_value") {
    return "tenant.platformStudio.forms.builder.fieldPreset.db_lookup_value";
  }

  if (field.preset === "contact_lookup") {
    return field.selectionMode === "multiple"
      ? "tenant.platformStudio.forms.builder.fieldPreset.contacts_lookup"
      : "tenant.platformStudio.forms.builder.fieldPreset.contact_lookup";
  }

  if (field.preset === "company_lookup") {
    return field.selectionMode === "multiple"
      ? "tenant.platformStudio.forms.builder.fieldPreset.companies_lookup"
      : "tenant.platformStudio.forms.builder.fieldPreset.company_lookup";
  }

  if (field.preset === "project_lookup") {
    return field.selectionMode === "multiple"
      ? "tenant.platformStudio.forms.builder.fieldPreset.projects_lookup"
      : "tenant.platformStudio.forms.builder.fieldPreset.project_lookup";
  }

  if (field.selectionMode === "multiple") {
    return "tenant.platformStudio.forms.builder.fieldPreset.db_lookup_multi";
  }

  return null;
}

function getFieldPresetKey(field: Pick<FormsPlaceholderField, "kind" | "preset" | "selectionMode">) {
  return getLookupPresetLabelKey(field) ?? (
    field.preset ? `tenant.platformStudio.forms.builder.fieldPreset.${field.preset}` : null
  );
}

export function getFieldPaletteDescription(
  field: Pick<
    FormsPlaceholderField,
    "historicalUpdates" | "kind" | "options" | "preset" | "selectionMode" | "sourceLabel"
  >,
  t: Translate,
) {
  const typeLabel = t(getFieldTypeKey(field));
  const presetLabelKey = getFieldPresetKey(field);

  if (field.kind === "db_lookup" && presetLabelKey) {
    return `${typeLabel} / ${t(presetLabelKey)}`;
  }

  if (field.kind === "db_lookup") {
    return `${typeLabel} / ${field.sourceLabel ?? t("tenant.platformStudio.forms.builder.fieldMeta.lookupReady")}`;
  }

  if (field.kind === "long_text" && field.historicalUpdates) {
    return `${typeLabel} / ${t("tenant.platformStudio.forms.builder.fieldMeta.historyEnabled")}`;
  }

  if (presetLabelKey) {
    return `${typeLabel} / ${t(presetLabelKey)}`;
  }

  if (field.options?.length) {
    return `${typeLabel} / ${t("tenant.platformStudio.forms.builder.fieldMeta.optionsCount", { count: field.options.length })}`;
  }

  return typeLabel;
}

export function getSummaryText(
  node: FormBuilderNode,
  document: FormBuilderDocument,
  objectTitle: string,
  objectFields: ReadonlyArray<FormsPlaceholderField>,
  summaryKey: string,
  t: Translate,
  childrenCount: number,
) {
  if (summaryKey === "tenant.platformStudio.forms.builder.summary.children") {
    return `${t(getNodeTypeKey(node.type))} (${t(summaryKey, { count: childrenCount })})`;
  }

  if (node.type === "field") {
    const field = objectFields.find((entry) => entry.id === node.fieldId);
    return field ? t(getFieldTypeKey(field)) : t(summaryKey, {
      fieldLabel: objectTitle,
    });
  }

  if (node.type === "view_only_field") {
    return t(getNodeTypeKey("view_only_field"));
  }

  if ((node.type === "text" || node.type === "rich_text") && node.text?.trim()) {
    const fallbackText = node.text
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    const nextText = typeof globalThis.document !== "undefined"
      ? (() => {
          const temporaryElement = globalThis.document.createElement("div");
          temporaryElement.innerHTML = node.text ?? "";
          return temporaryElement.textContent?.replace(/\s+/g, " ").trim() ?? fallbackText;
        })()
      : fallbackText;

    if (nextText.length > 0) {
      return nextText.length > 88 ? `${nextText.slice(0, 85).trimEnd()}...` : nextText;
    }
  }

  return t(summaryKey);
}
