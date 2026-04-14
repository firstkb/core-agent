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
    case "accordion":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5"
            width="15"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 9.5h8M8 12.5h8M8 15.5h5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "accordion_item":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="5"
            y="6"
            width="14"
            height="12"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 10.5h8M11 14h2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
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
    case "grid":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5"
            width="15"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 5v14M4.5 12h15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "column":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5"
            width="15"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M10 5v14M14 5v14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
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
    case "subform":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="5"
            y="4.5"
            width="10.5"
            height="13"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="9.5"
            y="8.5"
            width="9.5"
            height="11"
            rx="2.3"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "repeater":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5"
            width="15"
            height="4"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="4.5"
            y="10"
            width="15"
            height="4"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="4.5"
            y="15"
            width="15"
            height="4"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "heading":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M7 6v12M17 6v12M7 12h10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
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
    case "view_only_field":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5"
            width="15"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M7.5 12c1.2-2 2.96-3 4.5-3s3.3 1 4.5 3c-1.2 2-2.96 3-4.5 3s-3.3-1-4.5-3Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        </svg>
      );
    case "rich_text":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5"
            width="15"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 9h8M8 12h6M8 15h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
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
    case "spacer":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M12 5v14M8.5 8.5 12 5l3.5 3.5M8.5 15.5 12 19l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "field":
      return <FormIcon {...props} />;
    case "boolean":
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
    case "date_time":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4"
            y="5.5"
            width="16"
            height="13.5"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 4v3.5M16 4v3.5M4 10h10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="16.5"
            cy="14.5"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M16.5 13v1.7l1.1.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
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
    case "phone":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M8 5.5h2.5l1.2 3.6-1.7 1.7a13 13 0 0 0 4.2 4.2l1.7-1.7 3.6 1.2V17c0 .83-.67 1.5-1.5 1.5h-.8C11.1 18.5 5.5 12.9 5.5 6.8V6A1.5 1.5 0 0 1 7 4.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "url":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M10 14a3.5 3.5 0 0 1 0-5l1.5-1.5a3.5 3.5 0 1 1 5 5L15 14M14 10a3.5 3.5 0 0 1 0 5l-1.5 1.5a3.5 3.5 0 1 1-5-5L9 10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "long_text":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5"
            width="15"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 9h8M8 12h8M8 15h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
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
    case "currency":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M13.5 5.5h-3a3 3 0 1 0 0 6h3a3 3 0 1 1 0 6h-4M12 4v16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "db_lookup":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <ellipse
            cx="10"
            cy="7"
            rx="4.5"
            ry="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5.5 7v5c0 1.38 2.02 2.5 4.5 2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14.5 7v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="16.5"
            cy="15.5"
            r="3"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m18.6 17.6 2 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "multi_select":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <rect
            x="4.5"
            y="5.5"
            width="15"
            height="13"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m8 10 1.5 1.5L12 9m0 6h4m-8-4h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "tags":
      return (
        <svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            d="M5 10.5V6.8c0-.72.58-1.3 1.3-1.3H10l8 8-5.2 5.2a1.8 1.8 0 0 1-2.55 0L5 13.45"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="8.2"
            cy="8.2"
            r="1"
            fill="currentColor"
          />
        </svg>
      );
    case "single_select":
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
    default:
      return <FormIcon {...props} />;
  }
}
