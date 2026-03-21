import type { HTMLAttributes } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/card";
import { cx } from "../../lib/cx";

export type ActivityFeedTone = "brand" | "success" | "warning" | "danger" | "neutral";

export type ActivityFeedItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  tone?: ActivityFeedTone;
};

export type ActivityFeedProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  items: ActivityFeedItem[];
};

export function ActivityFeed({
  className,
  title,
  description,
  items,
  ...props
}: ActivityFeedProps) {
  return (
    <Card {...props} className={cx("ui-activity-feed", className)}>
      <CardHeader className="ui-activity-feed__header">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      </CardHeader>
      <CardContent className="ui-activity-feed__content">
        <ol className="ui-activity-feed__list">
          {items.map((item) => (
            <li key={item.id} className="ui-activity-feed__item">
              <span
                aria-hidden="true"
                className={cx(
                  "ui-activity-feed__marker",
                  `ui-activity-feed__marker--${item.tone ?? "neutral"}`,
                )}
              />
              <div className="ui-activity-feed__body">
                <div className="ui-activity-feed__item-header">
                  <p className="ui-activity-feed__item-title">{item.title}</p>
                  <span className="ui-activity-feed__item-meta">{item.meta}</span>
                </div>
                <p className="ui-activity-feed__item-description">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
