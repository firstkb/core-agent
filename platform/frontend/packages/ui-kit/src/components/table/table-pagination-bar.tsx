import type { HTMLAttributes, ReactNode } from "react";

import { Button } from "../button";
import { Select } from "../select";
import { cx } from "../../lib/cx";

type TablePaginationToken = number | "ellipsis-left" | "ellipsis-right";

export type TablePaginationBarProps = HTMLAttributes<HTMLDivElement> & {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  info?: ReactNode;
};

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function getPaginationTokens(currentPage: number, totalPages: number): TablePaginationToken[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-left", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages];
}

function renderRangeInfo(currentPage: number, pageSize: number, totalItems: number) {
  if (totalItems <= 0) {
    return "0 of 0";
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  return `${from}-${to} of ${totalItems}`;
}

export function TablePaginationBar({
  className,
  currentPage,
  info,
  onPageChange,
  onPageSizeChange,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems,
  totalPages,
  ...props
}: TablePaginationBarProps) {
  const safePage = clampPage(currentPage, totalPages);
  const pageTokens = getPaginationTokens(safePage, totalPages);
  const infoLabel = info ?? (typeof totalItems === "number" ? renderRangeInfo(safePage, pageSize, totalItems) : null);

  return (
    <div {...props} className={cx("ui-table-pagination-bar", className)}>
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

      <div className="ui-table-pagination-bar__controls" role="navigation" aria-label="Table pagination">
        <Button
          aria-label="Go to previous page"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          size="sm"
          variant="ghost"
        >
          Prev
        </Button>
        <div className="ui-table-pagination-bar__pages">
          {pageTokens.map((token) => {
            if (typeof token !== "number") {
              return (
                <span aria-hidden="true" className="ui-table-pagination-bar__ellipsis" key={token}>
                  …
                </span>
              );
            }

            const active = token === safePage;

            return (
              <Button
                aria-current={active ? "page" : undefined}
                className={cx(active && "ui-table-pagination-bar__page-button--active")}
                key={token}
                onClick={() => onPageChange(token)}
                size="sm"
                variant={active ? "secondary" : "ghost"}
              >
                {token}
              </Button>
            );
          })}
        </div>
        <Button
          aria-label="Go to next page"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          size="sm"
          variant="ghost"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
