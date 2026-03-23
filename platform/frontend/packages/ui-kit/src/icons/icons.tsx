import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

export function SearchIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function DashboardGridIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="6" rx="1.4" width="6" x="4" y="4" />
      <rect height="6" rx="1.4" width="6" x="14" y="4" />
      <rect height="6" rx="1.4" width="6" x="4" y="14" />
      <rect height="6" rx="1.4" width="6" x="14" y="14" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m12 3 1.7 3.8L18 8.5l-3 3.1.7 4.4L12 13.9 8.3 16l.7-4.4-3-3.1 4.3-1.7Z" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="9" cy="9" r="2.75" />
      <path d="M4.8 17.35c.92-2 2.4-3.1 4.2-3.1 1.82 0 3.28 1.1 4.2 3.1" />
      <circle cx="16.9" cy="10.1" r="2.1" />
      <path d="M15.35 15.25c1.32.1 2.45.86 3.35 2.25" />
    </svg>
  );
}

export function UserCircleIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="8.85" r="2.75" />
      <path d="M7.15 18.2c1.05-2.2 2.8-3.45 4.85-3.45s3.8 1.25 4.85 3.45" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function FormIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="16" rx="2" width="14" x="5" y="4" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  );
}

export function DataTableIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="14" rx="2" width="16" x="4" y="5" />
      <path d="M4 10h16M9 10v9" />
    </svg>
  );
}

export function ChartBarIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M5 19.25h14" />
      <path d="M8 19V11.75" />
      <path d="M12 19V8.5" />
      <path d="M16 19V5.75" />
    </svg>
  );
}

export function RoutePathIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8 6h5a3 3 0 0 1 3 3v6" />
    </svg>
  );
}

export function BuildingOfficeIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6 19.25V6.5A1.75 1.75 0 0 1 7.75 4.75h8.5A1.75 1.75 0 0 1 18 6.5v12.75" />
      <path d="M4.75 19.25h14.5" />
      <path d="M9 8.25h1.5M13.5 8.25H15M9 11.75h1.5M13.5 11.75H15M11.25 19.25v-3.5h1.5v3.5" />
    </svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="11.5" rx="2" width="15.5" x="4.25" y="7.25" />
      <path d="M9 7.25v-1a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6.25v1" />
      <path d="M4.25 12.1h15.5" />
      <path d="M10.85 11.9v1.4h2.3v-1.4" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
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
      <path d="M4.5 7.5h15" />
      <path d="M4.5 12h15" />
      <path d="M4.5 16.5h15" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M8.25 16.5h7.5c-.85-1-1.25-2.15-1.25-3.9V10.9A4.5 4.5 0 0 0 10 6.5v-.25a2 2 0 1 1 4 0v.25a4.5 4.5 0 0 1 4.5 4.4v1.7c0 1.75-.4 2.9-1.25 3.9H8.25Z" />
      <path d="M10.15 18a2.1 2.1 0 0 0 3.7 0" />
    </svg>
  );
}

export function CarFrontIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M7.2 16.75V9.9c0-.88.53-1.67 1.35-2l2.9-1.15a1.5 1.5 0 0 1 1.1 0l2.9 1.15c.82.33 1.35 1.12 1.35 2v6.85" />
      <path d="M6 16.75h12" />
      <path d="M8.1 11.1h7.8" />
      <circle cx="8.75" cy="17.4" r="1.35" />
      <circle cx="15.25" cy="17.4" r="1.35" />
      <path d="M10 14.1h4" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
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
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function WalletCardIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M5 7.75A2.75 2.75 0 0 1 7.75 5h8.5A2.75 2.75 0 0 1 19 7.75v8.5A2.75 2.75 0 0 1 16.25 19h-8.5A2.75 2.75 0 0 1 5 16.25Z" />
      <path d="M14.5 12h4.5" />
      <path d="M16.75 10.25v3.5" />
    </svg>
  );
}

export function ShieldKeyIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 4.5 18.25 7v4.3c0 3.4-2.05 6.46-6.25 8.2-4.2-1.74-6.25-4.8-6.25-8.2V7Z" />
      <circle cx="12" cy="11.1" r="1.7" />
      <path d="M12 12.8v2.2" />
    </svg>
  );
}

export function PulseLineIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M4 12h3l2-4 4 8 2-4h5" />
    </svg>
  );
}

export function InfoCircleIcon(props: IconProps) {
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
      <circle cx="12" cy="12" r="8" />
      <path d="M12 10v5" />
      <path d="M12 7.25h.01" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m12 4 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 16 8 4 8-4" />
    </svg>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M4.75 8.25h5l1.6-2h7.9c.55 0 1 .45 1 1v9.5c0 .83-.67 1.5-1.5 1.5H6.25a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M4.75 8.25h15.5" />
    </svg>
  );
}

export function DocumentListIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="16" rx="2" width="14" x="5" y="4" />
      <path d="M9 4.5h6v3H9zM9 11h6M9 15h4" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 20c3.35-4 5-7 5-9.2a5 5 0 1 0-10 0c0 2.2 1.65 5.2 5 9.2Z" />
      <circle cx="12" cy="10.8" r="1.9" />
    </svg>
  );
}

export function HelpCircleIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M9.7 9.4a2.52 2.52 0 0 1 4.6 1.35c0 1.55-1.55 2.05-2.3 2.95-.25.3-.38.63-.38 1.15" />
      <path d="M12 16.85h.01" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="2.7" />
      <path d="m12 4.6.62 1.45a1 1 0 0 0 .92.6h1.56l.63 1.4 1.53.28.3 1.54 1.38.63v1.58l-1.38.62-.3 1.54-1.53.28-.63 1.4h-1.56a1 1 0 0 0-.92.6L12 19.4l-1.45-.62a1 1 0 0 0-.92-.6H8.06l-.63-1.4-1.53-.28-.3-1.54-1.38-.62v-1.58l1.38-.63.3-1.54 1.53-.28.63-1.4h1.57a1 1 0 0 0 .91-.6Z" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
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
      <circle cx="12" cy="12" r="8" />
      <path d="m8.75 12.1 2.25 2.25 4.5-4.7" />
    </svg>
  );
}

export function WarningTriangleIcon(props: IconProps) {
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
      <path d="M12 4.5 20 18H4z" />
      <path d="M12 9v4.5" />
      <path d="M12 16.75h.01" />
    </svg>
  );
}
