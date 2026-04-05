import { startTransition, useEffect, useMemo, useRef, useState, type FocusEvent, type SVGProps } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ApiClientError,
  isUnauthorizedApiError,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import {
  Button,
  CloseIcon,
  DatePicker,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  PlusIcon,
  SearchIcon,
  Select,
  StarIcon,
} from "@platform/ui-kit";
import { useTranslation } from "@platform/i18n";

import { getCollectionFiltersForPreset } from "../../shared/collection-page";
import { createAdminModuleRegistryClient } from "../../shared/admin-module-registry-client";
import {
  type CollectionTableAdapter,
  type CollectionTableBulkActionDefinition,
  type CollectionTableMetaResponse,
  type CollectionTableQueryRequest,
  type CollectionTableQuickFilter,
  type CollectionTableRowActionDefinition,
  type CollectionTableSavedFilterSet,
  type CollectionTableSearchOperator,
  type CollectionTableSearchSuggestionGroup,
  type CollectionTableSearchSuggestionItem,
} from "../../shared/collection-table-contract";
import {
  clearPersistedCollectionTableState,
  createCollectionTableSuggestionsFieldSignature,
  getCollectionTableStateStorageKey,
  getCollectionTableSuggestionsStorageKey,
  readPersistedCollectionTableState,
  readPersistedCollectionTableSuggestions,
  restoreCollectionTableState,
  toCollectionTableQueryRequest,
  type CollectionTableState,
  writePersistedCollectionTableState,
  writePersistedCollectionTableSuggestions,
} from "../../shared/collection-table-state";
import {
  createCollectionRenderConfig,
  OverflowMenuIcon,
  renderHighlightedSuggestionText,
} from "../../shared/collection-table-render";
import {
  buildAppliedQuickFilter,
  buildSearchFieldOptions,
  createCollectionTableQueryScopeKey,
  createDefaultCollectionState,
  createFilterSignature,
  createInitialCollectionTableMeta,
  doesSearchOperatorRequireValue,
  filterCompatibleSearchSuggestionGroups,
  filterSearchSuggestionGroups,
  formatAppliedQuickFilterLabel,
  getAllowedSearchOperators,
  getCellText,
  getCollectionTableRowLabel,
  getDefaultSearchOperator,
  getSearchFieldKind,
  normalizeCollectionRows,
  reconcileSelectedRowIds,
  resolveCollectionStateForMeta,
  type CollectionTableRenderRow,
  type SearchFieldKind,
  type SearchFieldOption,
} from "../../shared/collection-table-runtime";
import { CollectionPageSurface } from "../../widgets/collection-page-surface/collection-page-surface";

type QuickFilterToken = {
  id: string;
  label: string;
  onRemove: () => void;
};

const DEFAULT_OPERATOR: CollectionTableSearchOperator = "contains";
const COLLECTION_TABLE_RESET_PARAM = "reset";
const MODULE_REGISTRY_TABLE_ID = "module-registry.list";
const MISSING_ADMIN_SESSION_ERROR_CODE = "admin_session_missing";
const SEARCH_SUGGESTION_LISTBOX_ID = `${MODULE_REGISTRY_TABLE_ID}-search-suggestions`;

function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M20 11a8 8 0 1 0-2.35 5.65" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

function FilterFunnelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M4.5 6.25h15" />
      <path d="M7.5 11.5h9" />
      <path d="M10.5 16.75h3" />
    </svg>
  );
}

function SpreadsheetExportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M7.5 3.75h7L19.5 8.7v10.55A1.75 1.75 0 0 1 17.75 21h-10A1.75 1.75 0 0 1 6 19.25V5.5A1.75 1.75 0 0 1 7.75 3.75Z" />
      <path d="M14.5 3.75V8.5h5" />
      <path d="M9 12.25h5.5M9 15.25h5.5M9 18.25h3.25" />
      <path d="M17 13.5v4.25" />
      <path d="m15.5 16.25 1.5 1.5 1.5-1.5" />
    </svg>
  );
}

function createMissingAdminSessionError() {
  return new ApiClientError("Admin session is unavailable.", {
    code: MISSING_ADMIN_SESSION_ERROR_CODE,
    statusCode: 401,
  });
}

function openDownloadUrl(downloadUrl?: string) {
  if (!downloadUrl || typeof window === "undefined") {
    return;
  }

  window.open(downloadUrl, "_blank", "noopener,noreferrer");
}

function getSearchSuggestionOptionId(suggestionId: string) {
  return `${MODULE_REGISTRY_TABLE_ID}-search-suggestion-${suggestionId}`;
}

function getSearchSuggestionKey(suggestion: CollectionTableSearchSuggestionItem) {
  return `${suggestion.fieldId}:${suggestion.id}:${suggestion.value}`;
}

function humanizeActionIdLabel(actionId: string) {
  return actionId
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveFrontendRowActionPath(
  action: CollectionTableRowActionDefinition,
  row: CollectionTableRenderRow,
) {
  switch (action.id) {
    case "edit":
      return `/modules/edit/${encodeURIComponent(row.id)}`;
    default:
      return null;
  }
}

function getCreateModulePath() {
  return "/modules/edit/new";
}

export function AdminModulesListPage({
  onNavigationRefresh,
}: {
  onNavigationRefresh?: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const { getAccessToken, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tableStateStorageKey = getCollectionTableStateStorageKey(MODULE_REGISTRY_TABLE_ID);
  const tableSuggestionsStorageKey = getCollectionTableSuggestionsStorageKey(MODULE_REGISTRY_TABLE_ID);
  const shouldResetPersistedState = searchParams.get(COLLECTION_TABLE_RESET_PARAM) === "1";
  const initialPersistedState = useMemo(
    () =>
      shouldResetPersistedState
        ? null
        : readPersistedCollectionTableState(tableStateStorageKey),
    [shouldResetPersistedState, tableStateStorageKey],
  );
  const initialMeta = useMemo(
    () => createInitialCollectionTableMeta(MODULE_REGISTRY_TABLE_ID),
    [],
  );
  const moduleRegistryClient = useMemo(
    () => createAdminModuleRegistryClient(),
    [],
  );
  const [selectedRowIds, setSelectedRowIds] = useState<ReadonlyArray<string>>([]);
  const [draftSearchFieldId, setDraftSearchFieldId] = useState(
    () => initialPersistedState?.draftSearchFieldId ?? initialMeta.search?.defaultFieldId ?? "all",
  );
  const [draftSearchOperator, setDraftSearchOperator] = useState<CollectionTableSearchOperator>(
    () => initialPersistedState?.draftSearchOperator ?? DEFAULT_OPERATOR,
  );
  const [draftSearchQuery, setDraftSearchQuery] = useState("");
  const [savedFilterSets, setSavedFilterSets] = useState<ReadonlyArray<CollectionTableSavedFilterSet>>(
    initialMeta.savedFilterSets ?? [],
  );
  const [searchSuggestionGroups, setSearchSuggestionGroups] = useState<ReadonlyArray<CollectionTableSearchSuggestionGroup>>([]);
  const [isSearchSuggestionOpen, setIsSearchSuggestionOpen] = useState(false);
  const [highlightedSuggestionKey, setHighlightedSuggestionKey] = useState<string | null>(null);
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
  const hasLoadedSearchSuggestions = useRef(searchSuggestionGroups.length > 0);
  const searchSuggestionsLoadPromise = useRef<Promise<ReadonlyArray<CollectionTableSearchSuggestionGroup>> | null>(null);
  const hasRevalidatedSearchSuggestionsForMeta = useRef(false);
  const getAccessTokenRef = useRef(getAccessToken);
  const signOutRef = useRef(signOut);
  const hasHydratedMetaRef = useRef(false);
  const lastQueryExecutionKeyRef = useRef<string | null>(null);
  const lastSelectionScopeKeyRef = useRef<string | null>(null);

  getAccessTokenRef.current = getAccessToken;
  signOutRef.current = signOut;

  const tableAdapter = useMemo<CollectionTableAdapter>(
    () => {
      async function runWithAdminSession<T>(
        operation: (accessToken: string) => Promise<T>,
      ) {
        const accessToken = getAccessTokenRef.current();

        if (!accessToken) {
          void signOutRef.current();
          throw createMissingAdminSessionError();
        }

        try {
          return await operation(accessToken);
        } catch (requestError) {
          if (isUnauthorizedApiError(requestError)) {
            void signOutRef.current();
          }

          throw requestError;
        }
      }

      return {
        createSavedFilterSet: async (input) => {
          const createdFilterSet = await runWithAdminSession((accessToken) =>
            moduleRegistryClient.createSavedFilterSet(accessToken, input),
          );

          setSavedFilterSets((currentValue) => [createdFilterSet, ...currentValue]);

          return createdFilterSet;
        },
        exportXls: async (requestInput) => {
          const result = await runWithAdminSession((accessToken) =>
            moduleRegistryClient.exportXls(accessToken, requestInput),
          );

          openDownloadUrl(result?.downloadUrl);
        },
        loadMeta: async () =>
          runWithAdminSession((accessToken) => moduleRegistryClient.loadMeta(accessToken)),
        loadSearchSuggestions: async () =>
          runWithAdminSession((accessToken) => moduleRegistryClient.loadSearchSuggestions(accessToken)),
        query: async (requestInput) =>
          runWithAdminSession((accessToken) => moduleRegistryClient.query(accessToken, requestInput)),
        runBulkAction: async (input) => {
          await runWithAdminSession((accessToken) => moduleRegistryClient.runBulkAction(accessToken, input));
        },
        runRowAction: async (input) => {
          const result = await runWithAdminSession((accessToken) =>
            moduleRegistryClient.runRowAction(accessToken, {
              actionId: input.actionId,
              rowId: input.rowId,
            }),
          );

          openDownloadUrl(result?.downloadUrl);
        },
        toggleFavorite: async () =>
          runWithAdminSession((accessToken) => moduleRegistryClient.toggleFavorite(accessToken)),
      };
    },
    [moduleRegistryClient],
  );
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
  const suggestionFieldSignature = useMemo(
    () => createCollectionTableSuggestionsFieldSignature(tableMeta.fields),
    [tableMeta.fields],
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

  useEffect(() => {
    const searchableFieldIds = new Set(
      tableMeta.fields
        .filter((field) => field.searchable)
        .map((field) => field.id),
    );
    const defaultFieldId = tableMeta.search?.defaultFieldId ?? "all";

    if (draftSearchFieldId !== "all" && !searchableFieldIds.has(draftSearchFieldId)) {
      setDraftSearchFieldId(defaultFieldId);
    }
  }, [draftSearchFieldId, tableMeta.fields, tableMeta.search?.defaultFieldId]);

  useEffect(() => {
    if (!hasHydratedMetaRef.current) {
      return;
    }

    writePersistedCollectionTableState(tableStateStorageKey, {
      draftSearchFieldId,
      draftSearchOperator,
      queryState: collectionState.query,
    });
  }, [
    collectionState.query,
    draftSearchFieldId,
    draftSearchOperator,
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
    setDraftSearchFieldId(tableMeta.search?.defaultFieldId ?? "all");
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    setSelectedRowIds([]);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(COLLECTION_TABLE_RESET_PARAM);
    setSearchParams(nextSearchParams, { replace: true });
  }, [
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
      const targetPath = resolveFrontendRowActionPath(action, row);

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
      if (!isUnauthorizedApiError(requestError)) {
        setError(t("admin.collectionTable.errors.remoteMetadata"));
      }
    }
  }

  function resolveRowActionLabel(action: CollectionTableRowActionDefinition) {
    if (action.label) {
      return action.label;
    }

    switch (action.id) {
      case "edit":
        return t("admin.collectionTable.rowActions.edit");
      case "view":
        return t("admin.collectionTable.rowActions.view");
      case "pdf":
        return t("admin.collectionTable.rowActions.pdf");
      default:
        return humanizeActionIdLabel(action.id);
    }
  }

  function resolveToolbarActionLabel(actionId: "create" | "exportXls" | "reload") {
    switch (actionId) {
      case "create":
        return t("admin.collectionTable.actions.startNew");
      case "exportXls":
        return t("admin.collectionTable.actions.exportXls");
      case "reload":
        return t("admin.collectionTable.actions.reload");
      default:
        return actionId;
    }
  }

  function resolveBulkActionLabel(action: CollectionTableBulkActionDefinition) {
    return action.label ?? action.id;
  }

  function resolveBulkActionToneClass(action: CollectionTableBulkActionDefinition) {
    switch (action.tone) {
      case "brand":
        return " admin-web__collection-bulk-button--brand";
      case "danger":
        return " admin-web__collection-bulk-button--danger";
      case "info":
        return " admin-web__collection-bulk-button--info";
      case "success":
        return " admin-web__collection-bulk-button--success";
      case "warning":
        return " admin-web__collection-bulk-button--warning";
      case "neutral":
      default:
        return "";
    }
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

      const targetPath = resolveFrontendRowActionPath(action, row);

      return {
        disabled: !targetPath,
        id: action.id,
        label: resolveRowActionLabel(action),
        onSelect: targetPath
          ? () => {
            void handleRunRowAction(action, row);
          }
          : undefined,
      };
    },
  });

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
        const nextSuggestionFieldSignature = createCollectionTableSuggestionsFieldSignature(nextMeta.fields);
        const persistedSuggestionGroups = readPersistedCollectionTableSuggestions(
          tableSuggestionsStorageKey,
          nextSuggestionFieldSignature,
        ) ?? [];
        const compatibleSuggestionGroups = filterCompatibleSearchSuggestionGroups(
          persistedSuggestionGroups,
          nextMeta.fields,
        );

        hasLoadedSearchSuggestions.current = compatibleSuggestionGroups.length > 0;
        hasRevalidatedSearchSuggestionsForMeta.current = false;
        searchSuggestionsLoadPromise.current = null;
        setSearchSuggestionGroups(compatibleSuggestionGroups);
        hasHydratedMetaRef.current = true;
        setMetaVersion((currentValue) => currentValue + 1);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (!isUnauthorizedApiError(requestError)) {
          setError(t("admin.collectionTable.errors.remoteMetadata"));
        }

        setLoading(false);
      }
    }

    void resolveCollectionMeta();

    return () => {
      cancelled = true;
    };
  }, [initialPersistedState, metaRefreshKey, t, tableAdapter, tableSuggestionsStorageKey]);

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

        if (!isUnauthorizedApiError(requestError)) {
          setError(t("admin.collectionTable.errors.remoteMetadata"));
        }

        setLoading(false);
      }
    }

    void resolveCollectionRows();

    return () => {
      cancelled = true;
    };
  }, [metaVersion, queryRefreshKey, request, t, tableAdapter]);

  const createAction = tableMeta.actions?.create?.visible
    ? {
      label: tableMeta.actions.create.label ?? resolveToolbarActionLabel("create"),
    }
    : null;
  const exportAction = tableMeta.actions?.exportXls?.visible
    ? {
      label: tableMeta.actions.exportXls.label ?? resolveToolbarActionLabel("exportXls"),
    }
    : null;
  const favoriteAction = tableMeta.actions?.favorite?.visible
    ? tableMeta.actions.favorite
    : null;
  const reloadAction = tableMeta.actions?.reload?.visible
    ? {
      label: tableMeta.actions.reload.label ?? resolveToolbarActionLabel("reload"),
    }
    : null;

  const searchFieldOptions = useMemo<ReadonlyArray<SearchFieldOption>>(
    () => buildSearchFieldOptions(tableMeta.fields, t("admin.collectionTable.search.all")),
    [tableMeta.fields, t],
  );
  const selectedSearchField = useMemo(
    () =>
      draftSearchFieldId === "all"
        ? null
        : tableMeta.fields.find((field) => field.id === draftSearchFieldId && field.searchable) ?? null,
    [draftSearchFieldId, tableMeta.fields],
  );
  const selectedSearchFieldKind = useMemo<SearchFieldKind>(
    () => (selectedSearchField ? getSearchFieldKind(selectedSearchField.type) : "all"),
    [selectedSearchField],
  );
  const allowedSearchOperators = useMemo(
    () => getAllowedSearchOperators(selectedSearchFieldKind),
    [selectedSearchFieldKind],
  );
  useEffect(() => {
    if (allowedSearchOperators.includes(draftSearchOperator)) {
      return;
    }

    setDraftSearchOperator(getDefaultSearchOperator(selectedSearchFieldKind));
  }, [allowedSearchOperators, draftSearchOperator, selectedSearchFieldKind]);
  const selectableSearchOperators = useMemo(
    () => searchOperators.filter((option) => allowedSearchOperators.includes(option.value)),
    [allowedSearchOperators, searchOperators],
  );
  const usesDateSearchInput =
    selectedSearchFieldKind === "date" && doesSearchOperatorRequireValue(draftSearchOperator);
  const supportsSearchSuggestions =
    doesSearchOperatorRequireValue(draftSearchOperator) &&
    !usesDateSearchInput &&
    (draftSearchFieldId === "all" || Boolean(selectedSearchField?.suggestable));
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
    () =>
      highlightedSuggestionKey
        ? flattenedVisibleSearchSuggestions.find((suggestion) => getSearchSuggestionKey(suggestion) === highlightedSuggestionKey) ?? null
        : null,
    [flattenedVisibleSearchSuggestions, highlightedSuggestionKey],
  );
  const highlightedSearchSuggestionOptionId = highlightedSearchSuggestion
    ? getSearchSuggestionOptionId(getSearchSuggestionKey(highlightedSearchSuggestion))
    : undefined;
  const shouldRenderSearchSuggestions =
    isSearchSuggestionOpen && visibleSearchSuggestionGroups.length > 0;
  const selectedRowIdSet = useMemo(
    () => new Set(selectedRowIds),
    [selectedRowIds],
  );
  const selectedRowCount = selectedRowIds.length;

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

  const activeTokens = useMemo<ReadonlyArray<QuickFilterToken>>(() => {
    return collectionState.query.quickFilters.map((filter) => ({
      id: filter.id,
      label: formatAppliedQuickFilterLabel(filter, searchFieldOptions, {
        allField: t("admin.collectionTable.search.all"),
        isEmpty: t("admin.collectionTable.operators.isEmpty"),
        isNotEmpty: t("admin.collectionTable.operators.isNotEmpty"),
      }),
      onRemove: () => {
        setState((currentValue) => ({
          ...currentValue,
          query: {
            ...currentValue.query,
            page: 1,
            quickFilters: currentValue.query.quickFilters.filter((currentFilter) => currentFilter.id !== filter.id),
          },
        }));
      },
    }));
  }, [collectionState.query.quickFilters, searchFieldOptions, t]);

  const currentFilterSignature = useMemo(
    () => createFilterSignature(collectionState.query.quickFilters),
    [collectionState.query.quickFilters],
  );

  const isCurrentFilterSetSaved = useMemo(
    () =>
      collectionState.query.quickFilters.length > 0 &&
      savedFilterSets.some((savedFilterSet) => createFilterSignature(savedFilterSet.quickFilters) === currentFilterSignature),
    [collectionState.query.quickFilters.length, currentFilterSignature, savedFilterSets],
  );

  const normalizedSavedFilterLabel = draftSavedFilterLabel.trim();
  const saveFilterLabelError = useMemo(() => {
    if (!isSaveFilterDialogOpen) {
      return null;
    }

    if (normalizedSavedFilterLabel.length === 0) {
      return t("admin.collectionTable.dialog.validation.empty");
    }

    if (
      savedFilterSets.some(
        (savedFilterSet) =>
          savedFilterSet.label.trim().toLowerCase() === normalizedSavedFilterLabel.toLowerCase(),
      )
    ) {
      return t("admin.collectionTable.dialog.validation.duplicate");
    }

    return null;
  }, [isSaveFilterDialogOpen, normalizedSavedFilterLabel, savedFilterSets]);

  function setState(
    updater: (currentValue: CollectionTableState) => CollectionTableState,
  ) {
    startTransition(() => {
      setCollectionState(updater);
    });
  }

  function reportCollectionError(requestError: unknown) {
    if (isUnauthorizedApiError(requestError)) {
      return;
    }

    setError(t("admin.collectionTable.errors.remoteMetadata"));
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

  function getCompatibleCachedSearchSuggestionGroups() {
    const inMemoryGroups = filterCompatibleSearchSuggestionGroups(
      searchSuggestionGroups,
      tableMeta.fields,
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
          tableMeta.fields,
        );

        hasLoadedSearchSuggestions.current = true;
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
      hasLoadedSearchSuggestions.current = true;

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

  function closeSearchSuggestions() {
    setIsSearchSuggestionOpen(false);
    setHighlightedSuggestionKey(null);
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

  async function handleApplyBulkAction(actionId: string) {
    if (selectedRowIdSet.size === 0) {
      return;
    }

    try {
      await tableAdapter.runBulkAction?.({
        actionId,
        query: request,
        rowIds: selectedRowIds,
      });
    } catch (requestError) {
      reportCollectionError(requestError);
      return;
    }

    clearSelection();
    await reloadCurrentQuery();
  }

  function handleResetFilters() {
    setDraftSearchFieldId("all");
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    closeSearchSuggestions();
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
    closeSearchSuggestions();
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

  function handleApplyDraftFilter() {
    handleApplyDraftFilterWithQuery(draftSearchQuery);
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
      return;
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
    setDraftSearchQuery("");
    closeSearchSuggestions();
    clearSelection();
  }

  function handleApplyDraftFilterWithQuery(nextQuery: string) {
    handleApplyQuickFilterValue(draftSearchFieldId, draftSearchOperator, nextQuery);
  }

  function handleApplySuggestion(suggestion: CollectionTableSearchSuggestionItem) {
    const nextFieldId =
      draftSearchFieldId === "all"
        ? (typeof suggestion.fieldId === "string" && suggestion.fieldId.trim().length > 0
          ? suggestion.fieldId
          : "all")
        : draftSearchFieldId;

    handleApplyQuickFilterValue(
      nextFieldId,
      nextFieldId === "all" ? DEFAULT_OPERATOR : draftSearchOperator,
      suggestion.value,
    );
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

  function handleApplySavedFilterSet(savedFilterSet: CollectionTableSavedFilterSet) {
    setDraftSearchFieldId("all");
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    closeSearchSuggestions();
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
      await onNavigationRefresh?.();
    } catch {
      // Shell favorites are a secondary surface; keep the table state updated even if refresh fails.
    }
  }

  function handleExportXls() {
    void runCollectionMutation(async () => {
      await tableAdapter.exportXls?.({ query: request });
    });
  }

  function handleCreateModule() {
    navigate(getCreateModulePath());
  }

  const savedFilterMenuItems = savedFilterSets.length > 0 ? (
    savedFilterSets.map((savedFilterSet) => (
      <MenuItem key={savedFilterSet.id} onClick={() => handleApplySavedFilterSet(savedFilterSet)}>
        {savedFilterSet.label}
      </MenuItem>
    ))
  ) : (
    <MenuItem disabled>
      {t("admin.collectionTable.menu.noSavedFilters")}
    </MenuItem>
  );

  const toolbar = (
    <div className="admin-web__collection-toolbar admin-web__collection-toolbar--smart">
      <div className="admin-web__collection-smart-row">
        {createAction ? (
          <div className="admin-web__collection-smart-start admin-web__collection-smart-start--desktop">
            <Button
              className="admin-web__collection-smart-start-button"
              leadingIcon={<PlusIcon className="admin-web__collection-start-icon" />}
              onClick={handleCreateModule}
              size="sm"
              variant="primary"
            >
              {createAction.label}
            </Button>
          </div>
        ) : null}

        <div className="admin-web__collection-smart-controls">
          <div
            className="admin-web__collection-smart-search-stack"
            onBlurCapture={handleSearchShellBlur}
            onFocusCapture={handleSearchShellFocusCapture}
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
                  onChange={(event) => {
                    const nextFieldId = event.currentTarget.value;
                    const nextField =
                      tableMeta.fields.find((field) => field.id === nextFieldId && field.searchable) ??
                      null;
                    const nextFieldKind = nextField ? getSearchFieldKind(nextField.type) : "all";
                    const nextAllowedOperators = getAllowedSearchOperators(nextFieldKind);
                    const nextOperator = nextAllowedOperators.includes(draftSearchOperator)
                      ? draftSearchOperator
                      : getDefaultSearchOperator(nextFieldKind);

                    setDraftSearchFieldId(nextFieldId);
                    setDraftSearchOperator(nextOperator);
                    setHighlightedSuggestionKey(null);

                    if (
                      (nextFieldId === "all" || Boolean(nextField?.suggestable)) &&
                      doesSearchOperatorRequireValue(nextOperator) &&
                      nextFieldKind !== "date"
                    ) {
                      void ensureSearchSuggestionsLoaded();
                      setIsSearchSuggestionOpen(true);
                      return;
                    }

                    closeSearchSuggestions();
                  }}
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
                  onChange={(event) => {
                    const nextOperator = event.currentTarget.value as CollectionTableSearchOperator;
                    const nextUsesDateSearchInput =
                      selectedSearchFieldKind === "date" &&
                      doesSearchOperatorRequireValue(nextOperator);

                    setDraftSearchOperator(nextOperator);
                    setHighlightedSuggestionKey(null);

                    if (
                      doesSearchOperatorRequireValue(nextOperator) &&
                      !nextUsesDateSearchInput &&
                      (draftSearchFieldId === "all" || Boolean(selectedSearchField?.suggestable))
                    ) {
                      void ensureSearchSuggestionsLoaded();
                      setIsSearchSuggestionOpen(true);
                      return;
                    }

                    closeSearchSuggestions();
                  }}
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
                    onValueChange={(nextValue) => {
                      setDraftSearchQuery(nextValue);

                      if (nextValue.length > 0) {
                        handleApplyDraftFilterWithQuery(nextValue);
                      }
                    }}
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
                    aria-controls={shouldRenderSearchSuggestions ? SEARCH_SUGGESTION_LISTBOX_ID : undefined}
                    aria-expanded={shouldRenderSearchSuggestions}
                    aria-label={t("admin.collectionTable.search.inputAria")}
                    className="admin-web__collection-smart-search-input"
                    onChange={(event) => {
                      setDraftSearchQuery(event.currentTarget.value);
                      setHighlightedSuggestionKey(null);

                      if (supportsSearchSuggestions) {
                        void ensureSearchSuggestionsLoaded();
                        setIsSearchSuggestionOpen(true);
                        return;
                      }

                      closeSearchSuggestions();
                    }}
                    onFocus={() => {
                      void openSearchSuggestions();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        closeSearchSuggestions();
                        return;
                      }

                      if (event.key === "ArrowDown") {
                        event.preventDefault();

                        if (flattenedVisibleSearchSuggestions.length === 0) {
                          return;
                        }

                        const currentIndex = highlightedSuggestionKey
                          ? flattenedVisibleSearchSuggestions.findIndex(
                            (suggestion) => getSearchSuggestionKey(suggestion) === highlightedSuggestionKey,
                          )
                          : -1;
                        const nextIndex =
                          currentIndex >= flattenedVisibleSearchSuggestions.length - 1
                            ? 0
                            : currentIndex + 1;

                        setIsSearchSuggestionOpen(true);
                        setHighlightedSuggestionKey(
                          flattenedVisibleSearchSuggestions[nextIndex]
                            ? getSearchSuggestionKey(flattenedVisibleSearchSuggestions[nextIndex])
                            : null,
                        );
                        return;
                      }

                      if (event.key === "ArrowUp") {
                        event.preventDefault();

                        if (flattenedVisibleSearchSuggestions.length === 0) {
                          return;
                        }

                        const currentIndex = highlightedSuggestionKey
                          ? flattenedVisibleSearchSuggestions.findIndex(
                            (suggestion) => getSearchSuggestionKey(suggestion) === highlightedSuggestionKey,
                          )
                          : flattenedVisibleSearchSuggestions.length;
                        const nextIndex =
                          currentIndex <= 0
                            ? flattenedVisibleSearchSuggestions.length - 1
                            : currentIndex - 1;

                        setIsSearchSuggestionOpen(true);
                        setHighlightedSuggestionKey(
                          flattenedVisibleSearchSuggestions[nextIndex]
                            ? getSearchSuggestionKey(flattenedVisibleSearchSuggestions[nextIndex])
                            : null,
                        );
                        return;
                      }

                      if (event.key !== "Enter") {
                        return;
                      }

                      event.preventDefault();

                      if (highlightedSearchSuggestion) {
                        handleApplySuggestion(highlightedSearchSuggestion);
                        return;
                      }

                      handleApplyDraftFilter();
                    }}
                    placeholder={
                      doesSearchOperatorRequireValue(draftSearchOperator)
                        ? (resolvedConfig.searchPlaceholder ?? "Search...")
                        : t("admin.collectionTable.search.pressEnter")
                    }
                    size="sm"
                    value={draftSearchQuery}
                  />
                )}
              </div>
            </div>

            {shouldRenderSearchSuggestions ? (
              <div
                className="admin-web__collection-smart-suggestions"
                id={SEARCH_SUGGESTION_LISTBOX_ID}
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
                          id={getSearchSuggestionOptionId(getSearchSuggestionKey(suggestion))}
                          key={getSearchSuggestionKey(suggestion)}
                          onClick={() => handleApplySuggestion(suggestion)}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setHighlightedSuggestionKey(getSearchSuggestionKey(suggestion));
                          }}
                          onMouseMove={() => {
                            const nextSuggestionKey = getSearchSuggestionKey(suggestion);

                            if (highlightedSuggestionKey !== nextSuggestionKey) {
                              setHighlightedSuggestionKey(nextSuggestionKey);
                            }
                          }}
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

          <div className="admin-web__collection-smart-actions admin-web__collection-smart-actions--desktop">
            {favoriteAction ? (
              <button
                aria-label={favoriteAction.isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
                className={`admin-web__collection-smart-icon-button admin-web__collection-smart-icon-button--favorite${favoriteAction.isFavorite ? " admin-web__collection-smart-icon-button--active" : ""}`}
                onClick={() => {
                  void handleToggleFavorite();
                }}
                title={favoriteAction.isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
                type="button"
              >
                <StarIcon className="admin-web__collection-smart-action-icon" />
              </button>
            ) : null}

            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label={t("admin.collectionTable.menu.openSavedFilters")}
                  className="admin-web__collection-smart-icon-button"
                  title={t("admin.collectionTable.menu.savedFilters")}
                  type="button"
                >
                  <FilterFunnelIcon className="admin-web__collection-smart-action-icon" />
                </button>
              </MenuTrigger>
              <MenuContent className="admin-web__collection-smart-menu-content">
                <MenuLabel className="admin-web__collection-smart-menu-label">
                  {t("admin.collectionTable.menu.savedFilters")}
                </MenuLabel>
                {savedFilterMenuItems}
              </MenuContent>
            </Menu>

            {reloadAction ? (
              <button
                aria-label={t("admin.collectionTable.actions.reload")}
                className="admin-web__collection-smart-icon-button"
                onClick={() => setQueryRefreshKey((currentValue) => currentValue + 1)}
                title={t("admin.collectionTable.actions.reload")}
                type="button"
              >
                <RefreshIcon className="admin-web__collection-smart-action-icon" />
              </button>
            ) : null}

            {exportAction ? (
              <button
                aria-label={t("admin.collectionTable.actions.exportXls")}
                className="admin-web__collection-smart-icon-button"
                onClick={handleExportXls}
                title={t("admin.collectionTable.actions.exportXls")}
                type="button"
              >
                <SpreadsheetExportIcon className="admin-web__collection-smart-action-icon" />
              </button>
            ) : null}
          </div>

          <div className="admin-web__collection-smart-actions admin-web__collection-smart-actions--mobile">
            {favoriteAction ? (
              <button
                aria-label={favoriteAction.isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
                className={`admin-web__collection-smart-icon-button admin-web__collection-smart-icon-button--favorite${favoriteAction.isFavorite ? " admin-web__collection-smart-icon-button--active" : ""}`}
                onClick={() => {
                  void handleToggleFavorite();
                }}
                title={favoriteAction.isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
                type="button"
              >
                <StarIcon className="admin-web__collection-smart-action-icon" />
              </button>
            ) : null}

            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label={t("admin.collectionTable.menu.openTableActions")}
                  className="admin-web__collection-smart-icon-button"
                  title={t("admin.collectionTable.menu.moreActions")}
                  type="button"
                >
                  <OverflowMenuIcon className="admin-web__collection-smart-menu-icon" />
                </button>
              </MenuTrigger>
              <MenuContent className="admin-web__collection-smart-menu-content">
                {reloadAction ? (
                  <MenuItem onClick={() => setQueryRefreshKey((currentValue) => currentValue + 1)}>
                    {t("admin.collectionTable.actions.reload")}
                  </MenuItem>
                ) : null}

                {exportAction ? (
                  <MenuItem onClick={handleExportXls}>
                    {t("admin.collectionTable.actions.exportXls")}
                  </MenuItem>
                ) : null}

                {reloadAction || exportAction ? <MenuSeparator /> : null}

                <MenuLabel className="admin-web__collection-smart-menu-label">
                  {t("admin.collectionTable.menu.savedFilters")}
                </MenuLabel>
                {savedFilterMenuItems}
              </MenuContent>
            </Menu>
          </div>
        </div>
      </div>

      {activeTokens.length > 0 ? (
        <div className="admin-web__collection-toolbar-secondary">
          <div className="admin-web__collection-toolbar-tokens">
            {activeTokens.map((token) => (
              <button
                className="admin-web__collection-filter-token"
                key={token.id}
                onClick={token.onRemove}
                type="button"
              >
                <span>{token.label}</span>
                <CloseIcon className="admin-web__collection-filter-token-icon" />
              </button>
            ))}
          </div>

          <div className="admin-web__collection-toolbar-secondary-actions">
            <Button className="admin-web__collection-reset-filter" onClick={handleResetFilters} size="sm" variant="outline">
              {t("admin.collectionTable.actions.resetFilters")}
            </Button>

            <Button
              className="admin-web__collection-save-filter"
              disabled={collectionState.query.quickFilters.length === 0 || isCurrentFilterSetSaved}
              onClick={handleSaveFilterSet}
              size="sm"
              variant="ghost"
            >
              {isCurrentFilterSetSaved ? t("admin.collectionTable.actions.saved") : t("admin.collectionTable.actions.saveFilterSet")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="admin-web__modules-page">
      {createAction ? (
        <div className="admin-web__collection-mobile-start">
          <Button
            className="admin-web__collection-mobile-start-button"
            leadingIcon={<PlusIcon className="admin-web__collection-start-icon" />}
            onClick={handleCreateModule}
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
        onResetFilters={handleResetFilters}
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

      {selectedRowCount > 0 && tableMeta.selection?.enabled ? (
        <div className="admin-web__collection-bulk-bar" role="region" aria-label={t("admin.collectionTable.selection.bulkActions")}>
          <div className="admin-web__collection-bulk-bar-copy">
            <span className="admin-web__collection-bulk-bar-count">{t("admin.collectionTable.selection.selectedCount", { count: selectedRowCount })}</span>
          </div>

          <div className="admin-web__collection-bulk-bar-actions">
            {(tableMeta.bulkActions ?? []).map((action) => (
              <Button
                className={`admin-web__collection-bulk-button${resolveBulkActionToneClass(action)}`}
                key={action.id}
                onClick={() => {
                  void handleApplyBulkAction(action.id);
                }}
                size="sm"
                variant="outline"
              >
                {resolveBulkActionLabel(action)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <Dialog onOpenChange={handleSaveFilterDialogOpenChange} open={isSaveFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.collectionTable.dialog.title")}</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <div className="admin-web__collection-save-dialog-form">
              <Input
                autoFocus
                aria-invalid={saveFilterLabelError ? "true" : undefined}
                id="saved-filter-set-name"
                onChange={(event) => setDraftSavedFilterLabel(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }

                  event.preventDefault();
                  handleConfirmSaveFilterSet();
                }}
                placeholder={t("admin.collectionTable.dialog.placeholder")}
                value={draftSavedFilterLabel}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button onClick={() => handleSaveFilterDialogOpenChange(false)} variant="ghost">
              {t("admin.collectionTable.dialog.cancel")}
            </Button>
            <Button disabled={Boolean(saveFilterLabelError)} onClick={handleConfirmSaveFilterSet}>
              {t("admin.collectionTable.dialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
