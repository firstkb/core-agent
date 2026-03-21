import { useState } from "react";
import type { ReactNode } from "react";

import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  Badge,
  Button,
} from "@platform/ui-kit";

type WorkspaceNavItem = {
  label: string;
  href?: string;
  active?: boolean;
  badge?: string;
  note?: string;
  onNavigate?: () => void;
};

type WorkspaceShellProps = {
  brand: string;
  surfaceLabel?: string;
  navigation: WorkspaceNavItem[];
  headerTitle?: string;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
};

export function WorkspaceShell({
  brand,
  surfaceLabel,
  navigation,
  headerTitle,
  headerMeta,
  headerActions,
  sidebarFooter,
  children,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AppShell className={`workspace-shell${isSidebarOpen ? " workspace-shell--sidebar-open" : ""}`}>
      <AppShellSidebar className="workspace-shell__sidebar">
        <div className="workspace-shell__sidebar-mobile-bar">
          <Button onClick={() => setIsSidebarOpen(false)} size="sm" variant="ghost">
            Close
          </Button>
        </div>

        <div className="workspace-shell__brand">
          <div>
            <p className="workspace-shell__eyebrow">FirstKB Platform</p>
            <h2 className="workspace-shell__brand-title">{brand}</h2>
          </div>
          {surfaceLabel ? <Badge variant="brand">{surfaceLabel}</Badge> : null}
        </div>

        <nav aria-label="Primary" className="workspace-shell__nav">
          <ul className="workspace-shell__nav-list">
            {navigation.map((item) => (
              <li key={item.label}>
                <a
                  aria-current={item.active ? "page" : undefined}
                  className={`workspace-shell__nav-link${item.active ? " workspace-shell__nav-link--active" : ""}`}
                  href={item.href ?? "#"}
                  onClick={(event) => {
                    if (item.onNavigate) {
                      event.preventDefault();
                      item.onNavigate();
                    }

                    setIsSidebarOpen(false);
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge ? <span className="workspace-shell__nav-badge">{item.badge}</span> : null}
                </a>
                {item.note ? <p className="workspace-shell__nav-note">{item.note}</p> : null}
              </li>
            ))}
          </ul>
        </nav>

        {sidebarFooter ? <div className="workspace-shell__footer">{sidebarFooter}</div> : null}
      </AppShellSidebar>

      <button
        aria-label="Close navigation"
        className="workspace-shell__backdrop"
        onClick={() => setIsSidebarOpen(false)}
        type="button"
      />

      <AppShellMain>
        <AppShellHeader className="workspace-shell__header">
          <div className="workspace-shell__header-start">
            <Button
              className="workspace-shell__sidebar-toggle"
              onClick={() => setIsSidebarOpen(true)}
              size="sm"
              variant="outline"
            >
              Menu
            </Button>
            {headerTitle ? <h1 className="workspace-shell__header-title">{headerTitle}</h1> : null}
            {headerMeta ? <div className="workspace-shell__header-meta">{headerMeta}</div> : null}
          </div>
          {headerActions ? <div className="workspace-shell__header-actions">{headerActions}</div> : null}
        </AppShellHeader>
        <AppShellContent>{children}</AppShellContent>
      </AppShellMain>
    </AppShell>
  );
}

export type { WorkspaceNavItem, WorkspaceShellProps };
