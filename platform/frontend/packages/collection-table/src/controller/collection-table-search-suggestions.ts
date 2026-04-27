import type { CollectionTableSearchSuggestionItem } from "../collection-table-contract";

export function getSearchSuggestionOptionId(tableId: string, suggestionId: string) {
  return `${tableId}-search-suggestion-${suggestionId}`;
}

export function getSearchSuggestionKey(suggestion: CollectionTableSearchSuggestionItem) {
  return `${suggestion.fieldId}:${suggestion.id}:${suggestion.value}`;
}
