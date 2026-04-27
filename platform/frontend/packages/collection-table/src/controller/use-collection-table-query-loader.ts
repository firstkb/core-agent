import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import type {
  CollectionTableAdapter,
  CollectionTableQueryRequest,
} from "../collection-table-contract";
import type { CollectionTableState } from "../collection-table-state";
import {
  normalizeCollectionRows,
  type CollectionTableRenderRow,
} from "../collection-table-runtime";

type UseCollectionTableQueryLoaderParams = {
  isIgnorableError?: (error: unknown) => boolean;
  metaVersion: number;
  queryRefreshKey: number;
  remoteMetadataErrorMessage: string;
  request: CollectionTableQueryRequest;
  setCollectionState: Dispatch<SetStateAction<CollectionTableState>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setResolvedRows: Dispatch<SetStateAction<ReadonlyArray<CollectionTableRenderRow>>>;
  setTotalItems: Dispatch<SetStateAction<number>>;
  setTotalPages: Dispatch<SetStateAction<number>>;
  tableAdapter: CollectionTableAdapter;
};

export function useCollectionTableQueryLoader({
  isIgnorableError,
  metaVersion,
  queryRefreshKey,
  remoteMetadataErrorMessage,
  request,
  setCollectionState,
  setError,
  setLoading,
  setResolvedRows,
  setTotalItems,
  setTotalPages,
  tableAdapter,
}: UseCollectionTableQueryLoaderParams) {
  const lastQueryExecutionKeyRef = useRef<string | null>(null);

  function reportCollectionError(requestError: unknown) {
    if (isIgnorableError?.(requestError)) {
      return;
    }

    setError(remoteMetadataErrorMessage);
  }

  function applyResolvedQueryResponse(
    response: Awaited<ReturnType<CollectionTableAdapter["query"]>>,
    requestInput: CollectionTableQueryRequest,
  ) {
    setResolvedRows(normalizeCollectionRows(response.rows));
    setTotalItems(response.totalItems);
    setTotalPages(response.totalPages);
    setLoading(false);

    if (response.page !== requestInput.page) {
      setCollectionState((currentValue) =>
        currentValue.query.page === response.page
          ? currentValue
          : {
            ...currentValue,
            query: {
              ...currentValue.query,
              page: response.page,
            },
          },
      );
    }
  }

  async function reloadCurrentQuery() {
    setLoading(true);
    setError(null);

    try {
      const response = await tableAdapter.query(request);
      applyResolvedQueryResponse(response, request);
    } catch (requestError) {
      reportCollectionError(requestError);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (metaVersion === 0) {
      return;
    }

    const queryExecutionKey = JSON.stringify({
      metaVersion,
      queryRefreshKey,
      request,
    });

    if (lastQueryExecutionKeyRef.current === queryExecutionKey) {
      return;
    }

    lastQueryExecutionKeyRef.current = queryExecutionKey;

    let cancelled = false;

    async function resolveCollectionRows() {
      setLoading(true);
      setError(null);

      try {
        const response = await tableAdapter.query(request);

        if (cancelled) {
          return;
        }

        applyResolvedQueryResponse(response, request);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        reportCollectionError(requestError);
        setLoading(false);
      }
    }

    void resolveCollectionRows();

    return () => {
      cancelled = true;
    };
  }, [
    isIgnorableError,
    metaVersion,
    queryRefreshKey,
    remoteMetadataErrorMessage,
    request,
    setCollectionState,
    setError,
    setLoading,
    setResolvedRows,
    setTotalItems,
    setTotalPages,
    tableAdapter,
  ]);

  return {
    reloadCurrentQuery,
  };
}
