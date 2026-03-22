import type { CSSProperties, HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type SkeletonVariant = "block" | "text" | "circle";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

export function Skeleton({
  className,
  height,
  style,
  variant = "block",
  width,
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cx("ui-skeleton", `ui-skeleton--${variant}`, className)}
      style={{ ...style, height, width }}
    />
  );
}

export type SkeletonTextProps = HTMLAttributes<HTMLDivElement> & {
  lines?: number;
  widths?: Array<CSSProperties["width"]>;
};

export function SkeletonText({
  className,
  lines = 3,
  widths,
  ...props
}: SkeletonTextProps) {
  return (
    <div {...props} className={cx("ui-skeleton-text", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          className="ui-skeleton-text__line"
          height="0.75rem"
          key={index}
          variant="text"
          width={widths?.[index] ?? (index === lines - 1 ? "62%" : "100%")}
        />
      ))}
    </div>
  );
}
