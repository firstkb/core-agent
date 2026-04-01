import { useEffect, useId, useState, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type SVGProps } from "react";

import { cx } from "../../lib/cx";

export type PaginationProps = HTMLAttributes<HTMLElement> & {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  editableCurrentPage?: boolean;
};

type PaginationItem = number | "ellipsis";

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), totalPages);
}

function buildPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): PaginationItem[] {
  if (totalPages <= 0) return [];

  const safeCurrentPage = clampPage(currentPage, totalPages);
  const compactThreshold = Math.max(4, siblingCount * 2 + 4);

  if (totalPages <= compactThreshold) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const items: PaginationItem[] = [1];

  if (safeCurrentPage === 1) {
    return [1, "ellipsis", totalPages];
  }

  if (safeCurrentPage === totalPages) {
    return [1, "ellipsis", totalPages];
  }

  if (safeCurrentPage === 2) {
    return [1, 2, "ellipsis", totalPages];
  }

  if (safeCurrentPage === totalPages - 1) {
    return [1, "ellipsis", totalPages - 1, totalPages];
  }

  items.push("ellipsis", safeCurrentPage, "ellipsis", totalPages);
  return items;
}

function PaginationChevronIcon({
  direction,
  ...props
}: SVGProps<SVGSVGElement> & { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      {direction === "left" ? (
        <path
          d="M11.75 5.5L7.25 10L11.75 14.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8.25 5.5L12.75 10L8.25 14.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function Pagination({
  className,
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 0,
  size = "md",
  disabled = false,
  previousLabel = "Previous",
  nextLabel = "Next",
  editableCurrentPage = true,
  ...props
}: PaginationProps) {
  const generatedFieldId = useId().replace(/:/g, "");
  const safeTotalPages = Math.max(totalPages, 0);
  const safeCurrentPage = safeTotalPages === 0 ? 0 : clampPage(currentPage, safeTotalPages);
  const pageItems = buildPageItems(safeCurrentPage || 1, safeTotalPages, siblingCount);
  const [draftPage, setDraftPage] = useState(String(safeCurrentPage || 1));
  const currentPageFieldBase = props.id ? `${props.id}-current-page` : `ui-pagination-${generatedFieldId}-current-page`;

  useEffect(() => {
    setDraftPage(String(safeCurrentPage || 1));
  }, [safeCurrentPage]);

  function changePage(page: number) {
    if (disabled || !onPageChange || page === safeCurrentPage || page < 1 || page > safeTotalPages) {
      return;
    }

    onPageChange(page);
  }

  function commitDraftPage() {
    const parsedPage = Number(draftPage);

    if (!Number.isFinite(parsedPage)) {
      setDraftPage(String(safeCurrentPage || 1));
      return;
    }

    const nextPage = clampPage(Math.trunc(parsedPage), safeTotalPages);
    setDraftPage(String(nextPage));
    changePage(nextPage);
  }

  function handleDraftKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraftPage();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setDraftPage(String(safeCurrentPage || 1));
    }
  }

  if (safeTotalPages <= 0) {
    return null;
  }

  return (
    <nav
      {...props}
      aria-label="Pagination"
      className={cx("ui-pagination", `ui-pagination--${size}`, className)}
      role="navigation"
    >
      <ul className="ui-pagination__list">
        <li className="ui-pagination__item">
          <button
            aria-label={previousLabel}
            className="ui-pagination__control"
            disabled={disabled || safeCurrentPage <= 1}
            onClick={() => changePage(safeCurrentPage - 1)}
            type="button"
          >
            <PaginationChevronIcon className="ui-pagination__control-icon" direction="left" />
          </button>
        </li>

        {pageItems.map((item, index) => (
          <li className="ui-pagination__item" key={`${item}-${index}`}>
            {item === "ellipsis" ? (
              <span aria-hidden="true" className="ui-pagination__ellipsis">
                …
              </span>
            ) : item === safeCurrentPage && safeTotalPages > 4 && editableCurrentPage ? (
              <input
                aria-label="Current page"
                className={cx("ui-pagination__page", "ui-pagination__page--current-input")}
                disabled={disabled}
                id={currentPageFieldBase}
                inputMode="numeric"
                max={safeTotalPages}
                min={1}
                name={currentPageFieldBase}
                onBlur={commitDraftPage}
                onChange={(event) => setDraftPage(event.target.value)}
                onClick={(event) => event.currentTarget.select()}
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={handleDraftKeyDown}
                type="text"
                value={draftPage}
              />
            ) : (
              <button
                aria-current={item === safeCurrentPage ? "page" : undefined}
                className={cx(
                  "ui-pagination__page",
                  item === safeCurrentPage && "ui-pagination__page--active",
                )}
                disabled={disabled}
                onClick={() => changePage(item)}
                type="button"
              >
                {item}
              </button>
            )}
          </li>
        ))}

        <li className="ui-pagination__item">
          <button
            aria-label={nextLabel}
            className="ui-pagination__control"
            disabled={disabled || safeCurrentPage >= safeTotalPages}
            onClick={() => changePage(safeCurrentPage + 1)}
            type="button"
          >
            <PaginationChevronIcon className="ui-pagination__control-icon" direction="right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
