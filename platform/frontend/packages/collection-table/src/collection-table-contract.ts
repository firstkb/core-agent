export type CollectionTableFieldType = "badge" | "boolean" | "date" | "date_time" | "html" | "text";
export type CollectionTableColumnType = CollectionTableFieldType | "actions";
export type CollectionTableBadgeTone =
  | "brand"
  | "danger"
  | "info"
  | "neutral"
  | "success"
  | "warning";
export type CollectionTableSearchOperator =
  | "contains"
  | "is_empty"
  | "is_equal_to"
  | "is_greater_or_equal_to"
  | "is_greater_than"
  | "is_less_or_equal_to"
  | "is_less_than"
  | "is_not_empty"
  | "is_not_equal_to";
export type CollectionTableSortDirection = "asc" | "desc";

export type CollectionTableQuickFilter = {
  fieldId: string;
  id: string;
  operator: CollectionTableSearchOperator;
  value: string;
};

export type CollectionTableSavedFilterSet = {
  id: string;
  label: string;
  quickFilters: ReadonlyArray<CollectionTableQuickFilter>;
};

export type CollectionTableFieldDefinition = {
  id: string;
  label: string;
  searchable: boolean;
  sortable: boolean;
  suggestable: boolean;
  type: CollectionTableFieldType;
};

export type CollectionTableColumnDefinition = {
  id: string;
  label: string;
  type: CollectionTableColumnType;
  align?: "left" | "right";
  defaultVisible?: boolean;
  description?: string;
  fieldId?: string;
  width?: string;
};

export type CollectionTableSearchMeta = {
  defaultFieldId: string;
  placeholder?: string;
};

export type CollectionTableSort = {
  columnId: string | null;
  direction: CollectionTableSortDirection;
};

export type CollectionTableBuiltInActionMeta = {
  label?: string;
  visible: boolean;
};

export type CollectionTableFavoriteActionMeta = CollectionTableBuiltInActionMeta & {
  isFavorite: boolean;
  pending?: boolean;
};

export type CollectionTableActionsMeta = {
  create?: CollectionTableBuiltInActionMeta;
  exportXls?: CollectionTableBuiltInActionMeta;
  favorite?: CollectionTableFavoriteActionMeta;
  reload?: CollectionTableBuiltInActionMeta;
};

export type CollectionTableRowActionDefinition = {
  execution: "backend" | "frontend";
  id: string;
  kind: "button";
  label?: string;
};

export type CollectionTableBulkActionDefinition = {
  confirmation?: CollectionTableBulkActionConfirmation;
  id: string;
  kind: "state-change" | "custom";
  label: string;
  tone?: CollectionTableBadgeTone;
};

export type CollectionTableBulkActionConfirmation = {
  cancelLabel?: string;
  confirmLabel?: string;
  description?: string;
  title: string;
};

export type CollectionTableSelectionMeta = {
  columnPosition: "leading";
  enabled: boolean;
  mode: "multi";
};

export type CollectionTableRowLayout = {
  secondaryRowFieldId?: string;
};

export type CollectionTableMetaResponse = {
  actions?: CollectionTableActionsMeta;
  bulkActions?: ReadonlyArray<CollectionTableBulkActionDefinition>;
  columns: ReadonlyArray<CollectionTableColumnDefinition>;
  defaultSort?: CollectionTableSort;
  fields: ReadonlyArray<CollectionTableFieldDefinition>;
  pageSizeOptions?: readonly number[];
  rowActions?: ReadonlyArray<CollectionTableRowActionDefinition>;
  rowLayout?: CollectionTableRowLayout;
  savedFilterSets?: ReadonlyArray<CollectionTableSavedFilterSet>;
  search?: CollectionTableSearchMeta;
  selection?: CollectionTableSelectionMeta;
  surfaceId: string;
  title: string;
};

export type CollectionTableRowCell = {
  displayValue?: string;
  html?: string;
  label?: string;
  tone?: CollectionTableBadgeTone;
  value: boolean | number | string;
};

export type CollectionTableRowData = {
  cells: Record<string, CollectionTableRowCell>;
  id: string;
  selectable?: boolean;
};

export type CollectionTableQueryRequest = {
  filters: Record<string, string>;
  page: number;
  pageSize: number;
  presetId: string;
  quickFilters: ReadonlyArray<CollectionTableQuickFilter>;
  sort: CollectionTableSort;
};

export type CollectionTableQueryResponse = {
  page: number;
  pageSize: number;
  rows: ReadonlyArray<CollectionTableRowData>;
  totalItems: number;
  totalPages: number;
};

export type CollectionTableSearchSuggestionItem = {
  count?: number;
  fieldId: string;
  id: string;
  value: string;
};

export type CollectionTableSearchSuggestionGroup = {
  fieldId: string;
  items: ReadonlyArray<CollectionTableSearchSuggestionItem>;
  label: string;
};

export type CollectionTableSearchSuggestionsResponse = {
  groups: ReadonlyArray<CollectionTableSearchSuggestionGroup>;
};

export type CollectionTableBulkActionRequest = {
  actionId: string;
  query: CollectionTableQueryRequest;
  rowIds: ReadonlyArray<string>;
};

export type CollectionTableRowActionRequest = {
  actionId: string;
  row: CollectionTableRowData;
  rowId: string;
};

export type CollectionTableSavedFilterSetCreateInput = {
  label: string;
  quickFilters: ReadonlyArray<CollectionTableQuickFilter>;
};

export type CollectionTableFavoriteToggleResult = {
  isFavorite: boolean;
};

export type CollectionTableFavoriteToggleEvent = CollectionTableFavoriteToggleResult & {
  surfaceId: string;
  tableId: string;
};

export type CollectionTableExportRequest = {
  query: CollectionTableQueryRequest;
};

export type CollectionTableAdapter = {
  createSavedFilterSet?: (
    input: CollectionTableSavedFilterSetCreateInput,
  ) => Promise<CollectionTableSavedFilterSet>;
  deleteSavedFilterSet?: (savedFilterId: string) => Promise<void>;
  exportXls?: (request: CollectionTableExportRequest) => Promise<void>;
  loadMeta: () => Promise<CollectionTableMetaResponse>;
  loadSearchSuggestions?: () => Promise<CollectionTableSearchSuggestionsResponse>;
  query: (request: CollectionTableQueryRequest) => Promise<CollectionTableQueryResponse>;
  runBulkAction?: (input: CollectionTableBulkActionRequest) => Promise<void>;
  runRowAction?: (input: CollectionTableRowActionRequest) => Promise<void>;
  toggleFavorite?: () => Promise<CollectionTableFavoriteToggleResult>;
};
