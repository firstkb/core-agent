import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button, PlusIcon } from "@platform/ui-kit";
import { useTranslation } from "@platform/i18n";

import { getCollectionFiltersForPreset } from "./collection-page";
import {
  type CollectionTableAdapter,
  type CollectionTableBulkActionDefinition,
  type CollectionTableMetaResponse,
  type CollectionTableQueryRequest,
  type CollectionTableRowActionDefinition,
  type CollectionTableFavoriteToggleEvent,
  type CollectionTableSavedFilterSet,
  type CollectionTableSearchOperator,
} from "./collection-table-contract";
import {
  clearPersistedCollectionTableState,
  getCollectionTableStateStorageKey,
  getCollectionTableSuggestionsStorageKey,
  readPersistedCollectionTableState,
  restoreCollectionTableState,
  toCollectionTableQueryRequest,
  type CollectionTableState,
  writePersistedCollectionTableState,
} from "./collection-table-state";
import {
  createCollectionRenderConfig,
} from "./collection-table-render";
import {
  buildAppliedQuickFilter,
  createCollectionTableQueryScopeKey,
  createDefaultCollectionState,
  createInitialCollectionTableMeta,
  doesSearchOperatorRequireValue,
  getCollectionTableRowLabel,
  reconcileSelectedRowIds,
  type CollectionTableRenderRow,
} from "./collection-table-runtime";
import { CollectionPageSurface } from "./collection-page-surface";
import { CollectionTableBulkActionConfirmDialog } from "./components/collection-table-bulk-action-confirm-dialog";
import { CollectionTableBulkBar } from "./components/collection-table-bulk-bar";
import { CollectionTableSaveFilterDialog } from "./components/collection-table-save-filter-dialog";
import { CollectionTableSavedFilterMenuItems } from "./components/collection-table-saved-filter-menu-items";
import { CollectionTableToolbar, type CollectionTableQuickFilterToken } from "./components/collection-table-toolbar";
import {
  buildCollectionTableQuickFilterTokens,
  getCollectionTableBulkActionLabel,
  getCollectionTableBulkActionToneClass,
  getCollectionTableRowActionLabel,
  getCollectionTableSavedFilterLabelState,
  getCollectionTableToolbarActions,
  isCollectionTableFilterSetSaved,
} from "./controller/collection-table-page-helpers";
import { useCollectionTableMetaLoader } from "./controller/use-collection-table-meta-loader";
import { useCollectionTableQueryLoader } from "./controller/use-collection-table-query-loader";
import { useCollectionTableSearchController } from "./controller/use-collection-table-search-controller";
import { useCollectionTableSearchSuggestions } from "./controller/use-collection-table-search-suggestions";

export type CollectionTablePageRowActionPathResolver = (
  action: CollectionTableRowActionDefinition,
  row: CollectionTableRenderRow,
) => string | null;

export type CollectionTablePageFrontendRowActionHandler = (
  action: CollectionTableRowActionDefinition,
  row: CollectionTableRenderRow,
) => void | Promise<void>;

type CollectionTablePageProps = {
  adapter: CollectionTableAdapter;
  getCreatePath?: () => string | null;
  isIgnorableError?: (error: unknown) => boolean;
  onFavoriteToggleSuccess?: (event: CollectionTableFavoriteToggleEvent) => Promise<void> | void;
  onFrontendRowAction?: CollectionTablePageFrontendRowActionHandler;
  resolveFrontendRowActionPath?: CollectionTablePageRowActionPathResolver;
  tableId: string;
};

const DEFAULT_OPERATOR: CollectionTableSearchOperator = "contains";
const COLLECTION_TABLE_RESET_PARAM = "reset";

export function CollectionTablePage({
  adapter,
  getCreatePath,
  isIgnorableError,
  onFavoriteToggleSuccess,
  onFrontendRowAction,
  resolveFrontendRowActionPath,
  tableId,
}: CollectionTablePageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tableStateStorageKey = getCollectionTableStateStorageKey(tableId);
  const tableSuggestionsStorageKey = getCollectionTableSuggestionsStorageKey(tableId);
  const shouldResetPersistedState = searchParams.get(COLLECTION_TABLE_RESET_PARAM) === "1";
  const initialPersistedState = useMemo(
    () =>
      shouldResetPersistedState
        ? null
        : readPersistedCollectionTableState(tableStateStorageKey),
    [shouldResetPersistedState, tableStateStorageKey],
  );
  const initialMeta = useMemo(
    () => createInitialCollectionTableMeta(tableId),
    [tableId],
  );
  const initialDraftSearchFieldId = initialPersistedState?.draftSearchFieldId ?? initialMeta.search?.defaultFieldId ?? "all";
  const initialDraftSearchOperator = initialPersistedState?.draftSearchOperator ?? DEFAULT_OPERATOR;
  const [selectedRowIds, setSelectedRowIds] = useState<ReadonlyArray<string>>([]);
  const [savedFilterSets, setSavedFilterSets] = useState<ReadonlyArray<CollectionTableSavedFilterSet>>(
    initialMeta.savedFilterSets ?? [],
  );
  const [deletingSavedFilterId, setDeletingSavedFilterId] = useState<string | null>(null);
  const [pendingBulkActionId, setPendingBulkActionId] = useState<string | null>(null);
  const [bulkActionConfirmation, setBulkActionConfirmation] = useState<CollectionTableBulkActionDefinition | null>(null);
  const [isSaveFilterDialogOpen, setIsSaveFilterDialogOpen] = useState(false);
  const [draftSavedFilterLabel, setDraftSavedFilterLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metaRefreshKey, setMetaRefreshKey] = useState(0);
  const [queryRefreshKey, setQueryRefreshKey] = useState(0);
  const [metaVersion, setMetaVersion] = useState(0);
  const [tableMeta, setTableMeta] = useState<CollectionTableMetaResponse>(initialMeta);
  const [collectionState, setCollectionState] = useState<CollectionTableState>(() =>
    restoreCollectionTableState(
      createDefaultCollectionState(initialMeta),
      initialPersistedState,
    ),
  );
  const [resolvedRows, setResolvedRows] = useState<ReadonlyArray<CollectionTableRenderRow>>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const hasHydratedMetaRef = useRef(false);
  const lastSelectionScopeKeyRef = useRef<string | null>(null);

  const tableAdapter = useMemo<CollectionTableAdapter>(
    () => ({
      ...adapter,
      createSavedFilterSet: adapter.createSavedFilterSet
        ? async (input) => {
          const createdFilterSet = await adapter.createSavedFilterSet!(input);
          setSavedFilterSets((currentValue) => [createdFilterSet, ...currentValue]);
          return createdFilterSet;
        }
        : undefined,
      deleteSavedFilterSet: adapter.deleteSavedFilterSet
        ? async (savedFilterId) => {
          await adapter.deleteSavedFilterSet!(savedFilterId);
          setSavedFilterSets((currentValue) =>
            currentValue.filter((savedFilterSet) => savedFilterSet.id !== savedFilterId),
          );
        }
        : undefined,
    }),
    [adapter],
  );
  const remoteMetadataErrorMessage = t("admin.collectionTable.errors.remoteMetadata");
  const searchOperators = useMemo<ReadonlyArray<{ label: string; value: CollectionTableSearchOperator }>>(
    () => [
      { label: t("admin.collectionTable.operators.contains"), value: "contains" },
      { label: t("admin.collectionTable.operators.isEqualTo"), value: "is_equal_to" },
      { label: t("admin.collectionTable.operators.isNotEqualTo"), value: "is_not_equal_to" },
      { label: t("admin.collectionTable.operators.isLessThan"), value: "is_less_than" },
      { label: t("admin.collectionTable.operators.isLessOrEqualTo"), value: "is_less_or_equal_to" },
      { label: t("admin.collectionTable.operators.isGreaterThan"), value: "is_greater_than" },
      { label: t("admin.collectionTable.operators.isGreaterOrEqualTo"), value: "is_greater_or_equal_to" },
      { label: t("admin.collectionTable.operators.isEmpty"), value: "is_empty" },
      { label: t("admin.collectionTable.operators.isNotEmpty"), value: "is_not_empty" },
    ],
    [t],
  );
  const request = useMemo<CollectionTableQueryRequest>(
    () => toCollectionTableQueryRequest(collectionState),
    [collectionState],
  );
  const queryScopeKey = useMemo(
    () => createCollectionTableQueryScopeKey(request),
    [request],
  );
  const surfaceState = useMemo(
    () => ({
      density: collectionState.density,
      filters: collectionState.query.filters,
      page: collectionState.query.page,
      pageSize: collectionState.query.pageSize,
      presetId: collectionState.query.presetId,
      sortColumnId: collectionState.query.sortColumnId,
      sortDirection: collectionState.query.sortDirection,
      visibleColumnIds: collectionState.visibleColumnIds,
    }),
    [collectionState],
  );
  const {
    ensureSearchSuggestionsLoaded,
    searchSuggestionGroups,
  } = useCollectionTableSearchSuggestions({
    isIgnorableError,
    remoteMetadataErrorMessage,
    setError,
    tableAdapter,
    tableFields: tableMeta.fields,
    tableSuggestionsStorageKey,
  });
  const searchController = useCollectionTableSearchController({
    allFieldLabel: t("admin.collectionTable.search.all"),
    defaultSearchFieldId: tableMeta.search?.defaultFieldId ?? "all",
    ensureSearchSuggestionsLoaded,
    initialDraftSearchFieldId,
    initialDraftSearchOperator,
    metaVersion,
    onApplyQuickFilterValue: handleApplyQuickFilterValue,
    searchOperators,
    searchSuggestionGroups,
    tableFields: tableMeta.fields,
    tableId,
  });
  const resetSearchDraft = searchController.resetSearchDraft;

  useEffect(() => {
    if (!hasHydratedMetaRef.current) {
      return;
    }

    writePersistedCollectionTableState(tableStateStorageKey, {
      draftSearchFieldId: searchController.draftSearchFieldId,
      draftSearchOperator: searchController.draftSearchOperator,
      queryState: collectionState.query,
    });
  }, [
    collectionState.query,
    searchController.draftSearchFieldId,
    searchController.draftSearchOperator,
    tableStateStorageKey,
  ]);

  useEffect(() => {
    if (lastSelectionScopeKeyRef.current === null) {
      lastSelectionScopeKeyRef.current = queryScopeKey;
      return;
    }

    if (lastSelectionScopeKeyRef.current === queryScopeKey) {
      return;
    }

    lastSelectionScopeKeyRef.current = queryScopeKey;
    setSelectedRowIds([]);
  }, [queryScopeKey]);

  useEffect(() => {
    setSelectedRowIds((currentValue) => reconcileSelectedRowIds(currentValue, resolvedRows));
  }, [resolvedRows]);

  useEffect(() => {
    if (!shouldResetPersistedState) {
      return;
    }

    clearPersistedCollectionTableState(tableStateStorageKey);
    setCollectionState(createDefaultCollectionState(tableMeta));
    resetSearchDraft(tableMeta.search?.defaultFieldId ?? "all");
    setSelectedRowIds([]);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(COLLECTION_TABLE_RESET_PARAM);
    setSearchParams(nextSearchParams, { replace: true });
  }, [
    resetSearchDraft,
    searchParams,
    setSearchParams,
    shouldResetPersistedState,
    tableMeta,
    tableStateStorageKey,
  ]);

  async function handleRunRowAction(
    action: CollectionTableRowActionDefinition,
    row: CollectionTableRenderRow,
  ) {
    if (action.execution === "frontend") {
      if (onFrontendRowAction) {
        await onFrontendRowAction(action, row);
        return;
      }

      const targetPath = resolveFrontendRowActionPath?.(action, row) ?? null;

      if (targetPath) {
        navigate(targetPath);
      }

      return;
    }

    if (action.execution !== "backend") {
      return;
    }

    try {
      await tableAdapter.runRowAction?.({
        actionId: action.id,
        row,
        rowId: row.id,
      });
    } catch (requestError) {
      if (!isIgnorableError?.(requestError)) {
        setError(t("admin.collectionTable.errors.remoteMetadata"));
      }
    }
  }

  function resolveRowActionLabel(action: CollectionTableRowActionDefinition) {
    return getCollectionTableRowActionLabel(action, {
      edit: t("admin.collectionTable.rowActions.edit"),
      pdf: t("admin.collectionTable.rowActions.pdf"),
      view: t("admin.collectionTable.rowActions.view"),
    });
  }

  const resolvedConfig = createCollectionRenderConfig(tableMeta, {
    getRowActionLabel: resolveRowActionLabel,
    resolveRowAction: (action, row) => {
      if (action.execution === "backend") {
        return {
          id: action.id,
          label: resolveRowActionLabel(action),
          onSelect: () => {
            void handleRunRowAction(action, row);
          },
        };
      }

      const targetPath = resolveFrontendRowActionPath?.(action, row) ?? null;
      const canRun = Boolean(targetPath) || Boolean(onFrontendRowAction);

      return {
        disabled: !canRun,
        id: action.id,
        label: resolveRowActionLabel(action),
        onSelect: canRun
          ? () => {
            void handleRunRowAction(action, row);
          }
          : undefined,
      };
    },
  });

  useCollectionTableMetaLoader({
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
  });

  const { reloadCurrentQuery } = useCollectionTableQueryLoader({
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
  });

  const createPath = getCreatePath?.() ?? null;
  const {
    createAction,
    exportAction,
    favoriteAction,
    reloadAction,
  } = getCollectionTableToolbarActions(tableMeta, createPath, {
    create: t("admin.collectionTable.actions.startNew"),
    exportXls: t("admin.collectionTable.actions.exportXls"),
    reload: t("admin.collectionTable.actions.reload"),
  });

  const selectedRowIdSet = useMemo(
    () => new Set(selectedRowIds),
    [selectedRowIds],
  );
  const selectedRowCount = selectedRowIds.length;

  const activeTokens = useMemo<ReadonlyArray<CollectionTableQuickFilterToken>>(() => {
    return buildCollectionTableQuickFilterTokens({
      labels: {
        allField: t("admin.collectionTable.search.all"),
        isEmpty: t("admin.collectionTable.operators.isEmpty"),
        isNotEmpty: t("admin.collectionTable.operators.isNotEmpty"),
      },
      onRemoveGroup: (groupFilterIds) => {
        setState((currentValue) => ({
          ...currentValue,
          query: {
            ...currentValue.query,
            page: 1,
            quickFilters: currentValue.query.quickFilters.filter(
              (currentFilter) => !groupFilterIds.has(currentFilter.id),
            ),
          },
        }));
      },
      quickFilters: collectionState.query.quickFilters,
      searchFieldOptions: searchController.searchFieldOptions,
    });
  }, [collectionState.query.quickFilters, searchController.searchFieldOptions, t]);

  const isCurrentFilterSetSaved = useMemo(
    () => isCollectionTableFilterSetSaved(collectionState.query.quickFilters, savedFilterSets),
    [collectionState.query.quickFilters, savedFilterSets],
  );

  const {
    error: saveFilterLabelError,
    normalizedLabel: normalizedSavedFilterLabel,
  } = useMemo(
    () =>
      getCollectionTableSavedFilterLabelState({
        labels: {
          duplicate: t("admin.collectionTable.dialog.validation.duplicate"),
          empty: t("admin.collectionTable.dialog.validation.empty"),
        },
        open: isSaveFilterDialogOpen,
        savedFilterSets,
        value: draftSavedFilterLabel,
      }),
    [draftSavedFilterLabel, isSaveFilterDialogOpen, savedFilterSets, t],
  );

  function setState(
    updater: (currentValue: CollectionTableState) => CollectionTableState,
  ) {
    startTransition(() => {
      setCollectionState(updater);
    });
  }

  function reportCollectionError(requestError: unknown) {
    if (isIgnorableError?.(requestError)) {
      return;
    }

    setError(remoteMetadataErrorMessage);
  }

  async function runCollectionMutation(
    task: () => Promise<void>,
  ) {
    try {
      await task();
    } catch (requestError) {
      reportCollectionError(requestError);
    }
  }

  function clearSelection() {
    setSelectedRowIds([]);
  }

  function handleToggleRowSelection(row: CollectionTableRenderRow, checked: boolean) {
    setSelectedRowIds((currentValue) =>
      checked
        ? currentValue.includes(row.id)
          ? currentValue
          : [...currentValue, row.id]
        : currentValue.filter((rowId) => rowId !== row.id),
    );
  }

  function handleToggleVisibleRows(rowIds: ReadonlyArray<string>, checked: boolean) {
    setSelectedRowIds((currentValue) => {
      if (checked) {
        const nextSet = new Set(currentValue);

        rowIds.forEach((rowId) => {
          nextSet.add(rowId);
        });

        return [...nextSet];
      }

      return currentValue.filter((rowId) => !rowIds.includes(rowId));
    });
  }

  async function executeBulkAction(action: CollectionTableBulkActionDefinition) {
    if (selectedRowIdSet.size === 0) {
      return;
    }
    if (!tableAdapter.runBulkAction) {
      setError(remoteMetadataErrorMessage);
      return;
    }
    if (pendingBulkActionId) {
      return;
    }

    setPendingBulkActionId(action.id);
    try {
      await tableAdapter.runBulkAction({
        actionId: action.id,
        query: request,
        rowIds: selectedRowIds,
      });
    } catch (requestError) {
      reportCollectionError(requestError);
      return;
    } finally {
      setPendingBulkActionId((currentValue) => (currentValue === action.id ? null : currentValue));
    }

    clearSelection();
    await reloadCurrentQuery();
  }

  async function handleApplyBulkAction(actionId: string) {
    const action = tableMeta.bulkActions?.find((candidate) => candidate.id === actionId);

    if (!action) {
      return;
    }

    if (action.confirmation) {
      setBulkActionConfirmation(action);
      return;
    }

    await executeBulkAction(action);
  }

  async function handleConfirmBulkAction(action: CollectionTableBulkActionDefinition) {
    setBulkActionConfirmation(null);
    await executeBulkAction(action);
  }

  function handleResetFilters() {
    searchController.resetSearchDraft("all");
    clearSelection();
    setState((currentValue) => ({
      ...currentValue,
      query: {
        ...currentValue.query,
        filters: getCollectionFiltersForPreset(resolvedConfig, currentValue.query.presetId),
        page: 1,
        quickFilters: [],
      },
    }));
  }

  function handleSortChange(columnId: string) {
    searchController.closeSearchSuggestions();
    clearSelection();
    setState((currentValue) => ({
      ...currentValue,
      query: {
        ...currentValue.query,
        page: 1,
        sortColumnId: columnId,
        sortDirection:
          currentValue.query.sortColumnId === columnId && currentValue.query.sortDirection === "asc"
            ? "desc"
            : "asc",
      },
    }));
  }

  function handleApplyQuickFilterValue(
    fieldId: string,
    operator: CollectionTableSearchOperator,
    nextQuery: string,
  ) {
    const nextFilter = buildAppliedQuickFilter(
      fieldId,
      operator,
      nextQuery,
    );

    if (!nextFilter) {
      return false;
    }

    setState((currentValue) => {
      if (currentValue.query.quickFilters.some((filter) => filter.id === nextFilter.id)) {
        return currentValue;
      }

      return {
        ...currentValue,
        query: {
          ...currentValue.query,
          page: 1,
          quickFilters: [...currentValue.query.quickFilters, nextFilter],
        },
      };
    });
    clearSelection();
    return true;
  }

  function handleApplySavedFilterSet(savedFilterSet: CollectionTableSavedFilterSet) {
    searchController.resetSearchDraft("all");
    clearSelection();
    setState((currentValue) => ({
      ...currentValue,
      query: {
        ...currentValue.query,
        page: 1,
        quickFilters: savedFilterSet.quickFilters,
      },
    }));
  }

  function handleSaveFilterSet() {
    if (collectionState.query.quickFilters.length === 0 || isCurrentFilterSetSaved) {
      return;
    }

    setDraftSavedFilterLabel("");
    setIsSaveFilterDialogOpen(true);
  }

  async function handleConfirmSaveFilterSet() {
    if (collectionState.query.quickFilters.length === 0 || isCurrentFilterSetSaved || saveFilterLabelError) {
      return;
    }

    try {
      await tableAdapter.createSavedFilterSet?.({
        label: normalizedSavedFilterLabel,
        quickFilters: collectionState.query.quickFilters,
      });
    } catch (requestError) {
      reportCollectionError(requestError);
      return;
    }

    setIsSaveFilterDialogOpen(false);
    setDraftSavedFilterLabel("");
  }

  function handleSaveFilterDialogOpenChange(open: boolean) {
    setIsSaveFilterDialogOpen(open);

    if (!open) {
      setDraftSavedFilterLabel("");
    }
  }

  async function handleDeleteSavedFilterSet(savedFilterId: string) {
    if (!tableAdapter.deleteSavedFilterSet || !savedFilterId || deletingSavedFilterId === savedFilterId) {
      return;
    }

    setDeletingSavedFilterId(savedFilterId);
    try {
      await tableAdapter.deleteSavedFilterSet(savedFilterId);
    } catch (requestError) {
      reportCollectionError(requestError);
    } finally {
      setDeletingSavedFilterId((currentValue) => (currentValue === savedFilterId ? null : currentValue));
    }
  }

  async function handleToggleFavorite() {
    let result: Awaited<ReturnType<NonNullable<CollectionTableAdapter["toggleFavorite"]>>> | undefined;

    try {
      result = await tableAdapter.toggleFavorite?.();
    } catch (requestError) {
      reportCollectionError(requestError);
      return;
    }

    if (!result) {
      return;
    }

    setTableMeta((currentValue) => ({
      ...currentValue,
      actions: {
        ...currentValue.actions,
        favorite: {
          ...(currentValue.actions?.favorite ?? { visible: true }),
          isFavorite: result.isFavorite,
          visible: true,
        },
      },
    }));

    try {
      await onFavoriteToggleSuccess?.({
        isFavorite: result.isFavorite,
        surfaceId: tableMeta.surfaceId,
        tableId,
      });
    } catch {
      // Host-side follow-up behavior is secondary; keep the table state updated even if it fails.
    }
  }

  function handleExportXls() {
    void runCollectionMutation(async () => {
      await tableAdapter.exportXls?.({ query: request });
    });
  }

  function handleCreateAction() {
    if (!createPath) {
      return;
    }

    navigate(createPath);
  }

  function handleReloadAction() {
    setQueryRefreshKey((currentValue) => currentValue + 1);
  }

  const savedFilterMenuItems = (
    <CollectionTableSavedFilterMenuItems
      canDelete={Boolean(tableAdapter.deleteSavedFilterSet)}
      deletingSavedFilterId={deletingSavedFilterId}
      onApplySavedFilterSet={handleApplySavedFilterSet}
      onDeleteSavedFilterSet={handleDeleteSavedFilterSet}
      savedFilterSets={savedFilterSets}
    />
  );

  const searchInputPlaceholder = doesSearchOperatorRequireValue(searchController.draftSearchOperator)
    ? (resolvedConfig.searchPlaceholder ?? "Search...")
    : t("admin.collectionTable.search.pressEnter");

  const toolbar = (
    <CollectionTableToolbar
      activeTokens={activeTokens}
      createAction={createAction}
      draftSearchFieldId={searchController.draftSearchFieldId}
      draftSearchOperator={searchController.draftSearchOperator}
      draftSearchQuery={searchController.draftSearchQuery}
      exportAction={exportAction}
      favoriteAction={favoriteAction}
      highlightedSearchSuggestionOptionId={searchController.highlightedSearchSuggestionOptionId}
      highlightedSuggestionKey={searchController.highlightedSuggestionKey}
      isCurrentFilterSetSaved={isCurrentFilterSetSaved}
      onApplySuggestion={searchController.applySuggestion}
      onCreateAction={handleCreateAction}
      onDateSearchValueChange={searchController.handleDateSearchValueChange}
      onExportXls={handleExportXls}
      onReload={handleReloadAction}
      onResetFilters={handleResetFilters}
      onSaveFilterSet={handleSaveFilterSet}
      onSearchFieldChange={searchController.handleSearchFieldChange}
      onSearchInputChange={searchController.handleSearchInputChange}
      onSearchInputFocus={() => {
        void searchController.openSearchSuggestions();
      }}
      onSearchInputKeyDown={searchController.handleSearchInputKeyDown}
      onSearchOperatorChange={searchController.handleSearchOperatorChange}
      onSearchShellBlur={searchController.handleSearchShellBlur}
      onSearchShellFocusCapture={searchController.handleSearchShellFocusCapture}
      onSuggestionMouseDown={searchController.handleSuggestionMouseDown}
      onSuggestionMouseMove={searchController.handleSuggestionMouseMove}
      onToggleFavorite={handleToggleFavorite}
      quickFilterCount={collectionState.query.quickFilters.length}
      reloadAction={reloadAction}
      savedFilterMenuItems={savedFilterMenuItems}
      searchFieldOptions={searchController.searchFieldOptions}
      searchInputPlaceholder={searchInputPlaceholder}
      searchSuggestionListboxId={searchController.searchSuggestionListboxId}
      selectableSearchOperators={searchController.selectableSearchOperators}
      shouldRenderSearchSuggestions={searchController.shouldRenderSearchSuggestions}
      tableId={tableId}
      usesDateSearchInput={searchController.usesDateSearchInput}
      visibleSearchSuggestionGroups={searchController.visibleSearchSuggestionGroups}
    />
  );

  return (
    <div className="admin-web__modules-page">
      {createAction ? (
        <div className="admin-web__collection-mobile-start">
          <Button
            className="admin-web__collection-mobile-start-button"
            leadingIcon={<PlusIcon className="admin-web__collection-start-icon" />}
            onClick={handleCreateAction}
            size="sm"
            variant="primary"
          >
            {createAction.label}
          </Button>
        </div>
      ) : null}

      <CollectionPageSurface
        config={resolvedConfig}
        currentPage={Math.min(collectionState.query.page, totalPages)}
        error={error}
        loading={loading}
        onPageChange={(page) => {
          clearSelection();
          setState((currentValue) => ({
            ...currentValue,
            query: {
              ...currentValue.query,
              page,
            },
          }));
        }}
        onPageSizeChange={(pageSize) => {
          clearSelection();
          setState((currentValue) => ({
            ...currentValue,
            query: {
              ...currentValue.query,
              page: 1,
              pageSize,
            },
          }));
        }}
        onRetry={() => {
          clearSelection();
          setMetaRefreshKey((currentValue) => currentValue + 1);
        }}
        onSortChange={handleSortChange}
        rows={resolvedRows}
        selection={tableMeta.selection?.enabled
          ? {
            getRowAriaLabel: (row) => t("admin.collectionTable.selection.selectRow", { label: getCollectionTableRowLabel(tableMeta, row) }),
            isRowSelectable: (row) => row.selectable,
            onToggleRow: handleToggleRowSelection,
            onToggleVisibleRows: handleToggleVisibleRows,
            selectedRowIds,
          }
          : undefined}
        state={{
          ...surfaceState,
          page: Math.min(surfaceState.page, totalPages),
        }}
        toolbar={toolbar}
        totalItems={totalItems}
        totalPages={totalPages}
      />

      {tableMeta.selection?.enabled ? (
        <CollectionTableBulkBar
          actions={tableMeta.bulkActions ?? []}
          getActionLabel={getCollectionTableBulkActionLabel}
          getActionToneClass={getCollectionTableBulkActionToneClass}
          onApplyAction={handleApplyBulkAction}
          pendingActionId={pendingBulkActionId}
          selectedRowCount={selectedRowCount}
        />
      ) : null}

      <CollectionTableBulkActionConfirmDialog
        action={bulkActionConfirmation}
        onConfirm={handleConfirmBulkAction}
        onOpenChange={(open) => {
          if (!open) {
            setBulkActionConfirmation(null);
          }
        }}
        open={Boolean(bulkActionConfirmation)}
      />

      <CollectionTableSaveFilterDialog
        labelError={saveFilterLabelError}
        onConfirm={handleConfirmSaveFilterSet}
        onLabelChange={setDraftSavedFilterLabel}
        onOpenChange={handleSaveFilterDialogOpenChange}
        open={isSaveFilterDialogOpen}
        value={draftSavedFilterLabel}
      />
    </div>
  );
}
