import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type {
  CollectionTableAdapter,
  CollectionTableFieldDefinition,
  CollectionTableSearchSuggestionGroup,
} from "../collection-table-contract";
import {
  createCollectionTableSuggestionsFieldSignature,
  readPersistedCollectionTableSuggestions,
  writePersistedCollectionTableSuggestions,
} from "../collection-table-state";
import { filterCompatibleSearchSuggestionGroups } from "../collection-table-runtime";

type UseCollectionTableSearchSuggestionsParams = {
  isIgnorableError?: (error: unknown) => boolean;
  remoteMetadataErrorMessage: string;
  setError: Dispatch<SetStateAction<string | null>>;
  tableAdapter: CollectionTableAdapter;
  tableFields: ReadonlyArray<CollectionTableFieldDefinition>;
  tableSuggestionsStorageKey: string;
};

export function useCollectionTableSearchSuggestions({
  isIgnorableError,
  remoteMetadataErrorMessage,
  setError,
  tableAdapter,
  tableFields,
  tableSuggestionsStorageKey,
}: UseCollectionTableSearchSuggestionsParams) {
  const [searchSuggestionGroups, setSearchSuggestionGroups] = useState<ReadonlyArray<CollectionTableSearchSuggestionGroup>>([]);
  const searchSuggestionsLoadPromise = useRef<Promise<ReadonlyArray<CollectionTableSearchSuggestionGroup>> | null>(null);
  const hasRevalidatedSearchSuggestionsForMeta = useRef(false);
  const suggestionFieldSignature = useMemo(
    () => createCollectionTableSuggestionsFieldSignature(tableFields),
    [tableFields],
  );

  useEffect(() => {
    const persistedSuggestionGroups = readPersistedCollectionTableSuggestions(
      tableSuggestionsStorageKey,
      suggestionFieldSignature,
    ) ?? [];
    const compatibleSuggestionGroups = filterCompatibleSearchSuggestionGroups(
      persistedSuggestionGroups,
      tableFields,
    );

    hasRevalidatedSearchSuggestionsForMeta.current = false;
    searchSuggestionsLoadPromise.current = null;
    setSearchSuggestionGroups(compatibleSuggestionGroups);
  }, [suggestionFieldSignature, tableFields, tableSuggestionsStorageKey]);

  function reportCollectionError(requestError: unknown) {
    if (isIgnorableError?.(requestError)) {
      return;
    }

    setError(remoteMetadataErrorMessage);
  }

  function getCompatibleCachedSearchSuggestionGroups() {
    const inMemoryGroups = filterCompatibleSearchSuggestionGroups(
      searchSuggestionGroups,
      tableFields,
    );

    if (inMemoryGroups.length > 0) {
      return inMemoryGroups;
    }

    return readPersistedCollectionTableSuggestions(
      tableSuggestionsStorageKey,
      suggestionFieldSignature,
    ) ?? [];
  }

  async function refreshSearchSuggestions() {
    if (searchSuggestionsLoadPromise.current) {
      return searchSuggestionsLoadPromise.current;
    }

    const loadPromise = (async () => {
      try {
        const nextGroups = filterCompatibleSearchSuggestionGroups(
          (await tableAdapter.loadSearchSuggestions?.())?.groups ?? [],
          tableFields,
        );

        hasRevalidatedSearchSuggestionsForMeta.current = true;
        setSearchSuggestionGroups(nextGroups);
        writePersistedCollectionTableSuggestions(
          tableSuggestionsStorageKey,
          nextGroups,
          suggestionFieldSignature,
        );

        return nextGroups;
      } catch (requestError) {
        reportCollectionError(requestError);
        return getCompatibleCachedSearchSuggestionGroups();
      }
    })();

    searchSuggestionsLoadPromise.current = loadPromise;

    try {
      return await loadPromise;
    } finally {
      searchSuggestionsLoadPromise.current = null;
    }
  }

  async function ensureSearchSuggestionsLoaded(options?: { revalidateOnCache?: boolean }) {
    const compatibleCachedGroups = getCompatibleCachedSearchSuggestionGroups();
    const shouldRevalidateOnCache = options?.revalidateOnCache === true;

    if (compatibleCachedGroups.length > 0) {
      if (searchSuggestionGroups !== compatibleCachedGroups) {
        setSearchSuggestionGroups(compatibleCachedGroups);
      }

      if (
        shouldRevalidateOnCache &&
        !hasRevalidatedSearchSuggestionsForMeta.current
      ) {
        void refreshSearchSuggestions();
      }

      return compatibleCachedGroups;
    }

    return refreshSearchSuggestions();
  }

  return {
    ensureSearchSuggestionsLoaded,
    searchSuggestionGroups,
  };
}
