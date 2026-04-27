import type {
  CollectionTableBulkActionDefinition,
  CollectionTableFavoriteActionMeta,
  CollectionTableMetaResponse,
  CollectionTableQuickFilter,
  CollectionTableRowActionDefinition,
  CollectionTableSavedFilterSet,
} from "../collection-table-contract";
import {
  createFilterSignature,
  formatAppliedQuickFilterGroupLabel,
  groupCollectionTableQuickFilters,
  type SearchFieldOption,
} from "../collection-table-runtime";

type ToolbarAction = {
  label: string;
};

type ToolbarActionLabels = {
  create: string;
  exportXls: string;
  reload: string;
};

type RowActionLabels = {
  edit: string;
  pdf: string;
  view: string;
};

type QuickFilterLabels = {
  allField: string;
  isEmpty: string;
  isNotEmpty: string;
};

type SavedFilterValidationLabels = {
  duplicate: string;
  empty: string;
};

export function humanizeCollectionTableActionIdLabel(actionId: string) {
  return actionId
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getCollectionTableRowActionLabel(
  action: CollectionTableRowActionDefinition,
  labels: RowActionLabels,
) {
  if (action.label) {
    return action.label;
  }

  switch (action.id) {
    case "edit":
      return labels.edit;
    case "view":
      return labels.view;
    case "pdf":
      return labels.pdf;
    default:
      return humanizeCollectionTableActionIdLabel(action.id);
  }
}

export function getCollectionTableBulkActionLabel(action: CollectionTableBulkActionDefinition) {
  return action.label ?? action.id;
}

export function getCollectionTableBulkActionToneClass(action: CollectionTableBulkActionDefinition) {
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

export function getCollectionTableToolbarActions(
  meta: CollectionTableMetaResponse,
  createPath: string | null,
  labels: ToolbarActionLabels,
): {
  createAction: ToolbarAction | null;
  exportAction: ToolbarAction | null;
  favoriteAction: CollectionTableFavoriteActionMeta | null;
  reloadAction: ToolbarAction | null;
} {
  return {
    createAction: meta.actions?.create?.visible && createPath
      ? {
        label: meta.actions.create.label ?? labels.create,
      }
      : null,
    exportAction: meta.actions?.exportXls?.visible
      ? {
        label: meta.actions.exportXls.label ?? labels.exportXls,
      }
      : null,
    favoriteAction: meta.actions?.favorite?.visible
      ? meta.actions.favorite
      : null,
    reloadAction: meta.actions?.reload?.visible
      ? {
        label: meta.actions.reload.label ?? labels.reload,
      }
      : null,
  };
}

export function buildCollectionTableQuickFilterTokens({
  labels,
  onRemoveGroup,
  quickFilters,
  searchFieldOptions,
}: {
  labels: QuickFilterLabels;
  onRemoveGroup: (filterIds: ReadonlySet<string>) => void;
  quickFilters: ReadonlyArray<CollectionTableQuickFilter>;
  searchFieldOptions: ReadonlyArray<SearchFieldOption>;
}) {
  return groupCollectionTableQuickFilters(quickFilters).map((group) => {
    const groupFilterIds = new Set(group.filters.map((filter) => filter.id));

    return {
      id: group.id,
      label: formatAppliedQuickFilterGroupLabel(group, searchFieldOptions, labels),
      onRemove: () => onRemoveGroup(groupFilterIds),
    };
  });
}

export function isCollectionTableFilterSetSaved(
  quickFilters: ReadonlyArray<CollectionTableQuickFilter>,
  savedFilterSets: ReadonlyArray<CollectionTableSavedFilterSet>,
) {
  if (quickFilters.length === 0) {
    return false;
  }

  const currentFilterSignature = createFilterSignature(quickFilters);

  return savedFilterSets.some(
    (savedFilterSet) => createFilterSignature(savedFilterSet.quickFilters) === currentFilterSignature,
  );
}

export function getCollectionTableSavedFilterLabelState({
  labels,
  open,
  savedFilterSets,
  value,
}: {
  labels: SavedFilterValidationLabels;
  open: boolean;
  savedFilterSets: ReadonlyArray<CollectionTableSavedFilterSet>;
  value: string;
}) {
  const normalizedLabel = value.trim();

  if (!open) {
    return {
      error: null,
      normalizedLabel,
    };
  }

  if (normalizedLabel.length === 0) {
    return {
      error: labels.empty,
      normalizedLabel,
    };
  }

  if (
    savedFilterSets.some(
      (savedFilterSet) =>
        savedFilterSet.label.trim().toLowerCase() === normalizedLabel.toLowerCase(),
    )
  ) {
    return {
      error: labels.duplicate,
      normalizedLabel,
    };
  }

  return {
    error: null,
    normalizedLabel,
  };
}
