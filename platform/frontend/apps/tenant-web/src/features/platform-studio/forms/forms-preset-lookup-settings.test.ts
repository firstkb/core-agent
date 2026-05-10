import { describe, expect, it } from "vitest";

import {
  applyPresetLookupFilterValueText,
  applyPresetLookupFilterValues,
  applyPresetLookupTemplate,
  buildDefaultPresetLookupFieldSettings,
  getPresetLookupFilterDefinitions,
  getPresetLookupFilterValueIds,
  getPresetLookupFilterValueText,
  getPresetLookupTemplateOptions,
  resolvePresetLookupTemplateKey,
} from "./forms-preset-lookup-settings";
import type { FormsPlaceholderField } from "./forms-placeholder-data";

function createPresetLookupField(
  overrides: Partial<FormsPlaceholderField> = {},
): FormsPlaceholderField {
  return {
    family: "preset",
    id: "contact",
    isLocked: false,
    kind: "db_lookup",
    label: "Contact",
    preset: "contact_lookup",
    selectionMode: "single",
    ...overrides,
  };
}

describe("Form Builder preset lookup settings", () => {
  it("applies the selected contact display template to the schema field", () => {
    const field = createPresetLookupField();
    const nextField = applyPresetLookupTemplate(field, "contact_employee_full_name");

    expect(nextField.displayFields).toEqual(["employee_number", "first_name", "last_name"]);
    expect(nextField.lookupConfig).toMatchObject({
      displayMode: "search_select",
      displayTemplate: "employee_number + ', ' + first_name + ' ' + last_name",
      searchBehavior: "ajax",
      searchFields: ["employee_number", "first_name", "last_name"],
      sortField: "employee_number",
      sourceModel: "users",
      storedValueField: "doc_id",
    });
    expect(nextField.sourceFilters).toBeUndefined();
    expect(resolvePresetLookupTemplateKey(nextField)).toBe("contact_employee_full_name");
  });

  it("stores preset lookup filter values in lookupConfig.filters without authoring active", () => {
    const field = createPresetLookupField({
      lookupConfig: {
        filters: [
          { field: "active", operator: "eq", value: true },
          { field: "status", operator: "eq", value: "open" },
        ],
      },
      sourceFilters: ["Only active contacts"],
    });

    const nextField = applyPresetLookupFilterValueText(field, "company_id", "12, 45");

    expect(nextField.lookupConfig?.filters).toEqual([
      { field: "status", operator: "eq", value: "open" },
      { field: "company_id", operator: "in", value: ["12", "45"] },
    ]);
    expect(nextField.sourceFilters).toBeUndefined();
    expect(getPresetLookupFilterValueText(nextField, "company_id")).toBe("12, 45");
    expect(getPresetLookupFilterValueIds(nextField, "company_id")).toEqual(["12", "45"]);
  });

  it("clears only the edited preset lookup filter", () => {
    const field = createPresetLookupField({
      lookupConfig: {
        filters: [
          { field: "job_type_id", operator: "in", value: ["2"] },
          { field: "company_id", operator: "in", value: ["12"] },
        ],
      },
    });

    const nextField = applyPresetLookupFilterValueText(field, "company_id", "");

    expect(nextField.lookupConfig?.filters).toEqual([
      { field: "job_type_id", operator: "in", value: ["2"] },
    ]);
  });

  it("stores preset lookup filter values from selected dictionary options", () => {
    const field = createPresetLookupField();
    const nextField = applyPresetLookupFilterValues(field, "job_type_id", ["2", " ", "5"]);

    expect(nextField.lookupConfig?.filters).toEqual([
      { field: "job_type_id", operator: "in", value: ["2", "5"] },
    ]);
  });

  it("exposes user-readable template and filter option labels", () => {
    const templateLabels = getPresetLookupTemplateOptions("contact_lookup").map((option) => option.label);
    const filterDefinitions = getPresetLookupFilterDefinitions("company_lookup");

    expect(templateLabels).toEqual([
      "First Name Last Name",
      "Employee ID, First Name Last Name",
    ]);
    expect(filterDefinitions).toMatchObject([
      { dictionaryKey: "companyTypes", field: "company_type_id" },
      { dictionaryKey: "companies", field: "main_company_id" },
    ]);
  });

  it("builds current default lookup templates for library presets", () => {
    expect(buildDefaultPresetLookupFieldSettings("company_lookup").lookupConfig).toMatchObject({
      displayTemplate: "name",
      sourceModel: "company",
    });
    expect(buildDefaultPresetLookupFieldSettings("project_lookup").lookupConfig).toMatchObject({
      displayTemplate: "project_number + ', ' + name",
      sourceModel: "projects",
    });
  });
});
