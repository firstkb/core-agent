import type { FocusEvent, KeyboardEvent } from "react";

import { useTranslation } from "@platform/i18n";
import {
  DatePicker,
  Input,
  SearchIcon,
  Select,
} from "@platform/ui-kit";

import type {
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionGroup,
  CollectionTableSearchSuggestionItem,
} from "../collection-table-contract";
import { renderHighlightedSuggestionText } from "../collection-table-render";
import type { SearchFieldOption } from "../collection-table-runtime";
import {
  getSearchSuggestionKey,
  getSearchSuggestionOptionId,
} from "../controller/collection-table-search-suggestions";

type CollectionTableSearchControlProps = {
  draftSearchFieldId: string;
  draftSearchOperator: CollectionTableSearchOperator;
  draftSearchQuery: string;
  highlightedSearchSuggestionOptionId?: string;
  highlightedSuggestionKey: string | null;
  onApplySuggestion: (suggestion: CollectionTableSearchSuggestionItem) => void;
  onDateSearchValueChange: (nextValue: string) => void;
  onSearchFieldChange: (fieldId: string) => void;
  onSearchInputChange: (nextQuery: string) => void;
  onSearchInputFocus: () => void;
  onSearchInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSearchOperatorChange: (operator: CollectionTableSearchOperator) => void;
  onSearchShellBlur: (event: FocusEvent<HTMLDivElement>) => void;
  onSearchShellFocusCapture: () => void;
  onSuggestionMouseDown: (suggestion: CollectionTableSearchSuggestionItem) => void;
  onSuggestionMouseMove: (suggestion: CollectionTableSearchSuggestionItem) => void;
  searchFieldOptions: ReadonlyArray<SearchFieldOption>;
  searchInputPlaceholder: string;
  searchSuggestionListboxId: string;
  selectableSearchOperators: ReadonlyArray<{ label: string; value: CollectionTableSearchOperator }>;
  shouldRenderSearchSuggestions: boolean;
  tableId: string;
  usesDateSearchInput: boolean;
  visibleSearchSuggestionGroups: ReadonlyArray<CollectionTableSearchSuggestionGroup>;
};

export function CollectionTableSearchControl({
  draftSearchFieldId,
  draftSearchOperator,
  draftSearchQuery,
  highlightedSearchSuggestionOptionId,
  highlightedSuggestionKey,
  onApplySuggestion,
  onDateSearchValueChange,
  onSearchFieldChange,
  onSearchInputChange,
  onSearchInputFocus,
  onSearchInputKeyDown,
  onSearchOperatorChange,
  onSearchShellBlur,
  onSearchShellFocusCapture,
  onSuggestionMouseDown,
  onSuggestionMouseMove,
  searchFieldOptions,
  searchInputPlaceholder,
  searchSuggestionListboxId,
  selectableSearchOperators,
  shouldRenderSearchSuggestions,
  tableId,
  usesDateSearchInput,
  visibleSearchSuggestionGroups,
}: CollectionTableSearchControlProps) {
  const { t } = useTranslation();

  return (
    <div
      className="admin-web__collection-smart-search-stack"
      onBlurCapture={onSearchShellBlur}
      onFocusCapture={onSearchShellFocusCapture}
    >
      <div className="admin-web__collection-smart-search-shell">
        <div
          aria-hidden="true"
          className="admin-web__collection-smart-segment admin-web__collection-smart-segment--prefix admin-web__collection-smart-search-prefix"
        >
          <SearchIcon className="admin-web__collection-smart-search-icon" />
        </div>

        <span aria-hidden="true" className="admin-web__collection-smart-divider admin-web__collection-smart-divider--prefix" />

        <div className="admin-web__collection-smart-segment admin-web__collection-smart-segment--field">
          <Select
            aria-label={t("admin.collectionTable.search.fieldAria")}
            className="admin-web__collection-smart-select admin-web__collection-smart-select--field"
            onChange={(event) => onSearchFieldChange(event.currentTarget.value)}
            size="sm"
            value={draftSearchFieldId}
          >
            {searchFieldOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <span aria-hidden="true" className="admin-web__collection-smart-divider" />

        <div className="admin-web__collection-smart-segment admin-web__collection-smart-segment--operator">
          <Select
            aria-label={t("admin.collectionTable.search.operatorAria")}
            className="admin-web__collection-smart-select admin-web__collection-smart-select--operator"
            disabled={draftSearchFieldId === "all"}
            onChange={(event) => onSearchOperatorChange(event.currentTarget.value as CollectionTableSearchOperator)}
            size="sm"
            value={draftSearchFieldId === "all" ? "contains" : draftSearchOperator}
          >
            {selectableSearchOperators.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <span aria-hidden="true" className="admin-web__collection-smart-divider admin-web__collection-smart-divider--operator" />

        <div className="admin-web__collection-smart-segment admin-web__collection-smart-segment--input">
          {usesDateSearchInput ? (
            <DatePicker
              aria-label={t("admin.collectionTable.search.inputAria")}
              className="admin-web__collection-smart-date-picker"
              onValueChange={onDateSearchValueChange}
              openOnFieldClick
              picker="calendar"
              placeholderText={t("admin.collectionTable.search.selectDate")}
              size="sm"
              value={draftSearchQuery}
            />
          ) : (
            <Input
              aria-activedescendant={shouldRenderSearchSuggestions ? highlightedSearchSuggestionOptionId : undefined}
              aria-autocomplete="list"
              aria-controls={shouldRenderSearchSuggestions ? searchSuggestionListboxId : undefined}
              aria-expanded={shouldRenderSearchSuggestions}
              aria-label={t("admin.collectionTable.search.inputAria")}
              className="admin-web__collection-smart-search-input"
              onChange={(event) => onSearchInputChange(event.currentTarget.value)}
              onFocus={onSearchInputFocus}
              onKeyDown={onSearchInputKeyDown}
              placeholder={searchInputPlaceholder}
              size="sm"
              value={draftSearchQuery}
            />
          )}
        </div>
      </div>

      {shouldRenderSearchSuggestions ? (
        <div
          className="admin-web__collection-smart-suggestions"
          id={searchSuggestionListboxId}
          role="listbox"
        >
          {visibleSearchSuggestionGroups.map((group) => (
            <div className="admin-web__collection-smart-suggestion-group" key={group.fieldId}>
              {draftSearchFieldId === "all" ? (
                <div className="admin-web__collection-smart-suggestion-group-label">
                  {group.label}
                </div>
              ) : null}

              <div className="admin-web__collection-smart-suggestion-items">
                {group.items.map((suggestion) => (
                  <button
                    aria-selected={highlightedSuggestionKey === getSearchSuggestionKey(suggestion)}
                    className={`admin-web__collection-smart-suggestion-item${highlightedSuggestionKey === getSearchSuggestionKey(suggestion) ? " admin-web__collection-smart-suggestion-item--active" : ""}`}
                    id={getSearchSuggestionOptionId(tableId, getSearchSuggestionKey(suggestion))}
                    key={getSearchSuggestionKey(suggestion)}
                    onClick={() => onApplySuggestion(suggestion)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSuggestionMouseDown(suggestion);
                    }}
                    onMouseMove={() => onSuggestionMouseMove(suggestion)}
                    role="option"
                    tabIndex={-1}
                    type="button"
                  >
                    <span className="admin-web__collection-smart-suggestion-value">
                      {renderHighlightedSuggestionText(suggestion.value, draftSearchQuery)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
