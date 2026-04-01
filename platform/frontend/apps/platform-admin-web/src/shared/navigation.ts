import { createElement } from "react";

import type { WorkspaceNavItem } from "@platform/app-shell";
import {
  DashboardGridIcon,
  DataTableIcon,
  LayersIcon,
  WalletCardIcon,
} from "@platform/ui-kit";

export type AdminRouteKey = "dashboard" | "billing" | "audit-log" | "modules-list";

const adminRouteConfig = {
  dashboard: {
    badgeKey: "admin.navigation.dashboard.badge",
    headerTitleKey: "admin.navigation.dashboard.headerTitle",
    icon: createElement(DashboardGridIcon),
    labelKey: "admin.navigation.dashboard.label",
    noteKey: "admin.navigation.dashboard.note",
    path: "/dashboard",
  },
  billing: {
    badgeKey: "admin.navigation.billing.badge",
    headerTitleKey: "admin.navigation.billing.headerTitle",
    icon: createElement(WalletCardIcon),
    labelKey: "admin.navigation.billing.label",
    noteKey: "admin.navigation.billing.note",
    path: "/billing/queue",
  },
  "audit-log": {
    badgeKey: "admin.navigation.auditLog.badge",
    headerTitleKey: "admin.navigation.auditLog.headerTitle",
    icon: createElement(DataTableIcon),
    labelKey: "admin.navigation.auditLog.label",
    noteKey: "admin.navigation.auditLog.note",
    path: "/audit-log/events",
  },
  "modules-list": {
    badgeKey: "admin.navigation.modulesList.badge",
    headerTitleKey: "admin.navigation.modulesList.headerTitle",
    icon: createElement(DataTableIcon),
    labelKey: "admin.navigation.modulesList.label",
    noteKey: "admin.navigation.modulesList.note",
    path: "/modules/list?reset=1",
  },
} as const;

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

export function getActiveAdminRoute(pathname: string): AdminRouteKey {
  if (pathname.startsWith("/modules")) {
    return "modules-list";
  }

  if (pathname.startsWith("/billing")) {
    return "billing";
  }

  if (pathname.startsWith("/audit-log")) {
    return "audit-log";
  }

  return "dashboard";
}

export function getAdminRouteMeta(pathname: string, translate: TranslateFunction) {
  const route = adminRouteConfig[getActiveAdminRoute(pathname)];

  return {
    badge: translate(route.badgeKey),
    headerTitle: translate(route.headerTitleKey),
    icon: route.icon,
    label: translate(route.labelKey),
    note: translate(route.noteKey),
    path: route.path,
  };
}

export function getAdminHeaderTitle(pathname: string, translate: TranslateFunction) {
  return getAdminRouteMeta(pathname, translate).headerTitle;
}

export function getAdminNavigation(
  pathname: string,
  translate: TranslateFunction,
  navigate?: (path: string) => void,
): WorkspaceNavItem[] {
  const activeRoute = getActiveAdminRoute(pathname);
  const baseItems = (Object.entries(adminRouteConfig) as Array<
    [AdminRouteKey, (typeof adminRouteConfig)[AdminRouteKey]]
  >)
    .filter(([key]) => key !== "modules-list")
    .map(([key, route]) => ({
      active: key === activeRoute,
      badge: translate(route.badgeKey),
      href: route.path,
      icon: route.icon,
      id: key,
      label: translate(route.labelKey),
      note: translate(route.noteKey),
      onNavigate: navigate ? () => navigate(route.path) : undefined,
    }));
  const modulesListRoute = adminRouteConfig["modules-list"];

  return [
    ...baseItems,
    {
      children: [
        {
          active: activeRoute === "modules-list",
          badge: translate(modulesListRoute.badgeKey),
          href: modulesListRoute.path,
          icon: modulesListRoute.icon,
          id: "modules-list",
          label: translate(modulesListRoute.labelKey),
          note: translate(modulesListRoute.noteKey),
          onNavigate: navigate ? () => navigate(modulesListRoute.path) : undefined,
        },
      ],
      defaultOpen: activeRoute === "modules-list",
      icon: createElement(LayersIcon),
      id: "modules",
      label: translate("admin.navigation.modules.label"),
    },
  ];
}
