import type { ReactNode, SVGProps } from "react";

import {
  Badge,
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@platform/ui-kit";
import { useTranslation } from "@platform/i18n";

import type { CollectionPageConfig } from "./collection-page";
import type {
  CollectionTableColumnDefinition,
  CollectionTableFieldDefinition,
  CollectionTableMetaResponse,
  CollectionTableRowCell,
  CollectionTableRowActionDefinition,
} from "./collection-table-contract";
import {
  formatCollectionTableCellValue,
  type CollectionTableRenderRow,
  getCellText,
  getRuntimeCollectionColumns,
} from "./collection-table-runtime";

type CollectionTableResolvedAction = {
  disabled?: boolean;
  id: string;
  label: string;
  onSelect?: () => void;
};

type CollectionTableRenderConfigOptions = {
  getRowActionLabel: (action: CollectionTableRowActionDefinition) => string;
  resolveRowAction: (
    action: CollectionTableRowActionDefinition,
    row: CollectionTableRenderRow,
  ) => CollectionTableResolvedAction;
};

function RowActionCell({
  actions,
  rowId,
}: {
  actions: ReadonlyArray<CollectionTableResolvedAction>;
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
            disabled={action.disabled}
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
              <MenuItem
                disabled={action.disabled}
                key={`${rowId}:${action.id}`}
                onClick={action.onSelect}
              >
                {action.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}

export function OverflowMenuIcon(props: SVGProps<SVGSVGElement>) {
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

function LeadingCommaText({ value }: { value: string }) {
  const commaIndex = value.indexOf(",");
  if (commaIndex <= 0) {
    return value;
  }

  return (
    <>
      <strong>{value.slice(0, commaIndex)}</strong>
      {value.slice(commaIndex)}
    </>
  );
}

function FormattedText({
  cell,
  value,
}: {
  cell?: CollectionTableRowCell;
  value: string;
}) {
  return cell?.displayFormat === "leading_comma_bold"
    ? <LeadingCommaText value={value} />
    : value;
}

function TextCell({
  cell,
  value,
}: {
  cell?: CollectionTableRowCell;
  value: string;
}) {
  return (
    <span className="admin-web__collection-cell-value">
      <FormattedText cell={cell} value={value} />
    </span>
  );
}

function getFieldDefinition(
  fieldDefinitions: ReadonlyArray<CollectionTableFieldDefinition>,
  fieldId: string,
) {
  return fieldDefinitions.find((field) => field.id === fieldId);
}

function buildRenderColumns(
  columns: ReadonlyArray<CollectionTableColumnDefinition>,
  fieldDefinitions: ReadonlyArray<CollectionTableFieldDefinition>,
  rowActions: ReadonlyArray<CollectionTableRowActionDefinition>,
  options: CollectionTableRenderConfigOptions,
): CollectionPageConfig<CollectionTableRenderRow>["columns"] {
  return columns.map((column) => {
    if (column.type === "actions") {
      return {
        defaultVisible: column.defaultVisible ?? true,
        description: column.description,
        id: column.id,
        label: column.label,
        renderCell: (row) => (
          <RowActionCell
            actions={rowActions.map((action) => options.resolveRowAction(action, row))}
            rowId={row.id}
          />
        ),
        width: column.width ?? "var(--admin-web-collection-action-column-width, max-content)",
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

        return (
          <TextCell
            cell={cell}
            value={formatCollectionTableCellValue(getCellText(cell), column.type === "actions" ? "text" : column.type)}
          />
        );
      },
      sortable: fieldDefinition?.sortable ?? false,
      width: column.width,
    };
  });
}

export function createCollectionRenderConfig(
  meta: CollectionTableMetaResponse,
  options: CollectionTableRenderConfigOptions,
): CollectionPageConfig<CollectionTableRenderRow> {
  const secondaryRowFieldId = meta.rowLayout?.secondaryRowFieldId;

  return {
    columns: buildRenderColumns(
      getRuntimeCollectionColumns(meta),
      meta.fields,
      meta.rowActions ?? [],
      options,
    ),
    filters: [],
    pageSizeOptions: meta.pageSizeOptions ?? [25, 50, 100],
    renderRowSecondary: secondaryRowFieldId
      ? (row) => {
        const secondaryCell = row.cells[secondaryRowFieldId];
        const secondaryText = getCellText(secondaryCell);
        return secondaryText.length > 0
          ? (
              <span className="admin-web__collection-row-description">
                <FormattedText cell={secondaryCell} value={secondaryText} />
              </span>
            )
          : null;
      }
      : undefined,
    rows: [],
    searchPlaceholder: meta.search?.placeholder,
    title: meta.title,
  };
}

export function renderHighlightedSuggestionText(value: string, query: string) {
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
