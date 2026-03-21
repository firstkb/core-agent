import type { HTMLAttributes, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card";
import { cx } from "../../lib/cx";

export type FilterRailProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  footer?: ReactNode;
};

export type FilterRailGroupProps = HTMLAttributes<HTMLElement> & {
  label: string;
  description?: string;
};

export function FilterRail({
  children,
  className,
  description,
  footer,
  title,
  ...props
}: FilterRailProps) {
  return (
    <Card {...props} className={cx("ui-filter-rail", className)}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      </CardHeader>

      <CardContent className="ui-filter-rail__content">
        {children}
        {footer ? <div className="ui-filter-rail__footer">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}

export function FilterRailGroup({
  children,
  className,
  description,
  label,
  ...props
}: FilterRailGroupProps) {
  return (
    <section {...props} className={cx("ui-filter-rail__group", className)}>
      <div className="ui-filter-rail__group-header">
        <p className="ui-filter-rail__group-label">{label}</p>
        {description ? <p className="ui-filter-rail__group-description">{description}</p> : null}
      </div>

      <div className="ui-filter-rail__group-body">{children}</div>
    </section>
  );
}
