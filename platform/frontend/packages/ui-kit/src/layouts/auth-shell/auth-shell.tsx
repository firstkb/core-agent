import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type AuthShellProps = HTMLAttributes<HTMLDivElement> & {
  aside?: ReactNode;
};

export function AuthShell({ className, children, aside, ...props }: AuthShellProps) {
  return (
    <div {...props} className={cx("ui-auth-shell", className)}>
      <div className="ui-shell-panel">
        {aside}
        {children}
      </div>
    </div>
  );
}
