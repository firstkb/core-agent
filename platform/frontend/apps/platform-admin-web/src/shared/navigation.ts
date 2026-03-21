import type { WorkspaceNavItem } from "@platform/app-shell";

const adminPageTabs = ["overview", "tenants", "signals"] as const;
const adminNavigationItems = ["overview", "tenants", "signals", "billing", "audit-log"] as const;

export type AdminPageTab = (typeof adminPageTabs)[number];
export type AdminRouteKey = (typeof adminNavigationItems)[number];

const adminRouteConfig: Record<
  AdminRouteKey,
  {
    badge?: string;
    headerTitle: string;
    label: string;
    note: string;
    path: string;
  }
> = {
  overview: {
    badge: "1",
    headerTitle: "Control Plane",
    label: "Overview",
    note: "Portfolio summary",
    path: "/overview",
  },
  tenants: {
    badge: "3",
    headerTitle: "Tenant Operations",
    label: "Tenants",
    note: "Rollout workbench",
    path: "/tenants",
  },
  signals: {
    badge: "2",
    headerTitle: "Signal Review",
    label: "Signals",
    note: "Automation posture",
    path: "/signals",
  },
  billing: {
    headerTitle: "Billing Operations",
    label: "Billing",
    note: "Revenue and subscriptions",
    path: "/billing",
  },
  "audit-log": {
    headerTitle: "Audit History",
    label: "Audit Log",
    note: "Operator traceability",
    path: "/audit-log",
  },
};

export function getActiveAdminRoute(pathname: string): AdminRouteKey {
  return adminNavigationItems.find((route) => pathname.startsWith(adminRouteConfig[route].path)) ?? "overview";
}

export function getActiveAdminTab(pathname: string): AdminPageTab {
  const activeRoute = getActiveAdminRoute(pathname);
  return adminPageTabs.find((tab) => tab === activeRoute) ?? "overview";
}

export function getAdminHeaderTitle(pathname: string) {
  return adminRouteConfig[getActiveAdminRoute(pathname)].headerTitle;
}

export function getAdminTabPath(tab: AdminPageTab) {
  return adminRouteConfig[tab].path;
}

export function getAdminRoutePath(route: AdminRouteKey) {
  return adminRouteConfig[route].path;
}

export function getAdminNavigation(
  pathname: string,
  navigate?: (path: string) => void,
): WorkspaceNavItem[] {
  const activeRoute = getActiveAdminRoute(pathname);

  return [
    ...adminNavigationItems.map((route) => ({
      active: activeRoute === route,
      badge: adminRouteConfig[route].badge,
      href: adminRouteConfig[route].path,
      label: adminRouteConfig[route].label,
      note: adminRouteConfig[route].note,
      onNavigate: navigate ? () => navigate(adminRouteConfig[route].path) : undefined,
    })),
  ];
}
