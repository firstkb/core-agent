import type { HTMLAttributes, ReactNode } from "react";

import type { BadgeVariant } from "../../components/badge";
import { cx } from "../../lib/cx";

export type SummaryPillStripItem = {
  id: string;
  label: string;
  value: ReactNode;
  tone?: BadgeVariant;
};

export type SummaryPillStripProps = HTMLAttributes<HTMLDivElement> & {
  items: ReadonlyArray<SummaryPillStripItem>;
};

export function SummaryPillStrip({ className, items, ...props }: SummaryPillStripProps) {
  return (
    <div {...props} className={cx("ui-summary-pill-strip", className)}>
      {items.map((item) => (
        <div
          className={cx(
            "ui-summary-pill-strip__item",
            item.tone ? `ui-summary-pill-strip__item--${item.tone}` : undefined,
          )}
          key={item.id}
        >
          <span className="ui-summary-pill-strip__label">{item.label}</span>
          <span className="ui-summary-pill-strip__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
