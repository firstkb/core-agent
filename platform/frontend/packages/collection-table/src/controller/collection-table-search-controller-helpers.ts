import type {
  CollectionTableFieldDefinition,
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionItem,
} from "../collection-table-contract";
import {
  doesSearchOperatorRequireValue,
  getAllowedSearchOperators,
  getDefaultSearchOperator,
  getSearchFieldKind,
  type SearchFieldKind,
} from "../collection-table-runtime";
import { getSearchSuggestionKey } from "./collection-table-search-suggestions";

export function getSelectedSearchField(
  tableFields: ReadonlyArray<CollectionTableFieldDefinition>,
  fieldId: string,
) {
  return fieldId === "all"
    ? null
    : tableFields.find((field) => field.id === fieldId && field.searchable) ?? null;
}

export function getSelectedSearchFieldKind(
  selectedSearchField: CollectionTableFieldDefinition | null,
): SearchFieldKind {
  return selectedSearchField ? getSearchFieldKind(selectedSearchField.type) : "all";
}

export function getSearchSuggestionSupport({
  draftSearchFieldId,
  draftSearchOperator,
  selectedSearchField,
  selectedSearchFieldKind,
}: {
  draftSearchFieldId: string;
  draftSearchOperator: CollectionTableSearchOperator;
  selectedSearchField: CollectionTableFieldDefinition | null;
  selectedSearchFieldKind: SearchFieldKind;
}) {
  const usesDateSearchInput =
    selectedSearchFieldKind === "date" && doesSearchOperatorRequireValue(draftSearchOperator);

  return {
    supportsSearchSuggestions:
      doesSearchOperatorRequireValue(draftSearchOperator) &&
      !usesDateSearchInput &&
      (draftSearchFieldId === "all" || Boolean(selectedSearchField?.suggestable)),
    usesDateSearchInput,
  };
}

export function getNextSearchOperator({
  currentOperator,
  nextFieldId,
  tableFields,
}: {
  currentOperator: CollectionTableSearchOperator;
  nextFieldId: string;
  tableFields: ReadonlyArray<CollectionTableFieldDefinition>;
}) {
  const nextField = getSelectedSearchField(tableFields, nextFieldId);
  const nextFieldKind = getSelectedSearchFieldKind(nextField);
  const nextAllowedOperators = getAllowedSearchOperators(nextFieldKind);
  const nextOperator = nextAllowedOperators.includes(currentOperator)
    ? currentOperator
    : getDefaultSearchOperator(nextFieldKind);

  return {
    nextField,
    nextFieldKind,
    nextOperator,
  };
}

export function getSuggestionQuickFilterFieldId(
  draftSearchFieldId: string,
  suggestion: CollectionTableSearchSuggestionItem,
) {
  if (draftSearchFieldId !== "all") {
    return draftSearchFieldId;
  }

  return typeof suggestion.fieldId === "string" && suggestion.fieldId.trim().length > 0
    ? suggestion.fieldId
    : "all";
}

export function getHighlightedSearchSuggestion(
  suggestions: ReadonlyArray<CollectionTableSearchSuggestionItem>,
  highlightedSuggestionKey: string | null,
) {
  return highlightedSuggestionKey
    ? suggestions.find((suggestion) => getSearchSuggestionKey(suggestion) === highlightedSuggestionKey) ?? null
    : null;
}

export function getNextHighlightedSearchSuggestionKey({
  currentKey,
  direction,
  suggestions,
}: {
  currentKey: string | null;
  direction: "down" | "up";
  suggestions: ReadonlyArray<CollectionTableSearchSuggestionItem>;
}) {
  if (suggestions.length === 0) {
    return null;
  }

  const currentIndex = currentKey
    ? suggestions.findIndex((suggestion) => getSearchSuggestionKey(suggestion) === currentKey)
    : direction === "down"
      ? -1
      : suggestions.length;
  const nextIndex = direction === "down"
    ? currentIndex >= suggestions.length - 1
      ? 0
      : currentIndex + 1
    : currentIndex <= 0
      ? suggestions.length - 1
      : currentIndex - 1;

  return suggestions[nextIndex] ? getSearchSuggestionKey(suggestions[nextIndex]) : null;
}
