import { describe, expect, it } from "vitest";

import {
  createDefaultCollectionState,
  formatCollectionTableCellValue,
  formatAppliedQuickFilterGroupLabel,
  groupCollectionTableQuickFilters,
  resolveCollectionStateForMeta,
} from "./collection-table-runtime";
import type { CollectionTableMetaResponse, CollectionTableQuickFilter } from "./collection-table-contract";

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

  it("formats date values in en-US format", () => {
    expect(formatCollectionTableCellValue("2026-04-16", "date")).toBe("04/16/2026");
  });

  it("formats date time values in en-US format", () => {
    expect(formatCollectionTableCellValue("2026-04-16T13:46:17.09608-04:00", "date_time"))
      .toBe("04/16/2026, 1:46:17 PM");
  });

  it("uses explicit meta default sort when building default state", () => {
    const meta: CollectionTableMetaResponse = {
      surfaceId: "test",
      title: "Test",
      search: { defaultFieldId: "all" },
      defaultSort: { columnId: "occurred_at", direction: "desc" },
      fields: [
        { id: "occurred_at", label: "Occurred At", type: "date_time", searchable: true, sortable: true, suggestable: false },
      ],
      columns: [
        { id: "occurred_at", label: "Occurred At", type: "date_time", fieldId: "occurred_at", defaultVisible: true },
      ],
    };

    const state = createDefaultCollectionState(meta);
    expect(state.query.sortColumnId).toBe("occurred_at");
    expect(state.query.sortDirection).toBe("desc");
  });

  it("prefers explicit meta default sort over persisted sort on hydrate", () => {
    const meta: CollectionTableMetaResponse = {
      surfaceId: "test",
      title: "Test",
      search: { defaultFieldId: "all" },
      defaultSort: { columnId: "occurred_at", direction: "desc" },
      fields: [
        { id: "occurred_at", label: "Occurred At", type: "date_time", searchable: true, sortable: true, suggestable: false },
        { id: "user", label: "User", type: "text", searchable: true, sortable: true, suggestable: true },
      ],
      columns: [
        { id: "occurred_at", label: "Occurred At", type: "date_time", fieldId: "occurred_at", defaultVisible: true },
        { id: "user", label: "User", type: "text", fieldId: "user", defaultVisible: true },
      ],
    };
    const baseState = createDefaultCollectionState(meta);
    const resolved = resolveCollectionStateForMeta(
      meta,
      baseState,
      {
        draftSearchFieldId: "all",
        draftSearchOperator: "contains",
        queryState: {
          ...baseState.query,
          sortColumnId: "user",
          sortDirection: "asc",
        },
      },
      false,
    );

    expect(resolved.query.sortColumnId).toBe("occurred_at");
    expect(resolved.query.sortDirection).toBe("desc");
  });
});
