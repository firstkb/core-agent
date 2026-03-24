import type { HTMLAttributes, ReactNode } from "react";

type FullscreenBrandLoaderProps = HTMLAttributes<HTMLDivElement> & {
  description?: ReactNode;
  label?: ReactNode;
  logo?: ReactNode;
};

export function FullscreenBrandLoader({
  className,
  description,
  label,
  logo,
  ...props
}: FullscreenBrandLoaderProps) {
  return (
    <div
      {...props}
      className={`public-brand-loader${className ? ` ${className}` : ""}`}
    >
      <div className="public-brand-loader__content">
        {logo ? <div className="public-brand-loader__logo">{logo}</div> : null}
        {label ? <p className="public-brand-loader__label">{label}</p> : null}
        {description ? <p className="public-brand-loader__description">{description}</p> : null}
      </div>
    </div>
  );
}

export type { FullscreenBrandLoaderProps };
