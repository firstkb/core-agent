import { describe, expect, it } from "vitest";

import type { FormBuilderDocument } from "../forms-builder-state";
import type { FormsPlaceholderField } from "../forms-placeholder-data";
import {
  getFieldsWithLookupDerivedOutputs,
  getViewFilterBaseFields,
  getViewFilterTargetFields,
} from "./form-builder-workspace-lookup-derived-outputs";

function createField(
  id: string,
  label: string,
  overrides: Partial<FormsPlaceholderField> = {},
): FormsPlaceholderField {
  return {
    family: "core",
    id,
    isLocked: false,
    kind: "short_text",
    label,
    ...overrides,
  };
}

describe("Form Builder lookup derived outputs", () => {
  it("excludes multiple lookup fields from View filter targets", () => {
    expect(getViewFilterBaseFields([
      createField("contact", "Contact", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "single",
      }),
      createField("contacts", "Contacts", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "multiple",
      }),
      createField("status", "Status", {
        family: "choice",
        kind: "single_select",
      }),
    ]).map((field) => field.id)).toEqual(["contact", "status"]);
  });

  it("does not add lookup derived output aliases to View filter targets", () => {
    const fields = [
      createField("reported-by", "Reported By", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "single",
      }),
      createField("company", "Company", {
        family: "preset",
        kind: "db_lookup",
        preset: "company_lookup",
        selectionMode: "single",
      }),
      createField("project", "Project", {
        family: "preset",
        kind: "db_lookup",
        preset: "project_lookup",
        selectionMode: "single",
      }),
      createField("db-lookup", "DB Lookup", {
        family: "choice",
        kind: "db_lookup",
        selectionMode: "single",
      }),
    ];
    const getFieldLabelAndBoundField = (field: FormsPlaceholderField) => ({
      boundField: field.label,
      labelField: `${field.label} title`,
    });

    expect(getFieldsWithLookupDerivedOutputs({
      document: {} as FormBuilderDocument,
      fields,
      getFieldLabelAndBoundField,
      t: ((key: string) => key) as never,
    }).some((field) => field.id.includes("::lookup_output::"))).toBe(true);

    const targets = getViewFilterTargetFields({
      document: {} as FormBuilderDocument,
      fields,
      getFieldLabelAndBoundField,
    });

    expect(targets.map((field) => field.id)).toEqual(["reported-by", "company", "project", "db-lookup"]);
    expect(targets.some((field) => field.id.includes("::lookup_output::"))).toBe(false);
    expect(targets.map((field) => field.label)).toEqual([
      "Reported By title",
      "Company title",
      "Project title",
      "DB Lookup title",
    ]);
  });
});
