import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export function DetailPanel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <aside {...props} className={cx("ui-detail-panel", className)} />;
}

export function DetailPanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-detail-panel__header", className)} />;
}

export function DetailPanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-detail-panel__body", className)} />;
}

export function DetailPanelFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-detail-panel__footer", className)} />;
}

export function DetailPanelTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cx("ui-detail-panel__title", className)} />;
}

export function DetailPanelDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-detail-panel__description", className)} />;
}

export function DetailPanelMeta({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-detail-panel__meta", className)} />;
}

export function DetailPanelSection({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section {...props} className={cx("ui-detail-panel__section", className)} />;
}

export function DetailPanelSectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h4 {...props} className={cx("ui-detail-panel__section-title", className)} />;
}
