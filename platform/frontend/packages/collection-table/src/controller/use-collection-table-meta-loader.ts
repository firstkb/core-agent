import { useEffect, type Dispatch, type SetStateAction } from "react";

import type {
  CollectionTableAdapter,
  CollectionTableMetaResponse,
  CollectionTableSavedFilterSet,
} from "../collection-table-contract";
import type {
  CollectionTableState,
  PersistedCollectionTableState,
} from "../collection-table-state";
import { resolveCollectionStateForMeta } from "../collection-table-runtime";

type MutableRef<T> = {
  current: T;
};

type UseCollectionTableMetaLoaderParams = {
  hasHydratedMetaRef: MutableRef<boolean>;
  initialPersistedState: PersistedCollectionTableState | null;
  isIgnorableError?: (error: unknown) => boolean;
  metaRefreshKey: number;
  remoteMetadataErrorMessage: string;
  setCollectionState: Dispatch<SetStateAction<CollectionTableState>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMetaVersion: Dispatch<SetStateAction<number>>;
  setSavedFilterSets: Dispatch<SetStateAction<ReadonlyArray<CollectionTableSavedFilterSet>>>;
  setTableMeta: Dispatch<SetStateAction<CollectionTableMetaResponse>>;
  tableAdapter: CollectionTableAdapter;
};

export function useCollectionTableMetaLoader({
  hasHydratedMetaRef,
  initialPersistedState,
  isIgnorableError,
  metaRefreshKey,
  remoteMetadataErrorMessage,
  setCollectionState,
  setError,
  setLoading,
  setMetaVersion,
  setSavedFilterSets,
  setTableMeta,
  tableAdapter,
}: UseCollectionTableMetaLoaderParams) {
  useEffect(() => {
    let cancelled = false;

    async function resolveCollectionMeta() {
      setLoading(true);
      setError(null);

      try {
        const nextMeta = await tableAdapter.loadMeta();

        if (cancelled) {
          return;
        }

        setTableMeta(nextMeta);
        setSavedFilterSets(nextMeta.savedFilterSets ?? []);
        setCollectionState((currentValue) =>
          resolveCollectionStateForMeta(
            nextMeta,
            currentValue,
            initialPersistedState,
            hasHydratedMetaRef.current,
          ),
        );
        hasHydratedMetaRef.current = true;
        setMetaVersion((currentValue) => currentValue + 1);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (!isIgnorableError?.(requestError)) {
          setError(remoteMetadataErrorMessage);
        }

        setLoading(false);
      }
    }

    void resolveCollectionMeta();

    return () => {
      cancelled = true;
    };
  }, [
    hasHydratedMetaRef,
    initialPersistedState,
    isIgnorableError,
    metaRefreshKey,
    remoteMetadataErrorMessage,
    setCollectionState,
    setError,
    setLoading,
    setMetaVersion,
    setSavedFilterSets,
    setTableMeta,
    tableAdapter,
  ]);
}
