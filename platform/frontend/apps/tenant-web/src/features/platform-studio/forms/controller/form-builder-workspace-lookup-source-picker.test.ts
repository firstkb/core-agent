import { describe, expect, it } from "vitest";

import {
  applyLookupSourcePickerSelectionToField,
  hasActiveLookupFilter,
} from "./form-builder-workspace-lookup-source-picker";
import type { LookupSourceModelOption } from "./form-builder-workspace-lookup-options";
import type { FormsPlaceholderField } from "../forms-placeholder-data";

function createLookupField(overrides: Partial<FormsPlaceholderField> = {}): FormsPlaceholderField {
  return {
    family: "choice",
    id: "company",
    isLocked: false,
    kind: "db_lookup",
    label: "Company",
    selectionMode: "single",
    ...overrides,
  };
}

function createSourceModel(): LookupSourceModelOption {
  return {
    activeFilterField: "active",
    defaultDisplayFields: ["name"],
    defaultSearchFields: ["doc_id", "name", "active"],
    defaultSortField: "name",
    fields: [
      { key: "doc_id", label: "Doc.id" },
      { key: "name", kind: "short_text", label: "Name" },
      { key: "active", kind: "boolean", label: "Active" },
    ],
    id: "company",
    label: "Company",
    storedValueField: "doc_id",
  };
}

describe("Form Builder lookup source picker", () => {
  it("stores the active lookup filter in the generic filters array", () => {
    const nextField = applyLookupSourcePickerSelectionToField({
      field: createLookupField(),
      picker: {
        activeFilterEnabled: true,
        fieldId: "company",
        modelId: "company",
        selectedFieldKeys: ["name"],
        sortFieldKey: "name",
      },
      sourceModel: createSourceModel(),
    });

    expect(nextField?.lookupConfig?.filters).toEqual([
      {
        field: "active",
        operator: "eq",
        value: true,
      },
    ]);
    expect(hasActiveLookupFilter(nextField?.lookupConfig)).toBe(true);
  });

  it("removes only the active filter when the toggle is disabled", () => {
    const nextField = applyLookupSourcePickerSelectionToField({
      field: createLookupField({
        lookupConfig: {
          filters: [
            { field: "status", operator: "eq", value: "Open" },
            { field: "active", operator: "eq", value: true },
          ],
          sourceModel: "company",
        },
      }),
      picker: {
        activeFilterEnabled: false,
        fieldId: "company",
        modelId: "company",
        selectedFieldKeys: ["name"],
        sortFieldKey: "name",
      },
      sourceModel: createSourceModel(),
    });

    expect(nextField?.lookupConfig?.filters).toEqual([
      { field: "status", operator: "eq", value: "Open" },
    ]);
  });
});
