import type { SVGProps } from "react";

import {
  FormIcon,
} from "@platform/ui-kit";

type IconProps = SVGProps<SVGSVGElement>;

export function FormBuilderElementIcon({
  iconKey,
  ...props
}: IconProps & { iconKey: string }) {
  switch (iconKey) {
    case "section":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            height="14"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            width="16"
            x="4"
            y="5"
          />
          <path
            d="M4 10h16M8 14h5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "group":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            height="6"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="1.8"
            width="6"
            x="4"
            y="5"
          />
          <rect
            height="6"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="1.8"
            width="6"
            x="14"
            y="5"
          />
          <rect
            height="6"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="1.8"
            width="16"
            x="4"
            y="13"
          />
        </svg>
      );
    case "tabs":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M5 9.5h14M8 6h3.2c.6 0 1.2.24 1.62.66l.72.72c.42.42 1.01.66 1.61.66H19"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <rect
            height="10"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            width="16"
            x="4"
            y="9"
          />
        </svg>
      );
    case "tab_item":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M6 9h4.4c.53 0 1.04-.2 1.42-.58l.76-.76c.38-.38.89-.58 1.42-.58H18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M6 9h12v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "text":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M6 7h12M10 7v10M8 17h6M7 11h10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "divider":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M4 12h16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "field":
      return <FormIcon {...props} />;
    case "checkbox":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            height="13"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            width="13"
            x="5.5"
            y="5.5"
          />
          <path
            d="M9 12.5l2 2 4-4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "date":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            height="14"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            width="16"
            x="4"
            y="6"
          />
          <path
            d="M8 4v4M16 4v4M4 10h16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "email":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            height="12"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            width="16"
            x="4"
            y="6"
          />
          <path
            d="M6 8.5 12 13l6-4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "number":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M8 6 6 18M15 6l-2 12M5 10h12M4 14h12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "select":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            height="12"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            width="16"
            x="4"
            y="6"
          />
          <path
            d="m9 11 3 3 3-3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "status":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <circle
            cx="12"
            cy="12"
            fill="currentColor"
            r="3.5"
          />
          <path
            d="M12 4.5v2.5M12 17v2.5M4.5 12H7M17 12h2.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "text":
    default:
      return <FormIcon {...props} />;
  }
}
