import type { SyntheticEvent } from "react";

function handleLogoFallback(fallbackSrc: string) {
  return (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackSrc;
  };
}

export function TenantBrandImage({
  alt,
  className,
  fallbackSrc,
  primarySrc,
}: {
  alt: string;
  className: string;
  fallbackSrc: string;
  primarySrc: string;
}) {
  return (
    <img
      alt={alt}
      className={className}
      onError={handleLogoFallback(fallbackSrc)}
      src={primarySrc}
    />
  );
}
