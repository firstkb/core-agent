import { createElement } from "react";

import type {
  AdminNavigation,
  AdminNavigationFavorite,
} from "@platform/api-client";
import type { WorkspaceNavItem } from "@platform/app-shell";
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DashboardGridIcon,
  DataTableIcon,
  FolderIcon,
  HelpCircleIcon,
  InfoCircleIcon,
  LayersIcon,
  PulseLineIcon,
  RoutePathIcon,
  SettingsIcon,
  ShieldKeyIcon,
  UsersIcon,
  WalletCardIcon,
  WarningTriangleIcon,
} from "@platform/ui-kit";

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

type AdminResolvedRouteKind =
  | "backend-section"
  | "dashboard"
  | "employees-edit"
  | "modules-create"
  | "modules-edit"
  | "modules-list";

type AdminResolvedRouteMeta = {
  badge?: string;
  headerTitle: string;
  icon: ReturnType<typeof createElement>;
  kind: AdminResolvedRouteKind;
  label: string;
  note: string;
  parentLabel?: string;
  parentPath?: string;
  path: string;
};

type AdminFavoriteShortcut = {
  access: string;
  description: string;
  icon: ReturnType<typeof createElement>;
  id: string;
  moduleTitle: string;
  path: string;
  title: string;
};

type AdminNavigationSectionRoute = {
  access: string;
  id: string;
  moduleDescription: string;
  moduleIcon?: string;
  moduleId: string;
  moduleKey: string;
  moduleTitle: string;
  path: string;
  sectionDescription: string;
  sectionIcon?: string;
  sectionId: string;
  sectionKey: string;
  sectionTitle: string;
};

const dashboardPath = "/dashboard";
const modulesListPath = "/modules/list";
const modulesListResetPath = "/modules/list?reset=1";

function normalizeAdminIconToken(iconToken?: string) {
  return iconToken?.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function normalizePath(path: string) {
  const [pathname = "/"] = path.split(/[?#]/);
  const trimmedPath = pathname.trim() || "/";

  if (trimmedPath === "/") {
    return trimmedPath;
  }

  return trimmedPath.replace(/\/+$/, "") || "/";
}

function capitalizeLabel(value: string) {
  if (!value.trim()) {
    return value;
  }

  return value[0]!.toUpperCase() + value.slice(1);
}

function resolveAdminModuleTitle(moduleKey: string, title: string) {
  if (moduleKey === "users") {
    return "Employees";
  }

  return title;
}

function resolveAdminSectionTitle(moduleKey: string, sectionKey: string, title: string) {
  if (moduleKey === "users" && sectionKey === "list_of_users") {
    return "List of Employees";
  }

  return title;
}

function flattenAdminNavigationSections(navigation: AdminNavigation): AdminNavigationSectionRoute[] {
  return navigation.modules.flatMap((module) =>
    module.sections.map((section) => ({
      access: section.access,
      id: `${module.module_key}:${section.section_key}`,
      moduleDescription: module.description?.trim() ?? "",
      moduleIcon: module.icon,
      moduleId: module.id,
      moduleKey: module.module_key,
      moduleTitle: resolveAdminModuleTitle(module.module_key, module.title),
      path: section.route_path,
      sectionDescription: section.description?.trim() ?? "",
      sectionIcon: section.icon,
      sectionId: section.id,
      sectionKey: section.section_key,
      sectionTitle: resolveAdminSectionTitle(module.module_key, section.section_key, section.title),
    })),
  );
}

function matchAdminNavigationSection(
  sections: AdminNavigationSectionRoute[],
  pathname: string,
) {
  const normalizedPath = normalizePath(pathname);

  return sections.find((section) => normalizePath(section.path) === normalizedPath) ?? null;
}

function resolveAdminNavigationIcon(iconToken?: string) {
  switch (normalizeAdminIconToken(iconToken)) {
    case "building":
    case "building-office":
    case "company":
    case "office":
    case "organization":
    case "tenant":
    case "tenants":
      return createElement(BuildingOfficeIcon);
    case "analytics":
    case "chart":
    case "report":
    case "reporting":
      return createElement(ChartBarIcon);
    case "check":
    case "check-circle":
    case "success":
      return createElement(CheckCircleIcon);
    case "dashboard":
    case "dashboard-grid":
    case "layout-grid":
    case "grid":
      return createElement(DashboardGridIcon);
    case "data-table":
    case "datatable":
    case "document-list":
    case "list":
    case "table":
      return createElement(DataTableIcon);
    case "help":
    case "support":
      return createElement(HelpCircleIcon);
    case "info":
      return createElement(InfoCircleIcon);
    case "module-registry":
    case "module-catalog":
    case "module-library":
    case "modules":
    case "registry":
    case "layers":
      return createElement(LayersIcon);
    case "monitor":
    case "pulse":
    case "signal":
    case "signals":
    case "status":
      return createElement(PulseLineIcon);
    case "flow":
    case "onboarding":
    case "route":
    case "path":
      return createElement(RoutePathIcon);
    case "config":
    case "configuration":
    case "settings":
      return createElement(SettingsIcon);
    case "access":
    case "grants":
    case "security":
    case "shield":
      return createElement(ShieldKeyIcon);
    case "admins":
    case "people":
    case "team":
    case "user":
    case "users":
      return createElement(UsersIcon);
    case "billing":
    case "wallet":
      return createElement(WalletCardIcon);
    case "alert":
    case "warning":
      return createElement(WarningTriangleIcon);
    default:
      return createElement(FolderIcon);
  }
}

function resolveModulesListParentMeta(
  navigation: AdminNavigation,
  translate: TranslateFunction,
) {
  const moduleRegistryRoute = flattenAdminNavigationSections(navigation).find((section) =>
    normalizePath(section.path) === modulesListPath ||
    section.moduleKey === "module_registry",
  );

  return {
    icon: moduleRegistryRoute
      ? resolveAdminNavigationIcon(moduleRegistryRoute.moduleIcon)
      : createElement(DataTableIcon),
    label: moduleRegistryRoute?.moduleTitle ?? translate("admin.navigation.modules.label"),
    path: moduleRegistryRoute?.path ?? modulesListResetPath,
  };
}

function resolveEmployeesListParentMeta(
  navigation: AdminNavigation,
  _translate: TranslateFunction,
) {
  const employeesRoute = flattenAdminNavigationSections(navigation).find((section) =>
    normalizePath(section.path) === "/admin/users" ||
    normalizePath(section.path) === "/admin/employees" ||
    (section.moduleKey === "users" && section.sectionKey === "list_of_users"),
  );

  return {
    icon: employeesRoute
      ? resolveAdminNavigationIcon(employeesRoute.moduleIcon)
      : createElement(UsersIcon),
    label: employeesRoute?.moduleTitle ?? "Employees",
    path: employeesRoute?.path ?? "/admin/users",
  };
}

export function getAdminNavigation(
  pathname: string,
  navigation: AdminNavigation,
  translate: TranslateFunction,
  navigate?: (path: string) => void,
): WorkspaceNavItem[] {
  const normalizedPath = normalizePath(pathname);

  return [
    {
      active: normalizedPath === dashboardPath,
      badge: translate("admin.navigation.dashboard.badge"),
      href: dashboardPath,
      icon: createElement(DashboardGridIcon),
      id: "dashboard",
      label: translate("admin.navigation.dashboard.label"),
      note: translate("admin.navigation.dashboard.note"),
      onNavigate: navigate ? () => navigate(dashboardPath) : undefined,
    },
    ...navigation.modules
      .map((module) => {
        const children = module.sections.map((section) => {
          const sectionPath = normalizePath(section.route_path);

          return {
            active: sectionPath === normalizedPath,
            href: section.route_path,
            icon: section.icon ? resolveAdminNavigationIcon(section.icon) : undefined,
            id: `${module.module_key}:${section.section_key}`,
            label: resolveAdminSectionTitle(module.module_key, section.section_key, section.title),
            note: section.description?.trim() || module.description?.trim() || undefined,
            onNavigate: navigate ? () => navigate(section.route_path) : undefined,
          } satisfies WorkspaceNavItem;
        });

        return {
          children,
          defaultOpen: children.some((child) => child.active),
          icon: resolveAdminNavigationIcon(module.icon),
          id: module.module_key,
          label: resolveAdminModuleTitle(module.module_key, module.title),
          note: module.description?.trim() || undefined,
        } satisfies WorkspaceNavItem;
      })
      .filter((item) => item.children.length > 0),
  ];
}

export function buildAdminFavoriteShortcuts(
  favorites: AdminNavigationFavorite[],
): AdminFavoriteShortcut[] {
  return favorites.map((favorite) => ({
    access: favorite.access,
    description: favorite.description?.trim() || `${favorite.module_title} section shortcut.`,
    icon: resolveAdminNavigationIcon(favorite.module_icon),
    id: favorite.id,
    moduleTitle: resolveAdminModuleTitle(favorite.module_key, favorite.module_title),
    path: favorite.route_path,
    title: resolveAdminSectionTitle(favorite.module_key, favorite.section_key, favorite.title),
  }));
}

export function findAdminNavigationSection(
  navigation: AdminNavigation,
  pathname: string,
) {
  return matchAdminNavigationSection(flattenAdminNavigationSections(navigation), pathname);
}

export function getAdminRouteMeta(
  pathname: string,
  navigation: AdminNavigation,
  translate: TranslateFunction,
): AdminResolvedRouteMeta {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === dashboardPath || normalizedPath === "/") {
    return {
      badge: translate("admin.navigation.dashboard.badge"),
      headerTitle: translate("admin.navigation.dashboard.headerTitle"),
      icon: createElement(DashboardGridIcon),
      kind: "dashboard",
      label: translate("admin.navigation.dashboard.label"),
      note: translate("admin.navigation.dashboard.note"),
      path: dashboardPath,
    };
  }

  if (normalizedPath === "/modules/edit/new") {
    const parentMeta = resolveModulesListParentMeta(navigation, translate);

    return {
      badge: translate("admin.navigation.modulesCreate.badge"),
      headerTitle: translate("admin.navigation.modulesCreate.headerTitle"),
      icon: parentMeta.icon,
      kind: "modules-create",
      label: translate("admin.navigation.modulesCreate.label"),
      note: translate("admin.navigation.modulesCreate.note"),
      parentLabel: parentMeta.label,
      parentPath: parentMeta.path,
      path: parentMeta.path,
    };
  }

  if (normalizedPath.startsWith("/modules/edit/")) {
    const parentMeta = resolveModulesListParentMeta(navigation, translate);

    return {
      badge: translate("admin.navigation.modulesEdit.badge"),
      headerTitle: translate("admin.navigation.modulesEdit.headerTitle"),
      icon: parentMeta.icon,
      kind: "modules-edit",
      label: translate("admin.navigation.modulesEdit.label"),
      note: translate("admin.navigation.modulesEdit.note"),
      parentLabel: parentMeta.label,
      parentPath: parentMeta.path,
      path: parentMeta.path,
    };
  }

  if (normalizedPath.startsWith("/admin/users/edit/") || normalizedPath.startsWith("/admin/employees/edit/")) {
    const parentMeta = resolveEmployeesListParentMeta(navigation, translate);

    return {
      badge: translate("admin.navigation.employeesEdit.badge"),
      headerTitle: translate("admin.navigation.employeesEdit.headerTitle"),
      icon: parentMeta.icon,
      kind: "employees-edit",
      label: translate("admin.navigation.employeesEdit.label"),
      note: translate("admin.navigation.employeesEdit.note"),
      parentLabel: parentMeta.label,
      parentPath: parentMeta.path,
      path: parentMeta.path,
    };
  }

  const activeBackendSection = findAdminNavigationSection(navigation, normalizedPath);

  if (activeBackendSection) {
    return {
      badge: capitalizeLabel(activeBackendSection.access),
      headerTitle: activeBackendSection.sectionTitle,
      icon: activeBackendSection.sectionIcon
        ? resolveAdminNavigationIcon(activeBackendSection.sectionIcon)
        : resolveAdminNavigationIcon(activeBackendSection.moduleIcon),
      kind: normalizePath(activeBackendSection.path) === modulesListPath
        ? "modules-list"
        : "backend-section",
      label: activeBackendSection.sectionTitle,
      note: activeBackendSection.sectionDescription || activeBackendSection.moduleDescription,
      parentLabel: activeBackendSection.moduleTitle,
      parentPath: normalizePath(activeBackendSection.path) === modulesListPath
        ? modulesListResetPath
        : undefined,
      path: activeBackendSection.path,
    };
  }

  if (normalizedPath.startsWith("/modules")) {
    const parentMeta = resolveModulesListParentMeta(navigation, translate);

    return {
      badge: translate("admin.navigation.modulesList.badge"),
      headerTitle: translate("admin.navigation.modulesList.headerTitle"),
      icon: parentMeta.icon,
      kind: "modules-list",
      label: translate("admin.navigation.modulesList.label"),
      note: translate("admin.navigation.modulesList.note"),
      parentLabel: parentMeta.label,
      parentPath: modulesListResetPath,
      path: modulesListPath,
    };
  }

  return {
    badge: translate("admin.navigation.dashboard.badge"),
    headerTitle: translate("admin.navigation.dashboard.headerTitle"),
    icon: createElement(DashboardGridIcon),
    kind: "dashboard",
    label: translate("admin.navigation.dashboard.label"),
    note: translate("admin.navigation.dashboard.note"),
    path: dashboardPath,
  };
}

export function getAdminHeaderTitle(
  pathname: string,
  navigation: AdminNavigation,
  translate: TranslateFunction,
) {
  return getAdminRouteMeta(pathname, navigation, translate).headerTitle;
}

export type {
  AdminFavoriteShortcut,
  AdminNavigationSectionRoute,
  AdminResolvedRouteKind,
  AdminResolvedRouteMeta,
};
