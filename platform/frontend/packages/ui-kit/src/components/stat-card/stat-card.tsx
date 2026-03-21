import type { HTMLAttributes, ReactNode } from "react";

import { Badge } from "../badge";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { cx } from "../../lib/cx";

export type StatCardTrend = "up" | "down" | "neutral";

export type StatCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string;
  trendLabel?: string;
  trendDirection?: StatCardTrend;
  footer?: string;
  badge?: ReactNode;
};

function getTrendVariant(direction: StatCardTrend) {
  if (direction === "up") return "success";
  if (direction === "down") return "danger";
  return "neutral";
}

function getTrendPrefix(direction: StatCardTrend) {
  if (direction === "up") return "+";
  if (direction === "down") return "-";
  return "";
}

export function StatCard({
  className,
  label,
  value,
  trendLabel,
  trendDirection = "neutral",
  footer,
  badge,
  ...props
}: StatCardProps) {
  return (
    <Card {...props} className={cx("ui-stat-card", className)}>
      <CardHeader className="ui-stat-card__header">
        <CardTitle className="ui-stat-card__title">{label}</CardTitle>
        {badge}
      </CardHeader>
      <CardContent className="ui-stat-card__content">
        <div className="ui-stat-card__value-row">
          <p className="ui-stat-card__value">{value}</p>
          {trendLabel ? (
            <Badge appearance="soft" size="sm" variant={getTrendVariant(trendDirection)}>
              {getTrendPrefix(trendDirection)}
              {trendLabel}
            </Badge>
          ) : null}
        </div>
        {footer ? <p className="ui-stat-card__footer">{footer}</p> : null}
      </CardContent>
    </Card>
  );
}
