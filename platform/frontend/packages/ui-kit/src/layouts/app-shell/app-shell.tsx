import type { HTMLAttributes } from "react";

import { cx } from "../../lib/cx";

export function AppShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-app-shell", className)} />;
}

export function AppShellSidebar({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <aside {...props} className={cx("ui-app-shell__sidebar", className)} />;
}

export function AppShellMain({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ui-app-shell__main", className)} />;
}

export function AppShellHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <header {...props} className={cx("ui-app-shell__header", className)} />;
}

export function AppShellContent({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main {...props} className={cx("ui-app-shell__content", className)} />;
}
