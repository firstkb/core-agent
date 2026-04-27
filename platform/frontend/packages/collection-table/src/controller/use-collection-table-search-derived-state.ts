import { useMemo } from "react";

import type {
  CollectionTableFieldDefinition,
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionGroup,
} from "../collection-table-contract";
import {
  buildSearchFieldOptions,
  filterSearchSuggestionGroups,
  getAllowedSearchOperators,
} from "../collection-table-runtime";
import {
  getHighlightedSearchSuggestion,
  getSearchSuggestionSupport,
  getSelectedSearchField,
  getSelectedSearchFieldKind,
} from "./collection-table-search-controller-helpers";
import {
  getSearchSuggestionKey,
  getSearchSuggestionOptionId,
} from "./collection-table-search-suggestions";

type UseCollectionTableSearchDerivedStateParams = {
  allFieldLabel: string;
  draftSearchFieldId: string;
  draftSearchOperator: CollectionTableSearchOperator;
  draftSearchQuery: string;
  highlightedSuggestionKey: string | null;
  isSearchSuggestionOpen: boolean;
  searchOperators: ReadonlyArray<{ label: string; value: CollectionTableSearchOperator }>;
  searchSuggestionGroups: ReadonlyArray<CollectionTableSearchSuggestionGroup>;
  tableFields: ReadonlyArray<CollectionTableFieldDefinition>;
  tableId: string;
};

export function useCollectionTableSearchDerivedState({
  allFieldLabel,
  draftSearchFieldId,
  draftSearchOperator,
  draftSearchQuery,
  highlightedSuggestionKey,
  isSearchSuggestionOpen,
  searchOperators,
  searchSuggestionGroups,
  tableFields,
  tableId,
}: UseCollectionTableSearchDerivedStateParams) {
  const searchFieldOptions = useMemo(
    () => buildSearchFieldOptions(tableFields, allFieldLabel),
    [allFieldLabel, tableFields],
  );
  const selectedSearchField = useMemo(
    () => getSelectedSearchField(tableFields, draftSearchFieldId),
    [draftSearchFieldId, tableFields],
  );
  const selectedSearchFieldKind = useMemo(
    () => getSelectedSearchFieldKind(selectedSearchField),
    [selectedSearchField],
  );
  const allowedSearchOperators = useMemo(
    () => getAllowedSearchOperators(selectedSearchFieldKind),
    [selectedSearchFieldKind],
  );
  const selectableSearchOperators = useMemo(
    () => searchOperators.filter((option) => allowedSearchOperators.includes(option.value)),
    [allowedSearchOperators, searchOperators],
  );
  const {
    supportsSearchSuggestions,
    usesDateSearchInput,
  } = getSearchSuggestionSupport({
    draftSearchFieldId,
    draftSearchOperator,
    selectedSearchField,
    selectedSearchFieldKind,
  });
  const visibleSearchSuggestionGroups = useMemo(
    () =>
      supportsSearchSuggestions
        ? filterSearchSuggestionGroups(searchSuggestionGroups, draftSearchFieldId, draftSearchQuery)
        : [],
    [draftSearchFieldId, draftSearchQuery, searchSuggestionGroups, supportsSearchSuggestions],
  );
  const flattenedVisibleSearchSuggestions = useMemo(
    () => visibleSearchSuggestionGroups.flatMap((group) => group.items),
    [visibleSearchSuggestionGroups],
  );
  const highlightedSearchSuggestion = useMemo(
    () => getHighlightedSearchSuggestion(flattenedVisibleSearchSuggestions, highlightedSuggestionKey),
    [flattenedVisibleSearchSuggestions, highlightedSuggestionKey],
  );
  const highlightedSearchSuggestionOptionId = highlightedSearchSuggestion
    ? getSearchSuggestionOptionId(tableId, getSearchSuggestionKey(highlightedSearchSuggestion))
    : undefined;

  return {
    allowedSearchOperators,
    flattenedVisibleSearchSuggestions,
    highlightedSearchSuggestion,
    highlightedSearchSuggestionOptionId,
    searchFieldOptions,
    selectableSearchOperators,
    selectedSearchField,
    selectedSearchFieldKind,
    shouldRenderSearchSuggestions: isSearchSuggestionOpen && visibleSearchSuggestionGroups.length > 0,
    supportsSearchSuggestions,
    usesDateSearchInput,
    visibleSearchSuggestionGroups,
  };
}
