import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CollectionTableFieldDefinition } from "./collection-table-contract";
import {
  clearPersistedCollectionTableState,
  createCollectionTableState,
  createCollectionTableSuggestionsFieldSignature,
  readPersistedCollectionTableState,
  readPersistedCollectionTableSuggestions,
  restoreCollectionTableState,
  toCollectionTableQueryRequest,
  writePersistedCollectionTableState,
  writePersistedCollectionTableSuggestions,
} from "./collection-table-state";

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

function createSessionStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("collection-table-state", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "window",
      {
        sessionStorage: createSessionStorageMock(),
      } as unknown as Window & typeof globalThis,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates default state from table metadata instead of CollectionPageConfig", () => {
    const state = createCollectionTableState({
      columns: [
        { id: "actions" },
        { defaultVisible: true, id: "location" },
        { defaultVisible: false, id: "hidden" },
      ],
      defaultSortColumnId: "location",
      pageSizeOptions: [25, 50],
      presetId: "all",
    });

    expect(state.query.pageSize).toBe(25);
    expect(state.query.sortColumnId).toBe("location");
    expect(state.visibleColumnIds).toEqual(["actions", "location"]);
  });

  it("reads, restores, and clears persisted table state", () => {
    const storageKey = "collection-table-state:module-registry.list";
    const baseState = createCollectionTableState({
      columns: [{ id: "location" }],
      defaultSortColumnId: "location",
      pageSizeOptions: [25, 50],
    });
    const persistedState = {
      draftSearchFieldId: "status",
      draftSearchOperator: "contains" as const,
      queryState: {
        filters: {},
        page: 2,
        pageSize: 50,
        presetId: "all",
        quickFilters: [],
        sortColumnId: "location",
        sortDirection: "desc" as const,
      },
    };

    writePersistedCollectionTableState(storageKey, persistedState);

    expect(readPersistedCollectionTableState(storageKey)).toEqual(persistedState);
    expect(restoreCollectionTableState(baseState, persistedState).query.page).toBe(2);

    clearPersistedCollectionTableState(storageKey);
    expect(readPersistedCollectionTableState(storageKey)).toBeNull();
  });

  it("normalizes malformed persisted quick filters before restore and request serialization", () => {
    const storageKey = "collection-table-state:malformed";

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        draftSearchFieldId: "all",
        draftSearchOperator: "contains",
        queryState: {
          filters: {},
          page: 1,
          pageSize: 25,
          presetId: "all",
          quickFilters: [
            {
              id: "undefined:contains:module registry",
              operator: "contains",
              value: "Module registry",
            },
          ],
          sortColumnId: "module_title",
          sortDirection: "asc",
        },
      }),
    );

    const persistedState = readPersistedCollectionTableState(storageKey);

    expect(persistedState?.queryState.quickFilters).toEqual([
      {
        fieldId: "all",
        id: "all:contains:module registry",
        operator: "contains",
        value: "Module registry",
      },
    ]);

    expect(
      toCollectionTableQueryRequest({
        density: "comfortable",
        query: persistedState!.queryState,
        visibleColumnIds: ["module_title"],
      }),
    ).toEqual({
      filters: {},
      page: 1,
      pageSize: 25,
      presetId: "all",
      quickFilters: [
        {
          fieldId: "all",
          id: "all:contains:module registry",
          operator: "contains",
          value: "Module registry",
        },
      ],
      sort: {
        columnId: "module_title",
        direction: "asc",
      },
    });
  });

  it("signs and scopes suggestion cache entries by suggestable field signature", () => {
    const storageKey = "collection-table-suggestions:module-registry.list";
    const groups = [
      {
        fieldId: "status",
        items: [{ fieldId: "status", id: "complete", value: "Complete" }],
        label: "Status",
      },
    ];
    const fieldSignature = createCollectionTableSuggestionsFieldSignature([
      createField({ id: "status", label: "Status", type: "badge" }),
      createField({ id: "location", label: "Location", type: "text" }),
      createField({ id: "date", label: "Date", suggestable: false, type: "date" }),
    ]);

    expect(fieldSignature).toBe("location:text|status:badge");

    writePersistedCollectionTableSuggestions(storageKey, groups, fieldSignature);

    expect(readPersistedCollectionTableSuggestions(storageKey, fieldSignature)).toEqual(groups);
    expect(readPersistedCollectionTableSuggestions(storageKey, "status:badge")).toBeNull();
  });

  it("keeps legacy suggestion cache readable only without a field signature", () => {
    const storageKey = "collection-table-suggestions:legacy";
    const groups = [
      {
        fieldId: "location",
        items: [{ fieldId: "location", id: "dock", value: "Dock" }],
        label: "Location",
      },
    ];

    writePersistedCollectionTableSuggestions(storageKey, groups);

    expect(readPersistedCollectionTableSuggestions(storageKey)).toEqual(groups);
    expect(readPersistedCollectionTableSuggestions(storageKey, "location:text")).toBeNull();
  });
});
