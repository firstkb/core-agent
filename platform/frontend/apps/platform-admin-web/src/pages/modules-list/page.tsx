import { startTransition, useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode, type SVGProps } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Badge,
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

import {
  type CollectionPageConfig,
  getCollectionFiltersForPreset,
  type CollectionPageRow,
} from "../../shared/collection-page";
import {
  type CollectionTableAdapter,
  type CollectionTableBulkActionDefinition,
  type CollectionTableColumnDefinition,
  type CollectionTableFieldDefinition,
  type CollectionTableMetaResponse,
  type CollectionTableQueryRequest,
  type CollectionTableQueryResponse,
  type CollectionTableQuickFilter,
  type CollectionTableRowActionDefinition,
  type CollectionTableRowCell,
  type CollectionTableRowData,
  type CollectionTableSavedFilterSet,
  type CollectionTableSearchOperator,
  type CollectionTableSearchSuggestionGroup,
  type CollectionTableSearchSuggestionItem,
} from "../../shared/collection-table-contract";
import {
  clearPersistedCollectionTableState,
  createCollectionTableState,
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
import { CollectionPageSurface } from "../../widgets/collection-page-surface/collection-page-surface";

type InspectionRow = {
  description: string;
  id: string;
  date: string;
  isActive: boolean;
  inspectorId: "alex" | "andrii" | "helpdesk" | "maria";
  inspectorLabel: string;
  location: string;
  reportedBy: string;
  statusId: "ai-reviewed" | "complete" | "open";
  statusLabel: string;
  statusTone: "brand" | "success" | "warning";
  typeId: "fall-protection" | "general" | "housekeeping" | "power-tools";
  typeLabel: string;
};

type SearchFieldOption = {
  id: string;
  label: string;
};

type SearchFieldKind = "all" | "date" | "text";

type QuickFilterToken = {
  id: string;
  label: string;
  onRemove: () => void;
};

type CollectionRenderRow = CollectionPageRow & {
  cells: Record<string, CollectionTableRowCell>;
  selectable: boolean;
};

type InspectionFieldAccessor<Row extends CollectionPageRow> = CollectionTableFieldDefinition & {
  getValue: (row: Row) => string | number;
};

const DEFAULT_OPERATOR: CollectionTableSearchOperator = "contains";
const COLLECTION_TABLE_RESET_PARAM = "reset";
const MODULE_REGISTRY_TABLE_ID = "module-registry.list";

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

const inspectionSeeds: ReadonlyArray<Omit<InspectionRow, "date" | "id" | "isActive">> = [
  {
    description: "All power cords and cord sets inspected for wear and routing.",
    inspectorId: "andrii",
    inspectorLabel: "Andrii K.",
    location: "Power tools",
    reportedBy: "Andrii K.",
    statusId: "ai-reviewed",
    statusLabel: "AI reviewed",
    statusTone: "warning",
    typeId: "power-tools",
    typeLabel: "Unsatisfactory",
  },
  {
    description: "Housekeeping notes recorded for stored materials and walkway clearance.",
    inspectorId: "andrii",
    inspectorLabel: "Andrii K.",
    location: "Test",
    reportedBy: "Andrii K.",
    statusId: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    typeId: "housekeeping",
    typeLabel: "Unsatisfactory",
  },
  {
    description: "Handrail anchors, treads, and safety markings verified.",
    inspectorId: "alex",
    inspectorLabel: "Alex T.",
    location: "North stairwell",
    reportedBy: "Alex T.",
    statusId: "open",
    statusLabel: "Open",
    statusTone: "brand",
    typeId: "general",
    typeLabel: "Observation",
  },
  {
    description: "Perimeter guard condition and roof ladder access reviewed.",
    inspectorId: "helpdesk",
    inspectorLabel: "Help Desk",
    location: "South roof",
    reportedBy: "Help Desk",
    statusId: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    typeId: "fall-protection",
    typeLabel: "Satisfactory",
  },
  {
    description: "Dock plates, bollards, and loading clearance checked for handoff.",
    inspectorId: "maria",
    inspectorLabel: "Maria P.",
    location: "Loading dock",
    reportedBy: "Maria P.",
    statusId: "ai-reviewed",
    statusLabel: "AI reviewed",
    statusTone: "warning",
    typeId: "power-tools",
    typeLabel: "Unsatisfactory",
  },
  {
    description: "Ceiling grid punch items and fixture placement logged.",
    inspectorId: "andrii",
    inspectorLabel: "Andrii K.",
    location: "West wing",
    reportedBy: "Andrii K.",
    statusId: "open",
    statusLabel: "Open",
    statusTone: "brand",
    typeId: "general",
    typeLabel: "Observation",
  },
  {
    description: "Valve labels, service clearance, and access route reviewed.",
    inspectorId: "alex",
    inspectorLabel: "Alex T.",
    location: "Mechanical room",
    reportedBy: "Alex T.",
    statusId: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    typeId: "housekeeping",
    typeLabel: "Satisfactory",
  },
  {
    description: "Hook, line, and exclusion-zone checkpoints confirmed.",
    inspectorId: "helpdesk",
    inspectorLabel: "Help Desk",
    location: "Tower crane",
    reportedBy: "Help Desk",
    statusId: "ai-reviewed",
    statusLabel: "AI reviewed",
    statusTone: "warning",
    typeId: "fall-protection",
    typeLabel: "Unsatisfactory",
  },
  {
    description: "Deck striping wear and drainage observations captured.",
    inspectorId: "maria",
    inspectorLabel: "Maria P.",
    location: "Parking deck",
    reportedBy: "Maria P.",
    statusId: "open",
    statusLabel: "Open",
    statusTone: "brand",
    typeId: "general",
    typeLabel: "Observation",
  },
  {
    description: "Latch inspection and access control handoff recorded.",
    inspectorId: "alex",
    inspectorLabel: "Alex T.",
    location: "Entry gate",
    reportedBy: "Alex T.",
    statusId: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    typeId: "housekeeping",
    typeLabel: "Satisfactory",
  },
] as const;

const inspectionRows: ReadonlyArray<InspectionRow> = Array.from({ length: 300 }, (_, index) => {
  const seed = inspectionSeeds[index % inspectionSeeds.length];
  const day = 23 - (index % 23);

  return {
    ...seed,
    date: `2/${Math.max(1, day)}/2026`,
    id: `record-${String(index + 1).padStart(3, "0")}`,
    isActive: index % 4 !== 0,
  };
});

function getAllowedSearchOperators(kind: SearchFieldKind) {
  return allowedOperatorsByFieldKind[kind];
}

function getSearchFieldKind(
  fieldType: CollectionTableFieldDefinition["type"],
): Exclude<SearchFieldKind, "all"> {
  return fieldType === "date" ? "date" : "text";
}

function buildSearchFieldOptions(
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

function buildSearchSuggestionGroups<Row extends CollectionPageRow>(
  rows: ReadonlyArray<Row>,
  fieldDefinitions: ReadonlyArray<InspectionFieldAccessor<Row>>,
  limit = 10,
): ReadonlyArray<CollectionTableSearchSuggestionGroup> {
  return fieldDefinitions
    .filter((field) => field.suggestable)
    .map((field) => {
      const itemMap = new Map<string, { count: number; value: string }>();

      rows.forEach((row) => {
        const value = String(field.getValue(row)).trim();

        if (value.length === 0) {
          return;
        }

        const normalizedValue = value.toLowerCase();
        const existingItem = itemMap.get(normalizedValue);

        if (existingItem) {
          existingItem.count += 1;
          return;
        }

        itemMap.set(normalizedValue, {
          count: 1,
          value,
        });
      });

      const items = Array.from(itemMap.entries())
        .map(([normalizedValue, item]) => ({
          count: item.count,
          fieldId: field.id,
          id: `${field.id}:${normalizedValue}`,
          value: item.value,
        }))
        .sort((left, right) => {
          if (right.count !== left.count) {
            return right.count - left.count;
          }

          return left.value.localeCompare(right.value, undefined, {
            sensitivity: "base",
          });
        })
        .slice(0, limit);

      return {
        fieldId: field.id,
        items,
        label: field.label,
      } satisfies CollectionTableSearchSuggestionGroup;
    })
    .filter((group) => group.items.length > 0);
}

function filterSearchSuggestionGroups(
  groups: ReadonlyArray<CollectionTableSearchSuggestionGroup>,
  fieldId: string,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const sourceGroups =
    fieldId === "all" ? groups : groups.filter((group) => group.fieldId === fieldId);

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

function renderHighlightedSuggestionText(value: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return value;
  }

  const normalizedValue = value.toLowerCase();
  const segments: ReactNode[] = [];
  let searchStartIndex = 0;
  let matchIndex = normalizedValue.indexOf(normalizedQuery, searchStartIndex);

  while (matchIndex !== -1) {
    if (matchIndex > searchStartIndex) {
      segments.push(value.slice(searchStartIndex, matchIndex));
    }

    const matchEndIndex = matchIndex + normalizedQuery.length;
    segments.push(
      <strong className="admin-web__collection-smart-suggestion-match" key={`${matchIndex}-${matchEndIndex}`}>
        {value.slice(matchIndex, matchEndIndex)}
      </strong>,
    );

    searchStartIndex = matchEndIndex;
    matchIndex = normalizedValue.indexOf(normalizedQuery, searchStartIndex);
  }

  if (searchStartIndex < value.length) {
    segments.push(value.slice(searchStartIndex));
  }

  return segments;
}

function getDefaultSearchOperator(kind: SearchFieldKind): CollectionTableSearchOperator {
  return getAllowedSearchOperators(kind)[0] ?? DEFAULT_OPERATOR;
}

function doesSearchOperatorRequireValue(operator: CollectionTableSearchOperator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

function getFieldDefinition(
  fieldDefinitions: ReadonlyArray<CollectionTableFieldDefinition>,
  fieldId: string,
) {
  return fieldDefinitions.find((field) => field.id === fieldId);
}

function RowActionCell({
  actions,
  rowId,
}: {
  actions: ReadonlyArray<{ id: string; label: string; onSelect: () => void }>;
  rowId: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="admin-web__collection-actions">
      <div className="admin-web__collection-actions-desktop">
        {actions.map((action) => (
          <Button
            key={action.id}
            className="admin-web__collection-row-action"
            onClick={action.onSelect}
            size="sm"
            variant="secondary"
          >
            {action.label}
          </Button>
        ))}
      </div>

      <div className="admin-web__collection-actions-mobile">
        <Menu align="start">
          <MenuTrigger>
            <button
              aria-label={t("admin.collectionTable.rowActions.openActions")}
              className="admin-web__collection-row-menu-button"
              title={t("admin.collectionTable.rowActions.moreActions")}
              type="button"
            >
              <OverflowMenuIcon className="admin-web__collection-row-menu-icon" />
            </button>
          </MenuTrigger>
          <MenuContent className="admin-web__collection-smart-menu-content">
            {actions.map((action) => (
              <MenuItem key={`${rowId}:${action.id}`} onClick={action.onSelect}>
                {action.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}

function OverflowMenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="5.5" r="2.1" />
      <circle cx="12" cy="12" r="2.1" />
      <circle cx="12" cy="18.5" r="2.1" />
    </svg>
  );
}

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

function TextCell({ value }: { value: string }) {
  return <span className="admin-web__collection-cell-value">{value}</span>;
}

function getCellText(cell?: CollectionTableRowCell) {
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

function buildRenderColumns(
  columns: ReadonlyArray<CollectionTableColumnDefinition>,
  fieldDefinitions: ReadonlyArray<CollectionTableFieldDefinition>,
  rowActions: ReadonlyArray<CollectionTableRowActionDefinition>,
  options: {
    getRowActionLabel: (action: CollectionTableRowActionDefinition) => string;
    onRowAction: (action: CollectionTableRowActionDefinition, row: CollectionRenderRow) => void;
  },
): CollectionPageConfig<CollectionRenderRow>["columns"] {
  return columns.map((column) => {
    if (column.type === "actions") {
      return {
        defaultVisible: column.defaultVisible ?? true,
        description: column.description,
        id: column.id,
        label: column.label,
        renderCell: (row) => (
          <RowActionCell
            actions={rowActions.map((action) => ({
              id: action.id,
              label: options.getRowActionLabel(action),
              onSelect: () => options.onRowAction(action, row),
            }))}
            rowId={row.id}
          />
        ),
        width: column.width ?? "var(--admin-web-collection-action-column-width, 14rem)",
      };
    }

    const fieldDefinition = column.fieldId
      ? getFieldDefinition(fieldDefinitions, column.fieldId)
      : null;

    return {
      align: column.align,
      defaultVisible: column.defaultVisible ?? true,
      description: column.description,
      id: column.id,
      label: column.label,
      renderCell: (row) => {
        const cell = column.fieldId ? row.cells[column.fieldId] : undefined;

        if (!cell) {
          return <TextCell value="" />;
        }

        if (column.type === "badge") {
          return (
            <Badge appearance="soft" size="sm" variant={cell.tone ?? "neutral"}>
              {getCellText(cell)}
            </Badge>
          );
        }

        if (column.type === "html") {
          return (
            <span
              className="admin-web__collection-cell-value"
              dangerouslySetInnerHTML={{ __html: cell.html ?? getCellText(cell) }}
            />
          );
        }

        return <TextCell value={getCellText(cell)} />;
      },
      sortable: fieldDefinition?.sortable ?? false,
      width: column.width,
    };
  });
}

function createCollectionRenderConfig(
  meta: CollectionTableMetaResponse,
  options: {
    getRowActionLabel: (action: CollectionTableRowActionDefinition) => string;
    onRowAction: (action: CollectionTableRowActionDefinition, row: CollectionRenderRow) => void;
  },
): CollectionPageConfig<CollectionRenderRow> {
  const secondaryRowFieldId = meta.rowLayout?.secondaryRowFieldId;

  return {
    columns: buildRenderColumns(
      meta.columns,
      meta.fields,
      meta.rowActions ?? [],
      options,
    ),
    filters: [],
    pageSizeOptions: meta.pageSizeOptions ?? [25, 50, 100],
    renderRowSecondary: secondaryRowFieldId
      ? (row) => {
        const secondaryText = getCellText(row.cells[secondaryRowFieldId]);
        return secondaryText.length > 0
          ? <span className="admin-web__collection-row-description">{secondaryText}</span>
          : null;
      }
      : undefined,
    rows: [],
    searchPlaceholder: meta.search?.placeholder,
    title: meta.title,
  };
}

function buildInspectionFieldAccessors(): ReadonlyArray<InspectionFieldAccessor<InspectionRow>> {
  return [
    { getValue: (row) => row.location, id: "location", label: "Location", searchable: true, sortable: true, suggestable: true, type: "text" },
    { getValue: (row) => row.description, id: "description", label: "Description", searchable: true, sortable: false, suggestable: false, type: "text" },
    { getValue: (row) => row.reportedBy, id: "reported", label: "Reported", searchable: true, sortable: true, suggestable: true, type: "text" },
    { getValue: (row) => row.inspectorLabel, id: "inspector", label: "Inspector", searchable: true, sortable: true, suggestable: true, type: "text" },
    { getValue: (row) => row.date, id: "date", label: "Date", searchable: true, sortable: true, suggestable: false, type: "date" },
    { getValue: (row) => row.statusLabel, id: "status", label: "Status", searchable: true, sortable: true, suggestable: true, type: "badge" },
    { getValue: (row) => (row.isActive ? "Active" : "Inactive"), id: "is_active", label: "Active", searchable: false, sortable: true, suggestable: false, type: "badge" },
    { getValue: (row) => row.typeLabel, id: "type", label: "Type", searchable: true, sortable: true, suggestable: true, type: "text" },
  ];
}

function buildMockTableMeta(
  params: {
    isFavorite: boolean;
    savedFilterSets: ReadonlyArray<CollectionTableSavedFilterSet>;
  },
): CollectionTableMetaResponse {
  return {
    actions: {
      create: { visible: true },
      exportXls: { visible: true },
      favorite: { isFavorite: params.isFavorite, visible: true },
      reload: { visible: true },
    },
    bulkActions: [
      { id: "activate", kind: "state-change" },
      { id: "deactivate", kind: "state-change" },
    ] satisfies ReadonlyArray<CollectionTableBulkActionDefinition>,
    columns: [
      { defaultVisible: true, id: "actions", label: "", type: "actions", width: "var(--admin-web-collection-action-column-width, 14rem)" },
      { defaultVisible: true, fieldId: "location", id: "location", label: "Location", type: "text", width: "14rem" },
      { defaultVisible: true, fieldId: "reported", id: "reported", label: "Reported", type: "text", width: "12rem" },
      { defaultVisible: true, fieldId: "date", id: "date", label: "Date", type: "date", width: "10rem" },
      { defaultVisible: true, fieldId: "status", id: "status", label: "Status", type: "badge", width: "10rem" },
      { defaultVisible: true, fieldId: "type", id: "type", label: "Type", type: "text", width: "12rem" },
    ],
    fields: buildInspectionFieldAccessors().map(({ getValue: _getValue, ...field }) => field),
    pageSizeOptions: [25, 50, 100],
    rowActions: [
      { execution: "frontend", id: "edit", kind: "button" },
      { execution: "frontend", id: "view", kind: "button" },
      { execution: "backend", id: "pdf", kind: "button" },
    ],
    rowLayout: {
      secondaryRowFieldId: "description",
    },
    savedFilterSets: params.savedFilterSets,
    search: {
      defaultFieldId: "all",
      placeholder: "Search...",
    },
    selection: {
      columnPosition: "leading",
      enabled: true,
      mode: "multi",
    },
    surfaceId: MODULE_REGISTRY_TABLE_ID,
    title: "Module registry",
  };
}

function mapInspectionRowsToCollectionRows(
  rows: ReadonlyArray<InspectionRow>,
): ReadonlyArray<CollectionRenderRow> {
  return rows.map((row) => ({
    cells: {
      date: { displayValue: row.date, value: row.date },
      description: { value: row.description },
      inspector: { value: row.inspectorLabel },
      is_active: { label: row.isActive ? "Active" : "Inactive", value: row.isActive },
      location: { value: row.location },
      reported: { value: row.reportedBy },
      status: { label: row.statusLabel, tone: row.statusTone, value: row.statusId },
      type: { value: row.typeLabel },
    },
    id: row.id,
    selectable: true,
  }));
}

function normalizeCollectionRows(
  rows: ReadonlyArray<CollectionTableRowData>,
): ReadonlyArray<CollectionRenderRow> {
  return rows.map((row) => ({
    cells: row.cells,
    id: row.id,
    selectable: row.selectable ?? true,
  }));
}

function createDefaultCollectionState(meta: CollectionTableMetaResponse) {
  return createCollectionTableState(
    createCollectionRenderConfig(meta, {
      getRowActionLabel: (action) => action.label ?? action.id,
      onRowAction: () => {},
    }),
  );
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function normalizeSearchValue(value: number | string) {
  return String(value).trim().toLowerCase();
}

function compareSearchValues(left: string, right: string) {
  const parsedLeftDate = Date.parse(left);
  const parsedRightDate = Date.parse(right);

  if (Number.isFinite(parsedLeftDate) && Number.isFinite(parsedRightDate)) {
    return parsedLeftDate - parsedRightDate;
  }

  const parsedLeftNumber = Number(left);
  const parsedRightNumber = Number(right);

  if (Number.isFinite(parsedLeftNumber) && Number.isFinite(parsedRightNumber)) {
    return parsedLeftNumber - parsedRightNumber;
  }

  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function evaluateSearchOperator(
  candidate: string,
  operator: CollectionTableSearchOperator,
  query: string,
) {
  if (operator === "is_empty") {
    return candidate.length === 0;
  }

  if (operator === "is_not_empty") {
    return candidate.length > 0;
  }

  if (query.length === 0) {
    return true;
  }

  switch (operator) {
    case "contains":
      return candidate.includes(query);
    case "is_equal_to":
      return candidate === query;
    case "is_not_equal_to":
      return candidate !== query;
    case "is_less_than":
      return compareSearchValues(candidate, query) < 0;
    case "is_less_or_equal_to":
      return compareSearchValues(candidate, query) <= 0;
    case "is_greater_than":
      return compareSearchValues(candidate, query) > 0;
    case "is_greater_or_equal_to":
      return compareSearchValues(candidate, query) >= 0;
    default:
      return false;
  }
}

function applyQuickFilter(
  rows: ReadonlyArray<InspectionRow>,
  filters: ReadonlyArray<CollectionTableQuickFilter>,
  fieldDefinitions: ReadonlyArray<InspectionFieldAccessor<InspectionRow>>,
) {
  if (filters.length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    filters.every((filter) => {
      const normalizedQuery = filter.value.trim().toLowerCase();

      if (
        filter.operator !== "is_empty" &&
        filter.operator !== "is_not_empty" &&
        normalizedQuery.length === 0
      ) {
        return true;
      }

      if (filter.fieldId === "all") {
        const haystack = normalizeSearchValue(
          fieldDefinitions
            .filter((field) => field.searchable)
            .map((field) => String(field.getValue(row)))
            .join(" "),
        );
        return evaluateSearchOperator(haystack, "contains", normalizedQuery);
      }

      const selectedField = fieldDefinitions.find((field) => field.id === filter.fieldId);

      if (!selectedField) {
        return true;
      }

      const candidate = normalizeSearchValue(selectedField.getValue(row));
      return evaluateSearchOperator(candidate, filter.operator, normalizedQuery);
    }),
  );
}

function formatAppliedQuickFilterLabel(
  filter: CollectionTableQuickFilter,
  searchFieldOptions: ReadonlyArray<SearchFieldOption>,
  labels: {
    allField: string;
    isEmpty: string;
    isNotEmpty: string;
  },
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

function buildAppliedQuickFilter(
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

function applyQuickFilters(
  rows: ReadonlyArray<InspectionRow>,
  filters: ReadonlyArray<CollectionTableQuickFilter>,
  fieldDefinitions: ReadonlyArray<InspectionFieldAccessor<InspectionRow>>,
) {
  return applyQuickFilter(rows, filters, fieldDefinitions);
}

function createFilterSignature(filters: ReadonlyArray<CollectionTableQuickFilter>) {
  return filters
    .map((filter) => filter.id)
    .sort((left, right) => left.localeCompare(right))
    .join("|");
}

function buildSavedFilterSetLabel(
  filters: ReadonlyArray<CollectionTableQuickFilter>,
  searchFieldOptions: ReadonlyArray<SearchFieldOption>,
  labels: {
    allField: string;
    isEmpty: string;
    isNotEmpty: string;
  },
) {
  if (filters.length === 0) {
    return "Saved filter set";
  }

  const [firstFilter] = filters;
  const firstLabel = formatAppliedQuickFilterLabel(firstFilter, searchFieldOptions, labels);

  if (filters.length === 1) {
    return firstLabel;
  }

  return `${firstLabel} +${filters.length - 1}`;
}

const defaultSavedFilterSets: ReadonlyArray<CollectionTableSavedFilterSet> = [
  {
    id: "saved-entry-gate",
    label: "Entry gate",
    quickFilters: [
      { fieldId: "location", id: "location:contains:entry gate", operator: "contains", value: "Entry gate" },
    ],
  },
  {
    id: "saved-complete",
    label: "Completed records",
    quickFilters: [
      { fieldId: "status", id: "status:is_equal_to:complete", operator: "is_equal_to", value: "Complete" },
    ],
  },
  {
    id: "saved-alex",
    label: "Alex T.",
    quickFilters: [
      { fieldId: "reported", id: "reported:contains:alex t.", operator: "contains", value: "Alex T." },
    ],
  },
] as const;

export function AdminModulesListPage() {
  const { t } = useTranslation();
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
    () =>
      buildMockTableMeta({
        isFavorite: false,
        savedFilterSets: defaultSavedFilterSets,
      }),
    [],
  );
  const fieldDefinitions = useMemo(
    () => buildInspectionFieldAccessors(),
    [],
  );
  const [inspectionData, setInspectionData] = useState<ReadonlyArray<InspectionRow>>(inspectionRows);
  const [isFavorite, setIsFavorite] = useState(
    initialMeta.actions?.favorite?.isFavorite ?? false,
  );
  const [selectedRowIds, setSelectedRowIds] = useState<ReadonlyArray<string>>([]);
  const [draftSearchFieldId, setDraftSearchFieldId] = useState(
    () => initialPersistedState?.draftSearchFieldId ?? initialMeta.search?.defaultFieldId ?? "all",
  );
  const [draftSearchOperator, setDraftSearchOperator] = useState<CollectionTableSearchOperator>(
    () => initialPersistedState?.draftSearchOperator ?? DEFAULT_OPERATOR,
  );
  const [draftSearchQuery, setDraftSearchQuery] = useState("");
  const [savedFilterSets, setSavedFilterSets] = useState<ReadonlyArray<CollectionTableSavedFilterSet>>(defaultSavedFilterSets);
  const [searchSuggestionGroups, setSearchSuggestionGroups] = useState<ReadonlyArray<CollectionTableSearchSuggestionGroup>>(
    () => readPersistedCollectionTableSuggestions(tableSuggestionsStorageKey) ?? [],
  );
  const [isSearchSuggestionOpen, setIsSearchSuggestionOpen] = useState(false);
  const [highlightedSuggestionId, setHighlightedSuggestionId] = useState<string | null>(null);
  const [isSaveFilterDialogOpen, setIsSaveFilterDialogOpen] = useState(false);
  const [draftSavedFilterLabel, setDraftSavedFilterLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tableMeta, setTableMeta] = useState<CollectionTableMetaResponse>(initialMeta);
  const [collectionState, setCollectionState] = useState<CollectionTableState>(() =>
    restoreCollectionTableState(createDefaultCollectionState(initialMeta), initialPersistedState),
  );
  const [resolvedRows, setResolvedRows] = useState<ReadonlyArray<CollectionRenderRow>>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const hasLoadedSearchSuggestions = useRef(searchSuggestionGroups.length > 0);
  const searchSuggestionsLoadPromise = useRef<Promise<ReadonlyArray<CollectionTableSearchSuggestionGroup>> | null>(null);
  const inspectionDataRef = useRef(inspectionData);
  const isFavoriteRef = useRef(isFavorite);
  const savedFilterSetsRef = useRef(savedFilterSets);

  inspectionDataRef.current = inspectionData;
  isFavoriteRef.current = isFavorite;
  savedFilterSetsRef.current = savedFilterSets;

  const tableAdapter = useMemo<CollectionTableAdapter>(
    () => ({
      createSavedFilterSet: async (input) => {
        await wait(120);

        const createdFilterSet = {
          id: `saved-${Date.now()}`,
          label: input.label,
          quickFilters: input.quickFilters,
        } satisfies CollectionTableSavedFilterSet;

        setSavedFilterSets((currentValue) => [createdFilterSet, ...currentValue]);

        return createdFilterSet;
      },
      exportXls: async () => {
        await wait(120);
      },
      loadMeta: async () => {
        await wait(120);

        return buildMockTableMeta({
          isFavorite: isFavoriteRef.current,
          savedFilterSets: savedFilterSetsRef.current,
        });
      },
      loadSearchSuggestions: async () => ({
        groups: buildSearchSuggestionGroups(inspectionDataRef.current, fieldDefinitions),
      }),
      query: async (remoteRequest) => {
        const filteredRows = applyQuickFilters(
          inspectionDataRef.current,
          remoteRequest.quickFilters,
          fieldDefinitions,
        ).filter((row) =>
          Object.entries(remoteRequest.filters).every(([filterId, filterValue]) => {
            if (filterValue === "all") {
              return true;
            }

            const selectedField = fieldDefinitions.find((field) => field.id === filterId);

            if (!selectedField) {
              return true;
            }

            return String(selectedField.getValue(row)) === filterValue;
          }),
        );
        const sortableField = remoteRequest.sort.columnId
          ? fieldDefinitions.find((field) => field.id === remoteRequest.sort.columnId)
          : null;
        const sortedRows = sortableField?.sortable
          ? [...filteredRows].sort((left, right) => {
            const result = compareSearchValues(
              String(sortableField.getValue(left)),
              String(sortableField.getValue(right)),
            );

            return remoteRequest.sort.direction === "asc" ? result : -result;
          })
          : filteredRows;
        const nextTotalItems = sortedRows.length;
        const nextTotalPages = Math.max(1, Math.ceil(nextTotalItems / remoteRequest.pageSize));
        const nextPage = Math.min(Math.max(remoteRequest.page, 1), nextTotalPages);
        const startIndex = (nextPage - 1) * remoteRequest.pageSize;

        await wait(280);

        return {
          page: nextPage,
          pageSize: remoteRequest.pageSize,
          rows: mapInspectionRowsToCollectionRows(
            sortedRows.slice(startIndex, startIndex + remoteRequest.pageSize),
          ),
          totalItems: nextTotalItems,
          totalPages: nextTotalPages,
        } satisfies CollectionTableQueryResponse;
      },
      runBulkAction: async ({ actionId, rowIds }) => {
        await wait(120);

        if (actionId !== "activate" && actionId !== "deactivate") {
          return;
        }

        const nextValue = actionId === "activate";

        setInspectionData((currentValue) =>
          currentValue.map((row) =>
            rowIds.includes(row.id)
              ? { ...row, isActive: nextValue }
              : row,
          ),
        );
      },
      runRowAction: async () => {
        await wait(120);
      },
      toggleFavorite: async () => {
        await wait(120);

        const nextFavoriteValue = !isFavoriteRef.current;

        setIsFavorite(nextFavoriteValue);

        return {
          isFavorite: nextFavoriteValue,
        };
      },
    }),
    [fieldDefinitions],
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
    row: CollectionRenderRow,
  ) {
    await tableAdapter.runRowAction?.({
      actionId: action.id,
      row,
      rowId: row.id,
    });
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
        return action.id;
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
    if (action.label) {
      return action.label;
    }

    switch (action.id) {
      case "activate":
        return t("admin.collectionTable.actions.setActive");
      case "deactivate":
        return t("admin.collectionTable.actions.setInactive");
      default:
        return action.id;
    }
  }

  const resolvedConfig = createCollectionRenderConfig(tableMeta, {
    getRowActionLabel: resolveRowActionLabel,
    onRowAction: (action, row) => {
      void handleRunRowAction(action, row);
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function resolveCollection() {
      setLoading(true);
      setError(null);

      try {
        const nextMeta = await tableAdapter.loadMeta();

        if (cancelled) {
          return;
        }

        setTableMeta(nextMeta);

        if (nextMeta.savedFilterSets) {
          setSavedFilterSets(nextMeta.savedFilterSets);
        }

        const response = await tableAdapter.query(request);

        if (cancelled) {
          return;
        }

        setResolvedRows(normalizeCollectionRows(response.rows));
        setTotalItems(response.totalItems);
        setTotalPages(response.totalPages);
        setLoading(false);

        if (response.page !== request.page) {
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
      } catch {
        if (cancelled) {
          return;
        }

        setError(t("admin.collectionTable.errors.remoteMetadata"));
        setLoading(false);
      }
    }

    void resolveCollection();

    return () => {
      cancelled = true;
    };
  }, [request, refreshKey, t, tableAdapter]);

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
      highlightedSuggestionId
        ? flattenedVisibleSearchSuggestions.find((suggestion) => suggestion.id === highlightedSuggestionId) ?? null
        : null,
    [flattenedVisibleSearchSuggestions, highlightedSuggestionId],
  );
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

    setHighlightedSuggestionId(null);
  }, [draftSearchFieldId, draftSearchOperator, draftSearchQuery, supportsSearchSuggestions]);

  useEffect(() => {
    if (!isSearchSuggestionOpen) {
      return;
    }

    setIsSearchSuggestionOpen(visibleSearchSuggestionGroups.length > 0);
  }, [isSearchSuggestionOpen, visibleSearchSuggestionGroups.length]);

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

  async function ensureSearchSuggestionsLoaded() {
    if (hasLoadedSearchSuggestions.current) {
      return searchSuggestionGroups;
    }

    if (searchSuggestionsLoadPromise.current) {
      return searchSuggestionsLoadPromise.current;
    }

    const loadPromise = (async () => {
      const persistedGroups = readPersistedCollectionTableSuggestions(tableSuggestionsStorageKey);

      if (persistedGroups && persistedGroups.length > 0) {
        hasLoadedSearchSuggestions.current = true;
        setSearchSuggestionGroups(persistedGroups);
        return persistedGroups;
      }

      const nextGroups = (await tableAdapter.loadSearchSuggestions?.())?.groups ?? [];

      hasLoadedSearchSuggestions.current = true;
      setSearchSuggestionGroups(nextGroups);
      writePersistedCollectionTableSuggestions(tableSuggestionsStorageKey, nextGroups);

      return nextGroups;
    })();

    searchSuggestionsLoadPromise.current = loadPromise;

    try {
      return await loadPromise;
    } finally {
      searchSuggestionsLoadPromise.current = null;
    }
  }

  function closeSearchSuggestions() {
    setIsSearchSuggestionOpen(false);
    setHighlightedSuggestionId(null);
  }

  async function openSearchSuggestions() {
    if (!supportsSearchSuggestions) {
      closeSearchSuggestions();
      return;
    }

    const loadedGroups = await ensureSearchSuggestionsLoaded();
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

  function handleToggleRowSelection(row: CollectionRenderRow, checked: boolean) {
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

    await tableAdapter.runBulkAction?.({
      actionId,
      query: request,
      rowIds: selectedRowIds,
    });

    clearSelection();
    setRefreshKey((currentValue) => currentValue + 1);
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
    handleApplyQuickFilterValue(
      draftSearchFieldId === "all" ? suggestion.fieldId : draftSearchFieldId,
      draftSearchFieldId === "all" ? DEFAULT_OPERATOR : draftSearchOperator,
      suggestion.value,
    );
  }

  function handleSearchShellFocusCapture() {
    void ensureSearchSuggestionsLoaded();
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

    await tableAdapter.createSavedFilterSet?.({
      label: normalizedSavedFilterLabel,
      quickFilters: collectionState.query.quickFilters,
    });

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
    const result = await tableAdapter.toggleFavorite?.();

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
              onClick={() => {}}
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
                      fieldDefinitions.find((field) => field.id === nextFieldId && field.searchable) ??
                      null;
                    const nextFieldKind = nextField ? getSearchFieldKind(nextField.type) : "all";
                    const nextAllowedOperators = getAllowedSearchOperators(nextFieldKind);
                    const nextOperator = nextAllowedOperators.includes(draftSearchOperator)
                      ? draftSearchOperator
                      : getDefaultSearchOperator(nextFieldKind);

                    setDraftSearchFieldId(nextFieldId);
                    setDraftSearchOperator(nextOperator);
                    setHighlightedSuggestionId(null);

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
                    setHighlightedSuggestionId(null);

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
                    aria-label={t("admin.collectionTable.search.inputAria")}
                    className="admin-web__collection-smart-search-input"
                    onChange={(event) => {
                      setDraftSearchQuery(event.currentTarget.value);
                      setHighlightedSuggestionId(null);

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

                        const currentIndex = highlightedSuggestionId
                          ? flattenedVisibleSearchSuggestions.findIndex((suggestion) => suggestion.id === highlightedSuggestionId)
                          : -1;
                        const nextIndex =
                          currentIndex >= flattenedVisibleSearchSuggestions.length - 1
                            ? 0
                            : currentIndex + 1;

                        setIsSearchSuggestionOpen(true);
                        setHighlightedSuggestionId(flattenedVisibleSearchSuggestions[nextIndex]?.id ?? null);
                        return;
                      }

                      if (event.key === "ArrowUp") {
                        event.preventDefault();

                        if (flattenedVisibleSearchSuggestions.length === 0) {
                          return;
                        }

                        const currentIndex = highlightedSuggestionId
                          ? flattenedVisibleSearchSuggestions.findIndex((suggestion) => suggestion.id === highlightedSuggestionId)
                          : flattenedVisibleSearchSuggestions.length;
                        const nextIndex =
                          currentIndex <= 0
                            ? flattenedVisibleSearchSuggestions.length - 1
                            : currentIndex - 1;

                        setIsSearchSuggestionOpen(true);
                        setHighlightedSuggestionId(flattenedVisibleSearchSuggestions[nextIndex]?.id ?? null);
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
                          aria-selected={highlightedSuggestionId === suggestion.id}
                          className={`admin-web__collection-smart-suggestion-item${highlightedSuggestionId === suggestion.id ? " admin-web__collection-smart-suggestion-item--active" : ""}`}
                          key={suggestion.id}
                          onClick={() => handleApplySuggestion(suggestion)}
                          onMouseDown={(event) => {
                            event.preventDefault();
                          }}
                          onMouseEnter={() => setHighlightedSuggestionId(suggestion.id)}
                          role="option"
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
                onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
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
                onClick={() => {
                  void tableAdapter.exportXls?.({ query: request });
                }}
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
                  <MenuItem onClick={() => setRefreshKey((currentValue) => currentValue + 1)}>
                    {t("admin.collectionTable.actions.reload")}
                  </MenuItem>
                ) : null}

                {exportAction ? (
                  <MenuItem onClick={() => {
                    void tableAdapter.exportXls?.({ query: request });
                  }}
                  >
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
            onClick={() => {}}
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
          setRefreshKey((currentValue) => currentValue + 1);
        }}
        onSortChange={handleSortChange}
        rows={resolvedRows}
        selection={tableMeta.selection?.enabled
          ? {
            getRowAriaLabel: (row) => t("admin.collectionTable.selection.selectRow", { label: getCellText(row.cells.location) }),
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
                className={`admin-web__collection-bulk-button${action.id === "activate" ? " admin-web__collection-bulk-button--activate" : action.id === "deactivate" ? " admin-web__collection-bulk-button--deactivate" : ""}`}
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
            <Button
              className="admin-web__collection-bulk-button admin-web__collection-bulk-button--clear"
              onClick={clearSelection}
              size="sm"
              variant="outline"
            >
              {t("admin.collectionTable.actions.clear")}
            </Button>
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
