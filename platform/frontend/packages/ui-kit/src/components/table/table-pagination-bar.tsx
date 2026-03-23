import type { HTMLAttributes, ReactNode } from "react";

import { Pagination } from "../pagination";
import { Select } from "../select";
import { cx } from "../../lib/cx";

export type TablePaginationBarProps = HTMLAttributes<HTMLDivElement> & {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  editableCurrentPage?: boolean;
  info?: ReactNode;
};

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function renderEntryInfo(totalItems: number) {
  const entryCount = Math.max(totalItems, 0);
  const entryLabel = entryCount === 1 ? "entry" : "entries";

  return (
    <span className="ui-table-pagination-bar__entry-summary">
      <span className="ui-table-pagination-bar__entry-count">{entryCount}</span>
      <span className="ui-table-pagination-bar__entry-label">{entryLabel}</span>
    </span>
  );
}

export function TablePaginationBar({
  className,
  currentPage,
  editableCurrentPage = true,
  info,
  onPageChange,
  onPageSizeChange,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems,
  totalPages,
  ...props
}: TablePaginationBarProps) {
  const safeTotalPages = Math.max(totalPages, 0);
  const safePage = clampPage(currentPage, safeTotalPages);
  const infoLabel = info ?? (typeof totalItems === "number" ? renderEntryInfo(totalItems) : null);

  return (
    <div {...props} className={cx("ui-table-pagination-bar", className)}>
      {safeTotalPages > 1 ? (
        <Pagination
          className="ui-table-pagination-bar__controls"
          currentPage={safePage}
          editableCurrentPage={editableCurrentPage}
          onPageChange={onPageChange}
          size="sm"
          totalPages={safeTotalPages}
        />
      ) : null}

      <div className="ui-table-pagination-bar__meta">
        {typeof onPageSizeChange === "function" ? (
          <label className="ui-table-pagination-bar__size-control">
            <span className="ui-table-pagination-bar__label">Rows per page</span>
            <Select
              aria-label="Rows per page"
              onChange={(event) => onPageSizeChange(Number(event.currentTarget.value))}
              size="sm"
              value={String(pageSize)}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        {infoLabel ? <span className="ui-table-pagination-bar__info">{infoLabel}</span> : null}
      </div>
    </div>
  );
}
