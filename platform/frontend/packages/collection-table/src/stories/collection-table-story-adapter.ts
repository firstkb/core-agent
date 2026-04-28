import {
  type CollectionTableAdapter,
  type CollectionTableQueryRequest,
  type CollectionTableQueryResponse,
  type CollectionTableRowData,
} from "../index";
import { safetyTableMeta } from "./collection-table-story-meta";
import { readyRows } from "./collection-table-story-rows";
import { searchSuggestions } from "./collection-table-story-suggestions";

type StoryAdapterOptions = {
  queryDelayMs?: number;
  rows?: ReadonlyArray<CollectionTableRowData>;
};

export function createCollectionTableAdapter({
  queryDelayMs = 0,
  rows = readyRows,
}: StoryAdapterOptions = {}): CollectionTableAdapter {
  return {
    createSavedFilterSet: async (input) => ({
      id: `story-filter-${Date.now()}`,
      label: input.label,
      quickFilters: input.quickFilters,
    }),
    deleteSavedFilterSet: async () => undefined,
    exportXls: async () => undefined,
    loadMeta: async () => safetyTableMeta,
    loadSearchSuggestions: async () => searchSuggestions,
    query: async (request) => {
      if (queryDelayMs > 0) {
        await wait(queryDelayMs);
      }

      return createQueryResponse(rows, request);
    },
    runBulkAction: async () => undefined,
    runRowAction: async () => undefined,
    toggleFavorite: async () => ({
      isFavorite: true,
    }),
  };
}

export function createLoadingAdapter(): CollectionTableAdapter {
  return {
    ...createCollectionTableAdapter(),
    query: () => new Promise<CollectionTableQueryResponse>(() => undefined),
  };
}

export function createErrorAdapter(): CollectionTableAdapter {
  return {
    ...createCollectionTableAdapter(),
    query: async () => {
      throw new Error("Storybook forced collection table request failure.");
    },
  };
}

function createQueryResponse(
  rows: ReadonlyArray<CollectionTableRowData>,
  request: CollectionTableQueryRequest,
): CollectionTableQueryResponse {
  const pageSize = Math.max(request.pageSize, 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(request.page, 1), totalPages);
  const offset = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    rows: rows.slice(offset, offset + pageSize),
    totalItems: rows.length,
    totalPages,
  };
}

function wait(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}
