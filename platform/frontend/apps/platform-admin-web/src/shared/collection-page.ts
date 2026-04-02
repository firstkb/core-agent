import type { ReactNode } from "react";

import type {
  BadgeVariant,
  ButtonVariant,
  TableDensity,
  TableSortDirection,
} from "@platform/ui-kit";

export type CollectionPageRow = {
  id: string;
};

export type CollectionPageSortDirection = Exclude<TableSortDirection, null>;

export type CollectionPageColumn<Row extends CollectionPageRow> = {
  id: string;
  label: string;
  align?: "left" | "right";
  defaultVisible?: boolean;
  description?: string;
  sortable?: boolean;
  width?: string;
  getSortValue?: (row: Row) => number | string;
  renderCell: (row: Row) => ReactNode;
};

export type CollectionPageFilterOption = {
  label: string;
  value: string;
  count?: number;
};

export type CollectionPageFilter<Row extends CollectionPageRow> = {
  id: string;
  label: string;
  defaultValue?: string;
  description?: string;
  options: ReadonlyArray<CollectionPageFilterOption>;
  getValue?: (row: Row) => string;
};

export type CollectionPagePreset<Row extends CollectionPageRow> = {
  id: string;
  label: string;
  count?: string;
  defaultFilters?: Record<string, string>;
  defaultQuery?: string;
  matchRow?: (row: Row) => boolean;
  meta?: string;
  tone?: BadgeVariant;
};

export type CollectionPageAction = {
  id: string;
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
  variant?: ButtonVariant;
};

export type CollectionPageEmptyState = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export type CollectionPageFavoriteState = {
  isFavorite: boolean;
  pending?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  onToggle: () => void;
};

export type CollectionPageConfig<Row extends CollectionPageRow> = {
  title: string;
  columns: ReadonlyArray<CollectionPageColumn<Row>>;
  rows: ReadonlyArray<Row>;
  actions?: ReadonlyArray<CollectionPageAction>;
  description?: string;
  emptyState?: CollectionPageEmptyState;
  eyebrow?: string;
  filters?: ReadonlyArray<CollectionPageFilter<Row>>;
  getRowSearchText?: (row: Row) => string;
  pageSizeOptions?: readonly number[];
  presets?: ReadonlyArray<CollectionPagePreset<Row>>;
  renderRowSecondary?: (row: Row) => ReactNode;
  searchPlaceholder?: string;
};

export type CollectionPageColumnOverride<Row extends CollectionPageRow> = {
  id: string;
} & Partial<Omit<CollectionPageColumn<Row>, "id">>;

export type CollectionPageFilterOverride<Row extends CollectionPageRow> = {
  id: string;
} & Partial<Omit<CollectionPageFilter<Row>, "id">>;

export type CollectionPageConfigOverrides<Row extends CollectionPageRow> = {
  actions?: ReadonlyArray<CollectionPageAction>;
  columns?: ReadonlyArray<CollectionPageColumn<Row>>;
  columnOverrides?: ReadonlyArray<CollectionPageColumnOverride<Row>>;
  description?: string;
  emptyState?: Partial<CollectionPageEmptyState>;
  filters?: ReadonlyArray<CollectionPageFilter<Row>>;
  filterOverrides?: ReadonlyArray<CollectionPageFilterOverride<Row>>;
  pageSizeOptions?: readonly number[];
  presets?: ReadonlyArray<CollectionPagePreset<Row>>;
  renderRowSecondary?: (row: Row) => ReactNode;
  searchPlaceholder?: string;
  title?: string;
};

export type CollectionPageState = {
  density: TableDensity;
  filters: Record<string, string>;
  page: number;
  pageSize: number;
  presetId: string;
  sortColumnId: string | null;
  sortDirection: CollectionPageSortDirection;
  visibleColumnIds: string[];
};

export type CollectionPageResolvedResult<Row extends CollectionPageRow> = {
  currentPage: number;
  rows: ReadonlyArray<Row>;
  totalItems: number;
  totalPages: number;
};

function mergeItemsById<T extends { id: string }>(
  items: ReadonlyArray<T>,
  overrides: ReadonlyArray<{ id: string } & Partial<T>> = [],
) {
  if (overrides.length === 0) {
    return items;
  }

  const overrideMap = new Map(overrides.map((override) => [override.id, override]));

  return items.map((item) => {
    const override = overrideMap.get(item.id);
    return override ? { ...item, ...override } : item;
  });
}

export function getDefaultCollectionFilters<Row extends CollectionPageRow>(
  filters: ReadonlyArray<CollectionPageFilter<Row>> = [],
) {
  return Object.fromEntries(
    filters.map((filter) => [filter.id, filter.defaultValue ?? filter.options[0]?.value ?? "all"]),
  ) as Record<string, string>;
}

export function getCollectionPreset<Row extends CollectionPageRow>(
  config: Pick<CollectionPageConfig<Row>, "presets">,
  presetId: string,
) {
  return config.presets?.find((preset) => preset.id === presetId) ?? null;
}

export function getCollectionFiltersForPreset<Row extends CollectionPageRow>(
  config: Pick<CollectionPageConfig<Row>, "filters" | "presets">,
  presetId: string,
) {
  const preset = getCollectionPreset(config, presetId);

  return {
    ...getDefaultCollectionFilters(config.filters),
    ...(preset?.defaultFilters ?? {}),
  };
}

export function createCollectionPageState<Row extends CollectionPageRow>(
  config: CollectionPageConfig<Row>,
): CollectionPageState {
  const presetId = config.presets?.[0]?.id ?? "all";
  const preset = getCollectionPreset(config, presetId);

  return {
    density: "comfortable",
    filters: getCollectionFiltersForPreset(config, presetId),
    page: 1,
    pageSize: config.pageSizeOptions?.[0] ?? 10,
    presetId,
    sortColumnId: config.columns.find((column) => column.sortable)?.id ?? config.columns[0]?.id ?? null,
    sortDirection: "asc",
    visibleColumnIds: config.columns
      .filter((column) => column.defaultVisible !== false)
      .map((column) => column.id),
  };
}

export function mergeCollectionPageConfig<Row extends CollectionPageRow>(
  config: CollectionPageConfig<Row>,
  overrides?: CollectionPageConfigOverrides<Row>,
): CollectionPageConfig<Row> {
  if (!overrides) {
    return config;
  }

  const columns = overrides.columns ?? mergeItemsById(config.columns, overrides.columnOverrides);
  const filters = overrides.filters
    ?? mergeItemsById(config.filters ?? [], overrides.filterOverrides);
  const nextEmptyStateTitle = overrides.emptyState?.title ?? config.emptyState?.title;
  const emptyState = overrides.emptyState
    ? nextEmptyStateTitle
      ? {
        ...config.emptyState,
        ...overrides.emptyState,
        title: nextEmptyStateTitle,
      }
      : undefined
    : config.emptyState;

  return {
    ...config,
    actions: overrides.actions ?? config.actions,
    columns,
    description: overrides.description ?? config.description,
    emptyState,
    filters,
    pageSizeOptions: overrides.pageSizeOptions ?? config.pageSizeOptions,
    presets: overrides.presets ?? config.presets,
    renderRowSecondary: overrides.renderRowSecondary ?? config.renderRowSecondary,
    searchPlaceholder: overrides.searchPlaceholder ?? config.searchPlaceholder,
    title: overrides.title ?? config.title,
  };
}

function compareValues(left: number | string, right: number | string) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

export function resolveLocalCollectionPage<Row extends CollectionPageRow>(
  config: CollectionPageConfig<Row>,
  state: CollectionPageState,
): CollectionPageResolvedResult<Row> {
  const activePreset = getCollectionPreset(config, state.presetId);
  const rows = config.rows
    .filter((row) => {
      if (activePreset?.matchRow && !activePreset.matchRow(row)) {
        return false;
      }

      return (config.filters ?? []).every((filter) => {
        const activeValue = state.filters[filter.id] ?? filter.defaultValue ?? "all";

        if (!filter.getValue || activeValue === "all") {
          return true;
        }

        return filter.getValue(row) === activeValue;
      });
    })
    .sort((left, right) => {
      if (!state.sortColumnId) {
        return 0;
      }

      const column = config.columns.find((item) => item.id === state.sortColumnId);

      if (!column?.sortable || !column.getSortValue) {
        return 0;
      }

      const result = compareValues(column.getSortValue(left), column.getSortValue(right));
      return state.sortDirection === "asc" ? result : -result;
    });

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  const currentPage = Math.min(Math.max(state.page, 1), totalPages);
  const startIndex = (currentPage - 1) * state.pageSize;

  return {
    currentPage,
    rows: rows.slice(startIndex, startIndex + state.pageSize),
    totalItems,
    totalPages,
  };
}
