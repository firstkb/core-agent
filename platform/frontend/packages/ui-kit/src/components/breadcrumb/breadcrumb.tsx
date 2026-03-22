import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export function Breadcrumb({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav {...props} aria-label="Breadcrumb" className={cx("ui-breadcrumb", className)} />;
}

export function BreadcrumbList({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return <ol {...props} className={cx("ui-breadcrumb__list", className)} />;
}

export function BreadcrumbItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li {...props} className={cx("ui-breadcrumb__item", className)} />;
}

export function BreadcrumbLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={cx("ui-breadcrumb__link", className)} />;
}

export function BreadcrumbPage({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-current="page"
      aria-disabled="true"
      className={cx("ui-breadcrumb__page", className)}
      role="link"
    />
  );
}

export type BreadcrumbSeparatorProps = HTMLAttributes<HTMLLIElement> & {
  children?: ReactNode;
};

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  return (
    <li
      {...props}
      aria-hidden="true"
      className={cx("ui-breadcrumb__separator", className)}
      role="presentation"
    >
      {children ?? <span>&gt;</span>}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cx("ui-breadcrumb__ellipsis", className)}
      role="presentation"
    >
      ...
    </span>
  );
}
