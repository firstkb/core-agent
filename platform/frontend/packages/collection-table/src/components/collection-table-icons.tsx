import type { SVGProps } from "react";

export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M20 11a8 8 0 1 0-2.35 5.65" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

export function FilterFunnelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M4.5 6.25h15" />
      <path d="M7.5 11.5h9" />
      <path d="M10.5 16.75h3" />
    </svg>
  );
}

export function SpreadsheetExportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M7.5 3.75h7L19.5 8.7v10.55A1.75 1.75 0 0 1 17.75 21h-10A1.75 1.75 0 0 1 6 19.25V5.5A1.75 1.75 0 0 1 7.75 3.75Z" />
      <path d="M14.5 3.75V8.5h5" />
      <path d="M9 12.25h5.5M9 15.25h5.5M9 18.25h3.25" />
      <path d="M17 13.5v4.25" />
      <path d="m15.5 16.25 1.5 1.5 1.5-1.5" />
    </svg>
  );
}
