import type { SVGProps } from "react";

export function ChevronIcon({
  open = false,
  ...props
}: SVGProps<SVGSVGElement> & { open?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={open ? "ui-lab-page__chevron ui-lab-page__chevron--open" : "ui-lab-page__chevron"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
