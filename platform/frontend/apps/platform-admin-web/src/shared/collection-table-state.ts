import type { TableDensity } from "@platform/ui-kit";

import type { CollectionPageConfig, CollectionPageRow } from "./collection-page";
import type {
  CollectionTableQueryRequest,
  CollectionTableQuickFilter,
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionGroup,
  CollectionTableSortDirection,
} from "./collection-table-contract";

const COLLECTION_TABLE_STATE_STORAGE_PREFIX = "collection-table-state:";
const COLLECTION_TABLE_SUGGESTIONS_STORAGE_PREFIX = "collection-table-suggestions:";

export type CollectionTableQueryState = {
  filters: Record<string, string>;
  page: number;
  pageSize: number;
  presetId: string;
  quickFilters: ReadonlyArray<CollectionTableQuickFilter>;
  sortColumnId: string | null;
  sortDirection: CollectionTableSortDirection;
};

export type CollectionTableState = {
  density: TableDensity;
  query: CollectionTableQueryState;
  visibleColumnIds: string[];
};

export type PersistedCollectionTableState = {
  draftSearchFieldId: string;
  draftSearchOperator: CollectionTableSearchOperator;
  queryState: CollectionTableQueryState;
};

export function createCollectionTableState<Row extends CollectionPageRow>(
  config: CollectionPageConfig<Row>,
): CollectionTableState {
  const presetId = config.presets?.[0]?.id ?? "all";

  return {
    density: "comfortable",
    query: {
      filters: {},
      page: 1,
      pageSize: config.pageSizeOptions?.[0] ?? 25,
      presetId,
      quickFilters: [],
      sortColumnId: config.columns.find((column) => column.sortable)?.id ?? config.columns[0]?.id ?? null,
      sortDirection: "asc",
    },
    visibleColumnIds: config.columns
      .filter((column) => column.defaultVisible !== false)
      .map((column) => column.id),
  };
}

export function restoreCollectionTableState(
  baseState: CollectionTableState,
  persistedState: PersistedCollectionTableState | null,
): CollectionTableState {
  if (!persistedState) {
    return baseState;
  }

  return {
    ...baseState,
    query: persistedState.queryState,
  };
}

export function toCollectionTableQueryRequest(
  state: CollectionTableState,
): CollectionTableQueryRequest {
  return {
    filters: state.query.filters,
    page: state.query.page,
    pageSize: state.query.pageSize,
    presetId: state.query.presetId,
    quickFilters: state.query.quickFilters,
    sort: {
      columnId: state.query.sortColumnId,
      direction: state.query.sortDirection,
    },
  };
}

export function getCollectionTableStateStorageKey(tableId: string) {
  return `${COLLECTION_TABLE_STATE_STORAGE_PREFIX}${tableId}`;
}

export function getCollectionTableSuggestionsStorageKey(tableId: string) {
  return `${COLLECTION_TABLE_SUGGESTIONS_STORAGE_PREFIX}${tableId}`;
}

export function readPersistedCollectionTableState(
  storageKey: string,
): PersistedCollectionTableState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedCollectionTableState>;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const queryState = parsed.queryState;

    return {
      draftSearchFieldId:
        typeof parsed.draftSearchFieldId === "string"
          ? parsed.draftSearchFieldId
          : "all",
      draftSearchOperator:
        typeof parsed.draftSearchOperator === "string"
          ? (parsed.draftSearchOperator as CollectionTableSearchOperator)
          : "contains",
      queryState: {
        filters:
          queryState && typeof queryState.filters === "object" && queryState.filters
            ? queryState.filters
            : {},
        page: queryState && typeof queryState.page === "number" ? queryState.page : 1,
        pageSize:
          queryState && typeof queryState.pageSize === "number"
            ? queryState.pageSize
            : 25,
        presetId:
          queryState && typeof queryState.presetId === "string"
            ? queryState.presetId
            : "all",
        quickFilters:
          queryState && Array.isArray(queryState.quickFilters)
            ? queryState.quickFilters
            : [],
        sortColumnId:
          queryState &&
          (typeof queryState.sortColumnId === "string" ||
            queryState.sortColumnId === null)
            ? queryState.sortColumnId
            : null,
        sortDirection:
          queryState?.sortDirection === "asc" || queryState?.sortDirection === "desc"
            ? queryState.sortDirection
            : "asc",
      },
    };
  } catch {
    return null;
  }
}

export function writePersistedCollectionTableState(
  storageKey: string,
  value: PersistedCollectionTableState,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(value));
  } catch {}
}

export function clearPersistedCollectionTableState(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {}
}

export function readPersistedCollectionTableSuggestions(
  storageKey: string,
): ReadonlyArray<CollectionTableSearchSuggestionGroup> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed as ReadonlyArray<CollectionTableSearchSuggestionGroup>;
  } catch {
    return null;
  }
}

export function writePersistedCollectionTableSuggestions(
  storageKey: string,
  groups: ReadonlyArray<CollectionTableSearchSuggestionGroup>,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(groups));
  } catch {}
}
