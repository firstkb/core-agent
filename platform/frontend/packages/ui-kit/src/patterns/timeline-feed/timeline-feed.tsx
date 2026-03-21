import type { HTMLAttributes } from "react";

import { Badge, type BadgeVariant } from "../../components/badge";
import { cx } from "../../lib/cx";

export type TimelineFeedItem = {
  id: string;
  actor: string;
  action: string;
  description?: string;
  meta?: string;
  time: string;
  tone?: BadgeVariant;
};

export type TimelineFeedGroup = {
  id: string;
  label: string;
  items: ReadonlyArray<TimelineFeedItem>;
};

export type TimelineFeedProps = HTMLAttributes<HTMLDivElement> & {
  groups: ReadonlyArray<TimelineFeedGroup>;
};

export function TimelineFeed({ className, groups, ...props }: TimelineFeedProps) {
  return (
    <div {...props} className={cx("ui-timeline-feed", className)}>
      {groups.map((group) => (
        <section className="ui-timeline-feed__group" key={group.id}>
          <div className="ui-timeline-feed__group-header">
            <span className="ui-timeline-feed__group-label">{group.label}</span>
            <span className="ui-timeline-feed__group-line" />
          </div>

          <ol className="ui-timeline-feed__list">
            {group.items.map((item) => (
              <li className="ui-timeline-feed__item" key={item.id}>
                <span
                  aria-hidden="true"
                  className={cx(
                    "ui-timeline-feed__marker",
                    `ui-timeline-feed__marker--${item.tone ?? "neutral"}`,
                  )}
                />
                <div className="ui-timeline-feed__body">
                  <div className="ui-timeline-feed__item-header">
                    <div className="ui-timeline-feed__copy">
                      <p className="ui-timeline-feed__title">
                        <span className="ui-timeline-feed__actor">{item.actor}</span>{" "}
                        <span>{item.action}</span>
                      </p>
                      {item.meta ? <p className="ui-timeline-feed__meta">{item.meta}</p> : null}
                    </div>
                    <div className="ui-timeline-feed__trailing">
                      {item.tone ? (
                        <Badge appearance="soft" size="sm" variant={item.tone}>
                          {item.tone}
                        </Badge>
                      ) : null}
                      <span className="ui-timeline-feed__time">{item.time}</span>
                    </div>
                  </div>
                  {item.description ? (
                    <p className="ui-timeline-feed__description">{item.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
