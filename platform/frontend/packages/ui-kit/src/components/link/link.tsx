import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type LinkTone = "default" | "subtle";
export type LinkUnderline = "hover" | "always" | "none";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  external?: boolean;
  tone?: LinkTone;
  underline?: LinkUnderline;
};

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ui-link__icon"
      fill="none"
      focusable="false"
      viewBox="0 0 16 16"
    >
      <path
        d="M6.333 3.333h6.334v6.334m-.667-5.667-7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

export function Link({
  children,
  className,
  external = false,
  rel,
  target,
  tone = "default",
  underline = "hover",
  ...props
}: LinkProps) {
  const resolvedRel = external && !rel ? "noopener noreferrer" : rel;
  const resolvedTarget = external && !target ? "_blank" : target;

  return (
    <a
      {...props}
      className={cx(
        "ui-link",
        `ui-link--${tone}`,
        `ui-link--underline-${underline}`,
        className,
      )}
      rel={resolvedRel}
      target={resolvedTarget}
    >
      <span className="ui-link__label">{children}</span>
      {external ? <ExternalLinkIcon /> : null}
    </a>
  );
}
