import type {
  CollectionTableColumnDefinition,
  CollectionTableFieldDefinition,
  CollectionTableFieldType,
  CollectionTableMetaResponse,
  CollectionTableQuickFilter,
  CollectionTableQueryRequest,
  CollectionTableRowCell,
  CollectionTableRowData,
  CollectionTableSearchOperator,
  CollectionTableSearchSuggestionItem,
  CollectionTableSearchSuggestionGroup,
} from "./collection-table-contract";
import {
  createCollectionTableState,
  restoreCollectionTableState,
  type CollectionTableState,
  type PersistedCollectionTableState,
} from "./collection-table-state";

export type SearchFieldOption = {
  id: string;
  label: string;
};

export type SearchFieldKind = "all" | "date" | "text";

export type CollectionTableRenderRow = {
  cells: Record<string, CollectionTableRowCell>;
  id: string;
  selectable: boolean;
};

export type CollectionTableQuickFilterLabels = {
  allField: string;
  isEmpty: string;
  isNotEmpty: string;
};

export type CollectionTableQuickFilterGroup = {
  fieldId: string;
  filters: ReadonlyArray<CollectionTableQuickFilter>;
  id: string;
  operator: CollectionTableSearchOperator;
  values: ReadonlyArray<string>;
};

const DEFAULT_OPERATOR: CollectionTableSearchOperator = "contains";
const ACTIONS_COLUMN_ID = "actions";
const DEFAULT_ACTIONS_COLUMN_WIDTH = "var(--admin-web-collection-action-column-width, 14rem)";
const collectionTableDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const collectionTableDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  year: "numeric",
});

function normalizeSearchSuggestionId(fieldId: string, value: string) {
  return `${fieldId}:${value.trim().toLowerCase()}`;
}

const allowedOperatorsByFieldKind: Record<SearchFieldKind, readonly CollectionTableSearchOperator[]> = {
  all: ["contains"],
  date: [
    "is_equal_to",
    "is_less_than",
    "is_less_or_equal_to",
    "is_greater_than",
    "is_greater_or_equal_to",
    "is_empty",
    "is_not_empty",
  ],
  text: ["contains", "is_equal_to", "is_not_equal_to", "is_empty", "is_not_empty"],
};

export function getAllowedSearchOperators(kind: SearchFieldKind) {
  return allowedOperatorsByFieldKind[kind];
}

export function getSearchFieldKind(
  fieldType: CollectionTableFieldType,
): Exclude<SearchFieldKind, "all"> {
  return fieldType === "date" || fieldType === "date_time" ? "date" : "text";
}

export function buildSearchFieldOptions(
  fieldDefinitions: ReadonlyArray<CollectionTableFieldDefinition>,
  allLabel: string,
): ReadonlyArray<SearchFieldOption> {
  return [
    { id: "all", label: allLabel },
    ...fieldDefinitions
      .filter((field) => field.searchable)
      .map((field) => ({ id: field.id, label: field.label })),
  ];
}

export function filterSearchSuggestionGroups(
  groups: ReadonlyArray<CollectionTableSearchSuggestionGroup>,
  fieldId: string,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedGroups = normalizeCollectionTableSearchSuggestionGroups(groups);
  const sourceGroups =
    fieldId === "all"
      ? normalizedGroups
      : normalizedGroups.filter((group) => group.fieldId === fieldId);

  return sourceGroups
    .map((group) => ({
      ...group,
      items:
        normalizedQuery.length === 0
          ? group.items
          : group.items.filter((item) => item.value.toLowerCase().includes(normalizedQuery)),
    }))
    .filter((group) => group.items.length > 0);
}

export function normalizeCollectionTableSearchSuggestionGroups(
  groups: ReadonlyArray<CollectionTableSearchSuggestionGroup>,
): ReadonlyArray<CollectionTableSearchSuggestionGroup> {
  return groups
    .filter((group): group is CollectionTableSearchSuggestionGroup =>
      typeof group?.fieldId === "string" &&
      group.fieldId.trim().length > 0 &&
      typeof group?.label === "string" &&
      group.label.trim().length > 0,
    )
    .map((group) => {
      const groupFieldId = group.fieldId.trim();

      return {
        fieldId: groupFieldId,
        label: group.label,
        items: (group.items ?? [])
          .map((item) => normalizeCollectionTableSearchSuggestionItem(groupFieldId, item))
          .filter((item): item is CollectionTableSearchSuggestionItem => item !== null),
      };
    })
    .filter((group) => group.items.length > 0);
}

function normalizeCollectionTableSearchSuggestionItem(
  groupFieldId: string,
  item: CollectionTableSearchSuggestionItem,
): CollectionTableSearchSuggestionItem | null {
  const value = typeof item?.value === "string" ? item.value.trim() : "";

  if (value.length === 0) {
    return null;
  }

  const fieldId =
    typeof item.fieldId === "string" && item.fieldId.trim().length > 0
      ? item.fieldId.trim()
      : groupFieldId;

  return {
    count: item.count,
    fieldId,
    id:
      typeof item.id === "string" && item.id.trim().length > 0
        ? item.id.trim()
        : normalizeSearchSuggestionId(fieldId, value),
    value,
  };
}

export function getCellText(cell?: CollectionTableRowCell) {
  if (!cell) {
    return "";
  }

  if (typeof cell.displayValue === "string") {
    return cell.displayValue;
  }

  if (typeof cell.label === "string") {
    return cell.label;
  }

  return String(cell.value);
}

function parseCollectionTableDateValue(value: string, type: CollectionTableFieldType) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  if (type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    const [year, month, day] = normalizedValue.split("-").map((segment) => Number(segment));
    const parsedDate = new Date(year, month - 1, day);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function formatCollectionTableCellValue(
  value: string,
  type: CollectionTableFieldType,
) {
  if (type === "boolean") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "t", "1", "yes"].includes(normalizedValue)) {
      return "Yes";
    }

    if (["false", "f", "0", "no"].includes(normalizedValue)) {
      return "No";
    }

    return value;
  }

  if (type !== "date" && type !== "date_time") {
    return value;
  }

  const parsedDate = parseCollectionTableDateValue(value, type);
  if (!parsedDate) {
    return value;
  }

  return type === "date"
    ? collectionTableDateFormatter.format(parsedDate)
    : collectionTableDateTimeFormatter.format(parsedDate);
}

function getFieldDefinition(
  fieldDefinitions: ReadonlyArray<CollectionTableFieldDefinition>,
  fieldId: string,
) {
  return fieldDefinitions.find((field) => field.id === fieldId);
}

export function getRuntimeCollectionColumns(
  meta: Pick<CollectionTableMetaResponse, "columns" | "rowActions">,
): ReadonlyArray<CollectionTableColumnDefinition> {
  const hasActionsColumn = meta.columns.some((column) => column.type === "actions");

  if ((meta.rowActions?.length ?? 0) === 0 || hasActionsColumn) {
    return meta.columns;
  }

  return [
    {
      defaultVisible: true,
      id: ACTIONS_COLUMN_ID,
      label: "",
      type: "actions",
      width: DEFAULT_ACTIONS_COLUMN_WIDTH,
    },
    ...meta.columns,
  ];
}

function resolveDefaultSortColumnId(meta: CollectionTableMetaResponse) {
  return (
    getRuntimeCollectionColumns(meta).find((column) =>
      Boolean(column.fieldId && getFieldDefinition(meta.fields, column.fieldId)?.sortable),
    )?.id
    ?? getRuntimeCollectionColumns(meta)[0]?.id
    ?? null
  );
}

export function createDefaultCollectionState(
  meta: CollectionTableMetaResponse,
): CollectionTableState {
  return createCollectionTableState({
    columns: getRuntimeCollectionColumns(meta),
    defaultSortColumnId: meta.defaultSort?.columnId ?? resolveDefaultSortColumnId(meta),
    defaultSortDirection: meta.defaultSort?.direction ?? "asc",
    pageSizeOptions: meta.pageSizeOptions,
  });
}

export function createInitialCollectionTableMeta(
  surfaceId: string,
): CollectionTableMetaResponse {
  return {
    columns: [],
    fields: [],
    pageSizeOptions: [25, 50, 100],
    search: {
      defaultFieldId: "all",
      placeholder: "Search...",
    },
    surfaceId,
    title: "",
  };
}

export function normalizeCollectionRows(
  rows: ReadonlyArray<CollectionTableRowData>,
): ReadonlyArray<CollectionTableRenderRow> {
  return rows.map((row) => ({
    cells: row.cells,
    id: row.id,
    selectable: row.selectable ?? true,
  }));
}

export function isSortableColumn(
  meta: CollectionTableMetaResponse,
  columnId: string | null,
) {
  if (!columnId) {
    return false;
  }

  const column = getRuntimeCollectionColumns(meta).find((candidate) => candidate.id === columnId);

  if (!column || !column.fieldId) {
    return false;
  }

  return Boolean(getFieldDefinition(meta.fields, column.fieldId)?.sortable);
}

function normalizeVisibleColumnIds(
  meta: CollectionTableMetaResponse,
  visibleColumnIds: ReadonlyArray<string>,
) {
  const runtimeColumns = getRuntimeCollectionColumns(meta);
  const supportedColumnIds = new Set(runtimeColumns.map((column) => column.id));
  const nextVisibleColumnIds = visibleColumnIds.filter((columnId) => supportedColumnIds.has(columnId));
  const actionsColumn = runtimeColumns.find((column) => column.type === "actions");

  if (nextVisibleColumnIds.length === 0) {
    return createDefaultCollectionState(meta).visibleColumnIds;
  }

  if (
    actionsColumn &&
    (actionsColumn.defaultVisible ?? true) &&
    !nextVisibleColumnIds.includes(actionsColumn.id)
  ) {
    return [actionsColumn.id, ...nextVisibleColumnIds];
  }

  return nextVisibleColumnIds;
}

export function resolveCollectionStateForMeta(
  meta: CollectionTableMetaResponse,
  currentState: CollectionTableState,
  persistedState: PersistedCollectionTableState | null,
  hasHydratedMeta: boolean,
) {
  const baseState = createDefaultCollectionState(meta);
  const sourceState = hasHydratedMeta
    ? currentState
    : restoreCollectionTableState(baseState, persistedState);
  const allowedPageSizes = meta.pageSizeOptions ?? [];

  return {
    ...baseState,
    density: sourceState.density,
    query: {
      ...baseState.query,
      ...sourceState.query,
      ...(meta.defaultSort
        ? {
            sortColumnId: baseState.query.sortColumnId,
            sortDirection: baseState.query.sortDirection,
          }
        : {}),
      pageSize:
        allowedPageSizes.length === 0 || allowedPageSizes.includes(sourceState.query.pageSize)
          ? sourceState.query.pageSize
          : baseState.query.pageSize,
      sortColumnId: meta.defaultSort
        ? baseState.query.sortColumnId
        : (isSortableColumn(meta, sourceState.query.sortColumnId)
          ? sourceState.query.sortColumnId
          : baseState.query.sortColumnId),
      sortDirection: meta.defaultSort
        ? baseState.query.sortDirection
        : sourceState.query.sortDirection,
    },
    visibleColumnIds: normalizeVisibleColumnIds(meta, currentState.visibleColumnIds),
  } satisfies CollectionTableState;
}

export function filterCompatibleSearchSuggestionGroups(
  groups: ReadonlyArray<CollectionTableSearchSuggestionGroup>,
  fieldDefinitions: ReadonlyArray<CollectionTableFieldDefinition>,
) {
  const supportedFieldIds = new Set(fieldDefinitions.map((field) => field.id));

  return normalizeCollectionTableSearchSuggestionGroups(groups)
    .filter((group) => supportedFieldIds.has(group.fieldId));
}

export function getDefaultSearchOperator(kind: SearchFieldKind): CollectionTableSearchOperator {
  return getAllowedSearchOperators(kind)[0] ?? DEFAULT_OPERATOR;
}

export function getCollectionTableRowLabel(
  meta: CollectionTableMetaResponse,
  row: CollectionTableRenderRow,
) {
  for (const column of getRuntimeCollectionColumns(meta)) {
    if (!column.fieldId) {
      continue;
    }

    const cellText = getCellText(row.cells[column.fieldId]).trim();

    if (cellText.length > 0) {
      return cellText;
    }
  }

  for (const field of meta.fields) {
    const cellText = getCellText(row.cells[field.id]).trim();

    if (cellText.length > 0) {
      return cellText;
    }
  }

  return row.id;
}

export function doesSearchOperatorRequireValue(operator: CollectionTableSearchOperator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

export function formatAppliedQuickFilterLabel(
  filter: CollectionTableQuickFilter,
  searchFieldOptions: ReadonlyArray<SearchFieldOption>,
  labels: CollectionTableQuickFilterLabels,
) {
  const fieldLabel = searchFieldOptions.find((option) => option.id === filter.fieldId)?.label ?? labels.allField;
  const normalizedQuery = filter.value.trim();
  const fieldToken = `[${fieldLabel}]`;

  if (filter.operator === "is_empty" || filter.operator === "is_not_empty") {
    return `${fieldToken} ${filter.operator === "is_empty" ? labels.isEmpty : labels.isNotEmpty}`;
  }

  if (filter.operator === "contains") {
    return `${fieldToken} ${normalizedQuery}`;
  }

  const operatorToken = {
    is_equal_to: "=",
    is_not_equal_to: "!=",
    is_less_than: "<",
    is_less_or_equal_to: "<=",
    is_greater_than: ">",
    is_greater_or_equal_to: ">=",
  } satisfies Partial<Record<CollectionTableSearchOperator, string>>;

  return `${fieldToken} ${operatorToken[filter.operator] ?? ""} ${normalizedQuery}`.trim();
}

export function groupCollectionTableQuickFilters(
  filters: ReadonlyArray<CollectionTableQuickFilter>,
): ReadonlyArray<CollectionTableQuickFilterGroup> {
  const groupedFilters: CollectionTableQuickFilterGroup[] = [];
  const containsGroupIndexes = new Map<string, number>();

  for (const filter of filters) {
    const normalizedValue = filter.value.trim();

    if (filter.operator === "contains") {
      const groupKey = `${filter.fieldId}:${filter.operator}`;
      const existingIndex = containsGroupIndexes.get(groupKey);

      if (existingIndex !== undefined) {
        const existingGroup = groupedFilters[existingIndex];
        const nextFilters = [...existingGroup.filters, filter];
        groupedFilters[existingIndex] = {
          ...existingGroup,
          filters: nextFilters,
          id: createFilterSignature(nextFilters),
          values: nextFilters.map((entry) => entry.value.trim()).filter((value) => value.length > 0),
        };
        continue;
      }

      containsGroupIndexes.set(groupKey, groupedFilters.length);
    }

    groupedFilters.push({
      fieldId: filter.fieldId,
      filters: [filter],
      id: filter.id,
      operator: filter.operator,
      values: normalizedValue.length > 0 ? [normalizedValue] : [],
    });
  }

  return groupedFilters;
}

export function formatAppliedQuickFilterGroupLabel(
  group: CollectionTableQuickFilterGroup,
  searchFieldOptions: ReadonlyArray<SearchFieldOption>,
  labels: CollectionTableQuickFilterLabels,
) {
  const primaryFilter = group.filters[0];

  if (!primaryFilter) {
    return "";
  }

  if (group.operator !== "contains" || group.filters.length <= 1) {
    return formatAppliedQuickFilterLabel(primaryFilter, searchFieldOptions, labels);
  }

  const fieldLabel = searchFieldOptions.find((option) => option.id === group.fieldId)?.label ?? labels.allField;
  const fieldToken = `[${fieldLabel}]`;
  const groupedValues = group.values.join(", ");

  return groupedValues.length > 0 ? `${fieldToken} ${groupedValues}` : fieldToken;
}

export function buildAppliedQuickFilter(
  fieldId: string,
  operator: CollectionTableSearchOperator,
  value: string,
) {
  const normalizedOperator = fieldId === "all" ? "contains" : operator;
  const trimmedValue = value.trim();

  if (
    normalizedOperator !== "is_empty" &&
    normalizedOperator !== "is_not_empty" &&
    trimmedValue.length === 0
  ) {
    return null;
  }

  return {
    fieldId,
    id: `${fieldId}:${normalizedOperator}:${trimmedValue.toLowerCase()}`,
    operator: normalizedOperator,
    value: trimmedValue,
  } satisfies CollectionTableQuickFilter;
}

export function createFilterSignature(filters: ReadonlyArray<CollectionTableQuickFilter>) {
  return filters
    .map((filter) => filter.id)
    .sort((left, right) => left.localeCompare(right))
    .join("|");
}

export function createCollectionTableQueryScopeKey(
  request: CollectionTableQueryRequest,
) {
  return JSON.stringify(request);
}

export function reconcileSelectedRowIds(
  selectedRowIds: ReadonlyArray<string>,
  rows: ReadonlyArray<CollectionTableRenderRow>,
) {
  const visibleSelectableRowIds = new Set(
    rows
      .filter((row) => row.selectable)
      .map((row) => row.id),
  );
  const nextSelectedRowIds = selectedRowIds.filter((rowId) => visibleSelectableRowIds.has(rowId));

  return nextSelectedRowIds.length === selectedRowIds.length
    ? selectedRowIds
    : nextSelectedRowIds;
}
