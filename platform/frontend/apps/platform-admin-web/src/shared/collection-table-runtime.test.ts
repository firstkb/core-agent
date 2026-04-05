import { describe, expect, it } from "vitest";

import type {
  CollectionTableFieldDefinition,
  CollectionTableMetaResponse,
} from "./collection-table-contract";
import type { PersistedCollectionTableState } from "./collection-table-state";
import {
  buildAppliedQuickFilter,
  createDefaultCollectionState,
  filterCompatibleSearchSuggestionGroups,
  filterSearchSuggestionGroups,
  getCollectionTableRowLabel,
  getAllowedSearchOperators,
  getRuntimeCollectionColumns,
  reconcileSelectedRowIds,
  resolveCollectionStateForMeta,
} from "./collection-table-runtime";

function createField(
  overrides: Partial<CollectionTableFieldDefinition> & Pick<CollectionTableFieldDefinition, "id" | "label" | "type">,
): CollectionTableFieldDefinition {
  return {
    searchable: true,
    sortable: true,
    suggestable: true,
    ...overrides,
  };
}

function createMeta(
  overrides: Partial<CollectionTableMetaResponse> = {},
): CollectionTableMetaResponse {
  return {
    columns: [
      { defaultVisible: true, id: "actions", label: "", type: "actions", width: "12rem" },
      { defaultVisible: true, fieldId: "location", id: "location", label: "Location", type: "text" },
      { defaultVisible: true, fieldId: "status", id: "status", label: "Status", type: "badge" },
    ],
    fields: [
      createField({ id: "location", label: "Location", type: "text" }),
      createField({ id: "status", label: "Status", type: "badge" }),
    ],
    pageSizeOptions: [25, 50, 100],
    surfaceId: "module-registry.list",
    title: "Module registry",
    ...overrides,
  };
}

describe("collection-table-runtime", () => {
  it("derives operators from the selected field kind", () => {
    expect(getAllowedSearchOperators("all")).toEqual(["contains"]);
    expect(getAllowedSearchOperators("text")).toEqual([
      "contains",
      "is_equal_to",
      "is_not_equal_to",
      "is_empty",
      "is_not_empty",
    ]);
    expect(getAllowedSearchOperators("date")).toEqual([
      "is_equal_to",
      "is_less_than",
      "is_less_or_equal_to",
      "is_greater_than",
      "is_greater_or_equal_to",
      "is_empty",
      "is_not_empty",
    ]);
  });

  it("normalizes quick filters for the all-field pseudo option", () => {
    expect(buildAppliedQuickFilter("all", "is_equal_to", "  Dock  ")).toEqual({
      fieldId: "all",
      id: "all:contains:dock",
      operator: "contains",
      value: "Dock",
    });

    expect(buildAppliedQuickFilter("status", "contains", "   ")).toBeNull();
    expect(buildAppliedQuickFilter("status", "is_empty", "")).toEqual({
      fieldId: "status",
      id: "status:is_empty:",
      operator: "is_empty",
      value: "",
    });
  });

  it("restores persisted state but clamps invalid page size and sort metadata", () => {
    const meta = createMeta();
    const currentState = {
      ...createDefaultCollectionState(meta),
      visibleColumnIds: ["missing-column"],
    };
    const persistedState: PersistedCollectionTableState = {
      draftSearchFieldId: "status",
      draftSearchOperator: "contains",
      queryState: {
        filters: {},
        page: 3,
        pageSize: 500,
        presetId: "all",
        quickFilters: [],
        sortColumnId: "missing-column",
        sortDirection: "desc",
      },
    };

    const resolvedState = resolveCollectionStateForMeta(
      meta,
      currentState,
      persistedState,
      false,
    );

    expect(resolvedState.query.page).toBe(3);
    expect(resolvedState.query.pageSize).toBe(25);
    expect(resolvedState.query.sortColumnId).toBe("location");
    expect(resolvedState.visibleColumnIds).toEqual(["actions", "location", "status"]);
  });

  it("injects a default actions column when row actions exist without an explicit actions column", () => {
    const meta = createMeta({
      columns: [
        { defaultVisible: true, fieldId: "location", id: "location", label: "Location", type: "text" },
        { defaultVisible: true, fieldId: "status", id: "status", label: "Status", type: "badge" },
      ],
      rowActions: [{ execution: "frontend", id: "edit", kind: "button" }],
    });

    expect(getRuntimeCollectionColumns(meta).map((column) => column.id)).toEqual([
      "actions",
      "location",
      "status",
    ]);
    expect(createDefaultCollectionState(meta).visibleColumnIds).toEqual([
      "actions",
      "location",
      "status",
    ]);
  });

  it("filters stale suggestion groups and stale row selection against the current page", () => {
    expect(
      filterCompatibleSearchSuggestionGroups(
        [
          {
            fieldId: "location",
            items: [{ fieldId: "location", id: "dock", value: "Dock" }],
            label: "Location",
          },
          {
            fieldId: "legacy",
            items: [{ fieldId: "legacy", id: "legacy", value: "Legacy" }],
            label: "Legacy",
          },
        ],
        createMeta().fields,
      ),
    ).toEqual([
      {
        fieldId: "location",
        items: [{ fieldId: "location", id: "dock", value: "Dock" }],
        label: "Location",
      },
    ]);

    expect(
      reconcileSelectedRowIds(
        ["row-1", "row-2", "row-3"],
        [
          { cells: {}, id: "row-1", selectable: true },
          { cells: {}, id: "row-2", selectable: false },
        ],
      ),
    ).toEqual(["row-1"]);
  });

  it("normalizes suggestion items that are missing fieldId and id", () => {
    expect(
      filterSearchSuggestionGroups(
        [
          {
            fieldId: "module_title",
            items: [
              {
                value: "Module registry",
              } as never,
            ],
            label: "Module title",
          },
        ],
        "all",
        "module",
      ),
    ).toEqual([
      {
        fieldId: "module_title",
        items: [
          {
            fieldId: "module_title",
            id: "module_title:module registry",
            value: "Module registry",
          },
        ],
        label: "Module title",
      },
    ]);
  });

  it("derives a stable row label from the first populated runtime column", () => {
    const meta = createMeta({
      columns: [
        { defaultVisible: true, fieldId: "module_title", id: "module_title", label: "Module", type: "text" },
        { defaultVisible: true, fieldId: "status", id: "status", label: "Status", type: "badge" },
      ],
      fields: [
        createField({ id: "module_title", label: "Module", type: "text" }),
        createField({ id: "status", label: "Status", type: "badge" }),
      ],
      rowActions: [{ execution: "frontend", id: "edit", kind: "button" }],
    });

    expect(
      getCollectionTableRowLabel(meta, {
        cells: {
          module_title: { value: "Module registry" },
          status: { label: "Active", tone: "success", value: "active" },
        },
        id: "row-1",
        selectable: true,
      }),
    ).toBe("Module registry");
  });
});
