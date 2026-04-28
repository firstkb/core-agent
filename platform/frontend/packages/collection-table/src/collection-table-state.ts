import type { TableDensity } from "@platform/ui-kit";

import type {
  CollectionTableColumnDefinition,
  CollectionTableFieldDefinition,
  CollectionTableQueryRequest,
  CollectionTableQuickFilter,
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionGroup,
  CollectionTableSortDirection,
} from "./collection-table-contract";

const COLLECTION_TABLE_STATE_STORAGE_PREFIX = "collection-table-state:";
const COLLECTION_TABLE_SUGGESTIONS_STORAGE_PREFIX = "collection-table-suggestions:";
const collectionTableSearchOperators = new Set<CollectionTableSearchOperator>([
  "contains",
  "is_empty",
  "is_equal_to",
  "is_greater_or_equal_to",
  "is_greater_than",
  "is_less_or_equal_to",
  "is_less_than",
  "is_not_empty",
  "is_not_equal_to",
]);

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

type PersistedCollectionTableSuggestions = {
  fieldSignature: string;
  groups: ReadonlyArray<CollectionTableSearchSuggestionGroup>;
};

export type CollectionTableStateConfig = {
  columns: ReadonlyArray<Pick<CollectionTableColumnDefinition, "defaultVisible" | "id">>;
  defaultSortColumnId?: string | null;
  defaultSortDirection?: CollectionTableSortDirection;
  pageSizeOptions?: readonly number[];
  presetId?: string;
};

function getNormalizedQuickFilterFieldId(candidate: Partial<CollectionTableQuickFilter>) {
  if (typeof candidate.fieldId === "string" && candidate.fieldId.trim().length > 0) {
    return candidate.fieldId.trim();
  }

  if (typeof candidate.id === "string") {
    const [derivedFieldId] = candidate.id.split(":");

    if (
      derivedFieldId &&
      derivedFieldId !== "undefined" &&
      derivedFieldId !== "null"
    ) {
      return derivedFieldId;
    }
  }

  return "all";
}

function normalizeCollectionTableQuickFilter(
  candidate: unknown,
): CollectionTableQuickFilter | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const rawFilter = candidate as Partial<CollectionTableQuickFilter>;
  const fieldId = getNormalizedQuickFilterFieldId(rawFilter);
  const operator =
    typeof rawFilter.operator === "string" &&
    collectionTableSearchOperators.has(rawFilter.operator as CollectionTableSearchOperator)
      ? rawFilter.operator as CollectionTableSearchOperator
      : "contains";
  const normalizedOperator = fieldId === "all" ? "contains" : operator;
  const value = typeof rawFilter.value === "string" ? rawFilter.value.trim() : "";

  if (
    normalizedOperator !== "is_empty" &&
    normalizedOperator !== "is_not_empty" &&
    value.length === 0
  ) {
    return null;
  }

  return {
    fieldId,
    id: `${fieldId}:${normalizedOperator}:${value.toLowerCase()}`,
    operator: normalizedOperator,
    value,
  };
}

function normalizeCollectionTableQuickFilters(
  quickFilters: unknown,
): ReadonlyArray<CollectionTableQuickFilter> {
  if (!Array.isArray(quickFilters)) {
    return [];
  }

  return quickFilters
    .map((quickFilter) => normalizeCollectionTableQuickFilter(quickFilter))
    .filter((quickFilter): quickFilter is CollectionTableQuickFilter => quickFilter !== null);
}

export function createCollectionTableState(
  config: CollectionTableStateConfig,
): CollectionTableState {
  const presetId = config.presetId ?? "all";

  return {
    density: "comfortable",
    query: {
      filters: {},
      page: 1,
      pageSize: config.pageSizeOptions?.[0] ?? 25,
      presetId,
      quickFilters: [],
      sortColumnId: config.defaultSortColumnId ?? config.columns[0]?.id ?? null,
      sortDirection: config.defaultSortDirection ?? "asc",
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
    quickFilters: normalizeCollectionTableQuickFilters(state.query.quickFilters),
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

export function createCollectionTableSuggestionsFieldSignature(
  fields: ReadonlyArray<CollectionTableFieldDefinition>,
) {
  return fields
    .filter((field) => field.suggestable)
    .map((field) => `${field.id}:${field.type}`)
    .sort((left, right) => left.localeCompare(right))
    .join("|");
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
        quickFilters: normalizeCollectionTableQuickFilters(queryState?.quickFilters),
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
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        ...value,
        queryState: {
          ...value.queryState,
          quickFilters: normalizeCollectionTableQuickFilters(value.queryState.quickFilters),
        },
      } satisfies PersistedCollectionTableState),
    );
  } catch {
    // Ignore unavailable or full sessionStorage.
  }
}

export function clearPersistedCollectionTableState(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore unavailable sessionStorage.
  }
}

export function readPersistedCollectionTableSuggestions(
  storageKey: string,
  fieldSignature?: string,
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
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const suggestionState = parsed as Partial<PersistedCollectionTableSuggestions>;

      if (!Array.isArray(suggestionState.groups)) {
        return null;
      }

      if (
        fieldSignature &&
        typeof suggestionState.fieldSignature === "string" &&
        suggestionState.fieldSignature !== fieldSignature
      ) {
        return null;
      }

      if (fieldSignature && typeof suggestionState.fieldSignature !== "string") {
        return null;
      }

      return suggestionState.groups;
    }

    if (fieldSignature) {
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
  fieldSignature?: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify(
        fieldSignature
          ? {
            fieldSignature,
            groups,
          } satisfies PersistedCollectionTableSuggestions
          : groups,
      ),
    );
  } catch {
    // Ignore unavailable or full sessionStorage.
  }
}
