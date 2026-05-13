import { describe, expect, it } from "vitest";

import type {
  FormBuilderFilterCondition,
  FormBuilderLookupPreset,
} from "../forms-builder-state";
import type { FormsPlaceholderField } from "../forms-placeholder-data";
import { createViewSettingsDefaultFilterItems } from "./form-builder-workspace-display-items";

function createLookupField(
  id: string,
  label: string,
  preset: FormBuilderLookupPreset,
  selectionMode: "multiple" | "single" = "single",
): FormsPlaceholderField {
  return {
    family: "preset",
    id,
    isLocked: false,
    kind: "db_lookup",
    label,
    preset,
    selectionMode,
  };
}

function createLookupCondition(
  fieldId: string,
  lookupPreset: FormBuilderLookupPreset,
  clauseKeys: ReadonlyArray<string>,
): FormBuilderFilterCondition {
  return {
    clauses: clauseKeys.map((clauseKey) => ({
      clauseKey,
      id: `${fieldId}-${clauseKey}`,
      value: true,
      valueMode: "boolean_flag",
    })),
    editorType: "lookup",
    fieldId,
    lookupPreset,
  };
}

const summaryResolver = (condition: FormBuilderFilterCondition) => {
  if ("editorType" in condition && condition.editorType === "lookup") {
    return condition.clauses.map((clause) => clause.clauseKey).join(" · ");
  }

  return "scalar summary";
};

const t = ((key: string) => key) as never;

describe("Form Builder workspace display items", () => {
  it("groups matching lookup semantic filters with OR display metadata", () => {
    const items = createViewSettingsDefaultFilterItems({
      conditions: [
        createLookupCondition("reported-by", "contact_lookup", ["active_account"]),
        createLookupCondition("contact", "contact_lookup", ["active_account"]),
      ],
      fields: [
        createLookupField("reported-by", "Reported By", "contact_lookup"),
        createLookupField("contact", "Contact", "contact_lookup"),
      ],
      getFilterConditionSummary: summaryResolver,
      t,
    });

    expect(items).toEqual([
      {
        actionItems: [
          { fieldLabel: "Reported By", index: 0 },
          { fieldLabel: "Contact", index: 1 },
        ],
        connective: "or",
        fieldLabel: "Reported By",
        fieldLabels: ["Reported By", "Contact"],
        id: "default-filter-lookup-or-active_account",
        index: 0,
        summary: "active_account",
      },
    ]);
  });

  it("keeps different lookup semantic clauses as separate display groups", () => {
    const items = createViewSettingsDefaultFilterItems({
      conditions: [
        createLookupCondition("reported-by", "contact_lookup", ["active_account", "by_user_company"]),
        createLookupCondition("contact", "contact_lookup", ["active_account", "by_user_company"]),
      ],
      fields: [
        createLookupField("reported-by", "Reported By", "contact_lookup"),
        createLookupField("contact", "Contact", "contact_lookup"),
      ],
      getFilterConditionSummary: summaryResolver,
      t,
    });

    expect(items.map((item) => ({
      fieldLabels: item.fieldLabels,
      summary: item.summary,
    }))).toEqual([
      {
        fieldLabels: ["Reported By", "Contact"],
        summary: "active_account",
      },
      {
        fieldLabels: ["Reported By", "Contact"],
        summary: "by_user_company",
      },
    ]);
  });

  it("does not group multiple-value lookup fields", () => {
    const items = createViewSettingsDefaultFilterItems({
      conditions: [
        createLookupCondition("contacts", "contact_lookup", ["active_account"]),
      ],
      fields: [
        createLookupField("contacts", "Contacts", "contact_lookup", "multiple"),
      ],
      getFilterConditionSummary: summaryResolver,
      t,
    });

    expect(items).toEqual([
      {
        fieldLabel: "Contacts",
        id: "default-filter-0",
        index: 0,
        summary: "active_account",
      },
    ]);
  });
});
