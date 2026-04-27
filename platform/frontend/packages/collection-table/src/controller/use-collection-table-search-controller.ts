import { useEffect, useState, type FocusEvent, type KeyboardEvent } from "react";

import type {
  CollectionTableFieldDefinition,
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionGroup,
  CollectionTableSearchSuggestionItem,
} from "../collection-table-contract";
import {
  filterSearchSuggestionGroups,
  getDefaultSearchOperator,
} from "../collection-table-runtime";
import {
  getNextHighlightedSearchSuggestionKey,
  getNextSearchOperator,
  getSearchSuggestionSupport,
  getSuggestionQuickFilterFieldId,
} from "./collection-table-search-controller-helpers";
import { getSearchSuggestionKey } from "./collection-table-search-suggestions";
import { useCollectionTableSearchDerivedState } from "./use-collection-table-search-derived-state";

const DEFAULT_OPERATOR: CollectionTableSearchOperator = "contains";

type UseCollectionTableSearchControllerParams = {
  allFieldLabel: string;
  defaultSearchFieldId: string;
  ensureSearchSuggestionsLoaded: (options?: { revalidateOnCache?: boolean }) => Promise<ReadonlyArray<CollectionTableSearchSuggestionGroup>>;
  initialDraftSearchFieldId: string;
  initialDraftSearchOperator: CollectionTableSearchOperator;
  metaVersion: number;
  onApplyQuickFilterValue: (
    fieldId: string,
    operator: CollectionTableSearchOperator,
    query: string,
  ) => boolean;
  searchOperators: ReadonlyArray<{ label: string; value: CollectionTableSearchOperator }>;
  searchSuggestionGroups: ReadonlyArray<CollectionTableSearchSuggestionGroup>;
  tableFields: ReadonlyArray<CollectionTableFieldDefinition>;
  tableId: string;
};

export function useCollectionTableSearchController({
  allFieldLabel,
  defaultSearchFieldId,
  ensureSearchSuggestionsLoaded,
  initialDraftSearchFieldId,
  initialDraftSearchOperator,
  metaVersion,
  onApplyQuickFilterValue,
  searchOperators,
  searchSuggestionGroups,
  tableFields,
  tableId,
}: UseCollectionTableSearchControllerParams) {
  const [draftSearchFieldId, setDraftSearchFieldId] = useState(initialDraftSearchFieldId);
  const [draftSearchOperator, setDraftSearchOperator] = useState<CollectionTableSearchOperator>(initialDraftSearchOperator);
  const [draftSearchQuery, setDraftSearchQuery] = useState("");
  const [isSearchSuggestionOpen, setIsSearchSuggestionOpen] = useState(false);
  const [highlightedSuggestionKey, setHighlightedSuggestionKey] = useState<string | null>(null);
  const searchSuggestionListboxId = `${tableId}-search-suggestions`;

  const {
    allowedSearchOperators,
    flattenedVisibleSearchSuggestions,
    highlightedSearchSuggestion,
    highlightedSearchSuggestionOptionId,
    searchFieldOptions,
    selectableSearchOperators,
    selectedSearchField,
    selectedSearchFieldKind,
    shouldRenderSearchSuggestions,
    supportsSearchSuggestions,
    usesDateSearchInput,
    visibleSearchSuggestionGroups,
  } = useCollectionTableSearchDerivedState({
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
  });

  function closeSearchSuggestions() {
    setIsSearchSuggestionOpen(false);
    setHighlightedSuggestionKey(null);
  }

  function resetSearchDraft(nextFieldId = "all") {
    setDraftSearchFieldId(nextFieldId);
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    closeSearchSuggestions();
  }

  function applyQuickFilterValue(
    fieldId: string,
    operator: CollectionTableSearchOperator,
    query: string,
  ) {
    if (!onApplyQuickFilterValue(fieldId, operator, query)) {
      return;
    }

    setDraftSearchQuery("");
    closeSearchSuggestions();
  }

  function applyDraftFilterWithQuery(nextQuery: string) {
    applyQuickFilterValue(draftSearchFieldId, draftSearchOperator, nextQuery);
  }

  function applyDraftFilter() {
    applyDraftFilterWithQuery(draftSearchQuery);
  }

  function applySuggestion(suggestion: CollectionTableSearchSuggestionItem) {
    const nextFieldId = getSuggestionQuickFilterFieldId(draftSearchFieldId, suggestion);

    applyQuickFilterValue(
      nextFieldId,
      nextFieldId === "all" ? DEFAULT_OPERATOR : draftSearchOperator,
      suggestion.value,
    );
  }

  async function openSearchSuggestions() {
    if (!supportsSearchSuggestions) {
      closeSearchSuggestions();
      return;
    }

    const loadedGroups = await ensureSearchSuggestionsLoaded({ revalidateOnCache: true });
    const nextVisibleGroups = filterSearchSuggestionGroups(
      loadedGroups,
      draftSearchFieldId,
      draftSearchQuery,
    );

    setIsSearchSuggestionOpen(nextVisibleGroups.length > 0);
  }

  function handleSearchFieldChange(nextFieldId: string) {
    const {
      nextField,
      nextFieldKind,
      nextOperator,
    } = getNextSearchOperator({
      currentOperator: draftSearchOperator,
      nextFieldId,
      tableFields,
    });

    setDraftSearchFieldId(nextFieldId);
    setDraftSearchOperator(nextOperator);
    setHighlightedSuggestionKey(null);

    const {
      supportsSearchSuggestions: nextSupportsSearchSuggestions,
    } = getSearchSuggestionSupport({
      draftSearchFieldId: nextFieldId,
      draftSearchOperator: nextOperator,
      selectedSearchField: nextField,
      selectedSearchFieldKind: nextFieldKind,
    });

    if (nextSupportsSearchSuggestions) {
      void ensureSearchSuggestionsLoaded();
      setIsSearchSuggestionOpen(true);
      return;
    }

    closeSearchSuggestions();
  }

  function handleSearchOperatorChange(nextOperator: CollectionTableSearchOperator) {
    const {
      supportsSearchSuggestions: nextSupportsSearchSuggestions,
    } = getSearchSuggestionSupport({
      draftSearchFieldId,
      draftSearchOperator: nextOperator,
      selectedSearchField,
      selectedSearchFieldKind,
    });

    setDraftSearchOperator(nextOperator);
    setHighlightedSuggestionKey(null);

    if (nextSupportsSearchSuggestions) {
      void ensureSearchSuggestionsLoaded();
      setIsSearchSuggestionOpen(true);
      return;
    }

    closeSearchSuggestions();
  }

  function handleDateSearchValueChange(nextValue: string) {
    setDraftSearchQuery(nextValue);

    if (nextValue.length > 0) {
      applyDraftFilterWithQuery(nextValue);
    }
  }

  function handleSearchInputChange(nextQuery: string) {
    setDraftSearchQuery(nextQuery);
    setHighlightedSuggestionKey(null);

    if (supportsSearchSuggestions) {
      void ensureSearchSuggestionsLoaded();
      setIsSearchSuggestionOpen(true);
      return;
    }

    closeSearchSuggestions();
  }

  function handleSearchInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearchSuggestions();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (flattenedVisibleSearchSuggestions.length === 0) {
        return;
      }

      setIsSearchSuggestionOpen(true);
      setHighlightedSuggestionKey(
        getNextHighlightedSearchSuggestionKey({
          currentKey: highlightedSuggestionKey,
          direction: event.key === "ArrowDown" ? "down" : "up",
          suggestions: flattenedVisibleSearchSuggestions,
        }),
      );
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (highlightedSearchSuggestion) {
      applySuggestion(highlightedSearchSuggestion);
      return;
    }

    applyDraftFilter();
  }

  function handleSearchShellFocusCapture() {
    if (!supportsSearchSuggestions || metaVersion === 0) {
      return;
    }

    void ensureSearchSuggestionsLoaded({ revalidateOnCache: true });
  }

  function handleSearchShellBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocusedElement = event.relatedTarget;

    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
      return;
    }

    closeSearchSuggestions();
  }

  function handleSuggestionMouseDown(suggestion: CollectionTableSearchSuggestionItem) {
    setHighlightedSuggestionKey(getSearchSuggestionKey(suggestion));
  }

  function handleSuggestionMouseMove(suggestion: CollectionTableSearchSuggestionItem) {
    const nextSuggestionKey = getSearchSuggestionKey(suggestion);

    if (highlightedSuggestionKey !== nextSuggestionKey) {
      setHighlightedSuggestionKey(nextSuggestionKey);
    }
  }

  useEffect(() => {
    const searchableFieldIds = new Set(
      tableFields
        .filter((field) => field.searchable)
        .map((field) => field.id),
    );
    if (draftSearchFieldId !== "all" && !searchableFieldIds.has(draftSearchFieldId)) {
      setDraftSearchFieldId(defaultSearchFieldId);
    }
  }, [defaultSearchFieldId, draftSearchFieldId, tableFields]);

  useEffect(() => {
    if (allowedSearchOperators.includes(draftSearchOperator)) {
      return;
    }

    setDraftSearchOperator(getDefaultSearchOperator(selectedSearchFieldKind));
  }, [allowedSearchOperators, draftSearchOperator, selectedSearchFieldKind]);

  useEffect(() => {
    if (!supportsSearchSuggestions) {
      setIsSearchSuggestionOpen(false);
    }

    setHighlightedSuggestionKey(null);
  }, [draftSearchFieldId, draftSearchOperator, draftSearchQuery, supportsSearchSuggestions]);

  useEffect(() => {
    if (!isSearchSuggestionOpen) {
      return;
    }

    setIsSearchSuggestionOpen(visibleSearchSuggestionGroups.length > 0);
  }, [isSearchSuggestionOpen, visibleSearchSuggestionGroups.length]);

  useEffect(() => {
    if (
      !isSearchSuggestionOpen ||
      !highlightedSearchSuggestionOptionId ||
      typeof document === "undefined"
    ) {
      return;
    }

    document.getElementById(highlightedSearchSuggestionOptionId)?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedSearchSuggestionOptionId, isSearchSuggestionOpen]);

  return {
    applySuggestion,
    closeSearchSuggestions,
    draftSearchFieldId,
    draftSearchOperator,
    draftSearchQuery,
    handleDateSearchValueChange,
    handleSearchFieldChange,
    handleSearchInputChange,
    handleSearchInputKeyDown,
    handleSearchOperatorChange,
    handleSearchShellBlur,
    handleSearchShellFocusCapture,
    handleSuggestionMouseDown,
    handleSuggestionMouseMove,
    highlightedSearchSuggestionOptionId,
    highlightedSuggestionKey,
    openSearchSuggestions,
    resetSearchDraft,
    searchFieldOptions,
    searchSuggestionListboxId,
    selectableSearchOperators,
    shouldRenderSearchSuggestions,
    usesDateSearchInput,
    visibleSearchSuggestionGroups,
  };
}
