import { describe, expect, it } from "vitest";

import type { AdminNavigation } from "@platform/api-client";
import {
  DashboardGridIcon,
  LayersIcon,
  RoutePathIcon,
  SettingsIcon,
  ShieldKeyIcon,
  WarningTriangleIcon,
} from "@platform/ui-kit";

import {
  buildAdminFavoriteShortcuts,
  findAdminNavigationSection,
  getAdminNavigation,
  getAdminRouteMeta,
} from "./navigation";

const navigationFixture: AdminNavigation = {
  favorites: [
    {
      access: "write",
      description: "Registry list for admin modules and sections.",
      id: "favorite-1",
      module_icon: "layout-grid",
      module_id: "module-registry",
      module_key: "module_registry",
      module_title: "Module registry",
      route_path: "/modules/list",
      section_key: "modules_list",
      title: "List of modules",
    },
  ],
  is_root: true,
  modules: [
    {
      description: "Root-only admin module registry.",
      icon: "layout-grid",
      id: "module-registry",
      module_key: "module_registry",
      sections: [
        {
          access: "write",
          description: "Reusable collection table proving surface.",
          id: "module-registry-list",
          route_path: "/modules/list",
          section_key: "modules_list",
          title: "List of modules",
        },
      ],
      title: "Module registry",
    },
    {
      description: "Tenant control-plane management and onboarding.",
      icon: "building",
      id: "module-tenant",
      module_key: "tenant",
      sections: [
        {
          access: "write",
          description: "Tenant inventory and registry operations.",
          id: "tenant-list",
          route_path: "/admin/tenants",
          section_key: "list_of_tenants",
          title: "List of tenants",
        },
        {
          access: "write",
          description: "Tenant provisioning and onboarding flow.",
          icon: "route",
          id: "tenant-onboarding",
          route_path: "/admin/tenants/onboarding",
          section_key: "onboarding",
          title: "Onboarding",
        },
      ],
      title: "Tenant",
    },
  ],
};

function translate(key: string, options?: Record<string, unknown>) {
  if (key === "admin.shell.menu.sectionLive") {
    return `${options?.label as string} is live`;
  }

  if (key === "admin.shell.menu.openCurrentSection") {
    return `Open ${options?.label as string}`;
  }

  return key;
}

describe("admin navigation", () => {
  it("builds sidebar items from backend modules while keeping dashboard fixed", () => {
    const navigation = getAdminNavigation("/admin/tenants/onboarding", navigationFixture, translate);

    expect(navigation.map((item) => item.label)).toEqual(["admin.navigation.dashboard.label", "Module registry", "Tenant"]);
    expect(navigation[0]?.active).toBe(false);
    expect(navigation[2]?.children?.[1]?.active).toBe(true);
  });

  it("maps module icon tokens but does not inherit them into child sections", () => {
    const navigation = getAdminNavigation("/modules/list", navigationFixture, translate);
    const moduleRegistryItem = navigation[1];
    const moduleRegistrySection = moduleRegistryItem?.children?.[0];

    expect(moduleRegistryItem?.icon).toMatchObject({ type: DashboardGridIcon });
    expect(moduleRegistrySection?.icon).toBeUndefined();
  });

  it("uses a section icon only when the section payload explicitly provides one", () => {
    const navigation = getAdminNavigation("/admin/tenants/onboarding", navigationFixture, translate);
    const tenantSection = navigation[2]?.children?.[1];

    expect(tenantSection?.icon).toMatchObject({ type: RoutePathIcon });
  });

  it("supports additional backend icon tokens beyond the initial rollout set", () => {
    const aliasNavigation: AdminNavigation = {
      favorites: [
        {
          access: "write",
          id: "favorite-security",
          module_icon: "security",
          module_id: "module-security",
          module_key: "security",
          module_title: "Security",
          route_path: "/admin/security",
          section_key: "overview",
          title: "Overview",
        },
      ],
      is_root: true,
      modules: [
        {
          id: "module-registry",
          module_key: "module_registry",
          title: "Module registry",
          icon: "layers",
          sections: [
            {
              access: "write",
              id: "module-registry-list",
              route_path: "/modules/list",
              section_key: "modules_list",
              title: "List of modules",
            },
          ],
        },
        {
          id: "module-settings",
          module_key: "settings",
          title: "Settings",
          icon: "settings",
          sections: [
            {
              access: "read",
              icon: "warning",
              id: "settings-alerts",
              route_path: "/admin/settings/alerts",
              section_key: "alerts",
              title: "Alerts",
            },
          ],
        },
      ],
    };

    const navigation = getAdminNavigation("/admin/settings/alerts", aliasNavigation, translate);
    const moduleRegistryItem = navigation[1];
    const settingsItem = navigation[2];
    const settingsSection = settingsItem?.children?.[0];
    const favorites = buildAdminFavoriteShortcuts(aliasNavigation.favorites);

    expect(moduleRegistryItem?.icon).toMatchObject({ type: LayersIcon });
    expect(settingsItem?.icon).toMatchObject({ type: SettingsIcon });
    expect(settingsSection?.icon).toMatchObject({ type: WarningTriangleIcon });
    expect(favorites[0]?.icon).toMatchObject({ type: ShieldKeyIcon });
  });

  it("resolves backend section metadata from route_path", () => {
    const routeMeta = getAdminRouteMeta("/admin/tenants/onboarding", navigationFixture, translate);

    expect(routeMeta.kind).toBe("backend-section");
    expect(routeMeta.label).toBe("Onboarding");
    expect(routeMeta.parentLabel).toBe("Tenant");
    expect(routeMeta.path).toBe("/admin/tenants/onboarding");
  });

  it("resolves tenant list metadata from route_path", () => {
    const routeMeta = getAdminRouteMeta("/admin/tenants", navigationFixture, translate);

    expect(routeMeta.kind).toBe("backend-section");
    expect(routeMeta.label).toBe("List of tenants");
    expect(routeMeta.parentLabel).toBe("Tenant");
    expect(routeMeta.parentPath).toBe("/admin/tenants");
    expect(routeMeta.path).toBe("/admin/tenants");
  });

  it("keeps module edit pages attached to the module registry parent route", () => {
    const routeMeta = getAdminRouteMeta("/modules/edit/123", navigationFixture, translate);

    expect(routeMeta.kind).toBe("modules-edit");
    expect(routeMeta.parentLabel).toBe("Module registry");
    expect(routeMeta.parentPath).toBe("/modules/list");
  });

  it("builds favorites from backend favorites payload", () => {
    const favorites = buildAdminFavoriteShortcuts(navigationFixture.favorites);

    expect(favorites).toEqual([
      expect.objectContaining({
        access: "write",
        description: "Registry list for admin modules and sections.",
        moduleTitle: "Module registry",
        path: "/modules/list",
        title: "List of modules",
      }),
    ]);
    expect(favorites[0]?.icon).toMatchObject({ type: DashboardGridIcon });
  });

  it("finds a backend section by runtime path", () => {
    expect(findAdminNavigationSection(navigationFixture, "/modules/list")).toEqual(
      expect.objectContaining({
        moduleKey: "module_registry",
        sectionKey: "modules_list",
      }),
    );
  });

  it("falls back to dashboard meta for removed legacy routes", () => {
    const routeMeta = getAdminRouteMeta("/billing/queue", navigationFixture, translate);

    expect(routeMeta.kind).toBe("dashboard");
    expect(routeMeta.path).toBe("/dashboard");
  });

  it("normalizes legacy users labels to employees labels before migration catches up", () => {
    const usersNavigation: AdminNavigation = {
      favorites: [],
      is_root: true,
      modules: [
        {
          description: "Admin user directory.",
          icon: "users",
          id: "module-users",
          module_key: "users",
          sections: [
            {
              access: "write",
              description: "Admin user directory and future access assignment.",
              id: "users-list",
              route_path: "/admin/users",
              section_key: "list_of_users",
              title: "List of users",
            },
          ],
          title: "Users",
        },
      ],
    };

    const navigation = getAdminNavigation("/admin/users", usersNavigation, translate);
    const routeMeta = getAdminRouteMeta("/admin/users", usersNavigation, translate);
    const backendSection = findAdminNavigationSection(usersNavigation, "/admin/users");

    expect(navigation[1]?.label).toBe("Employees");
    expect(navigation[1]?.children?.[0]?.label).toBe("List of Employees");
    expect(routeMeta.label).toBe("List of Employees");
    expect(routeMeta.parentLabel).toBe("Employees");
    expect(routeMeta.parentPath).toBe("/admin/users");
    expect(backendSection?.moduleTitle).toBe("Employees");
    expect(backendSection?.sectionTitle).toBe("List of Employees");
  });

  it("keeps employee edit pages attached to the employees parent route", () => {
    const usersNavigation: AdminNavigation = {
      favorites: [],
      is_root: true,
      modules: [
        {
          description: "Admin user directory.",
          icon: "users",
          id: "module-users",
          module_key: "users",
          sections: [
            {
              access: "write",
              description: "Admin user directory and future access assignment.",
              id: "users-list",
              route_path: "/admin/users",
              section_key: "list_of_users",
              title: "List of users",
            },
          ],
          title: "Users",
        },
      ],
    };

    const routeMeta = getAdminRouteMeta("/admin/users/edit/123", usersNavigation, translate);

    expect(routeMeta.kind).toBe("employees-edit");
    expect(routeMeta.parentLabel).toBe("Employees");
    expect(routeMeta.parentPath).toBe("/admin/users");
  });
});
