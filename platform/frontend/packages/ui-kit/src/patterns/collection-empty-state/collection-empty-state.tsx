import type { HTMLAttributes, ReactNode } from "react";

import { Badge, type BadgeVariant } from "../../components/badge";
import { cx } from "../../lib/cx";

export type CollectionEmptyStateHighlight = {
  id: string;
  label: string;
  value: string;
  tone?: BadgeVariant;
};

export type CollectionEmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  highlights?: ReadonlyArray<CollectionEmptyStateHighlight>;
};

export function CollectionEmptyState({
  actions,
  className,
  description,
  eyebrow,
  highlights,
  title,
  ...props
}: CollectionEmptyStateProps) {
  return (
    <div {...props} className={cx("ui-pattern ui-collection-empty-state", className)}>
      {eyebrow ? <p className="ui-collection-empty-state__eyebrow">{eyebrow}</p> : null}
      <h2 className="ui-pattern__title">{title}</h2>
      {description ? <p className="ui-pattern__description">{description}</p> : null}
      {highlights?.length ? (
        <div className="ui-collection-empty-state__highlights">
          {highlights.map((highlight) => (
            <div className="ui-collection-empty-state__highlight" key={highlight.id}>
              <div className="ui-collection-empty-state__highlight-header">
                <span className="ui-collection-empty-state__highlight-label">
                  {highlight.label}
                </span>
                {highlight.tone ? (
                  <Badge appearance="soft" size="sm" variant={highlight.tone}>
                    {highlight.tone}
                  </Badge>
                ) : null}
              </div>
              <span className="ui-collection-empty-state__highlight-value">
                {highlight.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {actions ? <div className="ui-pattern__actions">{actions}</div> : null}
    </div>
  );
}
