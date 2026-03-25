import { createElement } from "react";

import type { WorkspaceNavItem } from "@platform/app-shell";
import {
  DashboardGridIcon,
  DataTableIcon,
  WalletCardIcon,
} from "@platform/ui-kit";

export type AdminRouteKey = "dashboard" | "billing" | "audit-log";

const adminRouteConfig = {
  dashboard: {
    badge: "Mock",
    headerTitle: "Dashboard",
    icon: createElement(DashboardGridIcon),
    label: "Dashboard",
    note: "Control plane overview",
    path: "/dashboard",
  },
  billing: {
    badge: "Seeded",
    headerTitle: "Billing",
    icon: createElement(WalletCardIcon),
    label: "Billing",
    note: "Revenue lanes",
    path: "/billing/queue",
  },
  "audit-log": {
    badge: "Seeded",
    headerTitle: "Audit Log",
    icon: createElement(DataTableIcon),
    label: "Audit Log",
    note: "Governance event stream",
    path: "/audit-log/events",
  },
} as const;

export function getActiveAdminRoute(pathname: string): AdminRouteKey {
  if (pathname.startsWith("/billing")) {
    return "billing";
  }

  if (pathname.startsWith("/audit-log")) {
    return "audit-log";
  }

  return "dashboard";
}

export function getAdminRouteMeta(pathname: string) {
  return adminRouteConfig[getActiveAdminRoute(pathname)];
}

export function getAdminHeaderTitle(pathname: string) {
  return getAdminRouteMeta(pathname).headerTitle;
}

export function getAdminNavigation(
  pathname: string,
  navigate?: (path: string) => void,
): WorkspaceNavItem[] {
  const activeRoute = getActiveAdminRoute(pathname);

  return (Object.entries(adminRouteConfig) as Array<
    [AdminRouteKey, (typeof adminRouteConfig)[AdminRouteKey]]
  >).map(([key, route]) => ({
    active: key === activeRoute,
    badge: route.badge,
    href: route.path,
    icon: route.icon,
    id: key,
    label: route.label,
    note: route.note,
    onNavigate: navigate ? () => navigate(route.path) : undefined,
  }));
}
