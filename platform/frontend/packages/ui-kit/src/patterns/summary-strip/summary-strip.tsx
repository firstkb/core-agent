import type { HTMLAttributes } from "react";

import { Badge, type BadgeVariant } from "../../components/badge";
import { cx } from "../../lib/cx";

export type SummaryStripItem = {
  id: string;
  label: string;
  value: string;
  meta?: string;
  tone?: BadgeVariant;
};

export type SummaryStripProps = HTMLAttributes<HTMLDivElement> & {
  items: ReadonlyArray<SummaryStripItem>;
};

export function SummaryStrip({ className, items, ...props }: SummaryStripProps) {
  return (
    <div {...props} className={cx("ui-summary-strip", className)}>
      {items.map((item) => (
        <section className="ui-summary-strip__item" key={item.id}>
          <div className="ui-summary-strip__item-header">
            <span className="ui-summary-strip__label">{item.label}</span>
            {item.tone ? (
              <Badge appearance="soft" size="sm" variant={item.tone}>
                {item.tone}
              </Badge>
            ) : null}
          </div>
          <div className="ui-summary-strip__value">{item.value}</div>
          {item.meta ? <p className="ui-summary-strip__meta">{item.meta}</p> : null}
        </section>
      ))}
    </div>
  );
}
