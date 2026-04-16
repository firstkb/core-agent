import { describe, expect, it } from "vitest";

import {
  formatAppliedQuickFilterGroupLabel,
  groupCollectionTableQuickFilters,
} from "./collection-table-runtime";
import type { CollectionTableQuickFilter } from "./collection-table-contract";

describe("collection-table quick filter grouping", () => {
  const labels = {
    allField: "All",
    isEmpty: "Is empty",
    isNotEmpty: "Is not empty",
  };
  const searchFieldOptions = [
    { id: "all", label: "All" },
    { id: "module_title", label: "Module" },
    { id: "status", label: "Status" },
  ];

  it("groups repeated contains filters on the same field into one display group", () => {
    const quickFilters: CollectionTableQuickFilter[] = [
      { fieldId: "module_title", id: "module_title:contains:emp", operator: "contains", value: "Emp" },
      { fieldId: "module_title", id: "module_title:contains:tenant", operator: "contains", value: "Tenant" },
      { fieldId: "status", id: "status:is_equal_to:active", operator: "is_equal_to", value: "Active" },
    ];

    const groupedFilters = groupCollectionTableQuickFilters(quickFilters);

    expect(groupedFilters).toHaveLength(2);
    expect(groupedFilters[0]).toMatchObject({
      fieldId: "module_title",
      operator: "contains",
      values: ["Emp", "Tenant"],
    });
    expect(groupedFilters[1]).toMatchObject({
      fieldId: "status",
      operator: "is_equal_to",
      values: ["Active"],
    });
  });

  it("formats grouped contains filters as a single token label", () => {
    const groupedFilters = groupCollectionTableQuickFilters([
      { fieldId: "module_title", id: "module_title:contains:emp", operator: "contains", value: "Emp" },
      { fieldId: "module_title", id: "module_title:contains:tenant", operator: "contains", value: "Tenant" },
    ]);

    expect(
      formatAppliedQuickFilterGroupLabel(groupedFilters[0], searchFieldOptions, labels),
    ).toBe("[Module] Emp, Tenant");
  });
});
