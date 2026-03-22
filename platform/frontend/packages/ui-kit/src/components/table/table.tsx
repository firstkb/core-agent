import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import { cx } from "../../lib/cx";
export { TableColumnVisibility } from "./table-column-visibility";
export { TablePaginationBar } from "./table-pagination-bar";

export type TableDensity = "comfortable" | "compact";

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  density?: TableDensity;
};

export type TableMetaCellProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  caption?: ReactNode;
};

export type TableSortDirection = "asc" | "desc" | null;

export type TableSortButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  direction?: TableSortDirection;
};

export type TableColumnHeaderProps = HTMLAttributes<HTMLDivElement> & {
  description?: ReactNode;
  direction?: TableSortDirection;
  icon?: ReactNode;
  onSortToggle?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  title: ReactNode;
};

export function Table({
  className,
  density = "comfortable",
  ...props
}: TableProps) {
  return <table {...props} className={cx("ui-table", `ui-table--${density}`, className)} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className={cx("ui-table__head", className)} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} className={className} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={cx("ui-table__row", className)} />;
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={cx("ui-table__header-cell", className)} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cx("ui-table__cell", className)} />;
}

export function TableMetaCell({
  caption,
  className,
  description,
  eyebrow,
  title,
  ...props
}: TableMetaCellProps) {
  return (
    <div {...props} className={cx("ui-table-meta", className)}>
      {eyebrow ? <span className="ui-table-meta__eyebrow">{eyebrow}</span> : null}
      <span className="ui-table-meta__title">{title}</span>
      {description ? <span className="ui-table-meta__description">{description}</span> : null}
      {caption ? <span className="ui-table-meta__caption">{caption}</span> : null}
    </div>
  );
}

export function TableSortButton({
  children,
  className,
  direction = null,
  type = "button",
  ...props
}: TableSortButtonProps) {
  return (
    <button
      {...props}
      className={cx("ui-table-sort-button", className)}
      type={type}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={cx("ui-table-sort-button__indicator", direction && `ui-table-sort-button__indicator--${direction}`)}
      />
    </button>
  );
}

export function TableColumnHeader({
  className,
  description,
  direction = null,
  icon,
  onSortToggle,
  title,
  ...props
}: TableColumnHeaderProps) {
  const content = onSortToggle ? (
    <TableSortButton direction={direction} onClick={onSortToggle}>
      {title}
    </TableSortButton>
  ) : (
    <span className="ui-table-column-header__label">{title}</span>
  );

  return (
    <div {...props} className={cx("ui-table-column-header", className)}>
      <div className="ui-table-column-header__main">
        {icon ? <span className="ui-table-column-header__icon">{icon}</span> : null}
        {content}
      </div>
      {description ? <span className="ui-table-column-header__description">{description}</span> : null}
    </div>
  );
}
