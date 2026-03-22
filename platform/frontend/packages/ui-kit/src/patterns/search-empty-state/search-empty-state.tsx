import type { HTMLAttributes, ReactNode } from "react";

import { Badge } from "../../components/badge";
import { cx } from "../../lib/cx";

export type SearchEmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  query?: string;
  actions?: ReactNode;
  suggestions?: ReadonlyArray<string>;
};

export function SearchEmptyState({
  actions,
  className,
  description = "Adjust your query or remove some constraints to surface matching items.",
  query,
  suggestions,
  title = "No results found",
  ...props
}: SearchEmptyStateProps) {
  return (
    <div {...props} className={cx("ui-pattern ui-search-empty-state", className)}>
      <div className="ui-search-empty-state__hero">
        <div className="ui-search-empty-state__ring">
          <span className="ui-search-empty-state__glyph">?</span>
        </div>
      </div>
      <h2 className="ui-pattern__title">{title}</h2>
      {query ? (
        <div className="ui-search-empty-state__query-row">
          <span className="ui-search-empty-state__query-label">Query</span>
          <Badge appearance="soft" size="sm" variant="brand">
            {query}
          </Badge>
        </div>
      ) : null}
      <p className="ui-pattern__description">{description}</p>
      {suggestions?.length ? (
        <ul className="ui-search-empty-state__suggestions">
          {suggestions.map((suggestion) => (
            <li className="ui-search-empty-state__suggestion" key={suggestion}>
              {suggestion}
            </li>
          ))}
        </ul>
      ) : null}
      {actions ? <div className="ui-pattern__actions">{actions}</div> : null}
    </div>
  );
}
