import type { FocusEvent, KeyboardEvent, ReactNode } from "react";

import { Button, PlusIcon } from "@platform/ui-kit";

import type {
  CollectionTableFavoriteActionMeta,
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionGroup,
  CollectionTableSearchSuggestionItem,
} from "../collection-table-contract";
import type { SearchFieldOption } from "../collection-table-runtime";
import {
  CollectionTableFilterTokenBar,
  type CollectionTableQuickFilterToken,
} from "./collection-table-filter-token-bar";
import { CollectionTableSearchControl } from "./collection-table-search-control";
import { CollectionTableToolbarActions } from "./collection-table-toolbar-actions";

export type { CollectionTableQuickFilterToken } from "./collection-table-filter-token-bar";

type CollectionTableToolbarAction = {
  label: string;
};

type CollectionTableToolbarProps = {
  activeTokens: ReadonlyArray<CollectionTableQuickFilterToken>;
  createAction: CollectionTableToolbarAction | null;
  draftSearchFieldId: string;
  draftSearchOperator: CollectionTableSearchOperator;
  draftSearchQuery: string;
  exportAction: CollectionTableToolbarAction | null;
  favoriteAction: CollectionTableFavoriteActionMeta | null;
  highlightedSearchSuggestionOptionId?: string;
  highlightedSuggestionKey: string | null;
  isCurrentFilterSetSaved: boolean;
  onApplySuggestion: (suggestion: CollectionTableSearchSuggestionItem) => void;
  onCreateAction: () => void;
  onDateSearchValueChange: (nextValue: string) => void;
  onExportXls: () => void;
  onReload: () => void;
  onResetFilters: () => void;
  onSaveFilterSet: () => void;
  onSearchFieldChange: (fieldId: string) => void;
  onSearchInputChange: (nextQuery: string) => void;
  onSearchInputFocus: () => void;
  onSearchInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSearchOperatorChange: (operator: CollectionTableSearchOperator) => void;
  onSearchShellBlur: (event: FocusEvent<HTMLDivElement>) => void;
  onSearchShellFocusCapture: () => void;
  onSuggestionMouseDown: (suggestion: CollectionTableSearchSuggestionItem) => void;
  onSuggestionMouseMove: (suggestion: CollectionTableSearchSuggestionItem) => void;
  onToggleFavorite: () => Promise<void> | void;
  quickFilterCount: number;
  reloadAction: CollectionTableToolbarAction | null;
  savedFilterMenuItems: ReactNode;
  searchFieldOptions: ReadonlyArray<SearchFieldOption>;
  searchInputPlaceholder: string;
  searchSuggestionListboxId: string;
  selectableSearchOperators: ReadonlyArray<{ label: string; value: CollectionTableSearchOperator }>;
  shouldRenderSearchSuggestions: boolean;
  tableId: string;
  usesDateSearchInput: boolean;
  visibleSearchSuggestionGroups: ReadonlyArray<CollectionTableSearchSuggestionGroup>;
};

export function CollectionTableToolbar({
  activeTokens,
  createAction,
  draftSearchFieldId,
  draftSearchOperator,
  draftSearchQuery,
  exportAction,
  favoriteAction,
  highlightedSearchSuggestionOptionId,
  highlightedSuggestionKey,
  isCurrentFilterSetSaved,
  onApplySuggestion,
  onCreateAction,
  onDateSearchValueChange,
  onExportXls,
  onReload,
  onResetFilters,
  onSaveFilterSet,
  onSearchFieldChange,
  onSearchInputChange,
  onSearchInputFocus,
  onSearchInputKeyDown,
  onSearchOperatorChange,
  onSearchShellBlur,
  onSearchShellFocusCapture,
  onSuggestionMouseDown,
  onSuggestionMouseMove,
  onToggleFavorite,
  quickFilterCount,
  reloadAction,
  savedFilterMenuItems,
  searchFieldOptions,
  searchInputPlaceholder,
  searchSuggestionListboxId,
  selectableSearchOperators,
  shouldRenderSearchSuggestions,
  tableId,
  usesDateSearchInput,
  visibleSearchSuggestionGroups,
}: CollectionTableToolbarProps) {
  return (
    <div className="admin-web__collection-toolbar admin-web__collection-toolbar--smart">
      <div className="admin-web__collection-smart-row">
        {createAction ? (
          <div className="admin-web__collection-smart-start admin-web__collection-smart-start--desktop">
            <Button
              className="admin-web__collection-smart-start-button"
              leadingIcon={<PlusIcon className="admin-web__collection-start-icon" />}
              onClick={onCreateAction}
              size="sm"
              variant="primary"
            >
              {createAction.label}
            </Button>
          </div>
        ) : null}

        <div className="admin-web__collection-smart-controls">
          <CollectionTableSearchControl
            draftSearchFieldId={draftSearchFieldId}
            draftSearchOperator={draftSearchOperator}
            draftSearchQuery={draftSearchQuery}
            highlightedSearchSuggestionOptionId={highlightedSearchSuggestionOptionId}
            highlightedSuggestionKey={highlightedSuggestionKey}
            onApplySuggestion={onApplySuggestion}
            onDateSearchValueChange={onDateSearchValueChange}
            onSearchFieldChange={onSearchFieldChange}
            onSearchInputChange={onSearchInputChange}
            onSearchInputFocus={onSearchInputFocus}
            onSearchInputKeyDown={onSearchInputKeyDown}
            onSearchOperatorChange={onSearchOperatorChange}
            onSearchShellBlur={onSearchShellBlur}
            onSearchShellFocusCapture={onSearchShellFocusCapture}
            onSuggestionMouseDown={onSuggestionMouseDown}
            onSuggestionMouseMove={onSuggestionMouseMove}
            searchFieldOptions={searchFieldOptions}
            searchInputPlaceholder={searchInputPlaceholder}
            searchSuggestionListboxId={searchSuggestionListboxId}
            selectableSearchOperators={selectableSearchOperators}
            shouldRenderSearchSuggestions={shouldRenderSearchSuggestions}
            tableId={tableId}
            usesDateSearchInput={usesDateSearchInput}
            visibleSearchSuggestionGroups={visibleSearchSuggestionGroups}
          />

          <CollectionTableToolbarActions
            exportAction={exportAction}
            favoriteAction={favoriteAction}
            onExportXls={onExportXls}
            onReload={onReload}
            onToggleFavorite={onToggleFavorite}
            reloadAction={reloadAction}
            savedFilterMenuItems={savedFilterMenuItems}
          />
        </div>
      </div>

      <CollectionTableFilterTokenBar
        activeTokens={activeTokens}
        isCurrentFilterSetSaved={isCurrentFilterSetSaved}
        onResetFilters={onResetFilters}
        onSaveFilterSet={onSaveFilterSet}
        quickFilterCount={quickFilterCount}
      />
    </div>
  );
}
