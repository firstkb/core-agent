import type { CSSProperties, HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export type AspectRatioProps = HTMLAttributes<HTMLDivElement> & {
  ratio?: number;
};

export function AspectRatio({
  children,
  className,
  ratio = 16 / 9,
  style,
  ...props
}: AspectRatioProps) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;

  return (
    <div
      {...props}
      className={cx("ui-aspect-ratio", className)}
      style={
        {
          "--ui-aspect-ratio": `${safeRatio}`,
          ...style,
        } as CSSProperties
      }
    >
      <div className="ui-aspect-ratio__inner">{children}</div>
    </div>
  );
}
