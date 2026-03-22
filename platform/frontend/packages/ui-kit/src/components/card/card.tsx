import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type CardVariant = "default" | "accent";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

/**
 * Reusable panel container for dashboards, forms, and detail surfaces.
 */
export function Card({ className, variant = "default", ...props }: CardProps) {
  return <section {...props} className={cx("ui-card", `ui-card--${variant}`, className)} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <header {...props} className={cx("ui-card__header", className)} />;
}

export function CardHeaderBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-card__header-body", className)} />;
}

export function CardToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-card__toolbar", className)} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-card__content", className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <footer {...props} className={cx("ui-card__footer", className)} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cx("ui-card__title", className)} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cx("ui-card__description", className)} />;
}
