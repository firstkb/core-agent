import { createElement } from "react";

import type { WorkspaceNavItem } from "@platform/app-shell";
import { DashboardGridIcon } from "@platform/ui-kit";

export type AdminRouteKey = "dashboard";

const adminDashboardRoute = {
  badge: "Mock",
  headerTitle: "Dashboard",
  label: "Dashboard",
  note: "Skeleton + loading states",
  path: "/dashboard",
} as const;

export function getActiveAdminRoute(_pathname: string): AdminRouteKey {
  return "dashboard";
}

export function getAdminHeaderTitle(_pathname: string) {
  return adminDashboardRoute.headerTitle;
}

export function getAdminNavigation(
  _pathname: string,
  navigate?: (path: string) => void,
): WorkspaceNavItem[] {
  return [
    {
      active: true,
      badge: adminDashboardRoute.badge,
      href: adminDashboardRoute.path,
      id: "dashboard",
      icon: createElement(DashboardGridIcon),
      label: adminDashboardRoute.label,
      note: adminDashboardRoute.note,
      onNavigate: navigate ? () => navigate(adminDashboardRoute.path) : undefined,
    },
  ];
}
