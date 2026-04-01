import { startTransition, useEffect, useMemo, useRef, useState, type SVGProps } from "react";
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
  createCollectionPageState,
  getCollectionFiltersForPreset,
  mergeCollectionPageConfig,
  resolveLocalCollectionPage,
  type CollectionPageRequest,
  type CollectionPageResponse,
  type CollectionPageRow,
  type CollectionPageState,
} from "../../shared/collection-page";
import { CollectionPageSurface } from "../../widgets/collection-page-surface/collection-page-surface";

type SearchOperator =
  | "contains"
  | "is_empty"
  | "is_equal_to"
  | "is_greater_or_equal_to"
  | "is_greater_than"
  | "is_less_or_equal_to"
  | "is_less_than"
  | "is_not_empty"
  | "is_not_equal_to";

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
type InspectionFieldType = "badge" | "date" | "html" | "text";

type InspectionFieldDefinition<Row extends CollectionPageRow> = {
  id: string;
  label: string;
  type: InspectionFieldType;
  searchable: boolean;
  sortable: boolean;
  getValue: (row: Row) => string | number;
};

type QuickFilterToken = {
  id: string;
  label: string;
  onRemove: () => void;
};

type AppliedQuickFilter = {
  fieldId: string;
  id: string;
  operator: SearchOperator;
  query: string;
};

type SavedFilterSet = {
  filters: ReadonlyArray<AppliedQuickFilter>;
  id: string;
  label: string;
};

type CollectionTableAdapter<Row extends CollectionPageRow> = {
  loadMeta: () => Promise<CollectionPageConfig<Row>>;
  query: (request: CollectionPageRequest) => Promise<CollectionPageResponse<Row>>;
};

type PersistedCollectionTableState = {
  appliedQuickFilters: ReadonlyArray<AppliedQuickFilter>;
  collectionState: Pick<
    CollectionPageState,
    "filters" | "page" | "pageSize" | "presetId" | "sortColumnId" | "sortDirection"
  >;
  draftSearchFieldId: string;
  draftSearchOperator: SearchOperator;
};

const DEFAULT_OPERATOR: SearchOperator = "contains";
const COLLECTION_TABLE_RESET_PARAM = "reset";
const COLLECTION_TABLE_STATE_STORAGE_PREFIX = "collection-table-state:";
const MODULE_REGISTRY_TABLE_ID = "module-registry.list";

const allowedOperatorsByFieldKind: Record<SearchFieldKind, readonly SearchOperator[]> = {
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

function buildPresetCount(
  rows: ReadonlyArray<InspectionRow>,
  matcher: (row: InspectionRow) => boolean,
) {
  return rows.filter(matcher).length;
}

function getAllowedSearchOperators(kind: SearchFieldKind) {
  return allowedOperatorsByFieldKind[kind];
}

function getSearchFieldKind(fieldType: InspectionFieldType): Exclude<SearchFieldKind, "all"> {
  return fieldType === "date" ? "date" : "text";
}

function buildSearchFieldOptions<Row extends CollectionPageRow>(
  fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<Row>>,
  allLabel: string,
): ReadonlyArray<SearchFieldOption> {
  return [
    { id: "all", label: allLabel },
    ...fieldDefinitions
      .filter((field) => field.searchable)
      .map((field) => ({ id: field.id, label: field.label })),
  ];
}

function getDefaultSearchOperator(kind: SearchFieldKind): SearchOperator {
  return getAllowedSearchOperators(kind)[0] ?? DEFAULT_OPERATOR;
}

function doesSearchOperatorRequireValue(operator: SearchOperator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

function getFieldLabel<Row extends CollectionPageRow>(
  fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<Row>>,
  fieldId: string,
  fallback: string,
) {
  return fieldDefinitions.find((field) => field.id === fieldId)?.label ?? fallback;
}

function getFieldDefinition<Row extends CollectionPageRow>(
  fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<Row>>,
  fieldId: string,
) {
  return fieldDefinitions.find((field) => field.id === fieldId);
}

function RowActionCell({
  actions,
}: {
  actions: ReadonlyArray<{ id: string; label: string }>;
}) {
  const { t } = useTranslation();

  return (
    <div className="admin-web__collection-actions">
      <div className="admin-web__collection-actions-desktop">
        {actions.map((action) => (
          <Button key={action.id} className="admin-web__collection-row-action" size="sm" variant="secondary">
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
              <MenuItem key={action.id}>
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

function buildColumns(
  fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<InspectionRow>>,
  rowActions: ReadonlyArray<{ id: string; label: string }>,
): CollectionPageConfig<InspectionRow>["columns"] {
  const locationField = getFieldDefinition(fieldDefinitions, "location");
  const reportedField = getFieldDefinition(fieldDefinitions, "reported");
  const dateField = getFieldDefinition(fieldDefinitions, "date");
  const statusField = getFieldDefinition(fieldDefinitions, "status");
  const typeField = getFieldDefinition(fieldDefinitions, "type");
  const actionColumn = {
    defaultVisible: true,
    description: "Quick row actions.",
    id: "actions",
    label: "",
    renderCell: () => <RowActionCell actions={rowActions} />,
    width: "var(--admin-web-collection-action-column-width, 14rem)",
  };

  return [
    actionColumn,
    {
      defaultVisible: true,
      description: "Location value.",
      getSortValue: (row) => row.location,
      id: "location",
      label: getFieldLabel(fieldDefinitions, "location", "Location"),
      renderCell: (row) => <TextCell value={row.location} />,
      sortable: locationField?.sortable ?? true,
      width: "14rem",
    },
    {
      defaultVisible: true,
      description: "Reported by.",
      getSortValue: (row) => row.reportedBy,
      id: "reported",
      label: getFieldLabel(fieldDefinitions, "reported", "Reported"),
      renderCell: (row) => <TextCell value={row.reportedBy} />,
      sortable: reportedField?.sortable ?? true,
      width: "12rem",
    },
    {
      defaultVisible: true,
      description: "Inspection date.",
      getSortValue: (row) => row.date,
      id: "date",
      label: getFieldLabel(fieldDefinitions, "date", "Date"),
      renderCell: (row) => <TextCell value={row.date} />,
      sortable: dateField?.sortable ?? true,
      width: "10rem",
    },
    {
      defaultVisible: true,
      description: "Workflow state.",
      getSortValue: (row) => row.statusLabel,
      id: "status",
      label: getFieldLabel(fieldDefinitions, "status", "Status"),
      renderCell: (row) => (
        <Badge appearance="soft" size="sm" variant={row.statusTone}>
          {row.statusLabel}
        </Badge>
      ),
      sortable: statusField?.sortable ?? true,
      width: "10rem",
    },
    {
      defaultVisible: true,
      description: "Inspection type.",
      getSortValue: (row) => row.typeLabel,
      id: "type",
      label: getFieldLabel(fieldDefinitions, "type", "Type"),
      renderCell: (row) => <TextCell value={row.typeLabel} />,
      sortable: typeField?.sortable ?? true,
      width: "12rem",
    },
  ];
}

function createInspectionCollectionConfig(
  actions: CollectionPageConfig<InspectionRow>["actions"],
  rows: ReadonlyArray<InspectionRow>,
  options: {
    fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<InspectionRow>>;
    rowActions: ReadonlyArray<{ id: string; label: string }>;
    searchPlaceholder: string;
  },
): CollectionPageConfig<InspectionRow> {
  return {
    actions,
    columns: buildColumns(options.fieldDefinitions, options.rowActions),
    description: "Simple mock records that keep the table easy to scan while the smart toolbar is refined.",
    emptyState: {
      description: "Adjust search or clear the active tokens to restore records.",
      eyebrow: "Collection state",
      title: "No records match the current state",
    },
    eyebrow: "Collection preset",
    filters: [
      {
        defaultValue: "all",
        description: "Record status.",
        getValue: (row) => row.statusId,
        id: "status",
        label: getFieldLabel(options.fieldDefinitions, "status", "Status"),
        options: [
          { count: rows.length, label: "All statuses", value: "all" },
          { count: buildPresetCount(rows, (row) => row.statusId === "open"), label: "Open", value: "open" },
          { count: buildPresetCount(rows, (row) => row.statusId === "complete"), label: "Complete", value: "complete" },
          { count: buildPresetCount(rows, (row) => row.statusId === "ai-reviewed"), label: "AI reviewed", value: "ai-reviewed" },
        ],
      },
      {
        defaultValue: "all",
        description: "Inspection type.",
        getValue: (row) => row.typeId,
        id: "type",
        label: getFieldLabel(options.fieldDefinitions, "type", "Type"),
        options: [
          { count: rows.length, label: "All types", value: "all" },
          { count: buildPresetCount(rows, (row) => row.typeId === "power-tools"), label: "Power tools", value: "power-tools" },
          { count: buildPresetCount(rows, (row) => row.typeId === "housekeeping"), label: "Housekeeping", value: "housekeeping" },
          { count: buildPresetCount(rows, (row) => row.typeId === "fall-protection"), label: "Fall protection", value: "fall-protection" },
          { count: buildPresetCount(rows, (row) => row.typeId === "general"), label: "General", value: "general" },
        ],
      },
      {
        defaultValue: "all",
        description: "Assigned inspector.",
        getValue: (row) => row.inspectorId,
        id: "inspector",
        label: getFieldLabel(options.fieldDefinitions, "inspector", "Inspector"),
        options: [
          { count: rows.length, label: "All inspectors", value: "all" },
          { count: buildPresetCount(rows, (row) => row.inspectorId === "andrii"), label: "Andrii K.", value: "andrii" },
          { count: buildPresetCount(rows, (row) => row.inspectorId === "alex"), label: "Alex T.", value: "alex" },
          { count: buildPresetCount(rows, (row) => row.inspectorId === "helpdesk"), label: "Help Desk", value: "helpdesk" },
          { count: buildPresetCount(rows, (row) => row.inspectorId === "maria"), label: "Maria P.", value: "maria" },
        ],
      },
    ],
    getRowSearchText: (row) =>
      options.fieldDefinitions
        .filter((field) => field.searchable)
        .map((field) => String(field.getValue(row)))
        .join(" "),
    pageSizeOptions: [25, 50, 100],
    presets: [
      {
        count: String(rows.length),
        id: "all",
        label: "All records",
        meta: "Default queue",
        tone: "info",
      },
    ],
    renderRowSecondary: (row) => (
      <span className="admin-web__collection-row-description">{row.description}</span>
    ),
    rows,
    searchPlaceholder: options.searchPlaceholder,
    title: "Module registry",
  };
}

function createRemoteBaseConfig(
  rows: ReadonlyArray<InspectionRow>,
  options: {
    rowActions: ReadonlyArray<{ id: string; label: string }>;
    searchPlaceholder: string;
    createLabel: string;
    exportLabel: string;
    fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<InspectionRow>>;
    reloadLabel: string;
    favoriteLabel: string;
  },
): CollectionPageConfig<InspectionRow> {
  return createInspectionCollectionConfig([
    { id: "create", label: options.createLabel, variant: "primary" },
    { id: "export", label: options.exportLabel, variant: "ghost" },
    { id: "reload", label: options.reloadLabel, variant: "outline" },
    { id: "favorite", label: options.favoriteLabel, variant: "ghost" },
  ], rows, {
    fieldDefinitions: options.fieldDefinitions,
    rowActions: options.rowActions,
    searchPlaceholder: options.searchPlaceholder,
  });
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
  operator: SearchOperator,
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
  config: CollectionPageConfig<InspectionRow>,
  filters: ReadonlyArray<AppliedQuickFilter>,
  fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<InspectionRow>>,
) {
  if (filters.length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    filters.every((filter) => {
      const normalizedQuery = filter.query.trim().toLowerCase();

      if (
        filter.operator !== "is_empty" &&
        filter.operator !== "is_not_empty" &&
        normalizedQuery.length === 0
      ) {
        return true;
      }

      if (filter.fieldId === "all") {
        const haystack = normalizeSearchValue(config.getRowSearchText?.(row) ?? "");
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
  filter: AppliedQuickFilter,
  searchFieldOptions: ReadonlyArray<SearchFieldOption>,
  labels: {
    allField: string;
    isEmpty: string;
    isNotEmpty: string;
  },
) {
  const fieldLabel = searchFieldOptions.find((option) => option.id === filter.fieldId)?.label ?? labels.allField;
  const normalizedQuery = filter.query.trim();
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
  } satisfies Partial<Record<SearchOperator, string>>;

  return `${fieldToken} ${operatorToken[filter.operator] ?? ""} ${normalizedQuery}`.trim();
}

function buildAppliedQuickFilter(
  fieldId: string,
  operator: SearchOperator,
  query: string,
) {
  const normalizedOperator = fieldId === "all" ? "contains" : operator;
  const trimmedQuery = query.trim();

  if (
    normalizedOperator !== "is_empty" &&
    normalizedOperator !== "is_not_empty" &&
    trimmedQuery.length === 0
  ) {
    return null;
  }

  return {
    fieldId,
    id: `${fieldId}:${normalizedOperator}:${trimmedQuery.toLowerCase()}`,
    operator: normalizedOperator,
    query: trimmedQuery,
  } satisfies AppliedQuickFilter;
}

function applyQuickFilters(
  rows: ReadonlyArray<InspectionRow>,
  config: CollectionPageConfig<InspectionRow>,
  filters: ReadonlyArray<AppliedQuickFilter>,
  fieldDefinitions: ReadonlyArray<InspectionFieldDefinition<InspectionRow>>,
) {
  return applyQuickFilter(rows, config, filters, fieldDefinitions);
}

function createFilterSignature(filters: ReadonlyArray<AppliedQuickFilter>) {
  return filters
    .map((filter) => filter.id)
    .sort((left, right) => left.localeCompare(right))
    .join("|");
}

function buildSavedFilterSetLabel(
  filters: ReadonlyArray<AppliedQuickFilter>,
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

function getCollectionTableStateStorageKey(tableId: string) {
  return `${COLLECTION_TABLE_STATE_STORAGE_PREFIX}${tableId}`;
}

function readPersistedCollectionTableState(storageKey: string): PersistedCollectionTableState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedCollectionTableState>;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      appliedQuickFilters: Array.isArray(parsed.appliedQuickFilters) ? parsed.appliedQuickFilters : [],
      collectionState: {
        filters:
          parsed.collectionState && typeof parsed.collectionState.filters === "object" && parsed.collectionState.filters
            ? parsed.collectionState.filters
            : {},
        page:
          parsed.collectionState && typeof parsed.collectionState.page === "number"
            ? parsed.collectionState.page
            : 1,
        pageSize:
          parsed.collectionState && typeof parsed.collectionState.pageSize === "number"
            ? parsed.collectionState.pageSize
            : 25,
        presetId:
          parsed.collectionState && typeof parsed.collectionState.presetId === "string"
            ? parsed.collectionState.presetId
            : "all",
        sortColumnId:
          parsed.collectionState && (typeof parsed.collectionState.sortColumnId === "string" || parsed.collectionState.sortColumnId === null)
            ? parsed.collectionState.sortColumnId
            : null,
        sortDirection:
          parsed.collectionState?.sortDirection === "asc" || parsed.collectionState?.sortDirection === "desc"
            ? parsed.collectionState.sortDirection
            : "desc",
      },
      draftSearchFieldId:
        typeof parsed.draftSearchFieldId === "string"
          ? parsed.draftSearchFieldId
          : "all",
      draftSearchOperator:
        typeof parsed.draftSearchOperator === "string"
          ? (parsed.draftSearchOperator as SearchOperator)
          : DEFAULT_OPERATOR,
    };
  } catch {
    return null;
  }
}

function writePersistedCollectionTableState(
  storageKey: string,
  value: PersistedCollectionTableState,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(value));
  } catch {}
}

function clearPersistedCollectionTableState(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {}
}

function restoreCollectionPageState(
  baseState: CollectionPageState,
  persistedState: PersistedCollectionTableState | null,
): CollectionPageState {
  if (!persistedState) {
    return baseState;
  }

  return {
    ...baseState,
    filters: persistedState.collectionState.filters,
    page: persistedState.collectionState.page,
    pageSize: persistedState.collectionState.pageSize,
    presetId: persistedState.collectionState.presetId,
    sortColumnId: persistedState.collectionState.sortColumnId,
    sortDirection: persistedState.collectionState.sortDirection,
  };
}

const defaultSavedFilterSets: ReadonlyArray<SavedFilterSet> = [
  {
    id: "saved-entry-gate",
    label: "Entry gate",
    filters: [
      { fieldId: "location", id: "location:contains:entry gate", operator: "contains", query: "Entry gate" },
    ],
  },
  {
    id: "saved-complete",
    label: "Completed records",
    filters: [
      { fieldId: "status", id: "status:is_equal_to:complete", operator: "is_equal_to", query: "Complete" },
    ],
  },
  {
    id: "saved-alex",
    label: "Alex T.",
    filters: [
      { fieldId: "reported", id: "reported:contains:alex t.", operator: "contains", query: "Alex T." },
    ],
  },
] as const;

export function AdminModulesListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tableStateStorageKey = getCollectionTableStateStorageKey(MODULE_REGISTRY_TABLE_ID);
  const shouldResetPersistedState = searchParams.get(COLLECTION_TABLE_RESET_PARAM) === "1";
  const initialPersistedState = useMemo(
    () =>
      shouldResetPersistedState
        ? null
        : readPersistedCollectionTableState(tableStateStorageKey),
    [shouldResetPersistedState, tableStateStorageKey],
  );
  const [sourceMode] = useState<"local" | "remote">("remote");
  const [inspectionData, setInspectionData] = useState<ReadonlyArray<InspectionRow>>(inspectionRows);
  const [selectedRowIds, setSelectedRowIds] = useState<ReadonlyArray<string>>([]);
  const [draftSearchFieldId, setDraftSearchFieldId] = useState(
    () => initialPersistedState?.draftSearchFieldId ?? "all",
  );
  const [draftSearchOperator, setDraftSearchOperator] = useState<SearchOperator>(
    () => initialPersistedState?.draftSearchOperator ?? DEFAULT_OPERATOR,
  );
  const [draftSearchQuery, setDraftSearchQuery] = useState("");
  const [appliedQuickFilters, setAppliedQuickFilters] = useState<ReadonlyArray<AppliedQuickFilter>>(
    () => initialPersistedState?.appliedQuickFilters ?? [],
  );
  const [savedFilterSets, setSavedFilterSets] = useState<ReadonlyArray<SavedFilterSet>>(defaultSavedFilterSets);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaveFilterDialogOpen, setIsSaveFilterDialogOpen] = useState(false);
  const [draftSavedFilterLabel, setDraftSavedFilterLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tableRowActions = useMemo(
    () => [
      { id: "edit", label: t("admin.collectionTable.rowActions.edit") },
      { id: "view", label: t("admin.collectionTable.rowActions.view") },
      { id: "pdf", label: t("admin.collectionTable.rowActions.pdf") },
    ] as const,
    [t],
  );
  const searchOperators = useMemo<ReadonlyArray<{ label: string; value: SearchOperator }>>(
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
  const fieldDefinitions = useMemo<ReadonlyArray<InspectionFieldDefinition<InspectionRow>>>(
    () => [
      { getValue: (row) => row.location, id: "location", label: "Location", searchable: true, sortable: true, type: "text" },
      { getValue: (row) => row.description, id: "description", label: "Description", searchable: true, sortable: false, type: "text" },
      { getValue: (row) => row.reportedBy, id: "reported", label: "Reported", searchable: true, sortable: true, type: "text" },
      { getValue: (row) => row.inspectorLabel, id: "inspector", label: "Inspector", searchable: true, sortable: true, type: "text" },
      { getValue: (row) => row.date, id: "date", label: "Date", searchable: true, sortable: true, type: "date" },
      { getValue: (row) => row.statusLabel, id: "status", label: "Status", searchable: true, sortable: true, type: "badge" },
      { getValue: (row) => (row.isActive ? "Active" : "Inactive"), id: "is_active", label: "Active", searchable: false, sortable: true, type: "badge" },
      { getValue: (row) => row.typeLabel, id: "type", label: "Type", searchable: true, sortable: true, type: "text" },
    ],
    [],
  );

  const localActions = useMemo<NonNullable<CollectionPageConfig<InspectionRow>["actions"]>>(() => [
    {
      id: "create",
      label: t("admin.collectionTable.actions.startNew"),
      onSelect: () => {},
      variant: "primary",
    },
    {
      id: "export",
      label: t("admin.collectionTable.actions.exportXls"),
      onSelect: () => {},
      variant: "ghost",
    },
    {
      id: "reload",
      label: t("admin.collectionTable.actions.reload"),
      onSelect: () => {
        setRefreshKey((currentValue) => currentValue + 1);
      },
      variant: "outline",
    },
    {
      id: "favorite",
      label: t("admin.collectionTable.actions.favorite"),
      onSelect: () => {},
      variant: "ghost",
    },
  ], [t]);
  const remoteActionOverrides = useMemo<NonNullable<CollectionPageConfig<InspectionRow>["actions"]>>(() => [
    {
      id: "create",
      label: t("admin.collectionTable.actions.startNew"),
      onSelect: () => {},
      variant: "primary",
    },
    {
      id: "export",
      label: t("admin.collectionTable.actions.exportXls"),
      onSelect: () => {},
      variant: "ghost",
    },
    {
      id: "reload",
      label: t("admin.collectionTable.actions.reload"),
      onSelect: () => {
        setRefreshKey((currentValue) => currentValue + 1);
      },
      variant: "outline",
    },
    {
      id: "favorite",
      label: t("admin.collectionTable.actions.favorite"),
      onSelect: () => {},
      variant: "ghost",
    },
  ], [t]);

  const localConfig = useMemo(
    () => createInspectionCollectionConfig(localActions, inspectionData, {
      fieldDefinitions,
      rowActions: tableRowActions,
      searchPlaceholder: t("admin.collectionTable.search.placeholder"),
    }),
    [fieldDefinitions, inspectionData, localActions, t, tableRowActions],
  );
  const remoteBaseConfig = useMemo(
    () => createRemoteBaseConfig(inspectionData, {
      createLabel: t("admin.collectionTable.actions.startNew"),
      exportLabel: t("admin.collectionTable.actions.exportXls"),
      favoriteLabel: t("admin.collectionTable.actions.favorite"),
      fieldDefinitions,
      reloadLabel: t("admin.collectionTable.actions.reload"),
      rowActions: tableRowActions,
      searchPlaceholder: t("admin.collectionTable.search.placeholder"),
    }),
    [fieldDefinitions, inspectionData, t, tableRowActions],
  );
  const remoteConfig = useMemo(
    () => mergeCollectionPageConfig(remoteBaseConfig, {
      actions: remoteActionOverrides,
      description: "Remote schema stays backend-driven while the smart-toolbar sketch proves the collection contract.",
      searchPlaceholder: remoteBaseConfig.searchPlaceholder,
      title: remoteBaseConfig.title,
    }),
    [remoteActionOverrides, remoteBaseConfig],
  );
  const [collectionState, setCollectionState] = useState<CollectionPageState>(() =>
    restoreCollectionPageState(createCollectionPageState(remoteConfig), initialPersistedState),
  );
  const [resolvedConfig, setResolvedConfig] = useState<CollectionPageConfig<InspectionRow>>(remoteConfig);
  const [resolvedRows, setResolvedRows] = useState<ReadonlyArray<InspectionRow>>([]);
  const [totalItems, setTotalItems] = useState(0);
  const hasInitializedSourceMode = useRef(false);
  const previousSourceMode = useRef(sourceMode);

  const request = useMemo<CollectionPageRequest>(() => ({
    filters: collectionState.filters,
    page: collectionState.page,
    pageSize: collectionState.pageSize,
    presetId: collectionState.presetId,
    query: "",
    sortColumnId: collectionState.sortColumnId,
    sortDirection: collectionState.sortDirection,
  }), [
    collectionState.filters,
    collectionState.page,
    collectionState.pageSize,
    collectionState.presetId,
    collectionState.sortColumnId,
    collectionState.sortDirection,
  ]);

  const filteredLocalConfig = useMemo(
    () => ({
      ...localConfig,
      rows: applyQuickFilters(localConfig.rows, localConfig, appliedQuickFilters, fieldDefinitions),
    }),
    [appliedQuickFilters, fieldDefinitions, localConfig],
  );
  const filteredRemoteBaseConfig = useMemo(
    () => ({
      ...remoteBaseConfig,
      rows: applyQuickFilters(remoteBaseConfig.rows, remoteBaseConfig, appliedQuickFilters, fieldDefinitions),
    }),
    [appliedQuickFilters, fieldDefinitions, remoteBaseConfig],
  );
  const localRequestState = useMemo(
    () => ({
      ...createCollectionPageState(filteredLocalConfig),
      ...request,
    }),
    [filteredLocalConfig, request],
  );
  const remoteCollectionAdapter = useMemo<CollectionTableAdapter<InspectionRow>>(
    () => ({
      loadMeta: async () => {
        await wait(120);

        return filteredRemoteBaseConfig;
      },
      query: async (remoteRequest) => {
        const serverState = {
          ...createCollectionPageState(filteredRemoteBaseConfig),
          ...remoteRequest,
        };
        const resolved = resolveLocalCollectionPage(filteredRemoteBaseConfig, serverState);

        await wait(280);

        return {
          config: {
            ...filteredRemoteBaseConfig,
            rows: resolved.rows,
          },
          currentPage: resolved.currentPage,
          totalItems: resolved.totalItems,
        };
      },
    }),
    [filteredRemoteBaseConfig],
  );

  useEffect(() => {
    if (!hasInitializedSourceMode.current) {
      hasInitializedSourceMode.current = true;
      previousSourceMode.current = sourceMode;
      return;
    }

    if (previousSourceMode.current === sourceMode) {
      return;
    }

    previousSourceMode.current = sourceMode;

    const nextConfig = sourceMode === "local" ? localConfig : remoteConfig;

    setCollectionState(createCollectionPageState(nextConfig));
    setResolvedConfig(nextConfig);
    setResolvedRows(sourceMode === "local" ? nextConfig.rows : []);
    setTotalItems(sourceMode === "local" ? nextConfig.rows.length : 0);
    setError(null);
    setLoading(sourceMode === "remote");
    setDraftSearchFieldId("all");
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    setAppliedQuickFilters([]);
    setSelectedRowIds([]);
  }, [localConfig, remoteConfig, sourceMode]);

  useEffect(() => {
    if (!shouldResetPersistedState) {
      return;
    }

    clearPersistedCollectionTableState(tableStateStorageKey);

    const nextConfig = sourceMode === "local" ? localConfig : remoteConfig;

    setCollectionState(createCollectionPageState(nextConfig));
    setResolvedConfig(nextConfig);
    setResolvedRows(sourceMode === "local" ? nextConfig.rows : []);
    setTotalItems(sourceMode === "local" ? nextConfig.rows.length : 0);
    setError(null);
    setLoading(sourceMode === "remote");
    setDraftSearchFieldId("all");
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    setAppliedQuickFilters([]);
    setSelectedRowIds([]);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(COLLECTION_TABLE_RESET_PARAM);
    setSearchParams(nextSearchParams, { replace: true });
  }, [
    localConfig,
    remoteConfig,
    searchParams,
    setSearchParams,
    shouldResetPersistedState,
    sourceMode,
    tableStateStorageKey,
  ]);

  useEffect(() => {
    const searchableFieldIds = new Set(
      fieldDefinitions
        .filter((field) => field.searchable)
        .map((field) => field.id),
    );

    if (draftSearchFieldId !== "all" && !searchableFieldIds.has(draftSearchFieldId)) {
      setDraftSearchFieldId("all");
    }
  }, [draftSearchFieldId, fieldDefinitions]);

  useEffect(() => {
    writePersistedCollectionTableState(tableStateStorageKey, {
      appliedQuickFilters,
      collectionState: {
        filters: collectionState.filters,
        page: collectionState.page,
        pageSize: collectionState.pageSize,
        presetId: collectionState.presetId,
        sortColumnId: collectionState.sortColumnId,
        sortDirection: collectionState.sortDirection,
      },
      draftSearchFieldId,
      draftSearchOperator,
    });
  }, [
    appliedQuickFilters,
    collectionState.filters,
    collectionState.page,
    collectionState.pageSize,
    collectionState.presetId,
    collectionState.sortColumnId,
    collectionState.sortDirection,
    draftSearchFieldId,
    draftSearchOperator,
    tableStateStorageKey,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function resolveCollection() {
      if (sourceMode === "local") {
        const resolved = resolveLocalCollectionPage(filteredLocalConfig, localRequestState);

        if (cancelled) {
          return;
        }

        setResolvedConfig(localConfig);
        setResolvedRows(resolved.rows);
        setTotalItems(resolved.totalItems);
        setError(null);
        setLoading(false);

        if (resolved.currentPage !== request.page) {
          setCollectionState((currentValue) =>
            currentValue.page === resolved.currentPage
              ? currentValue
              : { ...currentValue, page: resolved.currentPage },
          );
        }

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const baseMeta = await remoteCollectionAdapter.loadMeta();

        if (cancelled) {
          return;
        }

        const response = await remoteCollectionAdapter.query(request);

        if (cancelled) {
          return;
        }

        const nextConfig = mergeCollectionPageConfig(response.config, {
          actions: remoteActionOverrides,
          description: baseMeta.description ?? remoteConfig.description,
          searchPlaceholder: baseMeta.searchPlaceholder ?? remoteConfig.searchPlaceholder,
          title: baseMeta.title ?? remoteConfig.title,
        });

        setResolvedConfig(nextConfig);
        setResolvedRows(nextConfig.rows);
        setTotalItems(response.totalItems ?? nextConfig.rows.length);
        setLoading(false);

        const nextPage = response.currentPage;

        if (typeof nextPage === "number" && nextPage !== request.page) {
          setCollectionState((currentValue) =>
            currentValue.page === nextPage
              ? currentValue
              : { ...currentValue, page: nextPage },
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
  }, [
    filteredLocalConfig,
    filteredRemoteBaseConfig,
    localConfig,
    localRequestState,
    remoteActionOverrides,
    remoteCollectionAdapter,
    remoteConfig,
    request,
    refreshKey,
    sourceMode,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / collectionState.pageSize));
  const createAction = resolvedConfig.actions?.find((action) => action.id === "create");
  const exportAction = resolvedConfig.actions?.find((action) => action.id === "export");
  const favoriteAction = resolvedConfig.actions?.find((action) => action.id === "favorite");
  const reloadAction = resolvedConfig.actions?.find((action) => action.id === "reload");

  const searchFieldOptions = useMemo<ReadonlyArray<SearchFieldOption>>(
    () => buildSearchFieldOptions(fieldDefinitions, t("admin.collectionTable.search.all")),
    [fieldDefinitions, t],
  );
  const selectedSearchField = useMemo(
    () =>
      draftSearchFieldId === "all"
        ? null
        : fieldDefinitions.find((field) => field.id === draftSearchFieldId && field.searchable) ?? null,
    [draftSearchFieldId, fieldDefinitions],
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
  const selectedRowIdSet = useMemo(
    () => new Set(selectedRowIds),
    [selectedRowIds],
  );
  const selectedRowCount = selectedRowIds.length;

  const activeTokens = useMemo<ReadonlyArray<QuickFilterToken>>(() => {
    return appliedQuickFilters.map((filter) => ({
      id: filter.id,
      label: formatAppliedQuickFilterLabel(filter, searchFieldOptions, {
        allField: t("admin.collectionTable.search.all"),
        isEmpty: t("admin.collectionTable.operators.isEmpty"),
        isNotEmpty: t("admin.collectionTable.operators.isNotEmpty"),
      }),
      onRemove: () => {
        setAppliedQuickFilters((currentValue) => currentValue.filter((currentFilter) => currentFilter.id !== filter.id));
        setState((currentValue) => ({
          ...currentValue,
          page: 1,
        }));
      },
    }));
  }, [appliedQuickFilters, searchFieldOptions]);

  const currentFilterSignature = useMemo(
    () => createFilterSignature(appliedQuickFilters),
    [appliedQuickFilters],
  );

  const isCurrentFilterSetSaved = useMemo(
    () =>
      appliedQuickFilters.length > 0 &&
      savedFilterSets.some((savedFilterSet) => createFilterSignature(savedFilterSet.filters) === currentFilterSignature),
    [appliedQuickFilters.length, currentFilterSignature, savedFilterSets],
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
    updater: (currentValue: CollectionPageState) => CollectionPageState,
  ) {
    startTransition(() => {
      setCollectionState(updater);
    });
  }

  function clearSelection() {
    setSelectedRowIds([]);
  }

  function handleToggleRowSelection(row: InspectionRow, checked: boolean) {
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

  function handleApplyBulkActiveState(nextValue: boolean) {
    if (selectedRowIdSet.size === 0) {
      return;
    }

    setInspectionData((currentValue) =>
      currentValue.map((row) =>
        selectedRowIdSet.has(row.id)
          ? { ...row, isActive: nextValue }
          : row,
      ),
    );
    clearSelection();
  }

  function handleResetFilters() {
    setDraftSearchFieldId("all");
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    setAppliedQuickFilters([]);
    clearSelection();
    setState((currentValue) => ({
      ...currentValue,
      filters: getCollectionFiltersForPreset(resolvedConfig, currentValue.presetId),
      page: 1,
      query: "",
    }));
  }

  function handleSortChange(columnId: string) {
    clearSelection();
    setState((currentValue) => ({
      ...currentValue,
      page: 1,
      sortColumnId: columnId,
      sortDirection:
        currentValue.sortColumnId === columnId && currentValue.sortDirection === "asc"
          ? "desc"
          : "asc",
    }));
  }

  function handleApplyDraftFilter() {
    handleApplyDraftFilterWithQuery(draftSearchQuery);
  }

  function handleApplyDraftFilterWithQuery(nextQuery: string) {
    const nextFilter = buildAppliedQuickFilter(
      draftSearchFieldId,
      draftSearchOperator,
      nextQuery,
    );

    if (!nextFilter) {
      return;
    }

    setAppliedQuickFilters((currentValue) => {
      if (currentValue.some((filter) => filter.id === nextFilter.id)) {
        return currentValue;
      }

      return [...currentValue, nextFilter];
    });
    setDraftSearchQuery("");
    clearSelection();
    setState((currentValue) => ({
      ...currentValue,
      page: 1,
    }));
  }

  function handleApplySavedFilterSet(savedFilterSet: SavedFilterSet) {
    setAppliedQuickFilters(savedFilterSet.filters);
    setDraftSearchFieldId("all");
    setDraftSearchOperator(DEFAULT_OPERATOR);
    setDraftSearchQuery("");
    clearSelection();
    setState((currentValue) => ({
      ...currentValue,
      page: 1,
    }));
  }

  function handleSaveFilterSet() {
    if (appliedQuickFilters.length === 0 || isCurrentFilterSetSaved) {
      return;
    }

    setDraftSavedFilterLabel("");
    setIsSaveFilterDialogOpen(true);
  }

  function handleConfirmSaveFilterSet() {
    if (appliedQuickFilters.length === 0 || isCurrentFilterSetSaved || saveFilterLabelError) {
      return;
    }

    setSavedFilterSets((currentValue) => [
      {
        filters: appliedQuickFilters,
        id: `saved-${currentFilterSignature || Date.now()}`,
        label: normalizedSavedFilterLabel,
      },
      ...currentValue,
    ]);

    setIsSaveFilterDialogOpen(false);
    setDraftSavedFilterLabel("");
  }

  function handleSaveFilterDialogOpenChange(open: boolean) {
    setIsSaveFilterDialogOpen(open);

    if (!open) {
      setDraftSavedFilterLabel("");
    }
  }

  function handleToggleFavorite() {
    setIsFavorite((currentValue) => !currentValue);
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
              onClick={() => createAction.onSelect?.()}
              size="sm"
              variant="primary"
            >
              {createAction.label}
            </Button>
          </div>
        ) : null}

        <div className="admin-web__collection-smart-controls">
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
                  const nextAllowedOperators = getAllowedSearchOperators(
                    nextField ? getSearchFieldKind(nextField.type) : "all",
                  );

                  setDraftSearchFieldId(nextFieldId);
                  setDraftSearchOperator((currentValue) =>
                    nextAllowedOperators.includes(currentValue)
                      ? currentValue
                      : getDefaultSearchOperator(nextField ? getSearchFieldKind(nextField.type) : "all"),
                  );
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
                onChange={(event) => setDraftSearchOperator(event.currentTarget.value as SearchOperator)}
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
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    event.preventDefault();
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

          <div className="admin-web__collection-smart-actions admin-web__collection-smart-actions--desktop">
            {favoriteAction ? (
              <button
                aria-label={isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
                className={`admin-web__collection-smart-icon-button admin-web__collection-smart-icon-button--favorite${isFavorite ? " admin-web__collection-smart-icon-button--active" : ""}`}
                onClick={handleToggleFavorite}
                title={isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
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
                onClick={() => reloadAction.onSelect?.()}
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
                onClick={() => exportAction.onSelect?.()}
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
                aria-label={isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
                className={`admin-web__collection-smart-icon-button admin-web__collection-smart-icon-button--favorite${isFavorite ? " admin-web__collection-smart-icon-button--active" : ""}`}
                onClick={handleToggleFavorite}
                title={isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
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
                  <MenuItem onClick={() => reloadAction.onSelect?.()}>
                    {t("admin.collectionTable.actions.reload")}
                  </MenuItem>
                ) : null}

                {exportAction ? (
                  <MenuItem onClick={() => exportAction.onSelect?.()}>
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
              disabled={appliedQuickFilters.length === 0 || isCurrentFilterSetSaved}
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
            onClick={() => createAction.onSelect?.()}
            size="sm"
            variant="primary"
          >
            {createAction.label}
          </Button>
        </div>
      ) : null}

      <CollectionPageSurface
        config={resolvedConfig}
        currentPage={Math.min(collectionState.page, totalPages)}
        error={error}
        loading={loading}
        onPageChange={(page) => {
          clearSelection();
          setState((currentValue) => ({
            ...currentValue,
            page,
          }));
        }}
        onPageSizeChange={(pageSize) => {
          clearSelection();
          setState((currentValue) => ({
            ...currentValue,
            page: 1,
            pageSize,
          }));
        }}
        onResetFilters={handleResetFilters}
        onRetry={() => {
          clearSelection();
          setRefreshKey((currentValue) => currentValue + 1);
        }}
        onSortChange={handleSortChange}
        rows={resolvedRows}
        selection={{
          getRowAriaLabel: (row) => t("admin.collectionTable.selection.selectRow", { label: row.location }),
          onToggleRow: handleToggleRowSelection,
          onToggleVisibleRows: handleToggleVisibleRows,
          selectedRowIds,
        }}
        state={{
          ...collectionState,
          page: Math.min(collectionState.page, totalPages),
        }}
        toolbar={toolbar}
        totalItems={totalItems}
        totalPages={totalPages}
      />

      {selectedRowCount > 0 ? (
        <div className="admin-web__collection-bulk-bar" role="region" aria-label={t("admin.collectionTable.selection.bulkActions")}>
          <div className="admin-web__collection-bulk-bar-copy">
            <span className="admin-web__collection-bulk-bar-count">{t("admin.collectionTable.selection.selectedCount", { count: selectedRowCount })}</span>
          </div>

          <div className="admin-web__collection-bulk-bar-actions">
            <Button
              className="admin-web__collection-bulk-button admin-web__collection-bulk-button--activate"
              onClick={() => handleApplyBulkActiveState(true)}
              size="sm"
              variant="outline"
            >
              {t("admin.collectionTable.actions.setActive")}
            </Button>
            <Button
              className="admin-web__collection-bulk-button admin-web__collection-bulk-button--deactivate"
              onClick={() => handleApplyBulkActiveState(false)}
              size="sm"
              variant="outline"
            >
              {t("admin.collectionTable.actions.setInactive")}
            </Button>
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
