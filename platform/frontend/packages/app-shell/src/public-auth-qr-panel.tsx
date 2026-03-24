import type { HTMLAttributes, ReactNode } from "react";

import { QRCodeSVG } from "qrcode.react";

type PublicAuthQrPanelProps = HTMLAttributes<HTMLDivElement> & {
  caption?: ReactNode;
  foregroundColor?: string;
  legal?: ReactNode;
  size?: number;
  value: string;
};

export function PublicAuthQrPanel({
  caption,
  className,
  foregroundColor = "#1e63b8",
  legal,
  size = 136,
  value,
  ...props
}: PublicAuthQrPanelProps) {
  return (
    <div
      {...props}
      className={`public-auth-shell__support${className ? ` ${className}` : ""}`}
    >
      <div className="public-auth-shell__qr-card">
        <QRCodeSVG
          bgColor="transparent"
          fgColor={foregroundColor}
          includeMargin={false}
          level="M"
          size={size}
          value={value}
        />
      </div>

      {caption ? <p className="public-auth-shell__qr-caption">{caption}</p> : null}
      {legal ? <p className="public-auth-shell__legal">{legal}</p> : null}
    </div>
  );
}

export type { PublicAuthQrPanelProps };
