import { Fragment, useMemo, type ReactNode } from "react";

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  CollectionEmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TablePaginationBar,
  TableRow,
  TableSortButton,
} from "@platform/ui-kit";
import { useTranslation } from "@platform/i18n";

import type {
  CollectionPageConfig,
  CollectionPageRow,
  CollectionPageState,
} from "../../shared/collection-page";

type CollectionPageSelection<Row extends CollectionPageRow> = {
  selectedRowIds: ReadonlyArray<string>;
  onToggleRow: (row: Row, checked: boolean) => void;
  onToggleVisibleRows: (rowIds: ReadonlyArray<string>, checked: boolean) => void;
  getRowAriaLabel?: (row: Row) => string;
  isRowSelectable?: (row: Row) => boolean;
};

type CollectionPageSurfaceProps<Row extends CollectionPageRow> = {
  config: CollectionPageConfig<Row>;
  currentPage: number;
  error?: string | null;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onResetFilters: () => void;
  onRetry?: () => void;
  onSortChange: (columnId: string) => void;
  rows: ReadonlyArray<Row>;
  selection?: CollectionPageSelection<Row>;
  state: CollectionPageState;
  toolbar?: ReactNode;
  totalItems: number;
  totalPages: number;
};

export function CollectionPageSurface<Row extends CollectionPageRow>({
  config,
  currentPage,
  error = null,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onResetFilters,
  onRetry,
  onSortChange,
  rows,
  selection,
  state,
  toolbar,
  totalItems,
  totalPages,
}: CollectionPageSurfaceProps<Row>) {
  const { t } = useTranslation();
  const visibleColumns = useMemo(() => {
    const visibleColumnSet = new Set(state.visibleColumnIds);

    return config.columns.filter((column) => visibleColumnSet.has(column.id));
  }, [config.columns, state.visibleColumnIds]);
  const selectedRowIdSet = useMemo(
    () => new Set(selection?.selectedRowIds ?? []),
    [selection?.selectedRowIds],
  );
  const visibleSelectableRowIds = useMemo(() => {
    if (!selection) {
      return [];
    }

    return rows
      .filter((row) => selection.isRowSelectable?.(row) ?? true)
      .map((row) => row.id);
  }, [rows, selection]);
  const allVisibleSelected =
    visibleSelectableRowIds.length > 0 &&
    visibleSelectableRowIds.every((rowId) => selectedRowIdSet.has(rowId));
  const partiallyVisibleSelected =
    visibleSelectableRowIds.some((rowId) => selectedRowIdSet.has(rowId)) &&
    !allVisibleSelected;
  const loadingRowCount = Math.min(Math.max(Math.ceil(state.pageSize / 3), 6), 12);
  const hasLeadingActionColumn = visibleColumns[0]?.id === "actions";
  const secondaryContentColSpan = Math.max(
    visibleColumns.length - (hasLeadingActionColumn ? 1 : 0),
    1,
  );

  function renderLoadingCell(columnId: string, rowIndex: number) {
    if (columnId === "actions") {
      return (
        <div className="admin-web__collection-loading-actions">
          <Skeleton height="1.75rem" width="3.5rem" />
        </div>
      );
    }

    if (columnId === "status") {
      return (
        <div className="admin-web__collection-loading-cell">
          <Skeleton height="1.5rem" width={rowIndex % 2 === 0 ? "5rem" : "4.25rem"} />
        </div>
      );
    }

    if (columnId === "date") {
      return (
        <div className="admin-web__collection-loading-cell">
          <Skeleton height="0.875rem" variant="text" width="5.5rem" />
        </div>
      );
    }

    return (
      <div className="admin-web__collection-loading-cell">
        <Skeleton height="0.875rem" variant="text" width={rowIndex % 3 === 0 ? "72%" : rowIndex % 3 === 1 ? "58%" : "66%"} />
      </div>
    );
  }

  function renderHeaderCell(column: (typeof visibleColumns)[number]) {
    return (
      <TableHeaderCell key={column.id} style={column.width ? { width: column.width } : undefined}>
        {column.sortable ? (
          <TableSortButton
            direction={state.sortColumnId === column.id ? state.sortDirection : null}
            onClick={() => onSortChange(column.id)}
          >
            {column.label}
          </TableSortButton>
        ) : (
          column.label
        )}
      </TableHeaderCell>
    );
  }

  return (
    <Card className="admin-web__collection-surface">
      <div className="admin-web__collection-reserved-bar">
        {toolbar ?? <div aria-hidden="true" className="admin-web__collection-reserved-bar-slot" />}
      </div>

      <CardContent className="admin-web__collection-table-content">
        {error ? (
          <CollectionEmptyState
            actions={onRetry ? (
              <Button onClick={onRetry} variant="outline">
                {t("admin.collectionTable.errors.retryRequest")}
              </Button>
            ) : null}
            description={error}
            eyebrow={t("admin.collectionTable.errors.remoteAdapter")}
            title={t("admin.collectionTable.errors.requestFailed")}
          />
        ) : (
          <div className="admin-web__collection-table-scroll">
            <Table density={state.density}>
              <TableHead>
                <tr>
                  {selection ? (
                    <TableHeaderCell className="admin-web__collection-selection-cell">
                      <Checkbox
                        aria-label={t("admin.collectionTable.selection.selectAllVisible")}
                        checked={allVisibleSelected}
                        indeterminate={partiallyVisibleSelected}
                        onChange={(event) => {
                          selection.onToggleVisibleRows(visibleSelectableRowIds, event.target.checked);
                        }}
                      />
                    </TableHeaderCell>
                  ) : null}
                  {visibleColumns.map((column) => renderHeaderCell(column))}
                </tr>
              </TableHead>

              <TableBody>
                {loading
                  ? Array.from({ length: loadingRowCount }, (_, rowIndex) => (
                    <TableRow className="admin-web__collection-loading-row" key={`loading-${rowIndex}`}>
                      {selection ? (
                        <TableCell className="admin-web__collection-selection-cell">
                          <Skeleton height="1rem" width="1rem" />
                        </TableCell>
                      ) : null}
                      {visibleColumns.map((column) => (
                        <TableCell
                          className={column.align === "right" ? "admin-web__collection-table-cell--align-right" : undefined}
                          key={column.id}
                        >
                          {renderLoadingCell(column.id, rowIndex)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                  : rows.length === 0
                    ? (
                      <TableRow className="admin-web__collection-empty-row">
                        <TableCell
                          className="admin-web__collection-empty-cell"
                          colSpan={Math.max(visibleColumns.length + (selection ? 1 : 0), 1)}
                        >
                          <div className="admin-web__collection-empty-inline">
                            <span className="admin-web__collection-empty-inline-message">{t("admin.collectionTable.empty.noRecords")}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : rows.map((row, rowIndex) => {
                    const isSelected = selectedRowIdSet.has(row.id);
                    const secondaryContent = config.renderRowSecondary?.(row);
                    const hasSecondaryRow = Boolean(secondaryContent);
                    const rowStateClassName = `${rowIndex % 2 === 0 ? " admin-web__collection-table-row--striped" : ""}${isSelected ? " admin-web__collection-table-row--selected" : ""}`;

                    return (
                      <Fragment key={row.id}>
                        <TableRow
                          className={`${secondaryContent ? "admin-web__collection-table-row--with-secondary" : ""}${rowStateClassName}`.trim() || undefined}
                        >
                          {selection ? (
                            <TableCell
                              className="admin-web__collection-selection-cell"
                              rowSpan={hasSecondaryRow ? 2 : undefined}
                            >
                              <Checkbox
                                aria-label={selection.getRowAriaLabel?.(row) ?? `Select ${row.id}`}
                                checked={isSelected}
                                disabled={!(selection.isRowSelectable?.(row) ?? true)}
                                onChange={(event) => {
                                  selection.onToggleRow(row, event.target.checked);
                                }}
                              />
                            </TableCell>
                          ) : null}
                          {visibleColumns.map((column, columnIndex) => {
                            const isLeadingActionCell =
                              hasLeadingActionColumn &&
                              columnIndex === 0 &&
                              column.id === "actions";

                            if (hasSecondaryRow && isLeadingActionCell) {
                              return (
                                <TableCell
                                  className="admin-web__collection-action-cell"
                                  key={column.id}
                                  rowSpan={2}
                                >
                                  {column.renderCell(row)}
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell
                                className={column.align === "right" ? "admin-web__collection-table-cell--align-right" : undefined}
                                key={column.id}
                              >
                                {column.renderCell(row)}
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {secondaryContent ? (
                          <TableRow
                            className={`admin-web__collection-table-row--secondary${rowStateClassName}`.trim()}
                          >
                            <TableCell
                              className="admin-web__collection-secondary-cell"
                              colSpan={secondaryContentColSpan}
                            >
                              {secondaryContent}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="admin-web__collection-footer">
        <TablePaginationBar
          currentPage={currentPage}
          editableCurrentPage
          entryLabelPlural={t("admin.collectionTable.pagination.entries")}
          entryLabelSingular={t("admin.collectionTable.pagination.entry")}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSize={state.pageSize}
          pageSizeOptions={config.pageSizeOptions}
          rowsPerPageLabel={t("admin.collectionTable.pagination.rowsPerPage")}
          totalItems={totalItems}
          totalPages={totalPages}
        />
      </CardFooter>
    </Card>
  );
}
